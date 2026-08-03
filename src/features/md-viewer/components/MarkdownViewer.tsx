import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import 'highlight.js/styles/github-dark.css'
import './MarkdownViewer.css'

interface Props {
  content: string
  compact?: boolean
}

export default function MarkdownViewer({ content, compact }: Props) {
  return (
    <article
      className={`md-prose prose prose-slate max-w-none w-full rounded-xl border px-12 py-10${compact ? ' prose-sm px-8 py-7' : ''}`}
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-surface)',
        maxWidth: compact ? undefined : '860px',
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
      >
        {content}
      </ReactMarkdown>
    </article>
  )
}
