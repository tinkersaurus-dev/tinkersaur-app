/**
 * Pointing-specific SignalR hub methods
 * Uses the shared collaboration hub connection
 */
import * as signalR from '@microsoft/signalr';
import { getConnection } from '@/features/collaboration/api/collaborationHub';
import type { PointingSession, Vote, VoteResults, TimeoutOption, FacilitationTransferred } from '../model/types';

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
export function onPointingSessionStarted(callback: (session: PointingSession) => void): void {
  const connection = getConnection();
  if (connection) {
    connection.on('OnPointingSessionStarted', callback);
  } else {
    console.warn('[PointingHub] No connection available for OnPointingSessionStarted handler');
  }
}

export function offPointingSessionStarted(callback: (session: PointingSession) => void): void {
  const connection = getConnection();
  connection?.off('OnPointingSessionStarted', callback);
}

export function onVoteReceived(callback: (storyId: string, vote: Vote) => void): void {
  const connection = getConnection();
  connection?.on('OnVoteReceived', callback);
}

export function offVoteReceived(callback: (storyId: string, vote: Vote) => void): void {
  const connection = getConnection();
  connection?.off('OnVoteReceived', callback);
}

export function onAllVotesIn(callback: (storyId: string) => void): void {
  const connection = getConnection();
  connection?.on('OnAllVotesIn', callback);
}

export function offAllVotesIn(callback: (storyId: string) => void): void {
  const connection = getConnection();
  connection?.off('OnAllVotesIn', callback);
}

export function onRevoteStarted(callback: (storyId: string) => void): void {
  const connection = getConnection();
  connection?.on('OnRevoteStarted', callback);
}

export function offRevoteStarted(callback: (storyId: string) => void): void {
  const connection = getConnection();
  connection?.off('OnRevoteStarted', callback);
}

export function onPointingSessionCompleted(
  callback: (storyId: string, finalPoints: number) => void
): void {
  const connection = getConnection();
  connection?.on('OnPointingSessionCompleted', callback);
}

export function offPointingSessionCompleted(
  callback: (storyId: string, finalPoints: number) => void
): void {
  const connection = getConnection();
  connection?.off('OnPointingSessionCompleted', callback);
}

export function onPointingSessionCancelled(callback: (storyId: string) => void): void {
  const connection = getConnection();
  connection?.on('OnPointingSessionCancelled', callback);
}

export function offPointingSessionCancelled(callback: (storyId: string) => void): void {
  const connection = getConnection();
  connection?.off('OnPointingSessionCancelled', callback);
}

export function onSessionTimedOut(callback: (storyId: string, results: VoteResults) => void): void {
  const connection = getConnection();
  connection?.on('OnSessionTimedOut', callback);
}

export function offSessionTimedOut(callback: (storyId: string, results: VoteResults) => void): void {
  const connection = getConnection();
  connection?.off('OnSessionTimedOut', callback);
}

export function onFacilitationTransferred(callback: (data: FacilitationTransferred) => void): void {
  const connection = getConnection();
  connection?.on('OnFacilitationTransferred', callback);
}

export function offFacilitationTransferred(callback: (data: FacilitationTransferred) => void): void {
  const connection = getConnection();
  connection?.off('OnFacilitationTransferred', callback);
}
