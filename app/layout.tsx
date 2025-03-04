import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import RightSidebar from "../components/RightSidebar";
import { getPosts } from "@/lib/posts";
import Header from "../components/Header";
import LeftSidebar from "../components/LeftSidebar";
import { PostsProvider } from "@/contexts/posts-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LazyDino Dev Log",
  description: "내가 한걸 티내기 위해 만든 블로그",
  authors: [{ name: "lazy-dinosaur", url: "https://github.com/lazy-dinosaur" }],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const posts = await getPosts();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PostsProvider posts={posts}>
            <div className="min-h-screen flex flex-col">
              <Header />
              <div className="flex flex-1 mx-auto px-4 gap-6 min-h-[calc(100vh-4rem)] mt-16">
                <LeftSidebar />
                <main className="flex-1 py-5 lg:py-10">{children}</main>
                <RightSidebar />
              </div>
            </div>
          </PostsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
