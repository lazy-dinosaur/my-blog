import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import PostCard from "./components/PostCard";

interface Post {
  id: string;
  title: string;
  summary: string;
  content: string;
  image: string;
  tags: string[];
  createdAt: string;
  urlPath: string; // URL 경로에 사용할 값 (예: dev/react/newnote)
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
        // 확장자 제거
        const urlPath = relativePath.replace(/\.md$/, "");
        posts.push({
          id: data.id || urlPath, // 프론트매터에 id가 없으면 urlPath 사용
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
          urlPath, // 실제 URL은 /posts/{urlPath} 형태
        });
      }
    }
    return posts;
  }

  return await walk(postsDir);
}

export default async function Home() {
  const posts = await getPosts();

  return (
    <main className="container mx-auto py-10 px-4 mt-16">
      <h1 className="text-4xl font-bold mb-10">LazyDino Dev Log</h1>
      <p className="text-lg text-muted-foreground mb-6">
        내가 한걸 티내기 위해 만든 블로그
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            id={post.urlPath} // 링크에 사용: 예를 들어 `/posts/dev/react/newnote`
            title={post.title}
            summary={post.summary}
            content={post.content}
            image={post.image}
            tags={post.tags}
            createdAt={post.createdAt}
          />
        ))}
      </div>
    </main>
  );
}
