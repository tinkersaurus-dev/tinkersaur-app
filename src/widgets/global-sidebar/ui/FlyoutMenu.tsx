/**
 * FlyoutMenu Component
 * Displays flyout navigation menu when sidebar is collapsed
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { NavSection } from '@/shared/lib/config/navigation-config';

interface FlyoutMenuProps {
  section: NavSection;
  sidebarRef: React.RefObject<HTMLDivElement | null>;
  flyoutTimeoutRef: React.RefObject<NodeJS.Timeout | null>;
  isExactActive: (path: string) => boolean;
  getResolvedPath: (section: NavSection) => string;
  navigate: (path: string) => void;
  setFlyoutSection: (section: string | null) => void;
}

export function FlyoutMenu({
  section,
  sidebarRef,
  flyoutTimeoutRef,
  isExactActive,
  getResolvedPath,
  navigate,
  setFlyoutSection,
}: FlyoutMenuProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!sidebarRef.current) return;

    const sidebarRect = sidebarRef.current.getBoundingClientRect();
    const sectionElement = sidebarRef.current.querySelector(`[data-section="${section.key}"]`);

    if (!sectionElement) return;

    const sectionRect = sectionElement.getBoundingClientRect();

    setPosition({
      top: sectionRect.top,
      left: sidebarRect.right + 4,
    });
  }, [sidebarRef, section.key]);

  if (!position) return null;

  return createPortal(
    <div
      data-flyout-menu
      className="fixed bg-[var(--bg-light)] border border-[var(--border)] rounded-sm shadow-lg py-2 min-w-[clamp(180px,12vw,240px)] z-50"
      style={{
        top: position.top,
        left: position.left,
      }}
      onMouseEnter={() => {
        if (flyoutTimeoutRef.current) {
          clearTimeout(flyoutTimeoutRef.current);
        }
      }}
      onMouseLeave={() => {
        setFlyoutSection(null);
      }}
    >
      {/* Section header in flyout */}
      <div
        className="px-4 py-2 text-xs font-medium text-[var(--text)] border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-hover)]"
        onClick={() => {
          navigate(getResolvedPath(section));
          setFlyoutSection(null);
        }}
      >
        {section.label}
      </div>

      {/* Children if any */}
      {section.children && section.children.length > 0 && (
        <div className="py-1">
          {section.children.map((child) => (
            <div
              key={child.key}
              className={`
                flex items-center gap-2 px-4 py-2 cursor-pointer text-xs transition-colors
                ${
                  isExactActive(child.path)
                    ? 'text-[var(--primary)] bg-[var(--bg-hover)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
                }
              `}
              onClick={() => {
                navigate(child.path);
                setFlyoutSection(null);
              }}
            >
              {child.icon}
              {child.label}
            </div>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
