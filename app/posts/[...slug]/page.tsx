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
      <article className="bg-card rounded-lg p-4 sm:p-6 lg:p-8 min-h-[70vh]">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
          포스트를 찾을 수 없습니다.
        </h1>
        <Link
          href="/"
          className="text-primary hover:underline inline-flex items-center text-sm sm:text-base"
        >
          <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          홈으로 돌아가기
        </Link>
      </article>
    );
  }

  const publishPath = post.urlPath.split("/").slice(0, -1).join("/");

  return (
    <article className="bg-card rounded-lg p-4 sm:p-6 lg:p-8 min-h-[70vh]">
      {/* 마크다운 콘텐츠 */}
      <div className="min-h-[250px] sm:min-h-[300px]">
        <MarkdownRenderer
          content={post.content}
          publish={publishPath}
          published={post.createdAt}
          modified={post.modifiedAt}
          tags={post.tags}
        />
      </div>

      {/* 홈으로 돌아가기 */}
      <div className="mt-8 sm:mt-10 md:mt-12 pt-4 sm:pt-6 border-t">
        <Link
          href="/"
          className="text-primary hover:underline inline-flex items-center text-sm sm:text-base"
        >
          <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          홈으로 돌아가기
        </Link>
      </div>
    </article>
  );
}
