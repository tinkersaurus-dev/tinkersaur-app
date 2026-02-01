/**
 * User Document Card Component
 *
 * Renders a single user document with all sections (overview, prerequisites,
 * steps, troubleshooting, related topics) as formatted content.
 */

import type { UserDocument } from '@/features/llm-generation';
import '@/shared/styles/markdown-content.css';

export interface UserDocCardProps {
  document: UserDocument;
}

export function UserDocCard({ document }: UserDocCardProps) {
  return (
    <div className="markdown-content markdown-content--compact markdown-content--user-doc text-[var(--text)] text-xs">
      <h1>{document.title}</h1>

      <h2>Overview</h2>
      <p>{document.overview}</p>

      {document.prerequisites && document.prerequisites.length > 0 && (
        <>
          <h2>Prerequisites</h2>
          <ul>
            {document.prerequisites.map((prereq, index) => (
              <li key={`prereq-${index}`}>{prereq}</li>
            ))}
          </ul>
        </>
      )}

      {document.steps && document.steps.length > 0 && (
        <>
          <h2>Steps</h2>
          {document.steps.map((step, index) => (
            <div key={`step-${index}`} className="step-container">
              <h3>
                Step {index + 1}: {step.title}
              </h3>
              <p>{step.description}</p>
              {step.screenshotHint && (
                <div className="screenshot-hint">[Screenshot: {step.screenshotHint}]</div>
              )}
              {step.callout && (
                <div className={`callout callout-${step.callout.type}`}>
                  <strong>
                    {step.callout.type.charAt(0).toUpperCase() + step.callout.type.slice(1)}:
                  </strong>{' '}
                  {step.callout.content}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {document.troubleshooting && document.troubleshooting.length > 0 && (
        <>
          <h2>Troubleshooting</h2>
          {document.troubleshooting.map((item, index) => (
            <div key={`trouble-${index}`}>
              <h3>{item.issue}</h3>
              <p>{item.resolution}</p>
            </div>
          ))}
        </>
      )}

      {document.relatedTopics && document.relatedTopics.length > 0 && (
        <>
          <h2>Related Topics</h2>
          <ul>
            {document.relatedTopics.map((topic, index) => (
              <li key={`topic-${index}`}>{topic}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
