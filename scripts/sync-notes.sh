#!/bin/bash

SOURCE_DIR="$HOME/vaults/notes"
POST_BASE="./content/posts"
IMG_BASE="./public/postImg"

TMP_POST=$(mktemp -d)
TMP_IMG=$(mktemp -d)

cleanup() {
	rm -rf "$TMP_POST" "$TMP_IMG"
}
trap cleanup EXIT

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

process_note() {
	local md_file="$1"

	if ! validate_frontmatter "$md_file"; then
		return
	fi

	local frontmatter=$(awk '/^---$/ {if(++c==1) next} c==1 && /^---$/ {exit} c==1' "$md_file")
	local publish=$(echo "$frontmatter" | yq eval '.publish // "null"' -)

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

	grep -oE '!\[.*\]\([^)]+\)' "$md_file" | sed -E 's/.*\((.*)\)/\1/' |
		while IFS= read -r img_path; do
			img_name=$(basename "$img_path")
			find "$SOURCE_DIR" -type f -name "$img_name" -not -path "*/.obsidian/*" -exec cp {} "$img_dir/" \; 2>/dev/null
		done
}

echo "📄 게시 가능한 노트 검색 중..."
find "$SOURCE_DIR" -type f -name "*.md" -not -path "*/.obsidian/*" -print0 | while IFS= read -r -d '' md_file; do
	process_note "$md_file"
done

echo "🔄 콘텐츠 동기화 중..."
mkdir -p "$POST_BASE" "$IMG_BASE"
rsync -a --delete "$TMP_POST/" "$POST_BASE/"
rsync -a --delete "$TMP_IMG/" "$IMG_BASE/"

echo "🚀 동기화 완료! 게시된 포스트: $(find "$POST_BASE" -name "*.md" | wc -l)개"
