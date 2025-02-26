import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import Link from "next/link";
import React from "react";

interface PostPageProps {
  params: {
    slug: string[];
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const resolvedParams = await Promise.resolve(params);
  // URL은 최소 2개의 세그먼트를 가져야 합니다.
  if (resolvedParams.slug.length < 2) {
    return (
      <main className="container mx-auto py-10 px-4">
        <article className="text-center">
          <h1 className="text-2xl font-bold mb-4">잘못된 URL입니다.</h1>
          <Link href="/" className="text-primary hover:underline">
            ← 홈으로 돌아가기
          </Link>
        </article>
      </main>
    );
  }

  // 마지막 세그먼트를 파일명(postSlug)으로 사용하고, 나머지 세그먼트를 합쳐 publish 경로를 생성합니다.
  const postSlug = resolvedParams.slug[resolvedParams.slug.length - 1];
  const publish = resolvedParams.slug.slice(0, -1).join("/");
  // 동기화된 md 파일 경로: content/posts/{publish}/{postSlug}.md
  const filePath = path.join(
    process.cwd(),
    "content",
    "posts",
    publish,
    `${postSlug}.md`,
  );

  let fileContent;
  try {
    fileContent = await fs.readFile(filePath, "utf8");
  } catch (error) {
    console.error("File read error:", error);
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

  // md 파일에서 프론트매터와 콘텐츠 분리
  const { content, data } = matter(fileContent);

  return (
    <main className="container mx-auto py-10 px-4 max-w-5xl">
      <article className="mx-auto shadow-lg rounded-lg p-8 mt-8">
        <h1 className="text-4xl font-bold mb-4">{data.title || postSlug}</h1>
        <div className="mb-6">
          <MarkdownRenderer content={content} publish={publish} />
        </div>
        <Link href="/" className="text-primary hover:underline">
          ← 홈으로 돌아가기
        </Link>
      </article>
    </main>
  );
}
