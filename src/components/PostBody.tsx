import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Render real h2/h3 tags for SEO structure, but visually match the surrounding
// body copy: same font, size, weight-as-bold, and paragraph spacing as `<p><strong>`.
// Inline styles + !important override the default `.prose-article h2/h3` sizing.
const asBodyHeading = (Tag: "h2" | "h3") =>
  function BodyHeading({ children }: { children?: React.ReactNode }) {
    return (
      <Tag
        style={{
          fontFamily: "inherit",
          fontSize: "inherit",
          fontWeight: 700,
          lineHeight: "inherit",
          margin: "1.1em 0",
        }}
      >
        {children}
      </Tag>
    );
  };

const H2 = asBodyHeading("h2");
const H3 = asBodyHeading("h3");

export function PostBody({ children }: { children: string }) {
  return (
    <div className="prose-article max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Demote markdown h1 to h2 so the page keeps a single <h1> (the post title).
          h1: H2,
          h2: H2,
          h3: H3,
          // h4-h6 are unusual in reviews; keep them as h3 to preserve descending order
          // under the surrounding h2 sections without introducing deeper levels.
          h4: H3,
          h5: H3,
          h6: H3,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

