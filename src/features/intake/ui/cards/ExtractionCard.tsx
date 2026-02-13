import { forwardRef, useState, useEffect } from 'react';
import { FiCheck, FiX, FiUsers, FiClipboard, FiMessageSquare, FiTarget, FiFileText } from 'react-icons/fi';
import type { Extraction, PersonaEntity, UseCaseEntity, FeedbackEntity, OutcomeEntity, RequirementEntity } from '../../model/types';
import { HStack } from '@/shared/ui';

interface ExtractionCardProps {
  extraction: Extraction;
  isActive: boolean;
  isNew?: boolean;
  isMerged?: boolean;
  mergedContent?: { name?: string; description?: string };
  onClick: () => void;
  onAccept: () => void;
  onReject: () => void;
  onAnimationComplete?: () => void;
}

const typeIcons = {
  personas: FiUsers,
  useCases: FiClipboard,
  feedback: FiMessageSquare,
  outcomes: FiTarget,
  requirements: FiFileText,
};

const typeColors = {
  personas: 'border-[var(--tag-blue)]',
  useCases: 'border-[var(--tag-green)]',
  feedback: 'border-[var(--tag-purple)]',
  outcomes: 'border-l-[var(--tag-orange)]',
  requirements: 'border-l-[var(--tag-cyan)]',
};

export const ExtractionCard = forwardRef<HTMLDivElement, ExtractionCardProps>(
  ({ extraction, isActive, isNew = false, isMerged = false, mergedContent, onClick, onAccept, onReject, onAnimationComplete }, ref) => {
    const [isAnimating, setIsAnimating] = useState(isNew);
    const Icon = typeIcons[extraction.type];
    const colorClass = typeColors[extraction.type];

    useEffect(() => {
      if (isNew && isAnimating) {
        const timer = setTimeout(() => {
          setIsAnimating(false);
          onAnimationComplete?.();
        }, 400);
        return () => clearTimeout(timer);
      }
    }, [isNew, isAnimating, onAnimationComplete]);

    const renderContent = () => {
      switch (extraction.type) {
        case 'personas': {
          const entity = extraction.entity as PersonaEntity;
          return (
            <>
              <h4 className="font-medium">{entity.name}</h4>
              <p className="text-sm text-[var(--text-muted)]">{entity.role}</p>
              {entity.description && (
                <p className="text-sm mt-1 line-clamp-2">{entity.description}</p>
              )}
            </>
          );
        }
        case 'useCases': {
          const entity = extraction.entity as UseCaseEntity;
          const name = mergedContent?.name ?? entity.name;
          const description = mergedContent?.description ?? entity.description;
          return (
            <>
              <h4 className="text-sm font-bold">Use Case: {name}</h4>
              <p className="text-sm mt-1 line-clamp-2">{description}</p>
            </>
          );
        }
        case 'feedback': {
          const entity = extraction.entity as FeedbackEntity;
          return (
            <>
              <p className="text-sm line-clamp-2"><span className="capitalize font-bold">{entity.type}:</span> {entity.content}</p>
            </>
          );
        }
        case 'outcomes': {
          const entity = extraction.entity as OutcomeEntity;
          return (
            <>
              <p className="text-sm font-bold">Outcome: {entity.description}</p>
              <p className="text-sm text-[var(--primary)] font-medium mt-1">
                Target: {entity.target}
              </p>
            </>
          );
        }
        case 'requirements': {
          const entity = extraction.entity as RequirementEntity;
          return (
            <>
              <p className="text-sm">
                <span className="capitalize font-bold">{entity.type} Requirement:</span> {entity.text}
              </p>
            </>
          );
        }
        default:
          return <p className="text-sm">Unknown extraction type</p>;
      }
    };

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`extraction-card p-3 border-1 border-l-6 cursor-pointer transition-all max-w-4xl ${colorClass} ${
          isActive ? 'ring-2 ring-[var(--primary)] shadow-md' : 'hover:shadow-sm'
        } ${extraction.status === 'accepted' || isMerged ? 'opacity-60' : ''} ${
          isAnimating ? 'animate-slide-in-right' : ''
        }`}
      >
        <HStack justify='between' align='center'>
        <HStack justify='between' align='center' gap="md">
          <Icon className="w-4 h-4 flex-shrink-0" />
          <div className="flex-1 min-w-0">{renderContent()}</div>
        </HStack>

        {extraction.status === 'pending' && (
          <div className="flex justify-end gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject();
              }}
              className="p-1.5 rounded hover:bg-[var(--tag-bg-red)] text-[var(--danger)] transition-colors"
              title="Reject"
            >
              <FiX className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept();
              }}
              className="p-1.5 rounded hover:bg-[var(--tag-bg-green)] text-[var(--success)] transition-colors"
              title="Accept"
            >
              <FiCheck className="w-4 h-4" />
            </button>
          </div>
        )}

        {extraction.status === 'accepted' && (
          <div className="flex justify-end">
            <span className="text-xs text-[var(--success)] flex items-center gap-1">
              <FiCheck className="w-3 h-3" />
              Accepted
            </span>
          </div>
        )}
        </HStack>
      </div>
    );
  }
);

ExtractionCard.displayName = 'ExtractionCard';
