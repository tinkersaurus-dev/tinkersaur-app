/**
 * Technical Specification Card Component
 *
 * Renders a single tech spec section with markdown content and subsections.
 * Optimized for displaying code blocks, tables, and technical documentation.
 */

import { MarkdownContent } from '@/shared/ui';
import type { TechSpecSection } from '@/features/llm-generation';
import { TECH_SPEC_SECTION_LABELS } from '@/features/llm-generation';
import '../../styles/markdown-content.css';

export interface TechSpecCardProps {
  section: TechSpecSection;
}

export function TechSpecCard({ section }: TechSpecCardProps) {
  return (
    <div className="markdown-content markdown-content--compact markdown-content--tech-spec text-[var(--text)] text-xs">
      <div className="section-type-badge">
        {TECH_SPEC_SECTION_LABELS[section.sectionType] || section.sectionType}
      </div>

      <h1>{section.title}</h1>

      <div className="markdown-content">
        <MarkdownContent content={section.content} />
      </div>

      {section.subsections && section.subsections.length > 0 && (
        <div className="subsections">
          {section.subsections.map((subsection) => (
            <div key={subsection.title} className="subsection">
              <h2>{subsection.title}</h2>
              <MarkdownContent content={subsection.content} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
