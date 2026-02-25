import { useMemo } from 'react';
import { startOfDay, addDays } from 'date-fns';
import type { Feedback } from '@/entities/feedback';
import type { Persona } from '@/entities/persona';
import type { UserGoal } from '@/entities/user-goal';
import type { IntakeSource } from '@/entities/intake-source';
import { SOURCE_TYPES } from '@/entities/source-type';
import type { TimeGranularity } from '@/entities/feedback';
import {
  getBucketStart,
  addInterval,
  formatBucketLabel,
  resolveFeedbackDate,
} from './timeBuckets';

export type DimensionKey =
  | 'personas'
  | 'userGoals'
  | 'sourceTypes'
  | 'tags'
  | 'days'
  | 'weeks'
  | 'months';

export type SortDirection = 'desc' | 'asc';

export interface DimensionValue {
  key: string;
  label: string;
}

export interface CrossTabResult {
  xValues: DimensionValue[];
  yValues: DimensionValue[];
  matrix: number[][];
  columnTotals: number[];
  rowTotals: number[];
  maxCount: number;
  xTruncated: boolean;
  yTruncated: boolean;
  xTotalCount: number;
  yTotalCount: number;
}

const MAX_ENTITY_VALUES = 30;

const TIME_DIMENSIONS: DimensionKey[] = ['days', 'weeks', 'months'];

function isTimeDimension(dim: DimensionKey): boolean {
  return TIME_DIMENSIONS.includes(dim);
}

function dimensionToGranularity(dim: DimensionKey): TimeGranularity {
  switch (dim) {
    case 'days':
      return 'day';
    case 'weeks':
      return 'week';
    case 'months':
      return 'month';
    default:
      return 'week';
  }
}

function buildTimeBuckets(
  feedback: Feedback[],
  granularity: TimeGranularity,
  intakeSourceDateMap: Record<string, string>,
): DimensionValue[] {
  if (feedback.length === 0) return [];

  const dates = feedback.map((f) =>
    resolveFeedbackDate(f, intakeSourceDateMap).getTime(),
  );
  const minDate = new Date(Math.min(...dates));
  const today = startOfDay(new Date());
  const ninetyDaysAgo = addDays(today, -90);
  const expandedMin = minDate < ninetyDaysAgo ? minDate : ninetyDaysAgo;

  const rangeStart = getBucketStart(expandedMin, granularity);
  const rangeEnd = getBucketStart(today, granularity);

  const values: DimensionValue[] = [];
  let current = rangeStart;
  while (current <= rangeEnd) {
    values.push({
      key: current.toISOString(),
      label: formatBucketLabel(current, granularity),
    });
    current = addInterval(current, granularity);
  }
  return values;
}

function resolveDimensionValues(
  dim: DimensionKey,
  feedback: Feedback[],
  personas: Persona[],
  userGoals: UserGoal[],
  intakeSourceMap: Record<string, IntakeSource>,
  intakeSourceDateMap: Record<string, string>,
): DimensionValue[] {
  switch (dim) {
    case 'personas':
      return personas.map((p) => ({ key: p.id, label: p.name }));
    case 'userGoals':
      return userGoals.map((ug) => ({ key: ug.id, label: ug.name }));
    case 'sourceTypes':
      return Object.values(SOURCE_TYPES).map((st) => ({
        key: st.key,
        label: st.label,
      }));
    case 'tags': {
      const allTags = new Set<string>();
      for (const f of feedback) {
        for (const tag of f.tags) {
          allTags.add(tag);
        }
      }
      return Array.from(allTags)
        .sort()
        .map((tag) => ({ key: tag, label: tag }));
    }
    case 'days':
    case 'weeks':
    case 'months':
      return buildTimeBuckets(
        feedback,
        dimensionToGranularity(dim),
        intakeSourceDateMap,
      );
  }
}

function getDimensionMatches(
  item: Feedback,
  dim: DimensionKey,
  intakeSourceMap: Record<string, IntakeSource>,
  intakeSourceDateMap: Record<string, string>,
): string[] {
  switch (dim) {
    case 'personas':
      return item.personaIds;
    case 'userGoals':
      return item.userGoalIds;
    case 'sourceTypes': {
      if (!item.intakeSourceId) return [];
      const source = intakeSourceMap[item.intakeSourceId];
      return source?.sourceType ? [source.sourceType] : [];
    }
    case 'tags':
      return item.tags;
    case 'days':
    case 'weeks':
    case 'months': {
      const date = resolveFeedbackDate(item, intakeSourceDateMap);
      const bucketStart = getBucketStart(
        date,
        dimensionToGranularity(dim),
      );
      return [bucketStart.toISOString()];
    }
  }
}

const EMPTY_RESULT: CrossTabResult = {
  xValues: [],
  yValues: [],
  matrix: [],
  columnTotals: [],
  rowTotals: [],
  maxCount: 0,
  xTruncated: false,
  yTruncated: false,
  xTotalCount: 0,
  yTotalCount: 0,
};

export function useCrossTabulation(
  xDimension: DimensionKey,
  yDimension: DimensionKey,
  feedback: Feedback[],
  personas: Persona[],
  userGoals: UserGoal[],
  intakeSourceMap: Record<string, IntakeSource>,
  intakeSourceDateMap: Record<string, string>,
  xSort: SortDirection,
  ySort: SortDirection,
): CrossTabResult {
  return useMemo(() => {
    // Prevent invalid combinations
    if (xDimension === yDimension) return EMPTY_RESULT;
    if (isTimeDimension(xDimension) && isTimeDimension(yDimension)) {
      return EMPTY_RESULT;
    }
    if (feedback.length === 0) return EMPTY_RESULT;

    // 1. Resolve dimension values
    const xValues = resolveDimensionValues(
      xDimension,
      feedback,
      personas,
      userGoals,
      intakeSourceMap,
      intakeSourceDateMap,
    );
    const yValues = resolveDimensionValues(
      yDimension,
      feedback,
      personas,
      userGoals,
      intakeSourceMap,
      intakeSourceDateMap,
    );

    if (xValues.length === 0 || yValues.length === 0) return EMPTY_RESULT;

    // 2. Build index maps for fast lookup
    const xIndexMap = new Map<string, number>();
    xValues.forEach((v, i) => xIndexMap.set(v.key, i));
    const yIndexMap = new Map<string, number>();
    yValues.forEach((v, i) => yIndexMap.set(v.key, i));

    // 3. Build the full count matrix
    const matrix: number[][] = Array.from({ length: yValues.length }, () =>
      new Array(xValues.length).fill(0),
    );

    for (const item of feedback) {
      const xMatches = getDimensionMatches(
        item,
        xDimension,
        intakeSourceMap,
        intakeSourceDateMap,
      );
      const yMatches = getDimensionMatches(
        item,
        yDimension,
        intakeSourceMap,
        intakeSourceDateMap,
      );

      for (const yKey of yMatches) {
        const yi = yIndexMap.get(yKey);
        if (yi === undefined) continue;
        for (const xKey of xMatches) {
          const xi = xIndexMap.get(xKey);
          if (xi === undefined) continue;
          matrix[yi][xi] += 1;
        }
      }
    }

    // 4. Compute row and column totals
    const rowTotals = matrix.map((row) =>
      row.reduce((sum, val) => sum + val, 0),
    );
    const columnTotals = new Array(xValues.length).fill(0);
    for (let yi = 0; yi < yValues.length; yi++) {
      for (let xi = 0; xi < xValues.length; xi++) {
        columnTotals[xi] += matrix[yi][xi];
      }
    }

    // 5. Sort dimensions
    const xTotalCount = xValues.length;
    const yTotalCount = yValues.length;

    // Build sort indices for X
    const xIndices = xValues.map((_, i) => i);
    if (isTimeDimension(xDimension)) {
      // Time is always chronological (asc)
    } else {
      xIndices.sort((a, b) =>
        xSort === 'desc'
          ? columnTotals[b] - columnTotals[a]
          : columnTotals[a] - columnTotals[b],
      );
    }

    // Build sort indices for Y
    const yIndices = yValues.map((_, i) => i);
    if (isTimeDimension(yDimension)) {
      // Time is always chronological (asc)
    } else {
      yIndices.sort((a, b) =>
        ySort === 'desc'
          ? rowTotals[b] - rowTotals[a]
          : rowTotals[a] - rowTotals[b],
      );
    }

    // 6. Cap entity dimensions at MAX_ENTITY_VALUES
    const xTruncated =
      !isTimeDimension(xDimension) && xIndices.length > MAX_ENTITY_VALUES;
    const yTruncated =
      !isTimeDimension(yDimension) && yIndices.length > MAX_ENTITY_VALUES;

    const finalXIndices = xTruncated
      ? xIndices.slice(0, MAX_ENTITY_VALUES)
      : xIndices;
    const finalYIndices = yTruncated
      ? yIndices.slice(0, MAX_ENTITY_VALUES)
      : yIndices;

    // 7. Reorder everything according to sorted+truncated indices
    const sortedXValues = finalXIndices.map((i) => xValues[i]);
    const sortedYValues = finalYIndices.map((i) => yValues[i]);
    const sortedMatrix = finalYIndices.map((yi) =>
      finalXIndices.map((xi) => matrix[yi][xi]),
    );
    const sortedRowTotals = finalYIndices.map((i) => rowTotals[i]);
    const sortedColumnTotals = finalXIndices.map((i) => columnTotals[i]);

    let maxCount = 0;
    for (const row of sortedMatrix) {
      for (const val of row) {
        if (val > maxCount) maxCount = val;
      }
    }

    return {
      xValues: sortedXValues,
      yValues: sortedYValues,
      matrix: sortedMatrix,
      columnTotals: sortedColumnTotals,
      rowTotals: sortedRowTotals,
      maxCount: Math.max(maxCount, 1),
      xTruncated,
      yTruncated,
      xTotalCount,
      yTotalCount,
    };
  }, [
    xDimension,
    yDimension,
    feedback,
    personas,
    userGoals,
    intakeSourceMap,
    intakeSourceDateMap,
    xSort,
    ySort,
  ]);
}
