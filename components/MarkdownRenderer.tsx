"use client";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "./ui/badge";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Element } from "hast";
import { Button } from "./ui/button";
import { Copy, Check } from "lucide-react";

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

function formatDate(dateString: string | undefined): string {
  if (!dateString) return "날짜 정보 없음";

  try {
    return new Date(dateString).toLocaleDateString("ko-KR");
  } catch (error) {
    console.error("날짜 변환 오류:", error);
    return "유효하지 않은 날짜";
  }
}

export default function MarkdownRenderer({
  content,
  tags,
  published,
  modified,
}: MarkdownRendererProps) {
  const [linkMap, setLinkMap] = useState<LinkMap>({});
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetch("/link-map.json")
      .then((res) => res.json())
      .then((data) => {
        setLinkMap(data);
        setIsMapLoaded(true);
      })
      .catch((err) => {
        console.error("링크 매핑 로드 실패:", err);
        setIsMapLoaded(true);
      });
  }, []);

  // 코드 복사 함수
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const processWikiLinks = (text: string) => {
    // 이스케이프된 링크 패턴을 정상 링크로 변환
    let processed = text.replace(
      /\\\[(.*?)\\\]\((.*?)\)/g,
      (_, linkText, href) => {
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

        // 인코딩된 경로로 마크다운 링크 생성
        return `[${displayName}](${encodedPath})`;
      },
    );

    return processed;
  };

  const processedContent = processWikiLinks(content);

  const components = {
    h1: ({ children }: { children?: React.ReactNode }) => (
      <div className="mb-6 sm:mb-8 md:mb-10">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 md:mb-5">
          {children}
        </h1>
        {/* 태그 목록 */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6">
          {tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs sm:text-sm">
              #{tag}
            </Badge>
          ))}
        </div>

        {/* 날짜 정보 */}
        <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8 pb-3 sm:pb-4 border-b">
          <div>작성일: {formatDate(published)}</div>
          {modified && (
            <div className="mt-1 sm:mt-0">수정일: {formatDate(modified)}</div>
          )}
        </div>
      </div>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold mt-8 sm:mt-10 md:mt-12 mb-4 sm:mb-6 pb-1 sm:pb-2 border-b border-border/50">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mt-6 sm:mt-8 md:mt-10 mb-3 sm:mb-4">
        {children}
      </h3>
    ),
    h4: ({ children }: { children?: React.ReactNode }) => (
      <h4 className="text-base sm:text-lg lg:text-xl font-medium mt-4 sm:mt-6 mb-2 sm:mb-3 text-primary">
        {children}
      </h4>
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
        <div className="my-3 sm:my-4 md:my-5">{children}</div>
      ) : (
        <p className="my-3 sm:my-4 md:my-5 leading-6 sm:leading-7 text-foreground/90 text-sm sm:text-base md:text-[17px]">
          {children}
        </p>
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
      const code = String(children).replace(/\n$/, "");

      return !inline && match ? (
        <div className="relative my-4 sm:my-6 md:my-8 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between bg-primary/10 text-primary px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-mono">
            <span>{match[1]}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 sm:h-8 text-xs"
              onClick={() => handleCopyCode(code)}
            >
              {copiedCode === code ? (
                <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              ) : (
                <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              )}
              {copiedCode === code ? "복사됨" : "복사"}
            </Button>
          </div>
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: "1rem",
              borderRadius: 0,
              fontSize: "12px",
            }}
            className="sm:text-[13px] md:text-[14px] sm:p-5 md:p-6"
            {...props}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code
          className="bg-muted/50 text-primary px-1.5 py-0.5 rounded mx-0.5 font-mono text-[0.9em]"
          {...props}
        >
          {children}
        </code>
      );
    },
    img: ({ src, alt }: { src?: string; alt?: string }) => (
      <div className="my-4 sm:my-6 md:my-8 relative group">
        <div className="flex flex-col w-full items-center justify-center">
          <div
            className="relative overflow-hidden rounded-md sm:rounded-lg shadow-md sm:shadow-lg transition-all group-hover:shadow-xl border       
 border-muted/20 w-full max-w-full sm:max-w-2xl md:max-w-3xl"
          >
            <Image
              src={src || ""}
              alt={alt || ""}
              width={1200}
              height={630}
              className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 95vw, (max-width: 768px) 85vw, (max-width: 1024px) 75vw, 50vw"
            />
          </div>
          {alt && (
            <div className="text-center text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-3 italic">
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
            className="text-primary font-medium hover:underline decoration-primary decoration-1 sm:decoration-2 underline-offset-2 transition-colors"
          >
            {children}
          </a>
        );
      }

      // 홈으로 가는 링크
      if (href === "/") {
        return (
          <Link
            href="/"
            className="text-primary font-medium hover:underline decoration-primary decoration-2 underline-offset-2        
 transition-colors"
          >
            {children}
          </Link>
        );
      }

      // 내부 링크 처리
      if (!isMapLoaded)
        return <span className="text-muted-foreground">{children}</span>;

      // 디코딩 및 정규화
      const decodedHref = decodeURIComponent(href);
      const normalizedHref = decodedHref.replace(/\.md$/, "");
      const targetFileName = normalizedHref.split("/").pop();

      // 링크맵에서 검색
      for (const [key, value] of Object.entries(linkMap)) {
        const srcFileName = key.replace(/\.md$/, "").split("/").pop();
        if (srcFileName === targetFileName) {
          return (
            <Link
              href={`/posts/${value}`}
              className="text-primary font-medium hover:underline decoration-primary decoration-2 underline-offset-2      
 transition-colors"
            >
              {children}
            </Link>
          );
        }
      }

      // 발행되지 않은 문서 링크
      return (
        <span
          className="text-muted-foreground cursor-not-allowed border-b border-dashed border-muted-foreground/50"
          title="발행되지 않은 문서"
        >
          {children}
        </span>
      );
    },
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-4 border-primary pl-3 sm:pl-4 md:pl-5 my-4 sm:my-5 md:my-6 py-1 bg-muted/30 rounded-r-lg">
        <div className="italic text-foreground/80 font-medium text-sm sm:text-base">
          {children}
        </div>
      </blockquote>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="my-3 sm:my-4 md:my-5 ml-4 sm:ml-5 md:ml-6 list-disc space-y-1 sm:space-y-1.5 md:space-y-2">
        {children}
      </ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="my-3 sm:my-4 md:my-5 ml-4 sm:ml-5 md:ml-6 list-decimal space-y-1 sm:space-y-1.5 md:space-y-2">
        {children}
      </ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
      <li className="leading-6 sm:leading-7 text-sm sm:text-base text-foreground/90">
        {children}
      </li>
    ),
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="my-4 sm:my-6 md:my-8 overflow-x-auto rounded-md sm:rounded-lg border border-border">
        <table className="w-full border-collapse text-xs sm:text-sm md:text-base">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => (
      <thead className="bg-muted">{children}</thead>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
      <th className="text-left py-2 sm:py-3 px-2 sm:px-3 md:px-4 font-semibold border-b border-border">
        {children}
      </th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 border-b border-border/50">
        {children}
      </td>
    ),
    hr: () => <hr className="my-6 sm:my-8 border-border" />,
    input: ({ checked }: { checked?: boolean }) => (
      <input
        type="checkbox"
        checked={checked}
        className="w-4 h-4 text-primary rounded border-muted-foreground/30 focus:ring-primary mr-2"
        readOnly
      />
    ),
  };

  return (
    <div className="prose-custom">
      <ReactMarkdown components={components}>{processedContent}</ReactMarkdown>
    </div>
  );
}
