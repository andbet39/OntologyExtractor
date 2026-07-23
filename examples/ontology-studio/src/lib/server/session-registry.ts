import {
  OntologyExtractor,
  type AggregatedCandidate,
  type CanonicalType,
  type ExtractionJob,
  type InputDocument,
  type Ontology,
  type Progress,
} from "ontology-extractor";

import { applyOperationsToEdits, emptyEdits, mergeOntology, type UserEdits } from "../shared/merge-ontology";
import type { DocumentMeta, EditOperation, SessionEvent, SessionSnapshot, WebExtractorSettings } from "../shared/types";
import { createProviderAdapters, type ProviderAdapters, type ProviderName } from "./providers";

export class SessionNotFoundError extends Error {}
export class AlreadyExtractingError extends Error {}
export class TooManySessionsError extends Error {}

interface SessionRecord {
  id: string;
  extractor: OntologyExtractor;
  adapters: ProviderAdapters;
  extractedOntology: Ontology | null;
  userEdits: UserEdits;
  documents: DocumentMeta[];
  status: "idle" | "extracting" | "error";
  activeJob: ExtractionJob | null;
  progress: Progress | null;
  createdAt: number;
  updatedAt: number;
  error: string | undefined;
  listeners: Set<(event: SessionEvent) => void>;
}

interface SessionRegistryOptions {
  maxActiveSessions: number;
  sessionTtlMs: number;
  supportCountThreshold: number;
  extractionAccuracy: "low" | "medium" | "high";
}

function readRegistryOptions(): SessionRegistryOptions {
  const env = process.env;
  return {
    maxActiveSessions: readPositiveInt(env.ONTOLOGY_MAX_ACTIVE_SESSIONS, 10),
    sessionTtlMs: readPositiveInt(env.ONTOLOGY_SESSION_TTL_MS, 3_600_000),
    supportCountThreshold: readPositiveInt(env.ONTOLOGY_SUPPORT_THRESHOLD, 1),
    extractionAccuracy: readAccuracy(env.ONTOLOGY_EXTRACTION_ACCURACY),
  };
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function readAccuracy(value: string | undefined): "low" | "medium" | "high" {
  if (value === "low" || value === "high") return value;
  return "medium";
}

export class SessionRegistry {
  readonly #sessions = new Map<string, SessionRecord>();
  readonly #options: SessionRegistryOptions;
  readonly #cleanupTimer: NodeJS.Timeout;

  constructor(options: SessionRegistryOptions) {
    this.#options = options;
    this.#cleanupTimer = setInterval(() => this.#cleanupExpired(), 60_000);
    this.#cleanupTimer.unref();
  }

  createSession(provider: ProviderName, settings?: WebExtractorSettings): string {
    if (this.#sessions.size >= this.#options.maxActiveSessions) {
      throw new TooManySessionsError("Maximum concurrent sessions reached");
    }
    const adapters = createProviderAdapters(provider);
    const extractor = new OntologyExtractor({
      llm: adapters.llm,
      embeddings: adapters.embeddings,
      extraction: {
        accuracy: settings?.extraction?.accuracy ?? this.#options.extractionAccuracy,
        systemPrompt: createExtractionSystemPrompt(),
        prompt: (chunk) => JSON.stringify({
          documentId: chunk.documentId,
          chunkIndex: chunk.chunkIndex,
          instruction: "Extract only certain ontology entities that are explicitly supported and central to the main subject of this document fragment.",
          text: chunk.text,
        }),
      },
      canonicalization: {
        systemPrompt: createCanonicalizationSystemPrompt(),
        prompt: ({ candidate, neighbors }) => createCanonicalizationPrompt(candidate, neighbors),
      },
      output: { supportCountThreshold: settings?.output?.supportCountThreshold ?? this.#options.supportCountThreshold },
    });
    const id = globalThis.crypto.randomUUID();
    const now = Date.now();
    this.#sessions.set(id, {
      id, extractor, adapters,
      extractedOntology: null,
      userEdits: emptyEdits(),
      documents: [],
      status: "idle",
      activeJob: null,
      progress: null,
      error: undefined,
      createdAt: now,
      updatedAt: now,
      listeners: new Set(),
    });
    return id;
  }

  getSnapshot(id: string): SessionSnapshot | undefined {
    const record = this.#sessions.get(id);
    if (record === undefined) return undefined;
    return toSnapshot(record);
  }

  startExtraction(
    id: string,
    docs: InputDocument[],
    docMeta: { id: string; name: string }[],
    settings?: WebExtractorSettings,
  ): void {
    const record = this.#sessions.get(id);
    if (record === undefined) throw new SessionNotFoundError(id);
    if (record.status === "extracting") throw new AlreadyExtractingError("Extraction already in progress");

    const isFirstBatch = record.documents.length === 0;
    const job = isFirstBatch ? record.extractor.extract(docs) : record.extractor.refine(docs);

    record.status = "extracting";
    record.activeJob = job;
    record.error = undefined;
    record.updatedAt = Date.now();
    this.#emit(record, { type: "progress", data: toSnapshot(record) });

    job.on("progress", (progress) => {
      record.progress = progress;
      record.updatedAt = Date.now();
      this.#emit(record, { type: "progress", data: toSnapshot(record) });
    });

    void job.completed().then(
      (ontology) => {
        record.extractedOntology = structuredClone(ontology);
        const newDocs = docMeta.map((m) => ({ id: m.id, name: m.name, addedAt: Date.now() }));
        const existingIds = new Set(record.documents.map((d) => d.id));
        for (const doc of newDocs) {
          if (!existingIds.has(doc.id)) record.documents.push(doc);
        }
        record.status = "idle";
        record.activeJob = null;
        record.updatedAt = Date.now();
        this.#emit(record, { type: "done", data: { id } });
      },
      (error: unknown) => {
        record.status = "error";
        record.activeJob = null;
        const errorMessage = safeErrorMessage(error);
        record.error = errorMessage;
        record.updatedAt = Date.now();
        this.#emit(record, { type: "error", data: { id, message: errorMessage } });
      },
    );
  }

  applyEdits(id: string, operations: EditOperation[]): number {
    const record = this.#sessions.get(id);
    if (record === undefined) throw new SessionNotFoundError(id);
    record.userEdits = applyOperationsToEdits(record.userEdits, operations);
    record.updatedAt = Date.now();
    return mergeOntology(record.extractedOntology, record.userEdits).types.length;
  }

  getDisplayOntology(id: string): Ontology | null {
    const record = this.#sessions.get(id);
    if (record === undefined) throw new SessionNotFoundError(id);
    if (record.extractedOntology === null && record.userEdits.additions.length === 0) return null;
    return mergeOntology(record.extractedOntology, record.userEdits);
  }

  resetSession(id: string): boolean {
    const record = this.#sessions.get(id);
    if (record === undefined) return false;
    if (record.activeJob !== null) {
      void record.activeJob.cancel().catch(() => undefined);
    }
    const adapters = record.adapters;
    const provider = adapters.summary.provider;
    const newExtractor = new OntologyExtractor({
      llm: adapters.llm,
      embeddings: adapters.embeddings,
      extraction: { systemPrompt: createExtractionSystemPrompt() },
      canonicalization: { systemPrompt: createCanonicalizationSystemPrompt() },
      output: { supportCountThreshold: this.#options.supportCountThreshold },
    });
    record.extractor = newExtractor;
    record.extractedOntology = null;
    record.userEdits = emptyEdits();
    record.documents = [];
    record.status = "idle";
    record.activeJob = null;
    record.progress = null;
    record.error = undefined;
    record.updatedAt = Date.now();
    return true;
  }

  subscribe(id: string, listener: (event: SessionEvent) => void): (() => void) | undefined {
    const record = this.#sessions.get(id);
    if (record === undefined) return undefined;
    record.listeners.add(listener);
    return () => record.listeners.delete(listener);
  }

  #emit(record: SessionRecord, event: SessionEvent): void {
    for (const listener of record.listeners) listener(event);
  }

  #cleanupExpired(): void {
    const cutoff = Date.now() - this.#options.sessionTtlMs;
    for (const [id, record] of this.#sessions) {
      if (record.status !== "extracting" && record.updatedAt <= cutoff) {
        record.listeners.clear();
        this.#sessions.delete(id);
      }
    }
  }
}

function toSnapshot(record: SessionRecord): SessionSnapshot {
  return {
    id: record.id,
    status: record.status,
    progress: record.progress === null ? null : structuredClone(record.progress),
    documents: [...record.documents],
    stats: record.extractedOntology?.stats ?? null,
    provider: record.adapters.summary.provider,
    createdAt: record.createdAt,
    ...(record.error === undefined ? {} : { error: record.error }),
  };
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.name === "CancelledError") return "Extraction cancelled";
  const msg = findProviderErrorMessage(error);
  if (msg?.includes("Virtual Network") === true || msg?.includes("cogsvc-vnet") === true) {
    return "Azure OpenAI rejected the request: resource restricted to a Virtual Network.";
  }
  return "Ontology extraction failed";
}

function findProviderErrorMessage(error: unknown): string | undefined {
  let current = error;
  const messages: string[] = [];
  for (let depth = 0; depth < 4; depth += 1) {
    if (!(current instanceof Error)) break;
    if (current.message.length > 0) messages.push(current.message);
    current = (current as Error & { cause?: unknown }).cause;
  }
  const message = messages.join(" ").slice(0, 500);
  return message.length === 0 ? undefined : message;
}

function createExtractionSystemPrompt(): string {
  return [
    "Extract ontology schema candidates from the document fragment.",
    "Return only entities, relations, and attributes that are explicitly stated or directly entailed by the text.",
    "Keep only candidates that are central to the fragment's main subject.",
    "Prefer fewer high-confidence NodeType and RelType candidates over broad recall.",
    "Use NodeType for stable domain concepts and RelType for stable relations between those concepts.",
    "For RelType include domain and range labels only when both endpoints are certain and central.",
    "Never invent identifiers, colors, constraints, cardinalities, synonyms, or implicit process steps.",
    "Keep definitions concise and grounded in the uploaded text.",
    "Include one or two grounding examples for every candidate.",
  ].join(" ");
}

function createCanonicalizationSystemPrompt(): string {
  return [
    "Decide whether an ontology candidate matches, extends, or differs from known types.",
    "Merge only when the candidate and target represent the same certain, central domain concept or relation.",
    "Use SUBTYPE only when the text clearly supports a narrower kind of the target.",
    "Use NEW when the relationship is uncertain, merely related, incidental, or based only on a broad semantic association.",
    "Do not normalize away domain-specific distinctions that matter to the document's main subject.",
  ].join(" ");
}

function createCanonicalizationPrompt(
  candidate: AggregatedCandidate,
  neighbors: Array<{ type: CanonicalType; score: number }>,
): string {
  return JSON.stringify({
    instruction: "Classify the candidate as MATCH, SUBTYPE, or NEW using only certain, main-subject ontology meaning.",
    candidate,
    neighbors,
  });
}

// Singleton with HMR-safe globalThis pattern
const REGISTRY_KEY = Symbol.for("ontology-studio:session-registry");

declare global {
  // eslint-disable-next-line no-var
  var __ontologyStudioRegistry: SessionRegistry | undefined;
}

function getRegistry(): SessionRegistry {
  const g = globalThis as typeof globalThis & { [REGISTRY_KEY]?: SessionRegistry };
  if (g[REGISTRY_KEY] === undefined) {
    g[REGISTRY_KEY] = new SessionRegistry(readRegistryOptions());
  }
  return g[REGISTRY_KEY];
}

export const registry = getRegistry();
