import MarkdownRenderer from "@/components/MarkdownRenderer";
import Link from "next/link";
import { getPost, getPosts } from "@/lib/posts";
import { ArrowLeft } from "lucide-react";

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
  const { slug } = await params;
  const decodedSlug = slug.map((s) => decodeURIComponent(s)).filter(Boolean);
  const post = await getPost(decodedSlug);

  if (!post) {
    return (
      <div className="bg-card rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6">포스트를 찾을 수 없습니다.</h1>
        <Link
          href="/"
          className="text-primary hover:underline inline-flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const publishPath = post.urlPath.split("/").slice(0, -1).join("/");

  return (
    <article className="bg-card rounded-lg  p-6 lg:p-8 min-h-[70vh]">
      {/* 마크다운 콘텐츠 */}
      <div className="min-h-[300px]">
        <MarkdownRenderer
          content={post.content}
          publish={publishPath}
          published={post.createdAt}
          modified={post.modifiedAt}
          tags={post.tags}
        />
      </div>

      {/* 홈으로 돌아가기 */}
      <div className="mt-12 pt-6 border-t">
        <Link
          href="/"
          className="text-primary hover:underline inline-flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          홈으로 돌아가기
        </Link>
      </div>
    </article>
  );
}
