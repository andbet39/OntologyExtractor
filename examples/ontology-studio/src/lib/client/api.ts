import type {
  EditOperation,
  ExtractResponse,
  Ontology,
  SessionEvent,
  SessionSnapshot,
  WebExtractorSettings,
} from "@/lib/shared/types";

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" }, ...init });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(typeof body.error === "string" ? body.error : `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function createSession(): Promise<string> {
  const result = await apiFetch<{ id: string }>("/api/sessions", { method: "POST" });
  return result.id;
}

export async function getSession(id: string): Promise<SessionSnapshot> {
  return apiFetch<SessionSnapshot>(`/api/sessions/${encodeURIComponent(id)}`);
}

export async function resetSession(id: string): Promise<void> {
  await apiFetch(`/api/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function startExtract(
  id: string,
  files: File[],
  settings: WebExtractorSettings,
): Promise<ExtractResponse> {
  const body = new FormData();
  body.append("settings", JSON.stringify(settings));
  for (const file of files) {
    body.append("documents", file, file.name);
  }
  const response = await fetch(`/api/sessions/${encodeURIComponent(id)}/extract`, { method: "POST", body });
  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(typeof err.error === "string" ? err.error : `Upload failed (${response.status})`);
  }
  return response.json() as Promise<ExtractResponse>;
}

export async function getOntology(id: string): Promise<Ontology> {
  return apiFetch<Ontology>(`/api/sessions/${encodeURIComponent(id)}/ontology`);
}

export async function patchOntology(
  id: string,
  operations: EditOperation[],
): Promise<{ ok: boolean; typeCount: number }> {
  return apiFetch(`/api/sessions/${encodeURIComponent(id)}/ontology`, {
    method: "PATCH",
    body: JSON.stringify({ operations }),
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  });
}

export function openEventSource(
  id: string,
  handlers: {
    onProgress: (snapshot: SessionSnapshot) => void;
    onDone: (data: { id: string }) => void;
    onError: (data: { id: string; message: string }) => void;
  },
): EventSource {
  const es = new EventSource(`/api/sessions/${encodeURIComponent(id)}/events`);
  es.addEventListener("progress", (event) => {
    const data = JSON.parse((event as MessageEvent<string>).data) as SessionSnapshot;
    handlers.onProgress(data);
  });
  es.addEventListener("done", (event) => {
    const data = JSON.parse((event as MessageEvent<string>).data) as { id: string };
    es.close();
    handlers.onDone(data);
  });
  es.addEventListener("error", (event) => {
    if (event instanceof MessageEvent) {
      const data = JSON.parse(event.data) as { id: string; message: string };
      es.close();
      handlers.onError(data);
    }
  });
  return es;
}
