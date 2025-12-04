/**
 * User Document Card Component
 *
 * Renders a single user document with all sections (overview, prerequisites,
 * steps, troubleshooting, related topics) as formatted content.
 */

import type { UserDocument } from '../../lib/llm/types';

export interface UserDocCardProps {
  document: UserDocument;
}

export function UserDocCard({ document }: UserDocCardProps) {
  return (
    <div className="user-doc-content text-[var(--text)] text-xs">
      <style>{`
        .user-doc-content {
          font-size: 12px;
          line-height: 1.5;
        }
        .user-doc-content h1 {
          font-size: 1.3em;
          font-weight: bold;
          margin-bottom: 0.4em;
          margin-top: 0;
          color: var(--text);
        }
        .user-doc-content h2 {
          font-size: 1.15em;
          font-weight: bold;
          margin-top: 0.8em;
          margin-bottom: 0.4em;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.2em;
          color: var(--text);
        }
        .user-doc-content h3 {
          font-size: 1.05em;
          font-weight: bold;
          margin-top: 0.6em;
          margin-bottom: 0.3em;
          color: var(--text);
        }
        .user-doc-content p {
          margin-bottom: 0.5em;
          line-height: 1.5;
          color: var(--text);
        }
        .user-doc-content ul {
          padding-left: 1.5em;
          margin-bottom: 0.5em;
          color: var(--text);
        }
        .user-doc-content li {
          margin-bottom: 0.2em;
        }
        .user-doc-content .callout {
          border-left: 3px solid;
          padding: 0.5em 0.75em;
          margin: 0.5em 0;
          background: var(--surface);
          border-radius: 0 4px 4px 0;
        }
        .user-doc-content .callout-note {
          border-color: var(--primary);
        }
        .user-doc-content .callout-warning {
          border-color: var(--warning);
        }
        .user-doc-content .callout-tip {
          border-color: var(--success);
        }
        .user-doc-content .screenshot-hint {
          background: var(--surface);
          padding: 0.5em 0.75em;
          border-radius: 4px;
          font-style: italic;
          margin: 0.5em 0;
          color: var(--text-muted);
          border: 1px dashed var(--border);
        }
        .user-doc-content .step-container {
          margin-bottom: 1em;
          padding-left: 0.5em;
          border-left: 2px solid var(--border-muted);
        }
      `}</style>

      <h1>{document.title}</h1>

      <h2>Overview</h2>
      <p>{document.overview}</p>

      {document.prerequisites.length > 0 && (
        <>
          <h2>Prerequisites</h2>
          <ul>
            {document.prerequisites.map((prereq, index) => (
              <li key={index}>{prereq}</li>
            ))}
          </ul>
        </>
      )}

      <h2>Steps</h2>
      {document.steps.map((step, index) => (
        <div key={index} className="step-container">
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

      {document.troubleshooting.length > 0 && (
        <>
          <h2>Troubleshooting</h2>
          {document.troubleshooting.map((item, index) => (
            <div key={index}>
              <h3>{item.issue}</h3>
              <p>{item.resolution}</p>
            </div>
          ))}
        </>
      )}

      {document.relatedTopics.length > 0 && (
        <>
          <h2>Related Topics</h2>
          <ul>
            {document.relatedTopics.map((topic, index) => (
              <li key={index}>{topic}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
