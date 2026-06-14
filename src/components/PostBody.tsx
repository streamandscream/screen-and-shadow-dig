import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Flatten any headings to plain paragraphs — post page enforces a no-subheading layout.
const flattenHeading = ({ children }: { children?: React.ReactNode }) => <p>{children}</p>;

export function PostBody({ children }: { children: string }) {
  return (
    <div className="prose-article max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: flattenHeading,
          h2: flattenHeading,
          h3: flattenHeading,
          h4: flattenHeading,
          h5: flattenHeading,
          h6: flattenHeading,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
