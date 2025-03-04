"use client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { TreeView } from "@/components/TreeView";
import { useState } from "react";
import { DialogTitle, DialogDescription } from "@radix-ui/react-dialog";
import { usePosts } from "@/contexts/posts-context";
import { buildFolderStructure } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface LeftSidebarProps {
  className?: string;
}

export default function LeftSidebar({ className }: LeftSidebarProps) {
  const [open, setOpen] = useState(false);
  const { posts } = usePosts();
  const folderStructure = buildFolderStructure(posts);

  return (
    <>
      {/* 모바일 버전 */}
      <Sheet open={open} onOpenChange={setOpen}>
        <DialogTitle hidden={true}></DialogTitle>
        <DialogDescription hidden={true}></DialogDescription>
        <SheetTrigger asChild className="lg:hidden fixed bottom-4 left-4 z-50">
          <Button variant="outline" size="icon">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-80 p-0 pt-12"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="relative h-full">
            <ScrollArea className="h-full p-4">
              <h2 className="text-lg font-semibold mb-4 px-2">카테고리</h2>
              <TreeView data={folderStructure} />
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* 데스크톱 버전 */}
      <aside className={cn("hidden lg:block border-r", className)}>
        <ScrollArea className="h-full p-4">
          <h2 className="text-lg font-semibold mb-4 px-2">카테고리</h2>
          <TreeView data={folderStructure} />
        </ScrollArea>
      </aside>
    </>
  );
}
