import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";
import metaData from "../public/meta-data.json";

// interface MetaData {
//   urlPath: string;
//   title: string;
//   summary: string;
//   image: string;
//   tags: string[];
//   createdAt: string;
//   modifiedAt: string;
// }

export interface Post {
  urlPath: string;
  title: string;
  summary: string;
  content: string;
  plainContent: string;
  image: string;
  tags: string[];
  createdAt: string;
  modifiedAt: string;
}

// getPosts 함수 수정
export async function getPosts(): Promise<Post[]> {
  try {
    if (!metaData || metaData.length === 0) return [];

    const postsDir = path.join(process.cwd(), "content", "posts");
    const posts = await Promise.all(
      metaData.map(async (item: Record<string, unknown>) => {
        try {
          const filePath = path.join(postsDir, `${item.urlPath}.md`);
          await fs.access(filePath, fs.constants.F_OK); // 파일 존재 확인

          const fileContent = await fs.readFile(filePath, "utf8");
          const { content } = matter(fileContent);

          return {
            urlPath: item.urlPath as string,
            title: item.title as string,
            summary: item.summary as string,
            content,
            plainContent: extractPlainTextFromMarkdown(content),
            image: (item.image || "") as string,
            tags: (item.tags || []) as string[],
            createdAt: item.createdAt as string,
            modifiedAt: item.modifiedAt as string,
          };
        } catch (error) {
          console.log(error);
          console.warn(`Skipping invalid post: ${item.urlPath}`);
          return null;
        }
      }),
    );

    return posts.filter(Boolean) as Post[]; // 유효한 포스트만 필터링
  } catch (error) {
    console.error("Error loading posts:", error);
    return []; // 에러 시 빈 배열 반환
  }
}

export async function getPost(slug: string[]): Promise<Post | null> {
  // 슬러그 유효성 검사 강화
  if (!slug || !Array.isArray(slug) || slug.length === 0) {
    return null;
  }

  const urlPath = slug.join("/").replace(/\/+/g, "/").replace(/\.md$/, "");

  try {
    // 메타데이터 타입 안전성 강화
    const postMeta = (metaData as Array<Record<string, unknown>>).find(
      (item) =>
        typeof item.urlPath === "string" &&
        item.urlPath.localeCompare(urlPath, undefined, {
          sensitivity: "base",
        }) === 0,
    );

    if (!postMeta) return null;

    // 파일 존재 여부 확인
    const filePath = path.join(
      process.cwd(),
      "content",
      "posts",
      `${postMeta.urlPath}.md`,
    );

    await fs.access(filePath, fs.constants.F_OK); // 파일 존재 확인

    const fileContent = await fs.readFile(filePath, "utf8");
    const { content } = matter(fileContent);

    return {
      urlPath: postMeta.urlPath as string,
      title: postMeta.title as string,
      summary: postMeta.summary as string,
      content,
      plainContent: extractPlainTextFromMarkdown(content),
      image: (postMeta.image || "") as string,
      tags: (postMeta.tags || []) as string[],
      createdAt: postMeta.createdAt as string,
      modifiedAt: postMeta.modifiedAt as string,
    };
  } catch (error) {
    console.error("Error loading post:", error);
    return null; // 모든 에러 경우에 null 반환
  }
}

function extractPlainTextFromMarkdown(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/^#+\s+(.*)$/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/(\*\*|\*)(.*?)\1/g, "$2")
    .replace(/^[\s-*]+(.*)$/gm, "$1")
    .replace(/\[\[([^|]+)(?:\|([^\]]+))?\]\]/g, (_, __, label) => label || "")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}
