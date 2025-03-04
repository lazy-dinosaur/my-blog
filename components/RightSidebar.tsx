"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { usePosts } from "@/contexts/posts-context";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface RightSidebarProps {
  className?: string;
}

const RightSidebar = ({ className }: RightSidebarProps) => {
  return (
    <aside className={cn("hidden lg:block border-l", className)}>
      <ScrollArea className="h-full p-4">
        <h2 className="font-semibold mb-4">최근 게시물</h2>
        <div className="space-y-3 mb-8">
          <RecentPosts />
        </div>

        <h2 className="font-semibold mb-4 mt-8">인기 태그</h2>
        <div className="flex flex-wrap gap-2">
          <PopularTags />
        </div>
      </ScrollArea>
    </aside>
  );
};

// 최근 게시물 목록 컴포넌트
function RecentPosts() {
  const { posts } = usePosts();
  const recentPosts = posts.slice(0, 5); // 최근 5개 게시물

  return (
    <div className="space-y-3">
      {recentPosts.map((post) => (
        <Link
          key={post.urlPath}
          href={`/posts/${post.urlPath}`}
          className="block text-sm hover:text-primary transition-colors line-clamp-1"
        >
          {post.title}
        </Link>
      ))}
    </div>
  );
}

// 인기 태그 컴포넌트
function PopularTags() {
  const { posts } = usePosts();

  // 태그 빈도수 계산
  const tagCount: Record<string, number> = {};
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });

  // 빈도수로 정렬하여 상위 10개 태그 선택
  const popularTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  return (
    <>
      {popularTags.map((tag) => (
        <Badge
          key={tag}
          variant="outline"
          className="text-xs hover:bg-primary hover:text-primary-foreground"
        >
          #{tag}
        </Badge>
      ))}
    </>
  );
}

export default RightSidebar;
