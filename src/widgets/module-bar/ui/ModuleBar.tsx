/**
 * ModuleBar Component
 * Vertical icon bar for navigating between main modules
 */

import { useLocation, useNavigate } from 'react-router';
import { MODULE_CONFIG } from '@/shared/lib/config/module-config';
import { getActiveModule } from '@/shared/lib/utils';
import { Tooltip } from '@/shared/ui';

interface ModuleBarProps {
  /**
   * Called when a module is clicked with the module key, whether it's active, and the default route
   */
  onModuleClick?: (moduleKey: string, isActive: boolean, defaultRoute: string) => void;
}

export function ModuleBar({ onModuleClick }: ModuleBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const activeModule = getActiveModule(location.pathname);

  const handleModuleClick = (moduleKey: string, defaultRoute: string) => {
    const isActive = activeModule === moduleKey;

    if (onModuleClick) {
      onModuleClick(moduleKey, isActive, defaultRoute);
    } else {
      navigate(defaultRoute);
    }
  };

  return (
    <div className="h-full w-12 flex flex-col bg-[var(--bg-light)] flex-shrink-0 border-r border-[var(--border-muted)]">
      {/* Module navigation */}
      <nav className="flex-1 flex flex-col">
        {MODULE_CONFIG.map((module) => (
          <Tooltip key={module.key} content={module.label} placement="right">
            <button
              onClick={() => handleModuleClick(module.key, module.defaultRoute)}
              className={`
                w-full h-8 flex items-center justify-center cursor-pointer transition-colors relative
                ${
                  activeModule === module.key
                    ? 'text-[var(--primary)] bg-[var(--bg-light)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
                }
              `}
            >
              {/* Active indicator bar */}
              {activeModule === module.key && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-[var(--primary)] rounded-r" />
              )}
              {module.icon}
            </button>
          </Tooltip>
        ))}
      </nav>
    </div>
  );
}
