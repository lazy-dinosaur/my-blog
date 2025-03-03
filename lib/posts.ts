import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";
import metaData from "../public/meta-data.json";

interface MetaData {
  urlPath: string;
  title: string;
  summary: string;
  image: string;
  tags: string[];
  createdAt: string;
  modifiedAt: string;
}

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

export async function getPosts(): Promise<Post[]> {
  const postsDir = path.join(process.cwd(), "content", "posts");

  return Promise.all(
    metaData.map(async (item: MetaData) => {
      const filePath = path.join(postsDir, `${item.urlPath}.md`);
      const fileContent = await fs.readFile(filePath, "utf8");
      const { content } = matter(fileContent);

      return {
        urlPath: item.urlPath,
        title: item.title,
        summary: item.summary,
        content,
        plainContent: extractPlainTextFromMarkdown(content),
        image: item.image || "",
        tags: item.tags || [],
        createdAt: item.createdAt,
        modifiedAt: item.modifiedAt,
      };
    }),
  );
}

export async function getPost(slug: string[]): Promise<Post | null> {
  // 슬러그 배열 유효성 검사
  if (!slug || !Array.isArray(slug) || slug.length === 0) {
    return null;
  }

  // 경로 정규화
  const urlPath = slug
    .join("/")
    .replace(/\/+/g, "/") // 중복 슬래시 제거
    .replace(/\.md$/, ""); // .md 확장자 제거

  // 대소문자 구분 없이 검색
  const postMeta = metaData.find(
    (item: MetaData) =>
      item.urlPath.localeCompare(urlPath, undefined, {
        sensitivity: "base",
      }) === 0,
  );

  if (!postMeta) return null;

  const filePath = path.join(
    process.cwd(),
    "content",
    "posts",
    `${postMeta.urlPath}.md`,
  );

  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    const { content } = matter(fileContent);

    return {
      urlPath: postMeta.urlPath,
      title: postMeta.title,
      summary: postMeta.summary,
      content,
      plainContent: extractPlainTextFromMarkdown(content),
      image: postMeta.image || "",
      tags: postMeta.tags || [],
      createdAt: postMeta.createdAt,
      modifiedAt: postMeta.modifiedAt,
    };
  } catch (error) {
    console.error("File read error:", error);
    return null;
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
