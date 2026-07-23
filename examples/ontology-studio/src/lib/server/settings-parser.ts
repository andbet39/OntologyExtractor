import type { WebExtractorSettings } from "../shared/types";

export function parseExtractorSettings(value: unknown): WebExtractorSettings {
  if (typeof value !== "string") {
    throw createHttpError(400, "Settings must be a JSON string");
  }
  if (value.length > 30_000) {
    throw createHttpError(413, "Settings exceed the size limit");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw createHttpError(400, "Settings must contain valid JSON");
  }
  const root = readRecord(parsed, "settings");
  const chunking = readOptionalRecord(root["chunking"], "settings.chunking");
  const extraction = readOptionalRecord(root["extraction"], "settings.extraction");
  const canonicalization = readOptionalRecord(root["canonicalization"], "settings.canonicalization");
  const output = readOptionalRecord(root["output"], "settings.output");
  const settings: WebExtractorSettings = {};
  if (chunking !== undefined) {
    settings.chunking = {
      ...(chunking["strategy"] === undefined ? {} : { strategy: readEnum(chunking["strategy"], ["recursive", "markdown", "html"], "settings.chunking.strategy") }),
      ...(chunking["chunkSize"] === undefined ? {} : { chunkSize: readInteger(chunking["chunkSize"], 1, 100_000, "settings.chunking.chunkSize") }),
      ...(chunking["chunkOverlap"] === undefined ? {} : { chunkOverlap: readInteger(chunking["chunkOverlap"], 0, 99_999, "settings.chunking.chunkOverlap") }),
    };
    if (
      settings.chunking.chunkSize !== undefined &&
      settings.chunking.chunkOverlap !== undefined &&
      settings.chunking.chunkOverlap >= settings.chunking.chunkSize
    ) {
      throw createHttpError(400, "settings.chunking.chunkOverlap must be smaller than chunkSize");
    }
  }
  if (extraction !== undefined) {
    settings.extraction = {
      ...(extraction["concurrency"] === undefined ? {} : { concurrency: readInteger(extraction["concurrency"], 1, 64, "settings.extraction.concurrency") }),
      ...(extraction["accuracy"] === undefined ? {} : { accuracy: readEnum(extraction["accuracy"], ["low", "medium", "high"], "settings.extraction.accuracy") }),
      ...(extraction["requireExamples"] === undefined ? {} : { requireExamples: readBoolean(extraction["requireExamples"], "settings.extraction.requireExamples") }),
      ...(extraction["systemPrompt"] === undefined ? {} : { systemPrompt: readPrompt(extraction["systemPrompt"], "settings.extraction.systemPrompt") }),
      ...(extraction["prompt"] === undefined ? {} : { prompt: readPrompt(extraction["prompt"], "settings.extraction.prompt") }),
    };
  }
  if (canonicalization !== undefined) {
    settings.canonicalization = {
      ...(canonicalization["topK"] === undefined ? {} : { topK: readInteger(canonicalization["topK"], 1, 50, "settings.canonicalization.topK") }),
      ...(canonicalization["autoMatchThreshold"] === undefined ? {} : { autoMatchThreshold: readThreshold(canonicalization["autoMatchThreshold"], "settings.canonicalization.autoMatchThreshold") }),
      ...(canonicalization["autoNewThreshold"] === undefined ? {} : { autoNewThreshold: readThreshold(canonicalization["autoNewThreshold"], "settings.canonicalization.autoNewThreshold") }),
      ...(canonicalization["useLlmForAmbiguous"] === undefined ? {} : { useLlmForAmbiguous: readBoolean(canonicalization["useLlmForAmbiguous"], "settings.canonicalization.useLlmForAmbiguous") }),
      ...(canonicalization["systemPrompt"] === undefined ? {} : { systemPrompt: readPrompt(canonicalization["systemPrompt"], "settings.canonicalization.systemPrompt") }),
      ...(canonicalization["prompt"] === undefined ? {} : { prompt: readPrompt(canonicalization["prompt"], "settings.canonicalization.prompt") }),
    };
    if (
      settings.canonicalization.autoNewThreshold !== undefined &&
      settings.canonicalization.autoMatchThreshold !== undefined &&
      settings.canonicalization.autoNewThreshold >= settings.canonicalization.autoMatchThreshold
    ) {
      throw createHttpError(400, "settings.canonicalization.autoNewThreshold must be smaller than autoMatchThreshold");
    }
  }
  if (output !== undefined) {
    settings.output = {
      ...(output["supportCountThreshold"] === undefined ? {} : { supportCountThreshold: readInteger(output["supportCountThreshold"], 1, 1_000, "settings.output.supportCountThreshold") }),
    };
  }
  return settings;
}

function readRecord(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw createHttpError(400, `${path} must be an object`);
  }
  return value as Record<string, unknown>;
}

function readOptionalRecord(value: unknown, path: string): Record<string, unknown> | undefined {
  return value === undefined ? undefined : readRecord(value, path);
}

function readInteger(value: unknown, minimum: number, maximum: number, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum || value > maximum) {
    throw createHttpError(400, `${path} must be an integer between ${minimum} and ${maximum}`);
  }
  return value;
}

function readThreshold(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw createHttpError(400, `${path} must be between 0 and 1`);
  }
  return value;
}

function readBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    throw createHttpError(400, `${path} must be a boolean`);
  }
  return value;
}

function readEnum<Value extends string>(value: unknown, allowed: readonly Value[], path: string): Value {
  if (typeof value !== "string" || !allowed.includes(value as Value)) {
    throw createHttpError(400, `${path} must be one of: ${allowed.join(", ")}`);
  }
  return value as Value;
}

function readPrompt(value: unknown, path: string): string {
  if (typeof value !== "string") {
    throw createHttpError(400, `${path} must be a string`);
  }
  const prompt = value.trim();
  if (prompt.length === 0 || prompt.length > 8_000) {
    throw createHttpError(400, `${path} must be between 1 and 8000 characters`);
  }
  return prompt;
}

export function createHttpError(statusCode: number, message: string): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

export function isHttpError(error: unknown): error is Error & { statusCode: number } {
  return error instanceof Error && "statusCode" in error && typeof error.statusCode === "number";
}
