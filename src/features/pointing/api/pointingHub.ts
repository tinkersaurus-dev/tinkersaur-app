/**
 * Pointing-specific SignalR hub methods
 * Uses the shared collaboration hub connection
 */
import * as signalR from '@microsoft/signalr';
import { getConnection } from '@/shared/signalr';
import type { PointingSession, Vote, VoteResults, TimeoutOption, FacilitationTransferred } from '../model/types';

// Event handlers storage for re-registration after reconnect (mirrors agentHub.ts pattern)
type PointingEventHandlers = {
  sessionStarted: Set<(session: PointingSession) => void>;
  voteReceived: Set<(storyId: string, vote: Vote) => void>;
  allVotesIn: Set<(storyId: string) => void>;
  revoteStarted: Set<(storyId: string) => void>;
  sessionCompleted: Set<(storyId: string, finalPoints: number) => void>;
  sessionCancelled: Set<(storyId: string) => void>;
  sessionTimedOut: Set<(storyId: string, results: VoteResults) => void>;
  facilitationTransferred: Set<(data: FacilitationTransferred) => void>;
};

const handlers: PointingEventHandlers = {
  sessionStarted: new Set(),
  voteReceived: new Set(),
  allVotesIn: new Set(),
  revoteStarted: new Set(),
  sessionCompleted: new Set(),
  sessionCancelled: new Set(),
  sessionTimedOut: new Set(),
  facilitationTransferred: new Set(),
};

function ensureConnection(): signalR.HubConnection {
  const connection = getConnection();
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    throw new Error('Not connected to collaboration hub');
  }
  return connection;
}

// Hub method invocations
export async function startPointingSession(
  storyId: string,
  storyTitle: string,
  timeoutMinutes: TimeoutOption
): Promise<void> {
  const connection = ensureConnection();
  await connection.invoke('StartPointingSession', storyId, storyTitle, timeoutMinutes);
}

export async function submitVote(storyId: string, points: number | null): Promise<void> {
  const connection = ensureConnection();
  await connection.invoke('SubmitVote', storyId, points);
}

export async function requestRevote(storyId: string): Promise<void> {
  const connection = ensureConnection();
  await connection.invoke('RequestRevote', storyId);
}

export async function completeSession(storyId: string, finalPoints: number): Promise<void> {
  const connection = ensureConnection();
  await connection.invoke('CompleteSession', storyId, finalPoints);
}

export async function cancelSession(storyId: string): Promise<void> {
  const connection = ensureConnection();
  await connection.invoke('CancelSession', storyId);
}

export async function getPointingSession(storyId: string): Promise<PointingSession | null> {
  const connection = ensureConnection();
  return await connection.invoke('GetPointingSession', storyId);
}

export async function getVoteResults(storyId: string): Promise<VoteResults | null> {
  const connection = ensureConnection();
  return await connection.invoke('GetVoteResults', storyId);
}

// Event subscription helpers - Pointing events
// Store handlers and register on current connection (mirrors agentHub.ts pattern)
export function onPointingSessionStarted(callback: (session: PointingSession) => void): void {
  handlers.sessionStarted.add(callback);
  getConnection()?.on('OnPointingSessionStarted', callback);
}

export function offPointingSessionStarted(callback: (session: PointingSession) => void): void {
  handlers.sessionStarted.delete(callback);
  getConnection()?.off('OnPointingSessionStarted', callback);
}

export function onVoteReceived(callback: (storyId: string, vote: Vote) => void): void {
  handlers.voteReceived.add(callback);
  getConnection()?.on('OnVoteReceived', callback);
}

export function offVoteReceived(callback: (storyId: string, vote: Vote) => void): void {
  handlers.voteReceived.delete(callback);
  getConnection()?.off('OnVoteReceived', callback);
}

export function onAllVotesIn(callback: (storyId: string) => void): void {
  handlers.allVotesIn.add(callback);
  getConnection()?.on('OnAllVotesIn', callback);
}

export function offAllVotesIn(callback: (storyId: string) => void): void {
  handlers.allVotesIn.delete(callback);
  getConnection()?.off('OnAllVotesIn', callback);
}

export function onRevoteStarted(callback: (storyId: string) => void): void {
  handlers.revoteStarted.add(callback);
  getConnection()?.on('OnRevoteStarted', callback);
}

export function offRevoteStarted(callback: (storyId: string) => void): void {
  handlers.revoteStarted.delete(callback);
  getConnection()?.off('OnRevoteStarted', callback);
}

export function onPointingSessionCompleted(
  callback: (storyId: string, finalPoints: number) => void
): void {
  handlers.sessionCompleted.add(callback);
  getConnection()?.on('OnPointingSessionCompleted', callback);
}

export function offPointingSessionCompleted(
  callback: (storyId: string, finalPoints: number) => void
): void {
  handlers.sessionCompleted.delete(callback);
  getConnection()?.off('OnPointingSessionCompleted', callback);
}

export function onPointingSessionCancelled(callback: (storyId: string) => void): void {
  handlers.sessionCancelled.add(callback);
  getConnection()?.on('OnPointingSessionCancelled', callback);
}

export function offPointingSessionCancelled(callback: (storyId: string) => void): void {
  handlers.sessionCancelled.delete(callback);
  getConnection()?.off('OnPointingSessionCancelled', callback);
}

export function onSessionTimedOut(callback: (storyId: string, results: VoteResults) => void): void {
  handlers.sessionTimedOut.add(callback);
  getConnection()?.on('OnSessionTimedOut', callback);
}

export function offSessionTimedOut(callback: (storyId: string, results: VoteResults) => void): void {
  handlers.sessionTimedOut.delete(callback);
  getConnection()?.off('OnSessionTimedOut', callback);
}

export function onFacilitationTransferred(callback: (data: FacilitationTransferred) => void): void {
  handlers.facilitationTransferred.add(callback);
  getConnection()?.on('OnFacilitationTransferred', callback);
}

export function offFacilitationTransferred(callback: (data: FacilitationTransferred) => void): void {
  handlers.facilitationTransferred.delete(callback);
  getConnection()?.off('OnFacilitationTransferred', callback);
}