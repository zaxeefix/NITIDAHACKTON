export type OfflineReport = {
  localReference: string;
  createdAt: string;
  title: string;
  description: string;
  file?: Blob;
  fileName?: string;
  fileType?: string;
  attempts: number;
  lastError?: string;
};

const DB_NAME = "triageng-offline";
const STORE = "reports";
const CACHE = "incident-cache";
const DRAFTS = "analyst-drafts";

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 3);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "localReference" });
      if (!request.result.objectStoreNames.contains(CACHE)) request.result.createObjectStore(CACHE, { keyPath: "id" });
      if (!request.result.objectStoreNames.contains(DRAFTS)) request.result.createObjectStore(DRAFTS, { keyPath: "incidentId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function createLocalReference() {
  return `TNG-LOCAL-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function queueOfflineReport(input: Omit<OfflineReport, "attempts">) {
  const db = await database();
  await requestResult(db.transaction(STORE, "readwrite").objectStore(STORE).put({ ...input, attempts: 0 }));
  db.close();
}

export async function listOfflineReports(): Promise<OfflineReport[]> {
  const db = await database();
  const rows = await requestResult(db.transaction(STORE).objectStore(STORE).getAll()) as OfflineReport[];
  db.close();
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function cacheIncidents<T extends { id: string }>(incidents: T[]) {
  const db = await database();
  const transaction = db.transaction(CACHE, "readwrite");
  const store = transaction.objectStore(CACHE);
  store.clear();
  for (const incident of incidents) store.put(incident);
  await new Promise<void>((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); });
  db.close();
}

export async function listCachedIncidents<T>(): Promise<T[]> {
  const db = await database();
  const rows = await requestResult(db.transaction(CACHE).objectStore(CACHE).getAll()) as T[];
  db.close();
  return rows;
}

export async function saveAnalystDraft(incidentId: string, note: string) {
  const db = await database();
  await requestResult(db.transaction(DRAFTS, "readwrite").objectStore(DRAFTS).put({ incidentId, note, updatedAt: new Date().toISOString() }));
  db.close();
}

export async function getAnalystDraft(incidentId: string): Promise<string> {
  const db = await database();
  const row = await requestResult(db.transaction(DRAFTS).objectStore(DRAFTS).get(incidentId)) as { note?: string } | undefined;
  db.close();
  return row?.note || "";
}

async function update(report: OfflineReport) {
  const db = await database();
  await requestResult(db.transaction(STORE, "readwrite").objectStore(STORE).put(report));
  db.close();
}

async function remove(reference: string) {
  const db = await database();
  await requestResult(db.transaction(STORE, "readwrite").objectStore(STORE).delete(reference));
  db.close();
}

export async function syncOfflineReports() {
  const reports = await listOfflineReports();
  let synced = 0;
  for (const report of reports) {
    try {
      const response = await fetch("/api/incidents", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: report.title, description: report.description, clientReference: report.localReference, department: "Unspecified", affectedSystem: "Unspecified", language: "English" }) });
      if (!response.ok) throw new Error((await response.json()).error || "Incident synchronisation failed");
      const saved = await response.json();
      if (report.file) {
        const form = new FormData();
        form.set("incidentId", saved.incident.id);
        form.set("file", new File([report.file], report.fileName || "offline-evidence", { type: report.fileType || report.file.type }));
        const attachment = await fetch("/api/attachments", { method: "POST", body: form });
        if (!attachment.ok) throw new Error("Evidence synchronisation failed");
      }
      await remove(report.localReference);
      synced++;
    } catch (error) {
      await update({ ...report, attempts: report.attempts + 1, lastError: error instanceof Error ? error.message : "Synchronisation failed" });
      break;
    }
  }
  return { synced, pending: (await listOfflineReports()).length, syncedAt: new Date().toISOString() };
}
