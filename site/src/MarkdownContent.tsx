import type { ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownContent({ children, link }: {
  children: string;
  link: (href: string, children: ReactNode) => ReactNode;
}) {
  return <Markdown remarkPlugins={[remarkGfm]} components={{
    a: ({ href = '', children }) => link(href, children),
  }}>{children}</Markdown>;
}
