import MarkdownRenderer from "@/components/MarkdownRenderer";
import Link from "next/link";
import { getPost, getPosts } from "@/lib/posts";

interface PostPageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const posts = await getPosts();
  if (posts.length === 0) {
    return [{ slug: ["no-post"] }];
  }

  return posts.map((post) => ({
    slug: decodeURIComponent(post.urlPath).split("/"),
  }));
}

export default async function PostPage({ params }: PostPageProps) {
  // URL 디코딩 및 경로 정규화
  const { slug } = await params;
  const decodedSlug = slug.map((s) => decodeURIComponent(s)).filter(Boolean); // 빈 문자열 제거

  const post = await getPost(decodedSlug);

  if (!post) {
    return (
      <main className="flex-1 mx-auto p-5 lg:p-10 shadow-md">
        <article className="mx-auto rounded-lg p-8">
          <h1 className="text-2xl font-bold mb-4">
            포스트를 찾을 수 없습니다.
          </h1>
          <Link href="/" className="text-primary hover:underline">
            ← 홈으로 돌아가기
          </Link>
        </article>
      </main>
    );
  }

  const publishPath = post.urlPath.split("/").slice(0, -1).join("/");

  return (
    <main className="flex-1 mx-auto p-5 lg:p-10 shadow-md">
      <article className="rounded-lg ">
        <div className="mb-6">
          <MarkdownRenderer
            content={post.content}
            publish={publishPath}
            published={post.createdAt}
            modified={post.modifiedAt}
            tags={post.tags}
          />
        </div>
        <Link href="/" className="text-primary hover:underline">
          ← 홈으로 돌아가기
        </Link>
      </article>
    </main>
  );
}
