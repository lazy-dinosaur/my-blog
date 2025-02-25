import { dummyPosts } from "./data/dummyPosts";
import PostCard from "./components/PostCard";

export default function Home() {
  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-10">LazyDino Dev Log</h1>
      <p className="text-lg text-muted-foreground mb-6">
        내가 한걸 티내기 위해 만든 블로그
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {dummyPosts.map((post) => (
          <PostCard
            key={post.id}
            id={post.id}
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
