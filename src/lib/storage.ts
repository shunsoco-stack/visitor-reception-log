import { importBackup, exportBackup } from "./backup";
import { createSeed } from "./seed";
import type { Database } from "./types";

export const STORAGE_KEY = "vrl:v1";

export function loadData(raw: string | null, now: string): { data: Database; recovered: boolean } {
  if (raw === null) return { data: createSeed(now), recovered: false };
  try {
    return { data: importBackup(raw), recovered: false };
  } catch {
    return { data: createSeed(now), recovered: true };
  }
}

export function saveData(storage: Pick<Storage, "setItem">, data: Database): void {
  storage.setItem(STORAGE_KEY, exportBackup(data));
}
