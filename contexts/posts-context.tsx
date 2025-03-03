// context/posts-context.tsx
"use client";

import { createContext, useContext } from "react";
import { Post } from "@/lib/posts";

type PostsContextType = {
  posts: Post[];
};

const PostsContext = createContext<PostsContextType>({ posts: [] });

export function PostsProvider({
  children,
  posts,
}: {
  children: React.ReactNode;
  posts: Post[];
}) {
  return (
    <PostsContext.Provider value={{ posts }}>{children}</PostsContext.Provider>
  );
}

export function usePosts() {
  return useContext(PostsContext);
}
