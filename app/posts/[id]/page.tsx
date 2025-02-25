import React from "react";
import Link from "next/link";

interface PostPageProps {
  params: {
    id: string;
  };
}

export default function PostPage({ params }: PostPageProps) {
  return (
    <main className="container mx-auto py-10 px-4">
      <article className="mx-auto shadow-lg rounded-lg p-8 mt-8">
        <h1 className="text-4xl font-bold mb-4">Post: {params.id}</h1>
        <p className="text-lg text-muted-foreground mb-6">
          This is the detail page for post with ID: {params.id}.
        </p>
        <Link href="/" className="text-primary hover:underline">
          ← Back to home
        </Link>
      </article>
    </main>
  );
}
