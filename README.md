# 나의 옵시디언 블로그 퍼블리셔

나의 워크플로우(옵시디언 + neovim)에 맞춘 블로그

Next.js 기반

## 기본 설정

1. env 설정

   - NOTES_SOURCE_DIR: 노트 저장소 주소 (절대주소)
   - IGNORED_DIRS: 무시하고 싶은 폴더 (상대주소)

   ```env
   NOTES_SOURCE_DIR=/home/lazydino/vaults/notes
   IGNORED_DIRS=_templates
   ```

2. 의존 프로그램 설치

- Ubuntu/Debian

  ```bash
  sudo apt update && sudo apt install -y bash yq gawk perl rsync findutils sed

  ```

- Fedora

  ```bash
  sudo dnf install -y bash yq gawk perl rsync findutils sed
  ```

- MacOS

  ```bash
  brew install bash yq gawk perl rsync findutils gnu-sed
  ```

## 기본 사용법

기본 워크플로우는 `./scripts/sync-notes.sh` 를 실행시켜 옵시디언 노트 내부의 폴더의 노트들을 복사해온 뒤 깃을 통해 푸시한다.

> [!IMPORTANT]
> 모든 md 문서중 프론트메터 값에 publish 값에 문자열값이(빈문자열 제외) 존재하는 문서들만 가져온다.
