import PostCard from "../components/PostCard";
import { getPosts } from "@/lib/posts";

export default async function Home() {
  const posts = await getPosts();

  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-10">
      {/* 헤더 섹션 */}
      <section className="space-y-2 sm:space-y-3 md:space-y-4 py-3 sm:py-4 md:py-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          LazyDino Dev Log
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          내가 한걸 티내기 위해 만든 블로그
        </p>
      </section>

      {/* 포스트 그리드 */}
      <section>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
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
      </section>
    </div>
  );
}
