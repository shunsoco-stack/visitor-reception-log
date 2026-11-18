"use client";

import { useEffect, useSyncExternalStore } from "react";
import { japanNow } from "@/lib/dates";
import { loadData, saveData, STORAGE_KEY } from "@/lib/storage";
import type { Database } from "@/lib/types";

type Snapshot = { data: Database | null; now: string; message: string };

const initial: Snapshot = { data: null, now: "", message: "" };

let snapshot = initial;

const listeners = new Set<() => void>();

function emit(next: Snapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function announce(message: string) {
  emit({ ...snapshot, message });
}

export function clearMessage() {
  announce("");
}

export async function mutate(
  transform: (data: Database, now: string) => Database,
): Promise<Database | null> {
  const commit = () => {
    try {
      const now = japanNow();
      const loaded = loadData(localStorage.getItem(STORAGE_KEY), now);
      const next = transform(loaded.data, now);
      saveData(localStorage, next);
      emit({
        data: next,
        now,
        message: loaded.recovered ? "壊れた保存データを既定データに戻しました。" : "保存しました。",
      });
      return next;
    } catch (error) {
      announce(
        error instanceof Error
          ? error.message
          : "保存できませんでした。ブラウザの保存設定と空き容量をご確認ください。",
      );
      return null;
    }
  };
  // 同じオリジンの複数タブからの受付を直列化し、二重割当を防ぐ。
  return navigator.locks ? navigator.locks.request(STORAGE_KEY, commit) : commit();
}

export function useApp() {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => initial,
  );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const refresh = () => {
      const now = japanNow();
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const { data, recovered } = loadData(raw, now);
        if (!raw || recovered) saveData(localStorage, data);
        emit({
          data,
          now,
          message: recovered ? "保存データが壊れていたため、既定データに戻しました。" : "",
        });
      } catch {
        emit({
          data: null,
          now,
          message:
            "ブラウザの保存領域を利用できません。サイトデータの保存を許可して再読み込みしてください。",
        });
      }
    };
    refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    const timer = window.setInterval(() => emit({ ...snapshot, now: japanNow() }), 15000);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => announce("オフライン機能を登録できませんでした。通常の操作は利用できます。"));
    }
    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(timer);
    };
  }, []);
  return children;
}
