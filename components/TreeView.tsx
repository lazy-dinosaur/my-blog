"use client";
import { ChevronRight, ChevronDown, Folder, File } from "lucide-react";
import { cn, FolderStructure } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface TreeViewProps {
  data: FolderStructure[];
  level?: number;
  parentPath?: string;
}

export function TreeView({ data, level = 0, parentPath = "" }: TreeViewProps) {
  return (
    <div className="space-y-1.5">
      {data.map((item) => (
        <TreeNode
          key={item.urlPath || item.name}
          node={item}
          level={level}
          parentPath={parentPath}
        />
      ))}
    </div>
  );
}

function TreeNode({
  node,
  level,
  parentPath,
}: {
  node: FolderStructure;
  level: number;
  parentPath: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const decodedPath = decodeURIComponent(pathname);
  const currentPath =
    node.type === "folder"
      ? `${parentPath}/${node.name}`.replace("//", "/")
      : node.urlPath || "";
  const normalizedCurrentPath = `/posts/${node.urlPath}`;
  const isFileActive = decodedPath === normalizedCurrentPath;
  const isFolderActive = decodedPath.startsWith(`${normalizedCurrentPath}/`);
  const shouldAutoExpand = decodedPath.startsWith(`/posts${currentPath}/`);

  useEffect(() => {
    if (shouldAutoExpand && !isExpanded) {
      setIsExpanded(true);
    }
  }, [shouldAutoExpand, isExpanded]);

  const paddingLeft = `${level * 12}px`;
  const linkClassName = cn(
    "flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium hover:text-primary transition-colors px-1",
    (isFileActive || isFolderActive) && "text-primary bg-accent/50",
  );

  return (
    <div style={{ paddingLeft }} className="py-0.5">
      <div
        className={cn(
          "flex items-center hover:bg-accent rounded-md mb-1 sm:mb-1.5",
          (isFileActive || isFolderActive) && "bg-accent",
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {node.type === "folder" && (
          <Button variant="ghost" size="sm" className="h-6 sm:h-8 w-6 sm:w-8 p-0">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button>
        )}
        <div className="flex-1 py-0.5 sm:py-1">
          {node.type === "file" ? (
            <Link href={normalizedCurrentPath} className={linkClassName}>
              <File className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              {node.name}
            </Link>
          ) : (
            <button className={linkClassName}>
              <Folder className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              {node.name}
            </button>
          )}
        </div>
      </div>
      {isExpanded && node.children && (
        <div className="transition-all duration-300 ease-in-out">
          <TreeView
            data={node.children}
            level={level + 1}
            parentPath={currentPath}
          />
        </div>
      )}
    </div>
  );
}
