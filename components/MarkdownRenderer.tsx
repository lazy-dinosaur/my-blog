// components/MarkdownRenderer.tsx
import React from "react";
import ReactMarkdown from "react-markdown";

export interface MarkdownRendererProps {
  content: string;
  publish?: string;
}

export default function MarkdownRenderer({
  content,
  publish = "default",
}: MarkdownRendererProps) {
  const components = {
    img: ({ src, alt, ...props }: { src?: string; alt?: string }) => {
      if (src && !src.startsWith("http")) {
        // 상대 경로에서 파일명만 추출합니다.
        const imgName = src.split("/").pop();
        src = `/postImg/${publish}/${imgName}`;
      }
      return <img src={src} alt={alt || ""} {...props} />;
    },
  };

  return (
    <div className="prose">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
