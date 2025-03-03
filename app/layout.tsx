import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import RightSidebar from "../components/RightSidebar";
import { getPosts } from "@/lib/posts";
import { buildFolderStructure } from "@/lib/utils";
import Header from "../components/Header";
import LeftSidebar from "../components/LeftSidebar";

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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const posts = await getPosts();
  const folderStructure = buildFolderStructure(posts);

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
          <div className="min-h-screen flex flex-col m-w-screen">
            <Header />
            <div className="flex flex-1 container min-h-[calc(100vh-4rem)] mt-16 min-w-full">
              <LeftSidebar folderStructure={folderStructure} />
              {children}
              <RightSidebar />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
