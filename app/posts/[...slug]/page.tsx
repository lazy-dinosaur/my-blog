import MarkdownRenderer from "@/components/MarkdownRenderer";
import Link from "next/link";
import { getPost } from "@/lib/posts";

interface PostPageProps {
  params: {
    slug: string[];
  };
}

export default async function PostPage({ params }: PostPageProps) {
  // params를 await하여 사용
  const resolvedParams = await Promise.resolve(params);
  const post = await getPost(resolvedParams.slug);

  if (!post) {
    return (
      <main className="container mx-auto py-10 px-4">
        <article className="text-center">
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

  // publish 경로 추출 (urlPath에서 마지막 세그먼트 제외)
  const publishPath = post.urlPath.split("/").slice(0, -1).join("/");

  return (
    <main className="container mx-auto py-10 px-4 max-w-5xl">
      <article className="mx-auto shadow-lg rounded-lg p-8 mt-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <div className="mb-6">
          <MarkdownRenderer
            content={post.content}
            publish={publishPath}
            published={post.createdAt}
            modified={post.modifiedAt}
          />
        </div>
        <Link href="/" className="text-primary hover:underline">
          ← 홈으로 돌아가기
        </Link>
      </article>
    </main>
  );
}
