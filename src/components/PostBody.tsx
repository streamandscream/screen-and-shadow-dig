import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function PostBody({ children }: { children: string }) {
  return (
    <div className="prose-article max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
