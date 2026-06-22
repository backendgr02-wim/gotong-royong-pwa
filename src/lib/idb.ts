import { openDB, type IDBPDatabase } from "idb";

interface OfflineAction {
  id?: number;
  type: "buatPost" | "buatLapor" | "votePolling" | "rsvpEvent" | "reaksiPost";
  payload: Record<string, unknown>;
  createdAt: string;
  status: "pending" | "synced" | "failed";
  error?: string;
}

const DB_NAME = "gotong-royong-offline";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<unknown>> | null = null;

function getDb(): Promise<IDBPDatabase<unknown>> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("actions")) {
          const store = db.createObjectStore("actions", {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("status", "status");
        }
      },
    });
  }
  return dbPromise;
}

export async function queueAction(action: Omit<OfflineAction, "id" | "createdAt" | "status">): Promise<void> {
  const db = await getDb();
  await db.add("actions", {
    ...action,
    createdAt: new Date().toISOString(),
    status: "pending",
  });
}

export async function getPendingActions(): Promise<OfflineAction[]> {
  const db = await getDb();
  const tx = db.transaction("actions", "readonly");
  const store = tx.objectStore("actions");
  const index = store.index("status");
  return index.getAll("pending");
}

export async function markAction(id: number, status: "synced" | "failed", error?: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("actions", "readwrite");
  const store = tx.objectStore("actions");
  const action = await store.get(id);
  if (action) {
    action.status = status;
    if (error) action.error = error;
    await store.put(action);
  }
}

export async function clearSyncedActions(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("actions", "readwrite");
  const store = tx.objectStore("actions");
  const index = store.index("status");
  const synced = await index.getAllKeys("synced");
  for (const key of synced) {
    await store.delete(key);
  }
}

export async function getQueueCount(): Promise<number> {
  const db = await getDb();
  const tx = db.transaction("actions", "readonly");
  const index = tx.objectStore("actions").index("status");
  const pending = await index.getAllKeys("pending");
  return pending.length;
}

export async function processQueue(executor: (action: OfflineAction) => Promise<void>): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingActions();
  let synced = 0;
  let failed = 0;

  for (const action of pending) {
    if (!action.id) continue;
    try {
      await executor(action);
      await markAction(action.id, "synced");
      synced++;
    } catch (e) {
      await markAction(action.id, "failed", e instanceof Error ? e.message : String(e));
      failed++;
    }
  }

  await clearSyncedActions();
  return { synced, failed };
}
