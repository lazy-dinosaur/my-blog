import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import path from "path";
import { Post } from "@/lib/posts";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface FolderStructure {
  name: string;
  type: "folder" | "file";
  children?: FolderStructure[];
  urlPath?: string;
}

export function buildFolderStructure(posts: Post[]): FolderStructure[] {
  const structure: FolderStructure[] = [];
  
  posts.forEach(post => {
    const pathSegments = post.urlPath.split('/');
    let currentLevel = structure;

    pathSegments.forEach((segment, index) => {
      const existingNode = currentLevel.find(n => n.name === segment);
      
      if (!existingNode) {
        const newNode: FolderStructure = {
          name: segment,
          type: index === pathSegments.length - 1 ? 'file' : 'folder',
          urlPath: pathSegments.slice(0, index + 1).join('/'),
          children: []
        };
        currentLevel.push(newNode);
        currentLevel = newNode.children!;
      } else {
        currentLevel = existingNode.children || [];
      }
    });
  });

  return structure;
}
