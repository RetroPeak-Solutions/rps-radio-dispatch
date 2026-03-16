import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import "./index.css";

type ContentMarkdownProps = {
    content: string;
}

export default function ContentMarkdown({ content }: ContentMarkdownProps) {
    return (
        <ReactMarkdown
            components={{
                ul: (props) => (
                    <ul className="markdown-content" {...props} />
                ),
                ol: ({node, ...props}) => (
                    <ol className="markdown-content" {...props} />
                )
            }} 
            remarkPlugins={[remarkGfm, remarkBreaks]} 
            remarkRehypeOptions={{
                passThrough: ["blockquote", "code", "list", "listItem"]
            }}
        >
            {content}
        </ReactMarkdown>
    )
}