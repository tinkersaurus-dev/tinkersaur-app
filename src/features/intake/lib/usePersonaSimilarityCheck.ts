import { useEffect, useCallback, useRef } from 'react';
import { useIntakeStore, useExtractionsByType } from '../model/useIntakeStore';
import { useAuthStore } from '@/features/auth';
import { personaApi } from '@/entities/persona';
import type { PersonaEntity, Extraction } from '../model/types';

/**
 * Hook that watches for new persona extractions and automatically
 * checks for similar existing personas in the database.
 */
export function usePersonaSimilarityCheck() {
  const teamId = useAuthStore((state) => state.selectedTeam?.teamId);
  const personaExtractions = useExtractionsByType('personas');
  const personaMatches = useIntakeStore((state) => state.personaMatches);
  const checkingPersonas = useIntakeStore((state) => state.checkingPersonas);
  const setPersonaMatches = useIntakeStore((state) => state.setPersonaMatches);
  const setCheckingPersona = useIntakeStore((state) => state.setCheckingPersona);

  // Track which extractions we've already started checking to avoid duplicate calls
  const checkedRef = useRef<Set<string>>(new Set());

  const checkSimilarity = useCallback(
    async (extraction: Extraction) => {
      if (!teamId) return;

      const entity = extraction.entity as PersonaEntity;
      setCheckingPersona(extraction.id, true);

      try {
        const results = await personaApi.findSimilar({
          teamId,
          name: entity.name,
          description: entity.description,
          role: entity.role,
          threshold: 0.5,
          limit: 5,
        });
        setPersonaMatches(extraction.id, results);
      } catch (error) {
        console.error('Failed to check persona similarity:', error);
        // Set empty results on error so we don't retry
        setPersonaMatches(extraction.id, []);
      } finally {
        setCheckingPersona(extraction.id, false);
      }
    },
    [teamId, setPersonaMatches, setCheckingPersona]
  );

  // Watch for new persona extractions and check similarity
  useEffect(() => {
    for (const extraction of personaExtractions) {
      // Skip if already checked, currently checking, or we've started a check
      if (
        personaMatches.has(extraction.id) ||
        checkingPersonas.has(extraction.id) ||
        checkedRef.current.has(extraction.id)
      ) {
        continue;
      }

      // Mark as started to prevent duplicate calls
      checkedRef.current.add(extraction.id);
      checkSimilarity(extraction);
    }
  }, [personaExtractions, personaMatches, checkingPersonas, checkSimilarity]);

  // Clean up ref when extractions are removed
  useEffect(() => {
    const currentIds = new Set(personaExtractions.map((e) => e.id));
    for (const id of checkedRef.current) {
      if (!currentIds.has(id)) {
        checkedRef.current.delete(id);
      }
    }
  }, [personaExtractions]);
}
