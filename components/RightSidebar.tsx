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
    <aside className={cn("hidden lg:block", className)}>
      <ScrollArea className="h-full p-3 sm:p-4 md:p-5">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 md:mb-5 border-b pb-2">
          최근 게시물
        </h2>
        <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 md:mb-10">
          <RecentPosts />
        </div>

        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 md:mb-5 mt-6 sm:mt-8 md:mt-10 border-b pb-2">
          인기 태그
        </h2>
        <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3">
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
    <div className="space-y-2 sm:space-y-3">
      {recentPosts.map((post) => (
        <Link
          key={post.urlPath}
          href={`/posts/${post.urlPath}`}
          className="block text-xs sm:text-sm hover:text-primary transition-colors line-clamp-1 py-0.5"
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
          className="text-2xs sm:text-xs hover:bg-primary hover:text-primary-foreground px-1.5 py-0.5 sm:px-2 sm:py-1"
        >
          #{tag}
        </Badge>
      ))}
    </>
  );
}

export default RightSidebar;
