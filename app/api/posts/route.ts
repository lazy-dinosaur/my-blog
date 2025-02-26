// app/api/posts/route.ts
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { NextResponse } from "next/server";

export interface Post {
  id: string;
  title: string;
  summary: string;
  content: string;
  image: string;
  tags: string[];
  createdAt: string;
  urlPath: string;
}

async function getPosts(): Promise<Post[]> {
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
        const urlPath = relativePath.replace(/\.md$/, "");
        posts.push({
          id: data.id || urlPath,
          title: data.title || "No title",
          summary:
            data.summary ||
            (content.length > 100
              ? content.substring(0, 100) + "..."
              : content),
          content,
          image: data.image || "",
          tags: data.tags || [],
          createdAt: data.createdAt || "",
          urlPath, // 실제 URL은 /posts/{urlPath} 형태 사용
        });
      }
    }
    return posts;
  }

  return await walk(postsDir);
}

export async function GET() {
  const posts = await getPosts();
  return NextResponse.json({ posts });
}
