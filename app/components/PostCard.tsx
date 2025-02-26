import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface PostCardProps {
  id: string;
  title: string;
  summary: string;
  content: string;
  image: string;
  tags: string[];
  createdAt: string;
}

const PostCard = ({
  id,
  title,
  summary,
  content,
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
    const publishDir = id.split("/").slice(0, -1).join("/");
    const imageName = thumbnail.split("/").pop();
    thumbnail = `/postImg/${publishDir}/${imageName}`;
  }

  return (
    <Link href={`/posts/${id}`}>
      <Card className="hover:shadow-lg transition-shadow duration-300 h-full">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {thumbnail ? (
            <div className="relative w-full mb-4 aspect-video overflow-hidden rounded-md">
              <Image
                src={thumbnail}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : (
            <div
              className="h-48 w-full mb-4 flex items-center justify-center bg-muted text-muted-foreground rounded-md 
 p-4"
            >
              <span className="text-center text-sm">
                {content.substring(0, 100)}...
              </span>
            </div>
          )}
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {summary}
          </p>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Published on {createdAt}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PostCard;
