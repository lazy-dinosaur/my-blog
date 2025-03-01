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
        setIsMapLoaded(true);
      })
      .catch((err) => {
        console.error("링크 매핑 로드 실패:", err);
        setIsMapLoaded(true);
      });
  }, []);

  const processWikiLinks = (text: string) => {
    return text.replace(/\[\[([^|]+)(?:\|([^\]]+))?\]\]/g, (_, path, label) => {
      return `[${label || path.split("/").pop()?.replace(".md", "") || ""}](${path})`;
    });
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
            className="rounded-xl shadow-lg transition-all group-hover:shadow-xl h-auto w-[20vw] min-w-96"
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

      if (href.endsWith(".md")) {
        if (!isMapLoaded) {
          return <span className="text-gray-500">{children}</span>;
        }

        const linkedPath = Object.keys(linkMap).find(
          (key) => key.endsWith(href) || key === href,
        );

        if (linkedPath && linkMap[linkedPath]) {
          return (
            <Link
              href={`/posts/${linkMap[linkedPath]}`}
              className="text-primary hover:underline"
            >
              {children}
            </Link>
          );
        }
        return (
          <span
            className="text-gray-400 cursor-not-allowed"
            title="발행되지 않은 문서"
          >
            {children}
          </span>
        );
      }

      return (
        <a href={href} className="text-primary hover:underline">
          {children}
        </a>
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
      max-w-none mx-auto py-10"
    >
      <ReactMarkdown components={components}>{processedContent}</ReactMarkdown>
    </div>
  );
}
