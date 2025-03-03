import { ScrollArea } from "@radix-ui/react-scroll-area";

const RightSidebar = () => {
  return (
    <aside className="hidden lg:block w-56 xl:w-64 2xl:w-80 h-[calc(100vh-4rem)] sticky top-16 py-10">
      <ScrollArea className="h-full p-4">
        <h2 className="font-semibold mb-4">Posts</h2>
      </ScrollArea>
    </aside>
  );
};
export default RightSidebar;
