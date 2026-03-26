/**
 * src/utils/mfs.ts
 *
 * MFS (Mutable File System) helpers — the "filesystem" layer on top of IPFS.
 * MFS lets us work with named paths like /chainedu/teachers/0xABC/exams.json
 * instead of raw CIDs.
 *
 * Directory scaffold created on first run:
 *
 * /chainedu/
 * ├── registry/
 * │   ├── links/              ← generated registration link records
 * │   └── users/
 * │       ├── teachers/       ← pending/approved teacher profiles
 * │       └── students/       ← pending/approved student profiles
 * ├── teachers/               ← per-teacher data
 * └── students/               ← per-student data
 */

import { getIPFSClient } from './ipfs';

// ─── Internal helper to write JSON via MFS ───────────────────
async function mfsWrite(path: string, data: object, overwrite = true): Promise<void> {
  const client = getIPFSClient();
  const content = JSON.stringify(data, null, 2);
  await client.files.write(path, new TextEncoder().encode(content), {
    create: true,
    parents: true,
    truncate: overwrite,
  });
}

// ─── Internal helper to read JSON via MFS ───────────────────
async function mfsRead<T = unknown>(path: string): Promise<T | null> {
  try {
    const client = getIPFSClient();
    const chunks: Uint8Array[] = [];
    for await (const chunk of client.files.read(path)) {
      chunks.push(chunk as Uint8Array);
    }
    const total = new Uint8Array(chunks.reduce((acc, c) => acc + c.length, 0));
    let offset = 0;
    for (const c of chunks) { total.set(c, offset); offset += c.length; }
    return JSON.parse(new TextDecoder().decode(total)) as T;
  } catch {
    return null;
  }
}

// ─── mkdir helper ────────────────────────────────────────────
async function mkdirSafe(path: string): Promise<void> {
  try {
    const client = getIPFSClient();
    await client.files.mkdir(path, { parents: true });
  } catch {
    // directory already exists — that's fine
  }
}

// ─── Public API ──────────────────────────────────────────────

/** Write any JSON object to an MFS path */
export async function mfsWriteJSON(path: string, data: object): Promise<void> {
  return mfsWrite(path, data, true);
}

/** Read JSON from an MFS path. Returns null if not found. */
export async function mfsReadJSON<T = unknown>(path: string): Promise<T | null> {
  return mfsRead<T>(path);
}

/** List entries in an MFS directory. Returns [] if directory doesn't exist. */
export async function mfsList(path: string): Promise<string[]> {
  try {
    const client = getIPFSClient();
    const entries: string[] = [];
    for await (const entry of client.files.ls(path)) {
      entries.push(entry.name);
    }
    return entries;
  } catch {
    return [];
  }
}

/** Delete an MFS path (file or directory). Fails silently if not found. */
export async function mfsRemove(path: string, recursive = false): Promise<void> {
  try {
    const client = getIPFSClient();
    await client.files.rm(path, { recursive });
  } catch {
    // not found — ignore
  }
}

/** Check if an MFS path exists */
export async function mfsExists(path: string): Promise<boolean> {
  try {
    const client = getIPFSClient();
    await client.files.stat(path);
    return true;
  } catch {
    return false;
  }
}

/** Get the current CID of an MFS path (useful for pinning / sharing) */
export async function mfsStat(path: string): Promise<{ cid: string; size: number } | null> {
  try {
    const client = getIPFSClient();
    const stat = await client.files.stat(path);
    return { cid: stat.cid.toString(), size: stat.size };
  } catch {
    return null;
  }
}

// ─── ChainEdu directory scaffold ────────────────────────────

const DIRS = [
  '/chainedu',
  '/chainedu/registry',
  '/chainedu/registry/links',
  '/chainedu/registry/users',
  '/chainedu/registry/users/teachers',
  '/chainedu/registry/users/students',
  '/chainedu/teachers',
  '/chainedu/students',
];

/**
 * Call once on app startup.
 * Creates the full /chainedu directory scaffold if it doesn't exist.
 * Safe to call multiple times — uses `parents: true`.
 */
export async function initChainEduDirectories(): Promise<{ ok: boolean; error?: string }> {
  try {
    for (const dir of DIRS) {
      await mkdirSafe(dir);
    }
    
    return { ok: true };
  } catch (err: any) {
    console.error('[MFS] Failed to init directories', err);
    return { ok: false, error: err?.message };
  }
}

// ─── Path builders (keep paths consistent) ──────────────────
export const MFS = {
  // Registry
  link:           (linkId: string)   => `/chainedu/registry/links/${linkId}.json`,
  pendingTeacher: (addr: string)     => `/chainedu/registry/users/teachers/${addr.toLowerCase()}.json`,
  pendingStudent: (addr: string)     => `/chainedu/registry/users/students/${addr.toLowerCase()}.json`,

  // Teacher
  teacherDir:     (addr: string)     => `/chainedu/teachers/${addr.toLowerCase()}`,
  teacherMeta:    (addr: string)     => `/chainedu/teachers/${addr.toLowerCase()}/meta.json`,
  teacherStudents:(addr: string)     => `/chainedu/teachers/${addr.toLowerCase()}/students.json`,
  teacherExamDir: (addr: string, examId: string) => `/chainedu/teachers/${addr.toLowerCase()}/exams/${examId}`,
  examPaper:      (teacherAddr: string, examId: string) => `/chainedu/teachers/${teacherAddr.toLowerCase()}/exams/${examId}/paper.enc`,
  examAnswers:    (teacherAddr: string, examId: string) => `/chainedu/teachers/${teacherAddr.toLowerCase()}/exams/${examId}/answers.enc`,
  examSchedule:   (teacherAddr: string, examId: string) => `/chainedu/teachers/${teacherAddr.toLowerCase()}/exams/${examId}/schedule.json`,
  teacherLog:     (addr: string, ts: number)     => `/chainedu/teachers/${addr.toLowerCase()}/logs/${ts}.json`,
  examLog:        (teacherAddr: string, examId: string, ts: number) => `/chainedu/teachers/${teacherAddr.toLowerCase()}/exams/${examId}/logs/${ts}.json`,

  // Student
  studentDir:     (addr: string)     => `/chainedu/students/${addr.toLowerCase()}`,
  studentMeta:    (addr: string)     => `/chainedu/students/${addr.toLowerCase()}/meta.json`,
  examBuffer:     (addr: string, examId: string) => `/chainedu/students/${addr.toLowerCase()}/buffer/${examId}.json`,
  studentResult:  (addr: string, examId: string) => `/chainedu/students/${addr.toLowerCase()}/results/${examId}.json`,
  studentLog:     (addr: string, ts: number)     => `/chainedu/students/${addr.toLowerCase()}/logs/${ts}.json`,
} as const;
