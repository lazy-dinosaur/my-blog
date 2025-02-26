"use client";
// components/MarkdownRenderer.tsx
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

export interface MarkdownRendererProps {
  content: string;
  publish?: string;
}

interface LinkMap {
  [key: string]: string; // 원본 경로 -> publish 값
}

export default function MarkdownRenderer({
  content,
  publish = "default",
}: MarkdownRendererProps) {
  const [linkMap, setLinkMap] = useState<LinkMap>({});
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    // 링크 매핑 파일 로드
    fetch("/link-map.json")
      .then((res) => res.json())
      .then((data) => {
        setLinkMap(data);
        setIsMapLoaded(true);
      })
      .catch((err) => {
        console.error("링크 매핑 로드 실패:", err);
        setIsMapLoaded(true); // 오류가 있어도 로딩 완료 표시
      });
  }, []);

  // 위키링크를 마크다운 링크로 변환
  const processWikiLinks = (text: string) => {
    return text.replace(/\[\[([^|]+)(?:\|([^\]]+))?\]\]/g, (_, path, label) => {
      return `[${label || path.split("/").pop().replace(".md", "")}](${path})`;
    });
  };

  const processedContent = processWikiLinks(content);

  const components = {
    img: ({ src, alt, ...props }: { src?: string; alt?: string }) => {
      if (src && !src.startsWith("http")) {
        // 상대 경로에서 파일명만 추출합니다.
        const imgName = src.split("/").pop();
        src = `/postImg/${publish}/${imgName}`;
      }
      return (
        <img src={src} alt={alt || ""} className="max-w-full" {...props} />
      );
    },
    a: ({
      href,
      children,
      ...props
    }: {
      href?: string;
      children?: React.ReactNode;
    }) => {
      if (!href) return <span {...props}>{children}</span>;

      // 외부 링크 처리
      if (href.startsWith("http")) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
            {children}
          </a>
        );
      }

      // 내부 MD 파일 링크 처리
      if (href.endsWith(".md")) {
        if (!isMapLoaded) {
          // 링크 맵 로딩 중에는 일반 텍스트로 표시
          return (
            <span className="text-gray-500" {...props}>
              {children}
            </span>
          );
        }

        // 링크된 파일의 경로 찾기
        const linkedPath = Object.keys(linkMap).find(
          (key) => key.endsWith(href) || key === href,
        );

        if (linkedPath && linkMap[linkedPath]) {
          // publish 값이 있으면 해당 경로로 링크
          return (
            <Link href={`/posts/${linkMap[linkedPath]}`} {...props}>
              {children}
            </Link>
          );
        } else {
          // publish 값이 없으면 비활성화된 링크로 표시
          return (
            <span
              className="text-gray-400 cursor-not-allowed"
              title="발행되지 않은 문서"
              {...props}
            >
              {children}
            </span>
          );
        }
      }

      // 기타 링크는 그대로 유지
      return (
        <a href={href} {...props}>
          {children}
        </a>
      );
    },
  };

  return (
    <div className="prose max-w-none">
      <ReactMarkdown components={components}>{processedContent}</ReactMarkdown>
    </div>
  );
}
