/**
 * Client Authentication Service
 * שירות אימות ללקוחות בפורטל
 */

import { randomBytes } from 'crypto';
import { hashPassword, verifyPassword } from './passwordUtils';

export interface ClientSession {
  id: string;
  clientId: string;
  token: string;
  expiresAt: Date;
}

export interface ClientLoginResult {
  success: boolean;
  session?: ClientSession;
  client?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  error?: string;
}

/**
 * Generate a secure session token
 */
export function generateClientSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a session token with expiration
 */
export function createSessionToken(): { token: string; expiresAt: Date } {
  const token = generateClientSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
  
  return { token, expiresAt };
}

/**
 * Validate email format
 */
export function isValidClientEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Hash client password
 */
export function hashClientPassword(password: string): string {
  return hashPassword(password);
}

/**
 * Verify client password
 */
export function verifyClientPassword(password: string, hash: string): boolean {
  return verifyPassword(password, hash);
}

/**
 * Generate invitation token
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString('hex');
}
