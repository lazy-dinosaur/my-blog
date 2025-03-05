# 나의 옵시디언 블로그 퍼블리셔

나의 워크플로우(옵시디언 + neovim)에 맞춘 블로그

Next.js 기반

## 기본 설정

1. env 설정
   프로젝트 내부의 `.env` 파일에 추가

   ```env
   NOTES_SOURCE_DIR=/home/lazydino/vaults/notes
   IGNORED_DIRS=_templates
   ```

   - NOTES_SOURCE_DIR: 노트 저장소 주소 (절대주소)
   - IGNORED_DIRS: 무시하고 싶은 폴더 (상대주소)

2. 의존 프로그램 설치

   - Ubuntu/Debian

     ```shell
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

3. neovim 에 배포용 플러그인 생성

   `lua/plugins/blog_deploy/core.lua` 파일 생성

   ```lua
    local M = {}

    function M.deploy_to_blog()
      -- 기존 deploy_to_blog 함수의 내용을 여기에 복사합니다
      -- 예:
      if not vim.g.blog_config then
        vim.notify("❌ opts가 설정되지 않았습니다!", vim.log.levels.ERROR)
        return
      end

      local blog_config = vim.g.blog_config or {}
      local blog_path = blog_config.path and vim.fn.expand(blog_config.path) or vim.fn.expand("~/my-blog")
      local branch = blog_config.branch or "blog"
      local vault_path = blog_config.vault_path and vim.fn.expand(blog_config.vault_path) or vim.fn.expand("~/vaults/notes")

      -- 디버깅용 출력
      print("📌 blog_path:", blog_path)
      print("📌 branch:", branch)
      print("📌 vault_path:", vault_path)

      -- 명령어에 동적 값 적용
      local cmd = string.format(
        "cd %s && git checkout %s && bun run deploy && git checkout -",
        vim.fn.shellescape(blog_path),
        vim.fn.shellescape(branch)
      )

      -- -- 디버깅용 로그
      -- vim.notify("📋 실행 명령어: " .. cmd, vim.log.levels.DEBUG)

      -- 로딩 애니메이션을 위한 변수
      -- 더 부드러운 애니메이션을 위한 프레임 증가
      local spinner_frames = { "⣷", "⣯", "⣟", "⡿", "⢿", "⣻", "⣽", "⣾" }
      local current_frame = 1
      local timer
      local notify_title = "블로그 배포"

      -- 알림 모듈 직접 사용
      local notify = require("notify")

      -- 데이터 수집용 변수
      local stdout_data = {}
      local stderr_data = {}

      -- 기존 알림 모두 제거 (배포 관련 알림만 제거하려면 filter 옵션 추가)
      notify.dismiss({
        title = notify_title,
        pending = true,
        silent = true,
      }) -- 블로그 배포 제목을 가진 알림만 제거

      -- 알림 ID 저장용 변수
      local notification_id

      -- 초기 알림 생성
      notification_id = notify("블로그 배포 준비 중...", vim.log.levels.INFO, {
        title = notify_title,
        icon = "🚀",
        timeout = false,
        hide_from_history = false,
      })

      -- 로딩 애니메이션 시작 - 타이머 간격을 150ms로 줄여 더 부드럽게
      timer = vim.loop.new_timer()

      if timer ~= nil then
        timer:start(
          100,
          50,
          vim.schedule_wrap(function()
            current_frame = (current_frame % #spinner_frames) + 1
            notification_id = notify("배포 진행 중... " .. spinner_frames[current_frame], vim.log.levels.INFO, {
              title = notify_title,
              icon = "🔄",
              timeout = false,
              replace = notification_id, -- 이전 알림 ID로 대체
            })
          end)
        )
      end

      -- 작업 실행
      vim.fn.jobstart(cmd, {
        on_stdout = function(_, data)
          if data and #data > 0 then
            for _, line in ipairs(data) do
              if line and line ~= "" then
                table.insert(stdout_data, line)
              end
            end
          end
        end,
        on_stderr = function(_, data)
          if data and #data > 0 then
            for _, line in ipairs(data) do
              if line and line ~= "" then
                table.insert(stderr_data, line)
              end
            end
          end
        end,
        on_exit = function(_, code)
          -- 타이머 정리
          if timer ~= nil then
            timer:stop()
            timer:close()
          end

          if code == 0 then
            -- 성공 알림
            notify("블로그 배포가 완료되었습니다!", vim.log.levels.INFO, {
              title = notify_title,
              icon = "✅",
              timeout = 3000,
              replace = notification_id, -- 이전 알림 ID로 대체
            })

            -- 성공 로그 (필요시)
            if #stdout_data > 0 then
              vim.defer_fn(function()
                notify("📄 실행 로그:\n" .. table.concat(stdout_data, "\n"):sub(1, 1000), vim.log.levels.DEBUG, {
                  title = "배포 로그",
                  timeout = 5000,
                })
              end, 1000)
            end
          else
            -- 실패 알림
            notify("블로그 배포에 실패했습니다! (코드: " .. code .. ")", vim.log.levels.ERROR, {
              title = notify_title,
              icon = "❌",
              timeout = 7000,
              replace = notification_id, -- 이전 알림 ID로 대체
            })

            -- 에러 로그
            if #stderr_data > 0 then
              vim.defer_fn(function()
                notify("🚨 에러 로그:\n" .. table.concat(stderr_data, "\n"):sub(1, 1000), vim.log.levels.ERROR, {
                  title = "에러 상세",
                  timeout = 10000,
                })
              end, 1000)
            end

            -- 출력 로그 (디버깅용)
            if #stdout_data > 0 then
              vim.defer_fn(function()
                notify("📄 출력 로그:\n" .. table.concat(stdout_data, "\n"):sub(1, 1000), vim.log.levels.DEBUG, {
                  title = "실행 로그",
                  timeout = 5000,
                })
              end, 2000)
            end
          end
        end,
        stdout_buffered = false,
        stderr_buffered = false,
      })
    end

    return M

   ```

   배포 플러그인을 위한 옵션 설정
   `lua/config/options.lua` 에 블로그 설정추가

   ```lua
    -- 블로그 배포 관련 설정을 전역 변수로 저장
    vim.g.blog_config = {
      path = "~/Development/my-blog", -- 블로그 저장소 경로
      branch = "blog", -- 배포용 브랜치
      vault_path = "~/vaults/notes", -- 옵시디언 볼트 경로
    }
   ```

   > [!info] 사용 방법
   >
   > ```lua
   > local map = vim.keymap.set
   > local map_opts = { noremap = true, silent = true }
   >
   > -- 블로그 배포 커맨드
   > local blog_deploy = require("plugins.blog_deploy.core")
   > vim.api.nvim_create_user_command("BlogDeploy", blog_deploy.deploy_to_blog, {})
   >
   > -- 키맵 설정
   > map("n", "<localleader>oP", ":BlogDeploy<CR>", map_opts)
   > ```

4. `obsidian.nvim` 설정 (중요!)
   해당 블로그는 파일 이름과 파일 내부의 프론트메터를 통해 블로그에 포스팅 되기 때문에 필수적으로 해야하는 설정이 있다

   - 파일명과 프론트메터의 분리
     `opts.note_path_func` 수정
     파일 명을 기반으로 블로그에서 주소를 만들게됨

     ```lua
      note_path_func = function(spec)
        local path = spec.dir / tostring(spec.title or "untitled")
        return path:with_suffix(".md")
      end,
     ```

     `opts.note_id_func` 수정(선택)
     선택사항이긴 하나 id에 최초 이름이 들어가기 때문에 지저분해보임 그냥 랜덤 생성으로 변경

     ```lua
      note_id_func = function()
        local suffix = ""
        for _ = 1, 4 do
          suffix = suffix .. string.char(math.random(65, 90))
        end
        return tostring(os.time()) .. "-" .. suffix
      end,
     ```

   - 필수 프론트 메터 설정
     `opts.note_frontmatter_func` 수정

     ```lua
      note_frontmatter_func = function(note)
        local out = {
          id = note.id,
          tags = note.tags,
          publish = "", -- 블로그의 폴더구조(카테고리) 설정 빈값이면 포스팅에서 제외
          series = "", -- 연관된 노트들을 그룹화 하기 위한 값
          createdAt = os.date("%Y-%m-%d %H:%M:%S"), -- 생성 시간 추가
          modifiedAt = os.date("%Y-%m-%d %H:%M:%S"), -- 생성 시간 추가
        }
        if note.metadata ~= nil and not vim.tbl_isempty(note.metadata) then
          for k, v in pairs(note.metadata) do
            out[k] = v
          end
        end
        return out
      end,
     ```

   - 편집 설정

     `opts.wiki_link_func` 수정
     기본 설정의 경우 `[[아이디|표시이름]]` 의형태로 링크가 삽입되는데 블로그는 아이디 값이 아니라 파일 명만 검색함 `[[파일명|표시이름]]` 으로 링크를 삽입해야 정삭 작동

     ```lua
     wiki_link_func = "use_alias_only",
     ```

     `opts.callbacks.pre_write_note` 함수 추가(선택)
     파일의 헤딩을 수정할시 해당 파일의 이름도 변경되며 동시에 백링크도 수정하는 기능
     필수는 아니지만 파일의 이름을 바꾸고 타이틀을 변경하는 경우 서로의 연결이 끊길수 있기 때문에 사용하면 좋음

     ```lua
        pre_write_note = function(client, note)
          local lines = vim.api.nvim_buf_get_lines(0, 0, -1, false)
          local content = table.concat(lines, "\n")
          local first_heading = content:match("#%s*(.-)\n")
          if first_heading and #first_heading > 0 then
            first_heading = first_heading:gsub('[/\\:*?"<>|]', "_"):gsub("^%s*(.-)%s*$", "%1")
            if #first_heading > 0 then
              local full_path = vim.fn.expand("%:p")
              local current_dir = vim.fn.fnamemodify(full_path, ":h")
              local current_filename = vim.fn.fnamemodify(full_path, ":t")
              local new_filename = first_heading .. ".md"
              local new_path = current_dir .. "/" .. new_filename
              if current_filename ~= new_filename then
                if vim.fn.filereadable(new_path) == 0 then
                  vim.cmd("silent! write")
                  local old_filename_no_ext = current_filename:gsub("%.md$", "")
                  local new_filename_no_ext = new_filename:gsub("%.md$", "")
                  local ok, err = pcall(function()
                    vim.cmd("silent! saveas! " .. vim.fn.fnameescape(new_path))
                    vim.cmd("bdelete! " .. vim.fn.fnameescape(full_path))
                    vim.cmd("silent! !rm " .. vim.fn.fnameescape(full_path))

                    local function get_workspace_root()
                      local full_path = vim.fn.expand("%:p")
                      local current_dir = vim.fn.fnamemodify(full_path, ":h")

                      -- Git 루트 찾기
                      local git_root = vim.fn.systemlist("git rev-parse --show-toplevel")[1]
                      if vim.fn.isdirectory(git_root) == 1 then
                        return git_root
                      end

                      -- `.obsidian` 폴더가 있으면 그걸 기준으로 루트 찾기
                      local obsidian_root = vim.fn.finddir(".obsidian", current_dir .. ";")
                      if obsidian_root and #obsidian_root > 0 then
                        return vim.fn.fnamemodify(obsidian_root, ":h")
                      end

                      -- 기본적으로 현재 파일이 있는 최상위 디렉터리 사용
                      return current_dir
                    end

                    local vault_path = get_workspace_root()
                    local Path = require("plenary.path")
                    local scan = require("plenary.scandir")

                    -- 볼트 내 모든 마크다운 파일 찾기
                    local function find_all_markdown_files(dir)
                      return scan.scan_dir(dir, { search_pattern = "%.md$", hidden = false, depth = 10 })
                    end

                    -- 파일 내용에서 백링크 업데이트
                    local function update_links_in_file(file_path, old_name, new_name)
                      local path = Path:new(file_path)
                      if not path:exists() then
                        return
                      end

                      local content = path:read()
                      if not content then
                        return
                      end

                      local updated = false

                      -- 1. 별칭 없는 위키 링크 처리
                      local wiki_pattern_simple = "%[%[%s*" .. vim.pesc(old_name) .. "%s*%]%]"
                      local wiki_replace_simple = "[[" .. new_name .. "]]"
                      if content:match(wiki_pattern_simple) then
                        content = content:gsub(wiki_pattern_simple, wiki_replace_simple)
                        updated = true
                      end

                      -- 2. 별칭 있는 위키 링크 처리
                      local wiki_pattern_alias = "%[%[%s*" .. vim.pesc(old_name) .. "%s*|%s*(.-)%s*%]%]"
                      local wiki_replace_alias = "[[" .. new_name .. "|%1]]"
                      if content:match(wiki_pattern_alias) then
                        content = content:gsub(wiki_pattern_alias, wiki_replace_alias)
                        updated = true
                      end

                      -- 마크다운 링크 형식 [텍스트](old_name.md) -> [텍스트](new_name.md) 업데이트
                      local md_pattern = "(%[.-%])%(" .. vim.pesc(old_name) .. "%.md%)"
                      local md_replace = "%1(" .. new_name .. ".md)"
                      if content:match(md_pattern) then
                        content = content:gsub(md_pattern, md_replace)
                        updated = true
                      end

                      -- 파일이 변경된 경우에만 저장
                      if updated then
                        path:write(content, "w")
                        print("✓ 백링크 업데이트 완료: " .. file_path)
                      end
                    end

                    -- 모든 마크다운 파일에서 백링크 업데이트 수행
                    local all_md_files = find_all_markdown_files(vault_path)
                    for _, file_path in ipairs(all_md_files) do
                      update_links_in_file(file_path, old_filename_no_ext, new_filename_no_ext)
                    end

                    -- 노트 경로 업데이트
                    note.path = Path:new(new_path)
                  end)
                  if ok then
                    print("✓ 파일 이름 변경 성공:", new_filename)
                  else
                    print("✗ 파일 이름 변경 실패:", tostring(err))
                  end
                else
                  print("✗ 같은 이름의 파일이 이미 존재함:", new_path)
                end
              else
                print("현재 파일명이 이미 헤딩과 동일함")
              end
            end
          else
            print("헤딩을 찾을 수 없음")
          end
          -- 메타데이터 업데이트
          local frontmatter = note.metadata or {}
          frontmatter.modifiedAt = os.date("%Y-%m-%d %H:%M:%S")
        end,
     ```

## 기본 사용법

기본 워크플로우는 `./scripts/sync-notes.sh` 를 실행시켜 옵시디언 노트 내부의 폴더의 노트들을 복사해온 뒤 gh-page cli를 통해 gh-page 에 퍼블리시 한다.

> [!IMPORTANT]
> 모든 md 문서중 프론트메터 값에 publish 값에 문자열값이(빈문자열 제외) 존재하는 문서들만 가져온다.

`./scripts/sync-notes.sh` 의 역할은 작성 중인 노트 폴더를 탐색하여 옳바른 구조로 정리해 블로그 배포용 프로젝트에 복사해오는 역할을 담당한다.

가져온 노트는 구조에 맞춰 `content/posts`폴더 안에 복사해오며 문서에 연결된 이미지도 마찬가지로 `public/postImg`폴더 안에 복사해오게 된다

가져온 노트와 이미지 그리고 노트 끼리의 연결은 `public/link-map.json` 과 `public/meta-data.json` 을 생성하고 읽어 블로그를 생성한다.

### 문서의 프론트메터에 대한 설명

```markdown
---
id: 1740877282-AGHK
tags:
  - blog
createdAt: 2025-03-02 10:01:22
modifiedAt: 2025-03-05 13:04:17
publish: blog
series: 나의 맞춤 블로그 만들기
---
```

보통 노트 작성을 하는 폴더 구조를 블로그에 그대로 사용하는것은 좋은 생각이 아니다. 하나의 계층으로 `블로그주소/포스트이름` 처럼 폴더 없이 하나의 계층으로 묶어두거나 다른 원하는 카테고리로 묶는 방법도 있다.

이 방식을 사용하기 위해 `publish`라는 값을 이용한다.

`publish`의 값이 비어있거나 키 자체가 존재하지 않는다면 스크립트의 탐색 대상에서 제외되며 블로그에 올라가지 않는다.

`publish`의 값은 문자열이어야 하며 할당된 값이 블로그 내의 주소 구조로 활용되며 카테고리를 만드는 역할을 한다. 즉 `블로그주소/posts/publish 값/파일이름` 의 주소를 갖게 된다.

## 추가해야할 기능혹은 페이지

- [ ] 소개 패이지
- [ ] 포트폴리오 페이지
- [ ] 댓글 기능
- [ ] 옵시디언 스타일의 콜아웃 적용
- [ ] 비디오 임베드
