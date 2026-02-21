/**
 * ModuleBar Component
 * Horizontal icon bar for navigating between main modules
 * Shows icons with small labels; active module has bottom underline indicator
 */

import { useLocation, useNavigate } from 'react-router';
import { MODULE_CONFIG } from '@/shared/lib/config/module-config';
import { getActiveModule } from '@/shared/lib/utils';

interface ModuleBarProps {
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
    <div className="w-full flex-shrink-0 border-b border-[var(--border-muted)] bg-[var(--bg-light)]">
      <nav className="flex items-stretch">
        {MODULE_CONFIG.map((module) => (
          <button
            key={module.key}
            onClick={() => handleModuleClick(module.key, module.defaultRoute)}
            className={`
              flex-1 flex flex-col items-center justify-center gap-0.5 py-2 cursor-pointer
              transition-colors relative
              ${
                activeModule === module.key
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
              }
            `}
          >
            {module.icon}
            <span className="text-[9px] font-medium leading-tight">
              {module.label}
            </span>
            {/* Active indicator - bottom underline bar */}
            {activeModule === module.key && (
              <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[var(--primary)] rounded-t" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
