/**
 * PresenceIndicator - Avatar stack showing users in a context
 */
import { Avatar, Tooltip } from '@/shared/ui';
import { usePresenceStore } from '../model/usePresenceStore';

interface PresenceIndicatorProps {
  contextType: string;
  contextId: string;
  maxAvatars?: number;
  showCount?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function PresenceIndicator({
  contextType,
  contextId,
  maxAvatars = 5,
  showCount = true,
  size = 'small',
}: PresenceIndicatorProps) {
  const contextKey = `${contextType}:${contextId}`;
  const context = usePresenceStore((state) => state.presenceByContext[contextKey]);

  const users = context?.users ?? [];
  const displayedUsers = users.slice(0, maxAvatars);
  const overflowCount = Math.max(0, users.length - maxAvatars);

  if (users.length === 0) return null;

  // Generate initials from name
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Generate a consistent color based on user ID
  const getAvatarColor = (userId: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-red-500',
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex items-center gap-2">
      {/* Avatar Stack */}
      <div className="flex -space-x-2">
        {displayedUsers.map((user, index) => (
          <Tooltip key={user.userId} content={user.name}>
            <div
              className="relative ring-2 ring-[var(--bg-light)] rounded-full"
              style={{ zIndex: displayedUsers.length - index }}
            >
              <Avatar size={size} className={`${getAvatarColor(user.userId)} text-white`}>
                {getInitials(user.name)}
              </Avatar>
              {/* Online indicator dot */}
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full ring-1 ring-[var(--bg-light)]" />
            </div>
          </Tooltip>
        ))}

        {/* Overflow indicator */}
        {overflowCount > 0 && (
          <Tooltip content={`${overflowCount} more`}>
            <div className="relative ring-2 ring-[var(--bg-light)] rounded-full">
              <Avatar size={size} className="bg-[var(--bg-dark)] text-[var(--text)]">
                +{overflowCount}
              </Avatar>
            </div>
          </Tooltip>
        )}
      </div>

      {/* Online count */}
      {showCount && (
        <span className="text-xs text-[var(--text-muted)]">{users.length} online</span>
      )}
    </div>
  );
}
