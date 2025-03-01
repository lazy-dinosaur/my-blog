"use client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react"; // X 아이콘 추가
import { FolderStructure } from "@/lib/utils";
import { TreeView } from "@/components/TreeView";
import { useState } from "react"; // 상태 관리 추가
import { DialogTitle, DialogDescription } from "@radix-ui/react-dialog";

export default function LeftSidebar({
  folderStructure,
}: {
  folderStructure: FolderStructure[];
}) {
  const [open, setOpen] = useState(false); // 오픈 상태 관리

  return (
    <>
      {/* Mobile version */}
      <Sheet open={open} onOpenChange={setOpen}>
        <DialogTitle hidden={true}></DialogTitle>
        <DialogDescription hidden={true}></DialogDescription>
        <SheetTrigger asChild className="lg:hidden fixed bottom-4 right-4 z-50">
          <Button variant="outline" size="icon">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-80 p-0 pt-12"
          onCloseAutoFocus={(e) => e.preventDefault()} // 포커스 이슈 방지
        >
          <div className="relative h-full">
            <ScrollArea className="h-full p-4">
              {/* 상단 패딩 추가 */}
              <h2 className="text-lg font-semibold mb-4 px-2">카테고리</h2>
              <TreeView data={folderStructure} />
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop version (기존 코드 유지) */}
      <aside className="hidden lg:block lg:w-96 h-[calc(100vh-4rem)] sticky top-16 shadow-lg">
        <ScrollArea className="h-full p-4">
          <h2 className="text-lg font-semibold mb-4 px-2">카테고리</h2>
          <TreeView data={folderStructure} />
        </ScrollArea>
      </aside>
    </>
  );
}
