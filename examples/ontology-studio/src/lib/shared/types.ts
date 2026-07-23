import type { AttributeDefinition, CanonicalType, Ontology, Progress } from "ontology-extractor";

export type { AttributeDefinition, CanonicalType, Ontology, Progress };

export type SessionStatus = "idle" | "extracting" | "error";

export interface DocumentMeta {
  id: string;
  name: string;
  addedAt: number;
}

export interface SessionSnapshot {
  id: string;
  status: SessionStatus;
  progress: Progress | null;
  documents: DocumentMeta[];
  stats: Ontology["stats"] | null;
  provider: string;
  createdAt: number;
  error?: string;
}

export interface UserEditsPayload {
  additions: CanonicalType[];
  modifications: Record<string, Partial<CanonicalType>>;
  deletions: string[];
}

export type EditOperation =
  | { op: "add"; type: CanonicalType }
  | { op: "modify"; id: string; patch: Partial<CanonicalType> }
  | { op: "delete"; id: string }
  | { op: "restore"; id: string }
  | { op: "set-attribute"; typeId: string; def: AttributeDefinition; locked: boolean }
  | { op: "delete-attribute"; typeId: string; attributeName: string }
  // snapshot = full type state at lock time; used as base instead of extraction output
  | { op: "lock-type"; id: string; snapshot: CanonicalType }
  | { op: "unlock-type"; id: string };

export interface UndoEntry {
  forward: EditOperation;
  backward: EditOperation;
}

export type SessionEvent =
  | { type: "progress"; data: SessionSnapshot }
  | { type: "done"; data: { id: string } }
  | { type: "error"; data: { id: string; message: string } };

export interface ExtractResponse {
  batchId: string;
  documentCount: number;
  skipped: number;
}

export interface WebExtractorSettings {
  chunking?: {
    strategy?: "recursive" | "markdown" | "html";
    chunkSize?: number;
    chunkOverlap?: number;
  };
  extraction?: {
    concurrency?: number;
    accuracy?: "low" | "medium" | "high";
    requireExamples?: boolean;
    systemPrompt?: string;
    prompt?: string;
  };
  canonicalization?: {
    topK?: number;
    autoMatchThreshold?: number;
    autoNewThreshold?: number;
    useLlmForAmbiguous?: boolean;
    systemPrompt?: string;
    prompt?: string;
  };
  output?: {
    supportCountThreshold?: number;
  };
}
