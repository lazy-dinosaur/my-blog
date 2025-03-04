"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { usePosts } from "@/contexts/posts-context";

export default function Header() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [prevScrollY, setPrevScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const { posts } = usePosts();

  useEffect(() => {
    setIsClient(true);

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 30px 이상 스크롤했을 때만 동작 (모바일에서는 더 빨리 반응하도록)
      if (currentScrollY > 5) {
        // 이전 스크롤 위치보다 아래로 스크롤하면 헤더 숨김
        // 이전 스크롤 위치보다 위로 스크롤하면 헤더 표시
        setHeaderVisible(prevScrollY > currentScrollY);
      } else {
        // 상단 근처에서는 항상 헤더 표시
        setHeaderVisible(true);
      }

      setPrevScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prevScrollY]);
  const filteredPosts = useMemo(() => {
    const cleanQuery = searchQuery.toLowerCase().replace(/\s/g, "");
    const decomposedQuery = disassemble(cleanQuery);
    return posts.filter((post) => {
      const cleanTitle = post.title.toLowerCase().replace(/\s/g, "");
      const cleanContent = post.plainContent.toLowerCase().replace(/\s/g, "");

      const exactMatch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.plainContent.toLowerCase().includes(searchQuery.toLowerCase());

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

  const { theme, setTheme } = useTheme();

  if (!isClient) return null;

  return (
    <header
      className={cn(
        `bg-background shadow-md fixed top-0 w-full transition-transform duration-300 h-12 sm:h-14 md:h-16 flex items-center justify-center ${
          headerVisible ? "translate-y-0" : "-translate-y-full"
        } z-20`,
      )}
    >
      <div className="flex items-center justify-between py-1 sm:py-2 px-3 sm:px-4 md:px-6 w-full max-w-screen-2xl">
        <Link className="flex items-center" href="/">
          <span className="relative w-10 h-8 sm:w-14 sm:h-9 md:w-20 md:h-12 mr-1 sm:mr-2">
            <Image
              src="/lazydino-logo3.png"
              alt="lazydino.dev"
              className="h-full w-full object-cover"
              width={80}
              height={80}
            />
          </span>
          <span className="text-lg sm:text-xl md:text-2xl font-bold">
            lazydino.dev
          </span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="rounded-full h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10"
          >
            <Sun className="h-[1rem] w-[1rem] sm:h-[1.2rem] sm:w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1rem] w-[1rem] sm:h-[1.2rem] sm:w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1 md:gap-2 rounded-md border border-input bg-transparent px-1.5 sm:px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm text-muted-foreground hover:bg-accent transition-colors"
          >
            <span className="hidden sm:inline">Search posts...</span>
            <span className="sm:hidden">Search...</span>
            <kbd className="pointer-events-none hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
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
              className="flex-1 border-none shadow-none focus:ring-0 text-sm sm:text-base"
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
                      key={post.urlPath}
                      value={`${post.title} ${disassemble(post.title)} ${post.tags.join(" ")}`}
                      onSelect={() => {
                        router.push(`/posts/${post.urlPath}`);
                        setOpen(false);
                      }}
                      className="cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                    >
                      <div className="py-1 sm:py-2">
                        <h3 className="text-sm sm:text-base font-medium">
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
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                          {(() => {
                            const lowerText = post.summary.toLowerCase();
                            const lowerQuery = searchQuery.toLowerCase();
                            const exactIndex = lowerText.indexOf(lowerQuery);
                            if (exactIndex !== -1) {
                              return (
                                <>
                                  {post.summary.slice(0, exactIndex)}
                                  <mark className="bg-yellow-200/30">
                                    {post.summary.slice(
                                      exactIndex,
                                      exactIndex + searchQuery.length,
                                    )}
                                  </mark>
                                  {post.summary.slice(
                                    exactIndex + searchQuery.length,
                                  )}
                                </>
                              );
                            }
                            return post.summary;
                          })()}
                        </p>
                        <div className="mt-1 flex gap-2">
                          {post.tags.map((tag) => {
                            const lowerTag = tag.toLowerCase();
                            const lowerQuery = searchQuery.toLowerCase();
                            const exactIndex = lowerTag.indexOf(lowerQuery);
                            if (exactIndex !== -1) {
                              return (
                                <Badge
                                  key={tag}
                                  className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full"
                                >
                                  #{tag.slice(0, exactIndex)}
                                  <mark className="bg-yellow-200/30">
                                    {tag.slice(
                                      exactIndex,
                                      exactIndex + searchQuery.length,
                                    )}
                                  </mark>
                                  {tag.slice(exactIndex + searchQuery.length)}
                                </Badge>
                              );
                            }
                            return (
                              <span
                                key={tag}
                                className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full"
                              >
                                {tag}
                              </span>
                            );
                          })}
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
