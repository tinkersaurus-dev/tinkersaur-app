/**
 * Technical Specification Card Component
 *
 * Renders a single tech spec section with markdown content and subsections.
 * Optimized for displaying code blocks, tables, and technical documentation.
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TechSpecSection } from '../../lib/llm/types';
import { TECH_SPEC_SECTION_LABELS } from '../../lib/llm/types';

export interface TechSpecCardProps {
  section: TechSpecSection;
}

export function TechSpecCard({ section }: TechSpecCardProps) {
  return (
    <div className="tech-spec-content text-[var(--text)] text-xs">
      <style>{`
        .tech-spec-content {
          font-size: 12px;
          line-height: 1.6;
        }
        .tech-spec-content .section-type-badge {
          display: inline-block;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 4px;
          background: var(--surface);
          color: var(--text-muted);
          margin-bottom: 0.5em;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .tech-spec-content h1 {
          font-size: 1.4em;
          font-weight: bold;
          margin-bottom: 0.4em;
          margin-top: 0;
          color: var(--text);
        }
        .tech-spec-content h2 {
          font-size: 1.2em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.4em;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.2em;
          color: var(--text);
        }
        .tech-spec-content h3 {
          font-size: 1.1em;
          font-weight: bold;
          margin-top: 0.8em;
          margin-bottom: 0.3em;
          color: var(--text);
        }
        .tech-spec-content h4 {
          font-size: 1em;
          font-weight: bold;
          margin-top: 0.6em;
          margin-bottom: 0.3em;
          color: var(--text);
        }
        .tech-spec-content p {
          margin-bottom: 0.6em;
          line-height: 1.6;
          color: var(--text);
        }
        .tech-spec-content ul,
        .tech-spec-content ol {
          padding-left: 1.5em;
          margin-bottom: 0.6em;
          color: var(--text);
        }
        .tech-spec-content li {
          margin-bottom: 0.3em;
        }
        .tech-spec-content code {
          background-color: var(--surface);
          padding: 0.15em 0.4em;
          border-radius: 3px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 0.9em;
          color: var(--primary);
        }
        .tech-spec-content pre {
          background-color: var(--surface);
          padding: 1em;
          border-radius: 6px;
          overflow-x: auto;
          margin: 0.8em 0;
          border: 1px solid var(--border);
        }
        .tech-spec-content pre code {
          background-color: transparent;
          padding: 0;
          color: var(--text);
          font-size: 11px;
          line-height: 1.5;
        }
        .tech-spec-content blockquote {
          border-left: 3px solid var(--primary);
          padding-left: 0.75em;
          margin-left: 0;
          margin-bottom: 0.6em;
          color: var(--text-secondary);
          background: var(--surface);
          padding: 0.5em 0.75em;
          border-radius: 0 4px 4px 0;
        }
        .tech-spec-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 0.8em 0;
          font-size: 11px;
        }
        .tech-spec-content th,
        .tech-spec-content td {
          border: 1px solid var(--border);
          padding: 0.4em 0.6em;
          text-align: left;
          color: var(--text);
        }
        .tech-spec-content th {
          background-color: var(--surface);
          font-weight: bold;
        }
        .tech-spec-content strong {
          font-weight: bold;
          color: var(--text);
        }
        .tech-spec-content em {
          font-style: italic;
        }
        .tech-spec-content hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 1.5em 0;
        }
        .tech-spec-content .subsection {
          margin-top: 1.5em;
          padding-top: 1em;
          border-top: 1px dashed var(--border);
        }
        .tech-spec-content .subsection:first-child {
          margin-top: 1em;
          padding-top: 0;
          border-top: none;
        }
      `}</style>

      <div className="section-type-badge">
        {TECH_SPEC_SECTION_LABELS[section.sectionType] || section.sectionType}
      </div>

      <h1>{section.title}</h1>

      <div className="markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {section.content}
        </ReactMarkdown>
      </div>

      {section.subsections && section.subsections.length > 0 && (
        <div className="subsections">
          {section.subsections.map((subsection, index) => (
            <div key={index} className="subsection">
              <h2>{subsection.title}</h2>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {subsection.content}
              </ReactMarkdown>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
