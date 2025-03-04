import { cn } from "@/lib/utils";
import Link from "next/link";

// // 정적 내보내기 호환을 위한 추가
// export function generateStaticParams() {
//   return []; // 빈 배열 반환 (의도적으로 정적 경로 생성하지 않음)
// }

export default function Custom404() {
  return (
    <main className="flex-1 mx-auto p-5 lg:p-10 shadow-md">
      <article className="mx-auto rounded-lg p-8">
        <h1 className="text-2xl font-bold mb-4">페이지를 찾을 수 없습니다</h1>
        <div className="prose dark:prose-invert">
          <p className="text-muted-foreground">
            요청하신 페이지가 존재하지 않거나 삭제되었습니다.
          </p>
          <Link
            href="/"
            className={cn(
              "mt-4 inline-block",
              "text-primary hover:underline",
              "transition-colors duration-200",
            )}
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </article>
    </main>
  );
}
