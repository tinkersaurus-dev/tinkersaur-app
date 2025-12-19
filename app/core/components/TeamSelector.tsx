import { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiCheck, FiEdit2, FiEye } from 'react-icons/fi';
import { useAuthStore } from '~/core/auth';
import type { TeamAccess } from '~/core/auth/types';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-1.5 text-xs text-[var(--text-muted)] uppercase tracking-wide">
      {children}
    </div>
  );
}

interface TeamItemProps {
  team: TeamAccess;
  showIcon?: boolean;
  isSelected: boolean;
  onSelect: (teamId: string) => void;
}

function TeamItem({ team, showIcon = true, isSelected, onSelect }: TeamItemProps) {
  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 cursor-pointer text-sm
        ${isSelected
          ? 'bg-[var(--bg-light)] text-[var(--text)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]'
        }
      `}
      onClick={() => onSelect(team.teamId)}
    >
      <span className="flex-1 truncate">{team.teamName}</span>
      {showIcon && team.role === 'Edit' && (
        <FiEdit2 className="w-3 h-3 text-[var(--text-muted)]" />
      )}
      {showIcon && team.role === 'View' && (
        <FiEye className="w-3 h-3 text-[var(--text-muted)]" />
      )}
      {isSelected && <FiCheck className="w-4 h-4 text-[var(--primary)]" />}
    </div>
  );
}

export function TeamSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { teamAccess, selectedTeam, selectTeam } = useAuthStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group teams by access type
  const primaryTeam = teamAccess.find(t => t.isPrimary);
  const editAccessTeams = teamAccess.filter(t => !t.isPrimary && t.role === 'Edit');
  const viewAccessTeams = teamAccess.filter(t => !t.isPrimary && t.role === 'View');

  const handleSelect = (teamId: string) => {
    selectTeam(teamId);
    setIsOpen(false);
  };

  if (!selectedTeam) {
    return (
      <div className="text-xs text-[var(--text-muted)]">
        No team selected
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 text-left hover:bg-[var(--bg-hover)] rounded px-1 py-1 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[var(--text)] truncate">
            {selectedTeam.teamName}
          </div>
          {!selectedTeam.canEdit && (
            <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <FiEye className="w-3 h-3" />
              View only
            </div>
          )}
        </div>
        <FiChevronDown
          className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-dark)] border border-[var(--border)] rounded-md shadow-lg z-50 py-1 max-h-80 overflow-auto">
          {/* Primary Team */}
          {primaryTeam && (
            <>
              <SectionLabel>Primary Team</SectionLabel>
              <TeamItem team={primaryTeam} showIcon={false} isSelected={selectedTeam?.teamId === primaryTeam.teamId} onSelect={handleSelect} />
            </>
          )}

          {/* Edit Access Teams */}
          {editAccessTeams.length > 0 && (
            <>
              <div className="my-1 border-t border-[var(--border)]" />
              <SectionLabel>Edit Access</SectionLabel>
              {editAccessTeams.map(team => (
                <TeamItem key={team.teamId} team={team} isSelected={selectedTeam?.teamId === team.teamId} onSelect={handleSelect} />
              ))}
            </>
          )}

          {/* View Access Teams */}
          {viewAccessTeams.length > 0 && (
            <>
              <div className="my-1 border-t border-[var(--border)]" />
              <SectionLabel>View Access</SectionLabel>
              {viewAccessTeams.map(team => (
                <TeamItem key={team.teamId} team={team} isSelected={selectedTeam?.teamId === team.teamId} onSelect={handleSelect} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
