"use client";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { disassemble } from "es-hangul";
import { DialogTitle, DialogDescription } from "@radix-ui/react-dialog";
import Link from "next/link";
import { Command } from "cmdk";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  // 필요시 다른 필드 추가
}

export default function Header() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);

  // 헤더 표시 여부 상태 (true이면 보이고, false이면 숨김)
  const [headerVisible, setHeaderVisible] = useState(true);

  // 컴포넌트가 마운트되면 로컬 스크롤 이벤트를 등록합니다.
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // 스크롤 내려가는 중이고 어느 정도 스크롤되었으면 헤더 숨김 (예: 100px 이상)
      if (currentScrollY > lastScrollY && currentScrollY > 5) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 컴포넌트가 마운트될 때 실제 md 파일 데이터를 가져옵니다.
  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/posts");
        if (res.ok) {
          const json = await res.json();
          setPosts(json.posts);
        } else {
          console.error("Failed to fetch posts:", res.statusText);
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    }
    fetchPosts();
  }, []);

  // 검색어에 따라 게시물을 필터링 합니다.
  const filteredPosts = useMemo(() => {
    const cleanQuery = searchQuery.toLowerCase().replace(/\s/g, "");
    const decomposedQuery = disassemble(cleanQuery);
    return posts.filter((post) => {
      const cleanTitle = post.title.toLowerCase().replace(/\s/g, "");
      const cleanContent = post.content.toLowerCase().replace(/\s/g, "");

      const exactMatch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase());

      const decomposedTitle = disassemble(cleanTitle);
      const decomposedContent = disassemble(cleanContent);

      const initialMatch = [decomposedTitle, decomposedContent].some(
        (decomp) => {
          let queryIndex = 0;
          for (const c of decomp) {
            if (c === decomposedQuery[queryIndex]) queryIndex++;
            if (queryIndex === decomposedQuery.length) return true;
          }
          return false;
        },
      );

      const tagMatch = (post.tags || []).some((tag) => {
        const cleanTag = tag.toLowerCase().replace(/\s/g, "");
        return (
          tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
          disassemble(cleanTag).includes(decomposedQuery)
        );
      });
      return exactMatch || initialMatch || tagMatch;
    });
  }, [searchQuery, posts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    // 헤더에 scroll 이벤트에 따른 translate-y 클래스를 동적으로 적용합니다.
    <header
      className={cn(
        `bg-background shadow-sm fixed top-0 w-full transition-transform duration-300 h-16 ${
          headerVisible ? "translate-y-0" : "-translate-y-full"
        } z-20`,
      )}
    >
      <div className="container mx-auto flex items-center justify-between py-2 px-6">
        <Link className="flex items-center" href="/">
          <span className="relative w-20 h-12 mr-2">
            <Image
              src="/lazydino-logo3.png"
              alt="lazydino.dev"
              className="h-full w-full object-cover"
              width={80}
              height={80}
            />
          </span>
          <span className="text-2xl font-bold">lazydino.dev</span>
        </Link>
        <div className="flex items-center">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm          
 text-muted-foreground hover:bg-accent transition-colors"
          >
            Search posts...
            <kbd
              className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted  
 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100"
            >
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <DialogTitle hidden={true}></DialogTitle>
          <DialogDescription hidden={true}></DialogDescription>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search posts..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="flex-1 border-none shadow-none focus:ring-0"
            />
            <ScrollArea className="h-full max-h-[300px]">
              <CommandList className="px-2 py-3 max-h-full">
                <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                  No results found.
                </CommandEmpty>
                <CommandGroup
                  heading="Posts"
                  className="text-xs font-medium text-muted-foreground px-2"
                >
                  {filteredPosts.map((post) => (
                    <CommandItem
                      key={post.id}
                      value={`${post.title} ${disassemble(post.title)} ${post.tags.join(" ")}`}
                      onSelect={() => {
                        router.push(`/posts/${post.id}`);
                        setOpen(false);
                      }}
                      className="cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                    >
                      <div className="py-2">
                        <h3 className="font-medium">
                          {(() => {
                            const lowerText = post.title;
                            const lowerQuery = searchQuery;
                            const exactIndex = lowerText
                              .toLowerCase()
                              .indexOf(lowerQuery.toLowerCase());
                            if (exactIndex !== -1) {
                              return (
                                <>
                                  {lowerText.slice(0, exactIndex)}
                                  <mark className="bg-yellow-200/30">
                                    {lowerText.slice(
                                      exactIndex,
                                      exactIndex + searchQuery.length,
                                    )}
                                  </mark>
                                  {lowerText.slice(
                                    exactIndex + searchQuery.length,
                                  )}
                                </>
                              );
                            }
                            return post.title;
                          })()}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {post.summary}
                        </p>
                        <div className="mt-1 flex gap-2">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-1 bg-accent rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </ScrollArea>
          </Command>
        </CommandDialog>
      </div>
    </header>
  );
}
