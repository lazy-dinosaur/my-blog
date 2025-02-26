#!/bin/bash

SOURCE_DIR="$HOME/vaults/notes"
POST_BASE="./content/posts"
IMG_BASE="./public/postImg"

TMP_POST=$(mktemp -d)
TMP_IMG=$(mktemp -d)
LINK_MAP="./public/link-map.json"

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
	# 위키링크 [[파일주소/파일명.md|표시텍스트]] 형식 추출
	# 더 정확한 추출을 위해 perl 사용
	perl -ne 'while (/\[\[([^|\]]+\.md)(?:\|[^\]]+)?\]\]/g) { print "$1\n" }' "$file"
}

# 처리된 노트 목록 (중복 처리 방지)
declare -A PROCESSED_FILES
# 발행된 노트의 원본 경로와 publish 값 매핑
declare -A PUBLISH_MAP

# 노트 처리 함수 (재귀적으로 링크된 파일도 처리)
process_note() {
	local md_file="$1"
	local relative_path="${md_file#$SOURCE_DIR/}"

	# 이미 처리한 파일이면 스킵
	if [[ -n "${PROCESSED_FILES[$relative_path]}" ]]; then
		return
	fi

	# 처리 완료 표시
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

	# 노트 파일 복사
	cp "$md_file" "$post_dir/$(basename "$md_file")"
	echo "✅ 게시됨: $safe_publish/$(basename "$md_file")"

	# 링크 매핑 정보 저장 (원본 경로 -> publish 값)
	PUBLISH_MAP["$relative_path"]="$safe_publish/$(basename "$md_file" .md)"
	echo "매핑 추가: $relative_path -> ${PUBLISH_MAP[$relative_path]}"  # 디버깅 출력

	# 이미지 파일 처리
	grep -oE '!\[.*\]\([^)]+\)' "$md_file" | sed -E 's/.*\((.*)\)/\1/' |
		while IFS= read -r img_path; do
			# 이미지 경로가 URL이면 스킵
			if [[ "$img_path" =~ ^https?:// ]]; then
				continue
			fi
			
			img_name=$(basename "$img_path")
			# 이미지 파일 찾기 (전체 볼트에서 검색)
			find "$SOURCE_DIR" -type f -name "$img_name" -not -path "*/.obsidian/*" -exec cp {} "$img_dir/" \; 2>/dev/null
			
			if [[ ! -f "$img_dir/$img_name" ]]; then
				echo "⚠️ 이미지 파일을 찾을 수 없음: $img_name (from $(basename "$md_file"))"
			fi
		done

	# 링크된 MD 파일 처리
	extract_linked_files "$md_file" | while IFS= read -r linked_file; do
		# 상대 경로를 절대 경로로 변환
		local linked_abs_path
		if [[ "$linked_file" == /* ]]; then
			# 절대 경로인 경우
			linked_abs_path="$SOURCE_DIR$linked_file"
		else
			# 상대 경로인 경우
			linked_abs_path="$(dirname "$md_file")/$linked_file"
		fi

		# 파일이 존재하면 재귀적으로 처리
		if [[ -f "$linked_abs_path" ]]; then
			process_note "$linked_abs_path"
		else
			echo "⚠️ 링크된 파일을 찾을 수 없음: $linked_file (from $(basename "$md_file"))"
		fi
	done
}

echo "📄 게시 가능한 노트 검색 중..."

# 모든 MD 파일 처리 (프로세스 치환 사용)
while IFS= read -r -d '' md_file; do
	process_note "$md_file"
done < <(find "$SOURCE_DIR" -type f -name "*.md" -not -path "*/.obsidian/*" -print0)

# 링크 매핑 파일 생성
echo "📝 링크 매핑 파일 생성 중..."
echo "연관 배열 크기: ${#PUBLISH_MAP[@]}"  # 디버깅 출력
echo "{" > "$TMP_POST/link-map.json"
for orig_path in "${!PUBLISH_MAP[@]}"; do
	echo "매핑: $orig_path -> ${PUBLISH_MAP[$orig_path]}"  # 디버깅 출력
	echo "  \"$orig_path\": \"${PUBLISH_MAP[$orig_path]}\"," >> "$TMP_POST/link-map.json"
done

# 매핑이 없는 경우 빈 객체 생성 방지
if [ ${#PUBLISH_MAP[@]} -eq 0 ]; then
    echo "  \"_empty\": \"true\"" >> "$TMP_POST/link-map.json"
else
    # 마지막 쉼표 제거
    sed -i '$ s/,$//' "$TMP_POST/link-map.json"
fi

echo "}" >> "$TMP_POST/link-map.json"

echo "🔄 콘텐츠 동기화 중..."
mkdir -p "$POST_BASE" "$IMG_BASE" "$(dirname "$LINK_MAP")"
rsync -a --delete "$TMP_POST/" "$POST_BASE/"
rsync -a --delete "$TMP_IMG/" "$IMG_BASE/"
cp "$TMP_POST/link-map.json" "$LINK_MAP"

echo "🚀 동기화 완료! 게시된 포스트: $(find "$POST_BASE" -name "*.md" | wc -l)개"
