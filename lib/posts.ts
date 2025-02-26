import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

export interface Post {
  id: string;
  title: string;
  summary: string;
  content: string;
  plainContent: string; // 순수 텍스트 콘텐츠 추가
  image: string;
  tags: string[];
  createdAt: string;
  urlPath: string; // URL 경로에 사용할 값 (예: dev/react/newnote)
}

// 마크다운에서 순수 텍스트 추출 함수
function extractPlainTextFromMarkdown(markdown: string): string {
  // 이미지 제거 (![대체텍스트](이미지주소))
  let text = markdown.replace(/!\[[^\]]*\]\([^)]+\)/g, '');
  
  // 헤딩 제거 (# 제목)
  text = text.replace(/^#+\s+(.*)$/gm, '');
  
  // 링크 제거 ([텍스트](링크) -> 텍스트)
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // 코드 블록 제거 (```코드```)
  text = text.replace(/```[\s\S]*?```/g, '');
  
  // 인라인 코드 제거 (`코드`)
  text = text.replace(/`([^`]+)`/g, '$1');
  
  // 볼드/이탤릭 제거 (**텍스트** 또는 *텍스트*)
  text = text.replace(/(\*\*|\*)(.*?)\1/g, '$2');
  
  // 목록 기호 제거 (- 항목 또는 * 항목)
  text = text.replace(/^[\s-*]+(.*)$/gm, '$1');
  
  // 위키링크 제거 ([[링크|텍스트]] -> 텍스트)
  text = text.replace(/\[\[([^|]+)(?:\|([^\]]+))?\]\]/g, (_, __, label) => label || '');
  
  // 여러 줄바꿈 하나로 통일
  text = text.replace(/\n\s*\n/g, '\n');
  
  // 앞뒤 공백 제거
  text = text.trim();
  
  return text;
}

export async function getPosts(): Promise<Post[]> {
  const postsDir = path.join(process.cwd(), "content", "posts");

  async function walk(dir: string): Promise<Post[]> {
    let posts: Post[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        posts = posts.concat(await walk(fullPath));
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        const fileContent = await fs.readFile(fullPath, "utf8");
        const { data, content } = matter(fileContent);
        // content/posts 폴더 기준의 상대 경로를 구합니다.
        const relativePath = path
          .relative(postsDir, fullPath)
          .replace(/\\/g, "/");
        // 확장자 제거
        const urlPath = relativePath.replace(/\.md$/, "");
        // 파일 이름을 제목으로 사용 (확장자 제거)
        const fileName = path.basename(fullPath, ".md");
        
        // 순수 텍스트 추출
        const plainContent = extractPlainTextFromMarkdown(content);
        
        posts.push({
          id: data.id || urlPath, // 프론트매터에 id가 없으면 urlPath 사용
          title: fileName, // 항상 파일 이름 사용
          summary:
            data.summary ||
            (plainContent.length > 150
              ? plainContent.substring(0, 150) + "..."
              : plainContent),
          content,
          plainContent,
          image: data.image || "",
          tags: data.tags || [],
          createdAt: data.createdAt
            ? new Date(data.createdAt).toLocaleDateString()
            : "",
          urlPath, // 실제 URL은 /posts/{urlPath} 형태
        });
      }
    }
    return posts;
  }

  return await walk(postsDir);
}

// 단일 포스트 가져오기 함수 추가
export async function getPost(slug: string[]): Promise<Post | null> {
  if (slug.length < 2) {
    return null;
  }

  // 마지막 세그먼트를 파일명(postSlug)으로 사용하고, 나머지 세그먼트를 합쳐 publish 경로를 생성합니다.
  const postSlug = slug[slug.length - 1];
  const publish = slug.slice(0, -1).join("/");
  // 동기화된 md 파일 경로: content/posts/{publish}/{postSlug}.md
  const filePath = path.join(
    process.cwd(),
    "content",
    "posts",
    publish,
    `${postSlug}.md`,
  );

  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    const { content, data } = matter(fileContent);
    const urlPath = `${publish}/${postSlug}`;

    // 순수 텍스트 추출
    const plainContent = extractPlainTextFromMarkdown(content);

    return {
      id: data.id || urlPath,
      title: postSlug, // 항상 파일 이름 사용
      summary:
        data.summary ||
        (plainContent.length > 150 ? plainContent.substring(0, 150) + "..." : plainContent),
      content,
      plainContent,
      image: data.image || "",
      tags: data.tags || [],
      createdAt: data.createdAt
        ? new Date(data.createdAt).toLocaleDateString()
        : "",
      urlPath,
    };
  } catch (error) {
    console.error("File read error:", error);
    return null;
  }
}
