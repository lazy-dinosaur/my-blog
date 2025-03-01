import PostCard from "../components/PostCard";
import { getPosts } from "@/lib/posts";

export default async function Home() {
  const posts = await getPosts();

  return (
    <main className="container mx-auto p-5 lg:p-10 ">
      <h1 className="text-4xl font-bold mb-10">LazyDino Dev Log</h1>
      <p className="text-lg text-muted-foreground mb-6">
        내가 한걸 티내기 위해 만든 블로그
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
        {posts.map((post) => (
          <PostCard
            key={post.urlPath}
            urlPath={post.urlPath}
            title={post.title}
            summary={post.summary}
            content={post.content}
            plainContent={post.plainContent}
            image={post.image}
            tags={post.tags}
            createdAt={post.createdAt}
          />
        ))}
      </div>
    </main>
  );
}
