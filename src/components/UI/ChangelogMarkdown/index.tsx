import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import "./index.css";

type ChangelogMarkdownProps = {
  content: string;
};

export default function ChangelogMarkdown({ content }: ChangelogMarkdownProps) {
  return (
    <div
      id="release-notes"
      className="max-h-40 overflow-y-auto p-2 bg-[#2f3136] rounded-lg text-gray-100 text-sm [&_ul]:list-disc [&_a]:text-blue-400"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          ul: (props) => <ul className="markdown-content" {...props} />,
          ol: (props) => <ol className="markdown-content" {...props} />,
          li: ({ node, ...props }) => <li {...props} />,
          br: ({ node, ...props }) => <br {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}