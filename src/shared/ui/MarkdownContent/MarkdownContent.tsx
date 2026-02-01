import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownContent.css';

interface MarkdownContentProps {
  content: string;
  compact?: boolean;
  className?: string;
}

export function MarkdownContent({ content, compact, className }: MarkdownContentProps) {
  const classes = [
    'markdown-content',
    compact && 'markdown-content--compact',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
