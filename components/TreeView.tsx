"use client";
import { ChevronRight, ChevronDown, Folder, File } from "lucide-react";
import { cn, FolderStructure } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface TreeViewProps {
  data: FolderStructure[];
  level?: number;
}

export function TreeView({ data, level = 0 }: TreeViewProps) {
  return (
    <div className="space-y-1">
      {data.map((item) => (
        <TreeNode key={item.urlPath || item.name} node={item} level={level} />
      ))}
    </div>
  );
}

function TreeNode({ node, level }: { node: FolderStructure; level: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  const decodedPath = decodeURIComponent(pathname);
  const decodedNodePath = node.urlPath ? decodeURIComponent(node.urlPath) : "";
  const isActive = decodedPath === `/posts/${decodedNodePath}`;
  const paddingLeft = `${level * 20}px`;

  return (
    <div className="pl-2" style={{ paddingLeft }}>
      <div
        className={cn(
          "flex items-center gap-2 hover:bg-accent rounded-md cursor-pointer",
          isActive && "bg-accent",
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {node.type === "folder" && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}

        <div className="flex-1 py-1">
          {node.type === "file" ? (
            <Link
              href={`/posts/${node.urlPath}`}
              className={cn(
                "flex items-center gap-2 text-sm font-medium",
                "hover:text-primary transition-colors",
                isActive && "text-primary bg-accent/50",
              )}
            >
              <File className="h-4 w-4 text-muted-foreground" />
              {node.name}
            </Link>
          ) : (
            <span className="flex items-center gap-2 text-sm font-medium">
              <Folder className="h-4 w-4 text-muted-foreground" />
              {node.name}
            </span>
          )}
        </div>
      </div>

      {isExpanded && node.children && (
        <div className="ml-6">
          <TreeView data={node.children} level={level + 1} />
        </div>
      )}
    </div>
  );
}
