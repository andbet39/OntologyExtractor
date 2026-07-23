import { basename, extname } from "node:path";

import { convertDocumentToMarkdown, supportedDocumentExtensions, supportedDocumentMimeTypes } from "@/lib/server/document-conversion";
import { parseExtractorSettings, isHttpError } from "@/lib/server/settings-parser";
import { registry, SessionNotFoundError, AlreadyExtractingError } from "@/lib/server/session-registry";
import type { InputDocument } from "ontology-extractor";

export const runtime = "nodejs";

const MAX_FILES = readEnvInt("ONTOLOGY_MAX_FILES", 20);
const MAX_FILE_BYTES = readEnvInt("ONTOLOGY_MAX_FILE_BYTES", 2 * 1024 * 1024);
const MAX_TOTAL_BYTES = readEnvInt("ONTOLOGY_MAX_TOTAL_BYTES", 20 * 1024 * 1024);

function readEnvInt(key: string, fallback: number): number {
  const n = Number(process.env[key]);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const snapshot = registry.getSnapshot(id);
  if (snapshot === undefined) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }
  if (snapshot.status === "extracting") {
    return Response.json({ error: "Extraction already in progress" }, { status: 409 });
  }

  try {
    const formData = await request.formData();
    const settingsField = formData.get("settings");
    const settings = settingsField !== null ? parseExtractorSettings(typeof settingsField === "string" ? settingsField : JSON.stringify(settingsField)) : {};

    const fileEntries = formData.getAll("documents");
    if (fileEntries.length === 0) {
      return Response.json({ error: "At least one document is required" }, { status: 400 });
    }
    if (fileEntries.length > MAX_FILES) {
      return Response.json({ error: `Too many files: maximum is ${MAX_FILES}` }, { status: 400 });
    }

    const docs: InputDocument[] = [];
    const docMeta: { id: string; name: string }[] = [];
    const seenIds = new Set<string>();
    let totalBytes = 0;

    for (const entry of fileEntries) {
      if (!(entry instanceof File)) continue;
      const name = basename(entry.name);
      const ext = extname(name).toLocaleLowerCase("en");

      if (!supportedDocumentExtensions.has(ext) || !supportedDocumentMimeTypes.has(entry.type || "application/octet-stream")) {
        return Response.json({ error: `Unsupported document type: ${name}` }, { status: 415 });
      }
      if (seenIds.has(name)) {
        return Response.json({ error: `Duplicate document filename: ${name}` }, { status: 400 });
      }
      if (entry.size > MAX_FILE_BYTES) {
        return Response.json({ error: `File too large: ${name}` }, { status: 413 });
      }

      totalBytes += entry.size;
      if (totalBytes > MAX_TOTAL_BYTES) {
        return Response.json({ error: "Total upload size exceeds limit" }, { status: 413 });
      }

      seenIds.add(name);
      const buffer = Buffer.from(await entry.arrayBuffer());
      const text = await convertDocumentToMarkdown(name, buffer);
      docs.push({ id: name, text });
      docMeta.push({ id: name, name });
    }

    if (docs.length === 0) {
      return Response.json({ error: "No valid documents provided" }, { status: 400 });
    }

    const existingDocs = new Set((registry.getSnapshot(id)?.documents ?? []).map((d) => d.id));
    const skipped = docs.filter((d) => existingDocs.has(d.id)).length;

    registry.startExtraction(id, docs, docMeta, settings);

    const batchId = globalThis.crypto.randomUUID();
    return Response.json({ batchId, documentCount: docs.length, skipped }, { status: 202 });
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }
    if (error instanceof AlreadyExtractingError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    if (isHttpError(error)) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : "Extraction failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
