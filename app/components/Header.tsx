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
import { dummyPosts } from "../data/dummyPosts";
import { disassemble } from "es-hangul";
import { Command } from "cmdk";
import Link from "next/link";
import { DialogTitle, DialogDescription } from "@radix-ui/react-dialog";

const highlightMatches = (text: string, query: string) => {
  if (!query) return text;

  const cleanQuery = query.toLowerCase().replace(/\s/g, "");
  const decomposedQuery = disassemble(cleanQuery);
  const decomposedText = disassemble(text.toLowerCase().replace(/\s/g, ""));

  const queryInitials = decomposedQuery
    .split("")
    .filter((c) => /[ㄱ-ㅎ]/.test(c));
  const matchIndices: number[] = [];
  let queryIndex = 0;

  for (let i = 0; i < decomposedText.length; i++) {
    if (
      queryIndex < queryInitials.length &&
      decomposedText[i] === queryInitials[queryIndex]
    ) {
      matchIndices.push(i);
      queryIndex++;
    }
  }

  if (queryIndex === queryInitials.length) {
    const positionMap: number[] = [];
    let charIndex = 0;

    while (charIndex < text.length) {
      if (text[charIndex] === " ") {
        charIndex++;
        continue;
      }
      const decompLength = disassemble(text[charIndex].toLowerCase()).length;
      for (let i = 0; i < decompLength; i++) {
        positionMap.push(charIndex);
      }
      charIndex++;
    }

    const firstMatch = matchIndices[0];
    const lastMatch = matchIndices[matchIndices.length - 1];

    const start = positionMap[firstMatch] ?? 0;
    const end = (positionMap[lastMatch] ?? text.length - 1) + 1;

    return (
      <>
        {text.slice(0, start)}
        <mark className="bg-yellow-200/30">{text.slice(start, end)}</mark>
        {text.slice(end)}
      </>
    );
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const exactIndex = lowerText.indexOf(lowerQuery);

  if (exactIndex !== -1) {
    return (
      <>
        {text.slice(0, exactIndex)}
        <mark className="bg-yellow-200/30">
          {text.slice(exactIndex, exactIndex + query.length)}
        </mark>
        {text.slice(exactIndex + query.length)}
      </>
    );
  }

  return text;
};

const calculateFilteredPosts = (searchQuery: string) => {
  const cleanQuery = searchQuery.toLowerCase().replace(/\s/g, "");
  const decomposedQuery = disassemble(cleanQuery);

  return dummyPosts.filter((post) => {
    const cleanTitle = post.title.toLowerCase().replace(/\s/g, "");
    const cleanContent = post.content.toLowerCase().replace(/\s/g, "");

    const exactMatch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());

    const decomposedTitle = disassemble(cleanTitle);
    const decomposedContent = disassemble(cleanContent);

    const initialMatch = [decomposedTitle, decomposedContent].some((decomp) => {
      let queryIndex = 0;
      for (const c of decomp) {
        if (c === decomposedQuery[queryIndex]) queryIndex++;
        if (queryIndex === decomposedQuery.length) return true;
      }
      return false;
    });

    const tagMatch = post.tags.some((tag) => {
      const cleanTag = tag.toLowerCase().replace(/\s/g, "");
      return (
        tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        disassemble(cleanTag).includes(decomposedQuery)
      );
    });

    return exactMatch || initialMatch || tagMatch;
  });
};

export default function Header() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = useMemo(
    () => calculateFilteredPosts(searchQuery),
    [searchQuery],
  );

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
    <header className="bg-background shadow-sm">
      <div className="container mx-auto flex items-center justify-between py-4 px-6">
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
            className="flex items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
          >
            Search posts...
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
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
            <CommandList className="px-2 py-3 overflow-y-auto">
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
                        {highlightMatches(post.title, searchQuery)}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {highlightMatches(post.summary, searchQuery)}
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
          </Command>
        </CommandDialog>
      </div>
    </header>
  );
}
