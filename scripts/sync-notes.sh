#!/bin/bash

SOURCE_DIR="$HOME/vaults/notes"
POST_BASE="./content/posts"
IMG_BASE="./public/postImg"

TMP_POST=$(mktemp -d)
TMP_IMG=$(mktemp -d)
LINK_MAP="./public/link-map.json"
META_DATA="./public/meta-data.json"

cleanup() {
	rm -rf "$TMP_POST" "$TMP_IMG"
}
trap cleanup EXIT

# 프론트매터 검증 함수
validate_frontmatter() {
	local file="$1"
	if ! grep -q '^---$' "$file"; then
		echo "❌ 유효하지 않은 프론트매터: $(basename "$file")"
		return 1
	fi

	local frontmatter=$(awk '/^---$/ {if(++c==1) next} c==1 && /^---$/ {exit} c==1' "$file")
	if ! echo "$frontmatter" | yq -e '.' >/dev/null 2>&1; then
		echo "❌ YAML 문법 오류: $(basename "$file")"
		return 1
	fi

	return 0
}

# 프론트매터에서 publish 값 추출
get_publish_value() {
	local file="$1"
	local frontmatter=$(awk '/^---$/ {if(++c==1) next} c==1 && /^---$/ {exit} c==1' "$file")
	echo "$frontmatter" | yq eval '.publish // "null"' -
}

# 노트 내 링크된 MD 파일 추출 (개선된 버전)
extract_linked_files() {
	local file="$1"
	perl -ne 'while (/\[\[([^|\]]+\.md)(?:\|[^\]]+)?\]\]/g) { print "$1\n" }' "$file"
}

declare -A PROCESSED_FILES
declare -A PUBLISH_MAP

process_note() {
	local md_file="$1"
	local relative_path="${md_file#$SOURCE_DIR/}"

	if [[ -n "${PROCESSED_FILES[$relative_path]}" ]]; then
		return
	fi

	PROCESSED_FILES[$relative_path]=1

	if ! validate_frontmatter "$md_file"; then
		return
	fi

	local publish=$(get_publish_value "$md_file")

	if [[ "$publish" == "null" || "$publish" == "" ]]; then
		echo "⏸️ 건너뜀: $(basename "$md_file") (publish 필드 없음)"
		return
	fi

	local safe_publish=$(echo "$publish" | tr -cd '[:alnum:]/._-')
	local post_dir="$TMP_POST/${safe_publish}"
	local img_dir="$TMP_IMG/${safe_publish}"

	mkdir -p "$post_dir" "$img_dir"

	cp "$md_file" "$post_dir/$(basename "$md_file")"
	echo "✅ 게시됨: $safe_publish/$(basename "$md_file")"

	PUBLISH_MAP["$relative_path"]="$safe_publish/$(basename "$md_file" .md)"
	echo "매핑 추가: $relative_path -> ${PUBLISH_MAP[$relative_path]}"

	grep -oE '!\[.*\]\([^)]+\)' "$md_file" | sed -E 's/.*\((.*)\)/\1/' |
		while IFS= read -r img_path; do
			if [[ "$img_path" =~ ^https?:// ]]; then
				continue
			fi

			img_name=$(basename "$img_path")
			find "$SOURCE_DIR" -type f -name "$img_name" -not -path "*/.obsidian/*" -not -path "*/_templates/*" -exec cp {} "$img_dir/" \; 2>/dev/null

			if [[ ! -f "$img_dir/$img_name" ]]; then
				echo "⚠️ 이미지 파일을 찾을 수 없음: $img_name (from $(basename "$md_file"))"
			fi
		done

	extract_linked_files "$md_file" | while IFS= read -r linked_file; do
		local linked_abs_path
		if [[ "$linked_file" == /* ]]; then
			linked_abs_path="$SOURCE_DIR$linked_file"
		else
			linked_abs_path="$(dirname "$md_file")/$linked_file"
		fi

		if [[ -f "$linked_abs_path" ]]; then
			process_note "$linked_abs_path"
		else
			echo "⚠️ 링크된 파일을 찾을 수 없음: $linked_file (from $(basename "$md_file"))"
		fi
	done
}

echo "📄 게시 가능한 노트 검색 중..."

while IFS= read -r -d '' md_file; do
	process_note "$md_file"
done < <(find "$SOURCE_DIR" -type f -name "*.md" -not -path "*/.obsidian/*" -not -path "*/_templates/*" -print0)

echo "📝 링크 매핑 및 메타데이터 파일 생성 중..."
echo "{" >"$TMP_POST/link-map.json"
echo "[" >"$TMP_POST/meta-data.json"

first_meta=true
for orig_path in "${!PUBLISH_MAP[@]}"; do
	echo "  \"$orig_path\": \"${PUBLISH_MAP[$orig_path]}\"," >>"$TMP_POST/link-map.json"

	md_file="$SOURCE_DIR/$orig_path"
	if [[ -f "$md_file" ]]; then
		frontmatter=$(awk '/^---$/ {if(++c==1) next} c==1 && /^---$/ {exit} c==1' "$md_file")
		title=$(basename "$md_file" .md)
		summary=$(echo "$frontmatter" | yq eval '.summary // ""' -)
		image=$(echo "$frontmatter" | yq eval '.image // ""' -)
		tags_raw=$(echo "$frontmatter" | yq eval '.tags' -)
		if [[ "$tags_raw" == "null" || -z "$tags_raw" ]]; then
			tags="[]"
		else
			tags=$(echo "$tags_raw" | yq -o=json e '.' - 2>/dev/null || echo "[]")
			if [[ "$tags" != \[* && "$tags" != "null" && ! -z "$tags" ]]; then
				tags="[\"$tags\"]"
			fi
		fi
		createdAt=$(echo "$frontmatter" | yq eval '.createdAt // ""' -)
		modifiedAt=$(echo "$frontmatter" | yq eval '.modifiedAt // ""' -)

		series=$(echo "$frontmatter" | yq eval '.series // ""' -)

		if [[ "$first_meta" == "true" ]]; then
			first_meta=false
		else
			echo "," >>"$TMP_POST/meta-data.json"
		fi

		cat <<EOF >>"$TMP_POST/meta-data.json"
        {
            "urlPath": "${PUBLISH_MAP[$orig_path]}",
            "title": "$title",
            "summary": "$summary",
            "image": "$image",
            "tags": $tags,
            "series": "$series",                                                                                                                                                                                                                  
            "createdAt": "$createdAt",
            "modifiedAt": "$modifiedAt"
        }
EOF
	fi
done

if [ ${#PUBLISH_MAP[@]} -eq 0 ]; then
	echo "  \"_empty\": \"true\"" >>"$TMP_POST/link-map.json"
else
	sed -i '$ s/,$//' "$TMP_POST/link-map.json"
fi
echo "}" >>"$TMP_POST/link-map.json"

echo "]" >>"$TMP_POST/meta-data.json"

echo "🔄 콘텐츠 동기화 중..."
mkdir -p "$POST_BASE" "$IMG_BASE" "$(dirname "$LINK_MAP")"

rsync -a --delete --exclude='link-map.json' --exclude='meta-data.json' "$TMP_POST/" "$POST_BASE/"
rsync -a --delete "$TMP_IMG/" "$IMG_BASE/"

cp "$TMP_POST/link-map.json" "$LINK_MAP"
cp "$TMP_POST/meta-data.json" "$META_DATA"

echo "🚀 동기화 완료! 게시된 포스트: $(find "$POST_BASE" -name "*.md" | wc -l)개"
