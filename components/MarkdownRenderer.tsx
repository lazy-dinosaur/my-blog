"use client";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "./ui/badge";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Element } from "hast";

export interface MarkdownRendererProps {
  content: string;
  publish?: string;
  tags?: string[];
  published?: string;
  modified?: string;
}

interface LinkMap {
  [key: string]: string;
}

export default function MarkdownRenderer({
  content,
  tags,
  published,
  modified,
}: MarkdownRendererProps) {
  const [linkMap, setLinkMap] = useState<LinkMap>({});
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    fetch("/link-map.json")
      .then((res) => res.json())
      .then((data) => {
        setLinkMap(data);
        console.log(data);
        setIsMapLoaded(true);
      })
      .catch((err) => {
        console.error("링크 매핑 로드 실패:", err);
        setIsMapLoaded(true);
      });
  }, []);

  const processWikiLinks = (text: string) => {
    // 이스케이프된 링크 패턴을 정상 링크로 변환
    let processed = text.replace(
      /\\\[(.*?)\\\]\((.*?)\)/g,
      (_, linkText, href) => {
        console.log(`이스케이프된 링크 발견: ${linkText} -> ${href}`);
        // 링크 텍스트는 그대로, href는 URI 인코딩
        return `[${linkText}](${encodeURIComponent(href)})`;
      },
    );

    // 위키링크 처리
    processed = processed.replace(
      /\[\[([^|]+)(?:\|([^\]]+))?\]\]/g,
      (_, path, label) => {
        // 경로 정규화
        const cleanPath = path.replace(/\.md$/, "");
        // 표시할 이름이 없으면 경로의 마지막 부분을 사용
        const displayName = label || cleanPath.split("/").pop() || cleanPath;

        // URI 인코딩 적용
        const encodedPath = encodeURIComponent(cleanPath);
        console.log(`위키링크 변환: ${cleanPath} -> ${encodedPath}`);

        // 인코딩된 경로로 마크다운 링크 생성
        return `[${displayName}](${encodedPath})`;
      },
    );

    return processed;
  };

  const processedContent = processWikiLinks(content);

  const components = {
    h1: ({ children }: { children?: React.ReactNode }) => (
      <div>
        <h1 className="text-4xl font-bold pb-2">{children}</h1>
        <div className="flex flex-row gap-2 mb-6 text-sm font-bold text-muted-foreground items-center justify-between">
          {tags && tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} className="px-3 py-1 rounded-full">
                  #{tag}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Badge className="px-3 py-1 rounded-full">태그 없음</Badge>
            </div>
          )}
          {(published || modified) && (
            <div className="flex flex-col">
              {published && (
                <span>
                  Published: {new Date(published).toLocaleDateString()}
                </span>
              )}
              {modified && (
                <span>Modified: {new Date(modified).toLocaleDateString()}</span>
              )}
            </div>
          )}
        </div>
      </div>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="text-3xl font-semibold my-5">{children}</h2>
    ),
    p: ({ children }: { children?: React.ReactNode }) => {
      const hasBlockElement = React.Children.toArray(children).some((child) => {
        if (!React.isValidElement(child)) return false;

        const childType = (child as React.ReactElement).type;
        const isCustomImage = childType === components.img;

        const htmlElementType =
          typeof childType === "string"
            ? childType
            : (childType as React.ComponentType).displayName;

        return (
          isCustomImage ||
          (htmlElementType &&
            ["div", "img", "pre", "table"].includes(htmlElementType))
        );
      });

      return hasBlockElement ? (
        <div className="my-4">{children}</div>
      ) : (
        <p className="my-4 leading-relaxed">{children}</p>
      );
    },
    code({
      inline,
      className,
      children,
      ...props
    }: {
      node?: Element;
      inline?: boolean;
      className?: string;
      children?: React.ReactNode;
    }) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          className="rounded-lg mb-4"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code
          className="bg-muted px-2 py-1 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    },
    img: ({ src, alt }: { src?: string; alt?: string }) => (
      <div className="my-6 relative group">
        <div className="flex flex-col w-full lg:w-fit items-center justify-center lg:justify-start">
          <Image
            src={src || ""}
            alt={alt || ""}
            width={1200}
            height={630}
            className="rounded-xl shadow-lg transition-all group-hover:shadow-xl h-auto w-[20vw] min-w-80 md:min-w-96"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {alt && (
            <div className="text-center text-sm text-muted-foreground">
              {alt}
            </div>
          )}
        </div>
      </div>
    ),
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
      if (!href) return <span>{children}</span>;

      // 외부 링크 처리 (http로 시작하는 경우)
      if (href.startsWith("http")) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {children}
          </a>
        );
      }

      // 홈으로 가는 링크
      if (href === "/") {
        return (
          <Link href="/" className="text-primary hover:underline">
            {children}
          </Link>
        );
      }

      // 내부 링크 처리
      if (!isMapLoaded)
        return <span className="text-gray-500">{children}</span>;

      console.log("Processing link:", href);

      // 중요: href 디코딩 추가
      const decodedHref = decodeURIComponent(href);
      console.log("Decoded href:", decodedHref);

      // 파일 확장자 제거 및 경로 정규화
      const normalizedHref = decodedHref.replace(/\.md$/, "");
      const targetFileName = normalizedHref.split("/").pop();

      console.log("Target filename:", targetFileName);

      // 모든 링크맵을 순회하며 일치하는 파일명 찾기
      for (const [key, value] of Object.entries(linkMap)) {
        const srcFileName = key.replace(/\.md$/, "").split("/").pop();
        console.log(`Comparing: ${srcFileName} with ${targetFileName}`);

        if (srcFileName === targetFileName) {
          console.log(`Match found! ${key} -> ${value}`);
          return (
            <Link
              href={`/posts/${value}`}
              className="text-primary hover:underline"
            >
              {children}
            </Link>
          );
        }
      }

      console.log("No match found for:", href);
      return (
        <span
          className="text-gray-400 cursor-not-allowed"
          title="발행되지 않은 문서"
        >
          {children}
        </span>
      );
    },
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="overflow-x-auto">
        <table className="w-full my-6 border-collapse">{children}</table>
      </div>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
      <th className="bg-accent/50 text-left py-3 px-4 font-semibold border-b">
        {children}
      </th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td className="py-3 px-4 border-b">{children}</td>
    ),
    input: ({ checked }: { checked?: boolean }) => (
      <input
        type="checkbox"
        checked={checked}
        className="w-4 h-4 text-primary rounded border-foreground/20 focus:ring-primary"
        readOnly
      />
    ),
  };

  return (
    <div
      className="prose 
      prose-lg 
      dark:prose-invert 
      prose-headings:font-serif
      prose-a:text-primary prose-a:no-underline hover:prose-a:text-primary/80
      prose-img:rounded-xl prose-img:shadow-lg
      prose-blockquote:border-l-4 prose-blockquote:border-primary
      max-w-none mx-auto py-5 md:py-10"
    >
      <ReactMarkdown components={components}>{processedContent}</ReactMarkdown>
    </div>
  );
}
