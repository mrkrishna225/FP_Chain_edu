/**
 * src/utils/registrationLinks.ts
 *
 * Handles generation, storage, validation, and consumption of
 * admin-generated registration links stored in IPFS MFS.
 *
 * Directory: /chainedu/registry/links/{linkId}.json
 *   {
 *     linkId: string,
 *     role: 'teacher' | 'student',
 *     createdBy: string,   // admin wallet address
 *     createdAt: number,   // unix ms
 *     expiresAt: number,   // unix ms (createdAt + 7 days)
 *     usedBy: string | null, // wallet addr of registrant
 *     usedAt: number | null,
 *     status: 'active' | 'used' | 'expired' | 'revoked'
 *   }
 *
 * User profile: /chainedu/registry/users/{role}s/{walletAddr}.json
 *   {
 *     walletAddress: string,
 *     name: string,
 *     email: string,
 *     institution: string,
 *     role: 'teacher' | 'student',
 *     linkId: string,
 *     registeredAt: number,
 *     approvedAt: number | null,
 *     approvedBy: string | null,
 *     status: 'pending' | 'approved' | 'rejected'
 *   }
 */

import { v4 as uuidv4 } from 'uuid';
import { mfsWriteJSON, mfsReadJSON, mfsList, mfsExists, MFS } from './mfs';

// ─── Types ───────────────────────────────────────────────────

export type Role = 'teacher' | 'student';

export interface RegistrationLink {
  linkId: string;
  role: Role;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  usedBy: string | null;
  usedAt: number | null;
  status: 'active' | 'used' | 'expired' | 'revoked';
}

export interface UserProfile {
  walletAddress: string;
  name: string;
  email: string;
  institution: string;
  role: Role;
  linkId: string;
  registeredAt: number;
  approvedAt: number | null;
  approvedBy: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

// ─── Link Generation (Admin only) ────────────────────────────

/**
 * Generate a new registration link and store in IPFS MFS.
 * Fallback to localStorage if IPFS is unreachable.
 */
export async function generateRegistrationLink(
  role: Role,
  adminAddress: string,
): Promise<{ linkId: string; url: string; link: RegistrationLink }> {
  const linkId = uuidv4();
  const now = Date.now();
  const link: RegistrationLink = {
    linkId,
    role,
    createdBy: adminAddress.toLowerCase(),
    createdAt: now,
    expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
    usedBy: null,
    usedAt: null,
    status: 'active',
  };

  try {
    await mfsWriteJSON(MFS.link(linkId), link);
  } catch (err) {
    console.warn('[LinkGen] MFS failed, falling back to localStorage', err);
    const links = JSON.parse(localStorage.getItem('chain_edu_invites') || '[]');
    links.push(link);
    localStorage.setItem('chain_edu_invites', JSON.stringify(links));
  }

  const url = `${window.location.origin}/register/${linkId}`;
  return { linkId, url, link };
}

// ─── Link Validation ─────────────────────────────────────────

export async function validateRegistrationLink(
  linkId: string,
): Promise<{ valid: boolean; link?: RegistrationLink; reason?: string }> {
  let link = await mfsReadJSON<RegistrationLink>(MFS.link(linkId));

  if (!link) {
    // Check fallback
    const links = JSON.parse(localStorage.getItem('chain_edu_invites') || '[]');
    link = links.find((l: RegistrationLink) => l.linkId === linkId);
  }

  if (!link) return { valid: false, reason: 'Link not found or invalid' };

  if (link.status === 'revoked') return { valid: false, reason: 'This link has been revoked by an admin' };
  if (link.status === 'used') return { valid: false, reason: 'This link has already been used' };
  
  if (Date.now() > link.expiresAt || link.status === 'expired') {
    if (link.status !== 'expired') {
      link.status = 'expired';
      try { await mfsWriteJSON(MFS.link(linkId), link); } catch {
        const links = JSON.parse(localStorage.getItem('chain_edu_invites') || '[]');
        const idx = links.findIndex((l: any) => l.linkId === linkId);
        if (idx !== -1) { links[idx].status = 'expired'; localStorage.setItem('chain_edu_invites', JSON.stringify(links)); }
      }
    }
    return { valid: false, reason: 'This registration link has expired (valid for 7 days)' };
  }

  return { valid: true, link };
}

// ─── User Registration ────────────────────────────────────────

export async function registerUser(
  linkId: string,
  walletAddress: string,
  name: string,
  email: string,
  institution: string,
): Promise<{ success: boolean; error?: string }> {
  const addr = walletAddress.toLowerCase();

  const { valid, link, reason } = await validateRegistrationLink(linkId);
  if (!valid || !link) return { success: false, error: reason };

  const existsMFS = await mfsExists(MFS.pendingTeacher(addr)) || await mfsExists(MFS.pendingStudent(addr));
  if (existsMFS) return { success: false, error: 'Wallet address already registered.' };

  const profile: UserProfile = {
    walletAddress: addr,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    institution: institution.trim(),
    role: link.role,
    linkId,
    registeredAt: Date.now(),
    approvedAt: null,
    approvedBy: null,
    status: 'pending',
  };

  try {
    const path = link.role === 'teacher' ? MFS.pendingTeacher(addr) : MFS.pendingStudent(addr);
    await mfsWriteJSON(path, profile);

    // Update link status
    const updatedLink: RegistrationLink = { ...link, usedBy: addr, usedAt: Date.now(), status: 'used' };
    await mfsWriteJSON(MFS.link(linkId), updatedLink);

  } catch (err) {
    console.error('[Register] IPFS failed', err);
    return { success: false, error: 'IPFS Error. Please ensure IPFS Desktop is running.' };
  }

  return { success: true };
}

// ─── Pending Users (Admin view) ──────────────────────────────

export async function getPendingTeachers(): Promise<UserProfile[]> {
  try {
    const files = await mfsList('/chainedu/registry/users/teachers');
    const profiles: UserProfile[] = [];
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const p = await mfsReadJSON<UserProfile>(`/chainedu/registry/users/teachers/${f}`);
      if (p && p.status === 'pending') profiles.push(p);
    }
    return profiles;
  } catch { return []; }
}

export async function getPendingStudents(): Promise<UserProfile[]> {
  try {
    const files = await mfsList('/chainedu/registry/users/students');
    const profiles: UserProfile[] = [];
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const p = await mfsReadJSON<UserProfile>(`/chainedu/registry/users/students/${f}`);
      if (p && p.status === 'pending') profiles.push(p);
    }
    return profiles;
  } catch { return []; }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const t = await getPendingTeachers();
  const s = await getPendingStudents();
  return [...t, ...s];
}

// ─── Approve / Reject (Admin/SubAdmin) ───────────────────────

export async function approveUser(
  walletAddress: string,
  role: Role,
  approvedBy: string,
): Promise<void> {
  const addr = walletAddress.toLowerCase();
  const path = role === 'teacher' ? MFS.pendingTeacher(addr) : MFS.pendingStudent(addr);
  const profile = await mfsReadJSON<UserProfile>(path);
  if (!profile) throw new Error('User profile not found in IPFS');

  const updated: UserProfile = {
    ...profile,
    status: 'approved',
    approvedAt: Date.now(),
    approvedBy: approvedBy.toLowerCase(),
  };
  await mfsWriteJSON(path, updated);
}

export async function rejectUser(
  walletAddress: string,
  role: Role,
): Promise<void> {
  const addr = walletAddress.toLowerCase();
  const path = role === 'teacher' ? MFS.pendingTeacher(addr) : MFS.pendingStudent(addr);
  const profile = await mfsReadJSON<UserProfile>(path);
  if (!profile) throw new Error('User profile not found in IPFS');
  await mfsWriteJSON(path, { ...profile, status: 'rejected' });
}

// ─── Link Management ─────────────────────────────────────────

export async function getAllLinks(): Promise<RegistrationLink[]> {
  try {
    const files = await mfsList('/chainedu/registry/links');
    const links: RegistrationLink[] = [];
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const l = await mfsReadJSON<RegistrationLink>(`/chainedu/registry/links/${f}`);
      if (l) links.push(l);
    }
    return links;
  } catch { return []; }
}

export async function revokeLink(linkId: string): Promise<void> {
  const link = await mfsReadJSON<RegistrationLink>(MFS.link(linkId));
  if (!link) throw new Error('Link not found');
  await mfsWriteJSON(MFS.link(linkId), { ...link, status: 'revoked' });
}
