import type { AttributeDefinition, CanonicalType, Ontology } from "ontology-extractor";
import type { EditOperation } from "./types";

export interface AttributeOverride {
  def: AttributeDefinition;
  locked: boolean;
}

export interface UserEdits {
  additions: CanonicalType[];
  modifications: Map<string, Partial<CanonicalType>>;
  deletions: Set<string>;
  // typeId → attributeName → override (locked attrs always survive refinement)
  attributeOverrides: Map<string, Map<string, AttributeOverride>>;
  // typeId → full snapshot captured at lock time; these types are fully protected from refinement
  lockedTypes: Map<string, CanonicalType>;
}

export function emptyEdits(): UserEdits {
  return {
    additions: [],
    modifications: new Map(),
    deletions: new Set(),
    attributeOverrides: new Map(),
    lockedTypes: new Map(),
  };
}

export function applyOperationsToEdits(edits: UserEdits, operations: EditOperation[]): UserEdits {
  const next: UserEdits = {
    additions: [...edits.additions],
    modifications: new Map(edits.modifications),
    deletions: new Set(edits.deletions),
    attributeOverrides: new Map(
      [...edits.attributeOverrides].map(([k, v]) => [k, new Map(v)]),
    ),
    lockedTypes: new Map(edits.lockedTypes),
  };
  for (const op of operations) {
    if (op.op === "add") {
      next.additions.push(op.type);
    } else if (op.op === "modify") {
      const existing = next.modifications.get(op.id) ?? {};
      next.modifications.set(op.id, { ...existing, ...op.patch });
    } else if (op.op === "delete") {
      next.deletions.add(op.id);
    } else if (op.op === "restore") {
      next.deletions.delete(op.id);
    } else if (op.op === "set-attribute") {
      const typeAttrs = next.attributeOverrides.get(op.typeId) ?? new Map<string, AttributeOverride>();
      typeAttrs.set(op.def.name, { def: op.def, locked: op.locked });
      next.attributeOverrides.set(op.typeId, typeAttrs);
    } else if (op.op === "delete-attribute") {
      const typeAttrs = next.attributeOverrides.get(op.typeId);
      if (typeAttrs) typeAttrs.delete(op.attributeName);
    } else if (op.op === "lock-type") {
      next.lockedTypes.set(op.id, op.snapshot);
    } else if (op.op === "unlock-type") {
      next.lockedTypes.delete(op.id);
    }
  }
  return next;
}

// Merges extracted attribute definitions with user overrides.
// Locked overrides always win (survive extraction changes/removal).
// Non-locked overrides apply only when the attribute still exists in the extraction.
function mergeAttributeDefs(
  extracted: AttributeDefinition[] | undefined,
  overrides: Map<string, AttributeOverride> | undefined,
): { defs: AttributeDefinition[]; names: string[] } {
  if (!overrides || overrides.size === 0) {
    const defs = extracted ?? [];
    return { defs, names: defs.map((d) => d.name) };
  }
  const result = new Map<string, AttributeDefinition>();
  for (const def of extracted ?? []) result.set(def.name, def);
  // Non-locked overrides: only apply when the attribute is still present in extraction
  for (const [name, { def, locked }] of overrides) {
    if (!locked && result.has(name)) result.set(name, def);
  }
  // Locked overrides: always win, even if extraction removed the attribute
  for (const [name, { def, locked }] of overrides) {
    if (locked) result.set(name, def);
  }
  const defs = [...result.values()];
  return { defs, names: defs.map((d) => d.name) };
}

function applyAttrOverrides(t: CanonicalType, edits: UserEdits): CanonicalType {
  const attrOverrides = edits.attributeOverrides.get(t.id);
  if (!attrOverrides || attrOverrides.size === 0) return t;
  const { defs, names } = mergeAttributeDefs(t.attributeDefinitions, attrOverrides);
  return { ...t, attributeDefinitions: defs, attributes: names };
}

export function mergeOntology(extracted: Ontology | null, edits: UserEdits): Ontology {
  const base = extracted ?? emptyOntology();
  const extractedIds = new Set(base.types.map((t) => t.id));

  const processExtracted = (t: CanonicalType): CanonicalType => {
    // Locked types: use snapshot as base so refinement cannot overwrite user fields
    const baseType = edits.lockedTypes.get(t.id) ?? t;
    const mod = edits.modifications.get(t.id);
    const withMod = mod === undefined ? baseType : { ...baseType, ...mod };
    return applyAttrOverrides(withMod, edits);
  };

  const types: CanonicalType[] = [
    // All extracted types (locked ones use snapshot as base, unlocked use extraction)
    ...base.types
      .filter((t) => !edits.deletions.has(t.id))
      .map(processExtracted),
    // Locked types dropped by extraction (below threshold etc.) → reinsert from snapshot
    ...[...edits.lockedTypes.entries()]
      .filter(([id]) => !extractedIds.has(id) && !edits.deletions.has(id))
      .map(([, snapshot]) => {
        const mod = edits.modifications.get(snapshot.id);
        const withMod = mod === undefined ? snapshot : { ...snapshot, ...mod };
        return applyAttrOverrides(withMod, edits);
      }),
    ...edits.additions,
  ];

  return {
    ...base,
    types,
    stats: { ...base.stats, typeCount: types.length },
  };
}

function emptyOntology(): Ontology {
  return {
    types: [],
    generatedAt: Date.now(),
    stats: {
      documentCount: 0,
      candidateCount: 0,
      typeCount: 0,
      droppedBelowThreshold: 0,
    },
  };
}
