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
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 sm:h-12 sm:w-12 shadow-md"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[280px] sm:w-[320px] md:w-[360px] p-0 pt-10 sm:pt-12"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="relative h-full">
            <ScrollArea className="h-full p-3 sm:p-4">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 px-1 sm:px-2">
                카테고리
              </h2>
              <TreeView data={folderStructure} />
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* 데스크톱 버전 */}
      <aside className={cn("hidden lg:block", className)}>
        <ScrollArea className="h-full p-3 sm:p-4 md:p-5">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 md:mb-5 px-1 sm:px-2 border-b pb-2">
            카테고리
          </h2>
          <TreeView data={folderStructure} />
        </ScrollArea>
      </aside>
    </>
  );
}
