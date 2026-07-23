"use client";

import { useState } from "react";
import type { CanonicalType, Ontology } from "@/lib/shared/types";
import { Dialog } from "@/components/ui/Dialog";

interface AddTypeDialogProps {
  open: boolean;
  kind: "NodeType" | "RelType";
  ontology: Ontology | null;
  onClose: () => void;
  onAdd: (type: CanonicalType) => void;
}

function generateTempId(): string {
  return `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function AddTypeDialog({ open, kind, ontology, onClose, onAdd }: AddTypeDialogProps) {
  const [label, setLabel] = useState("");
  const [definition, setDefinition] = useState("");
  const [category, setCategory] = useState("");
  const [domain, setDomain] = useState("");
  const [range, setRange] = useState("");
  const [fromCardinality, setFromCardinality] = useState<"" | "0" | "1" | "N">("");
  const [toCardinality, setToCardinality] = useState<"" | "0" | "1" | "N">("");
  const [error, setError] = useState<string | null>(null);

  const nodeTypes = ontology?.types.filter((t) => t.kind === "NodeType") ?? [];

  function reset() {
    setLabel(""); setDefinition(""); setCategory("");
    setDomain(""); setRange(""); setFromCardinality(""); setToCardinality("");
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimLabel = label.trim();
    const trimDef = definition.trim();
    if (!trimLabel) { setError("Label is required."); return; }
    if (!trimDef) { setError("Definition is required."); return; }
    if (kind === "RelType" && (!domain || !range)) {
      setError("Domain and range are required for relations."); return;
    }

    const type: CanonicalType = {
      id: generateTempId(),
      label: trimLabel,
      definition: trimDef,
      kind,
      aliases: [],
      attributes: [],
      supportCount: 1,
      provenance: [],
      ...(category.trim() ? { category: category.trim() } : {}),
      ...(kind === "RelType" && domain ? { domain } : {}),
      ...(kind === "RelType" && range ? { range } : {}),
      ...(fromCardinality ? { fromCardinality: fromCardinality as "0" | "1" | "N" } : {}),
      ...(toCardinality ? { toCardinality: toCardinality as "0" | "1" | "N" } : {}),
    };

    onAdd(type);
    reset();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={kind === "NodeType" ? "Add Entity Type" : "Add Relation Type"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-xs text-red-400 bg-red-900/20 border border-red-700/40 rounded px-3 py-2">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs text-text-muted mb-1">Label *</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={kind === "NodeType" ? "e.g. Customer" : "e.g. owns"}
            className="w-full text-sm bg-surface-base border border-surface-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1">Definition *</label>
          <textarea
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            placeholder="Describe what this type represents"
            rows={3}
            className="w-full text-sm bg-surface-base border border-surface-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Optional category"
            className="w-full text-sm bg-surface-base border border-surface-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        {kind === "RelType" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">Domain (source) *</label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full text-sm bg-surface-base border border-surface-border rounded px-2 py-2 text-text-primary"
                >
                  <option value="">— select —</option>
                  {nodeTypes.map((n) => (
                    <option key={n.id} value={n.id}>{n.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Range (target) *</label>
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="w-full text-sm bg-surface-base border border-surface-border rounded px-2 py-2 text-text-primary"
                >
                  <option value="">— select —</option>
                  {nodeTypes.map((n) => (
                    <option key={n.id} value={n.id}>{n.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">From cardinality</label>
                <select
                  value={fromCardinality}
                  onChange={(e) => setFromCardinality(e.target.value as "" | "0" | "1" | "N")}
                  className="w-full text-sm bg-surface-base border border-surface-border rounded px-2 py-2 text-text-primary"
                >
                  <option value="">—</option>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="N">N</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">To cardinality</label>
                <select
                  value={toCardinality}
                  onChange={(e) => setToCardinality(e.target.value as "" | "0" | "1" | "N")}
                  className="w-full text-sm bg-surface-base border border-surface-border rounded px-2 py-2 text-text-primary"
                >
                  <option value="">—</option>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="N">N</option>
                </select>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            className="flex-1 py-2 text-sm font-medium rounded bg-accent hover:bg-accent-hover text-white transition-colors"
          >
            Add {kind === "NodeType" ? "Entity" : "Relation"}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2 text-sm text-text-secondary border border-surface-border rounded hover:bg-surface-overlay transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Dialog>
  );
}
