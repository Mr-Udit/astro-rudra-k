/**
 * Shared Consultation Type Constants
 * 
 * Frontend & Backend canonical values must match exactly
 * Backend source of truth: voice_call, video_call, chat
 */

export const CONSULTATION_TYPE_IDS = {
  AUDIO: 'audio',
  VIDEO: 'video',
  CHAT: 'chat',
} as const;

/**
 * Maps frontend IDs to backend API values
 */
export const CONSULTATION_TYPE_MAP: Record<string, string> = {
  audio: 'voice_call',
  video: 'video_call',
  chat: 'chat',
};

/**
 * Reverse mapping: backend API value → frontend ID
 */
export const CONSULTATION_TYPE_REVERSE_MAP: Record<string, string> = {
  voice_call: 'audio',
  video_call: 'video',
  chat: 'chat',
};

/**
 * Get backend API value from frontend ID
 */
export function getBackendConsultationType(frontendId: string): string {
  return CONSULTATION_TYPE_MAP[frontendId] || 'chat';
}

/**
 * Get frontend ID from backend API value
 */
export function getFrontendConsultationType(backendValue: string): string {
  return CONSULTATION_TYPE_REVERSE_MAP[backendValue] || 'chat';
}
