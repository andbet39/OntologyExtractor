import type { Candidate, EmbeddingAdapter, LlmAdapter } from "ontology-extractor";

export class DemoLlmAdapter implements LlmAdapter {
  async generateStructured<T>(request: {
    prompt: string;
    schema: Record<string, unknown>;
  }): Promise<T> {
    const required = Array.isArray(request.schema.required) ? request.schema.required : [];
    if (!required.includes("candidates")) {
      return { verdict: "NEW" } as T;
    }
    const parsed = JSON.parse(request.prompt) as { text?: unknown };
    const text = typeof parsed.text === "string" ? parsed.text : "";
    return { candidates: extractDemoCandidates(text) } as T;
  }
}

export class DemoEmbeddingAdapter implements EmbeddingAdapter {
  readonly dimensions = 32;

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((text) => hashText(text, this.dimensions));
  }
}

function extractDemoCandidates(text: string): Candidate[] {
  const normalized = text.toLocaleLowerCase("en");
  const candidates: Candidate[] = [];
  addNodeWhenPresent(candidates, normalized, "service", "Service", "A deployable software capability.");
  addNodeWhenPresent(candidates, normalized, "api", "API", "A programmatic interface exposed by a system.");
  addNodeWhenPresent(candidates, normalized, "database", "Database", "A persistent structured data store.");
  if (normalized.includes("service") && normalized.includes("api") && normalized.includes("expos")) {
    candidates.push({
      label: "exposes",
      definition: "A service makes an API available.",
      kind: "RelType",
      domain: "Service",
      range: "API",
      fromCardinality: "1",
      toCardinality: "N",
      examples: ["The billing service exposes an API"],
    });
  }
  if (normalized.includes("service") && normalized.includes("database") && normalized.includes("use")) {
    candidates.push({
      label: "uses",
      definition: "A service depends on a database.",
      kind: "RelType",
      domain: "Service",
      range: "Database",
      fromCardinality: "N",
      toCardinality: "1",
      examples: ["The billing service uses a database"],
    });
  }
  return candidates;
}

function addNodeWhenPresent(
  candidates: Candidate[],
  text: string,
  keyword: string,
  label: string,
  definition: string,
): void {
  if (text.includes(keyword)) {
    candidates.push({
      label,
      definition,
      kind: "NodeType",
      attributes: ["name"],
      attributeDefinitions: [{ name: "name", type: "STRING", label: "Name", indexed: true, required: true, restricted: false }],
      primaryKeyAttribute: "name",
      labelAttribute: "name",
      category: "Software Architecture",
      examples: [label],
    });
  }
}

function hashText(text: string, dimensions: number): number[] {
  const normalized = `  ${text.toLocaleLowerCase("en").replace(/\s+/g, " ")}  `;
  const vector: number[] = Array.from({ length: dimensions }, () => 0);
  for (let index = 0; index <= normalized.length - 3; index += 1) {
    const trigram = normalized.slice(index, index + 3);
    let hash = 0;
    for (const character of trigram) {
      hash = Math.trunc(hash * 31 + (character.codePointAt(0) ?? 0));
    }
    const bucket = Math.abs(hash) % dimensions;
    vector[bucket] = (vector[bucket] ?? 0) + (hash % 2 === 0 ? 1 : -1);
  }
  if (vector.every((value) => value === 0)) {
    return [1, ...vector.slice(1)];
  }
  return vector;
}
