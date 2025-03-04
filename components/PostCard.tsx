import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface PostCardProps {
  urlPath: string;
  title: string;
  summary: string;
  content: string;
  plainContent?: string;
  image: string;
  tags: string[];
  createdAt: string;
}

const PostCard = ({
  urlPath,
  title,
  summary,
  content,
  plainContent,
  image,
  tags,
  createdAt,
}: PostCardProps) => {
  let thumbnail = image || (content.match(/!\[.*?\]\((.*?)\)/)?.[1] ?? "");

  if (
    thumbnail &&
    !thumbnail.startsWith("http") &&
    !thumbnail.startsWith("/")
  ) {
    const publishDir = urlPath.split("/").slice(0, -1).join("/");
    const imageName = thumbnail.split("/").pop();
    thumbnail = `/postImg/${publishDir}/${imageName}`;
  }

  return (
    <Link href={`/posts/${urlPath}`}>
      <Card className="hover:shadow-lg transition-shadow duration-300 h-full group">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-lg sm:text-xl md:text-2xl line-clamp-2">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          {thumbnail ? (
            <div className="relative w-full mb-3 sm:mb-4 aspect-video overflow-hidden rounded-md group-hover:shadow-md transition-shadow">
              <Image
                src={thumbnail}
                alt={title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div className="h-32 sm:h-40 md:h-48 w-full mb-3 sm:mb-4 flex items-center justify-center bg-muted text-muted-foreground rounded-md p-3 sm:p-4 group-hover:bg-muted/80 transition-colors">
              <span className="text-center text-xs sm:text-sm">
                {(plainContent || content).substring(0, 100)}...
              </span>
            </div>
          )}
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
            {summary}
          </p>
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
            {tags.map((tag) => (
              <Badge
                key={tag}
                className="text-xs px-1.5 py-0.5 sm:px-2 sm:py-1"
              >
                #{tag}
              </Badge>
            ))}
          </div>
          <p className="text-2xs sm:text-xs text-muted-foreground">
            Published on {new Date(createdAt).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PostCard;
