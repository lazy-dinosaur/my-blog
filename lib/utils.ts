import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Post } from "./posts";

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
  const root: FolderStructure[] = [];
  const nodeMap = new Map<string, FolderStructure>();

  posts.forEach((post) => {
    const pathSegments = post.urlPath.split("/");
    let currentPath = "";
    let parentNodes = root;

    pathSegments.forEach((segment, index) => {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      const isFile = index === pathSegments.length - 1;

      const existingNode = parentNodes.find((n) => n.name === segment);
      if (existingNode) {
        parentNodes = existingNode.children!;
        return;
      }

      const newNode: FolderStructure = {
        name: segment,
        type: isFile ? "file" : "folder",
        children: isFile ? undefined : [],
        urlPath: isFile ? post.urlPath : currentPath,
      };

      nodeMap.set(currentPath, newNode);
      parentNodes.push(newNode);
      parentNodes = newNode.children || [];
    });
  });

  function sortNodes(nodes: FolderStructure[]): FolderStructure[] {
    return nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "folder" ? -1 : 1;
    });
  }

  return sortNodes(root);
}

export function findNodeByPath(
  nodes: FolderStructure[],
  path: string,
): FolderStructure | undefined {
  const segments = path.split("/");
  let currentNodes = nodes;

  for (const segment of segments) {
    const node = currentNodes.find((n) => n.name === segment);
    if (!node) return undefined;
    if (node.type === "file") return node;
    currentNodes = node.children!;
  }

  return currentNodes.find((n) => n.name === segments[segments.length - 1]);
}

export function flattenTree(nodes: FolderStructure[]): FolderStructure[] {
  const result: FolderStructure[] = [];
  const stack: FolderStructure[] = [...nodes];

  while (stack.length) {
    const node = stack.pop()!;
    result.push(node);
    if (node.children) stack.push(...node.children);
  }

  return result;
}
