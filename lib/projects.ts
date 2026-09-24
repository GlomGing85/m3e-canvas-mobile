import { Doc } from "./tokens";

/* Multi-project storage: every document the author works on is kept here, one
 * record per project, newest first. The editor's current document is mirrored
 * into its record on every change, so switching projects never loses work.
 * All of it lives in localStorage, next to the editor's other keys. */

export type SavedProject = {
  id: string;
  name: string;
  updatedAt: number;
  doc: Doc;
};

const LIST_KEY = "m3e:projects:v1";
const CURRENT_KEY = "m3e:projects:current";

const isDoc = (value: unknown): value is Doc =>
  typeof value === "object" && value !== null && Array.isArray((value as Doc).groups) && Array.isArray((value as Doc).frames);

const isSavedProject = (value: unknown): value is SavedProject =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as SavedProject).id === "string" &&
  typeof (value as SavedProject).name === "string" &&
  Number.isFinite((value as SavedProject).updatedAt) &&
  isDoc((value as SavedProject).doc);

/** every stored project, most recently saved first */
export function listProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(LIST_KEY);
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(isSavedProject).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

const writeAll = (list: SavedProject[]) => {
  try {
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
  } catch {}
};

/** inserts or replaces a project's record; the list stays newest-first */
export function upsertProject(project: SavedProject) {
  writeAll([project, ...listProjects().filter((x) => x.id !== project.id)]);
}

export function removeProject(id: string) {
  writeAll(listProjects().filter((x) => x.id !== id));
}

export function renameStoredProject(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  writeAll(listProjects().map((x) => (x.id === id ? { ...x, name: trimmed } : x)));
}

/** the project the editor is sitting in; null when nothing was stored yet */
export const getCurrentProjectId = (): string | null => {
  try {
    return localStorage.getItem(CURRENT_KEY);
  } catch {
    return null;
  }
};

export const setCurrentProjectId = (id: string | null) => {
  try {
    if (id) localStorage.setItem(CURRENT_KEY, id);
    else localStorage.removeItem(CURRENT_KEY);
  } catch {}
};
