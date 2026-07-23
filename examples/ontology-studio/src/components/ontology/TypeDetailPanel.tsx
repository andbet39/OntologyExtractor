"use client";

import { useEffect, useRef, useState } from "react";
import type { AttributeDefinition, CanonicalType, Ontology } from "@/lib/shared/types";
import type { AttributeOverride } from "@/lib/shared/merge-ontology";
import { Badge } from "@/components/ui/Badge";

const ATTR_VALUE_TYPES = ["STRING", "NUMBER", "FLOAT", "BOOLEAN", "DATE", "DATETIME"] as const;

interface TypeDetailPanelProps {
  typeId: string | null;
  ontology: Ontology | null;
  deletions: Set<string>;
  isTypeLocked: boolean;
  attributeOverrides: Map<string, AttributeOverride> | undefined;
  onClose: () => void;
  onSave: (id: string, patch: Partial<CanonicalType>) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onLockType: (id: string) => void;
  onUnlockType: (id: string) => void;
  onSetAttribute: (typeId: string, def: AttributeDefinition, locked: boolean) => void;
  onDeleteAttribute: (typeId: string, attributeName: string) => void;
}

function EditableField({
  label, value, multiline = false, onCommit, disabled,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  onCommit: (value: string) => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value && trimmed.length > 0) {
      onCommit(trimmed);
    } else {
      setDraft(value);
    }
  }

  if (!editing) {
    return (
      <div className="group">
        <p className="text-xs text-text-muted mb-0.5">{label}</p>
        <div
          className={`text-sm text-text-primary rounded px-2 py-1 cursor-text group-hover:bg-surface-overlay transition-colors ${disabled ? "cursor-default" : ""}`}
          onClick={() => !disabled && setEditing(true)}
          title={disabled ? undefined : "Click to edit"}
        >
          {value || <span className="text-text-muted italic">—</span>}
        </div>
      </div>
    );
  }

  const sharedProps = {
    ref: inputRef as React.Ref<HTMLInputElement & HTMLTextAreaElement>,
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !multiline) { e.preventDefault(); commit(); }
      if (e.key === "Escape") { setEditing(false); setDraft(value); }
    },
    autoFocus: true,
    className: "w-full text-sm bg-surface-base border border-accent rounded px-2 py-1 text-text-primary focus:outline-none resize-none",
  };

  return (
    <div>
      <p className="text-xs text-text-muted mb-0.5">{label}</p>
      {multiline
        ? <textarea {...sharedProps} rows={3} />
        : <input type="text" {...sharedProps} />
      }
    </div>
  );
}

interface AttrFormState {
  name: string;
  type: string;
  description: string;
  required: boolean;
  locked: boolean;
}

function AttributeEditForm({
  initial,
  initialLocked,
  isNew,
  onSave,
  onCancel,
}: {
  initial: AttributeDefinition | null;
  initialLocked: boolean;
  isNew: boolean;
  onSave: (def: AttributeDefinition, locked: boolean) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<AttrFormState>({
    name: initial?.name ?? "",
    type: initial?.type ?? "",
    description: initial?.description ?? "",
    required: initial?.required ?? false,
    locked: isNew ? true : initialLocked,
  });

  function handleSave() {
    const name = form.name.trim();
    if (!name) return;
    const def: AttributeDefinition = { name };
    if (form.type) def.type = form.type as NonNullable<AttributeDefinition["type"]>;
    const desc = form.description.trim();
    if (desc) def.description = desc;
    if (form.required) def.required = true;
    onSave(def, form.locked);
  }

  return (
    <div className="mt-2 p-2 bg-surface-base border border-surface-border rounded space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <p className="text-xs text-text-muted mb-0.5">Name</p>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            disabled={!isNew}
            placeholder="attribute_name"
            className="w-full text-xs bg-surface-elevated border border-surface-border rounded px-2 py-1 text-text-primary focus:outline-none focus:border-accent disabled:opacity-60"
          />
        </div>
        <div className="w-28">
          <p className="text-xs text-text-muted mb-0.5">Type</p>
          <select
            value={form.type}
            onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}
            className="w-full text-xs bg-surface-elevated border border-surface-border rounded px-2 py-1 text-text-primary focus:outline-none"
          >
            <option value="">—</option>
            {ATTR_VALUE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <p className="text-xs text-text-muted mb-0.5">Description</p>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
          placeholder="Optional description"
          className="w-full text-xs bg-surface-elevated border border-surface-border rounded px-2 py-1 text-text-primary focus:outline-none focus:border-accent"
        />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.required}
            onChange={(e) => setForm((s) => ({ ...s, required: e.target.checked }))}
            className="accent-accent"
          />
          <span className="text-xs text-text-secondary">Required</span>
        </label>
        <label className={`flex items-center gap-1.5 ${isNew ? "cursor-not-allowed" : "cursor-pointer"}`}>
          <input
            type="checkbox"
            checked={form.locked}
            disabled={isNew}
            onChange={(e) => setForm((s) => ({ ...s, locked: e.target.checked }))}
            className="accent-accent disabled:opacity-60"
          />
          <span className="text-xs text-text-secondary">Locked</span>
        </label>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={!form.name.trim()}
          className="flex-1 py-1 text-xs font-medium rounded bg-accent/20 text-accent border border-accent/40 hover:bg-accent/30 transition-colors disabled:opacity-40"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-1 text-xs rounded border border-surface-border text-text-secondary hover:bg-surface-overlay transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function TypeDetailPanel({
  typeId, ontology, deletions, isTypeLocked, attributeOverrides,
  onClose, onSave, onDelete, onRestore, onLockType, onUnlockType,
  onSetAttribute, onDeleteAttribute,
}: TypeDetailPanelProps) {
  const type = ontology?.types.find((t) => t.id === typeId) ?? null;
  const isDeleted = typeId ? deletions.has(typeId) : false;
  const [editingAttr, setEditingAttr] = useState<string | null>(null); // attr name or "__new__"

  // Reset attr form when selected type changes
  useEffect(() => { setEditingAttr(null); }, [typeId]);

  if (!type) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
          <h2 className="text-sm font-semibold text-text-primary">Type Details</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors text-lg leading-none">✕</button>
        </div>
        <div className="flex-1 flex items-center justify-center text-text-muted text-sm p-6 text-center">
          Select a node or edge in the graph to view and edit its details.
        </div>
      </div>
    );
  }

  const nodeTypes = ontology?.types.filter((t) => t.kind === "NodeType") ?? [];

  // Collect all attributes to display: from merged type (which already has overrides applied)
  const attrDefs: AttributeDefinition[] =
    type.attributeDefinitions ?? type.attributes.map((a) => ({ name: a }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant={type.kind === "NodeType" ? "node" : "rel"}>
            {type.kind === "NodeType" ? "Entity" : "Relation"}
          </Badge>
          {isTypeLocked && (
            <span className="text-xs text-amber-400 font-medium shrink-0">🔒 Locked</span>
          )}
          <span className="text-xs text-text-muted truncate">{type.id}</span>
        </div>
        <button type="button" onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors text-lg leading-none ml-2 shrink-0">✕</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isDeleted && (
          <div className="text-xs text-red-400 bg-red-900/20 border border-red-700/40 rounded px-3 py-2">
            This type is marked for deletion. Changes won't apply until restored.
          </div>
        )}

        <EditableField
          label="Label"
          value={type.label}
          onCommit={(v) => onSave(type.id, { label: v })}
          disabled={isDeleted}
        />
        <EditableField
          label="Definition"
          value={type.definition}
          multiline
          onCommit={(v) => onSave(type.id, { definition: v })}
          disabled={isDeleted}
        />
        <EditableField
          label="Category"
          value={type.category ?? ""}
          onCommit={(v) => { if (v) onSave(type.id, { category: v }); }}
          disabled={isDeleted}
        />

        {type.kind === "RelType" && (
          <>
            <div>
              <p className="text-xs text-text-muted mb-0.5">Domain (source entity)</p>
              <select
                value={type.domain ?? ""}
                onChange={(e) => { if (e.target.value) onSave(type.id, { domain: e.target.value }); }}
                disabled={isDeleted}
                className="w-full text-sm bg-surface-base border border-surface-border rounded px-2 py-1 text-text-primary"
              >
                <option value="">— none —</option>
                {nodeTypes.map((n) => (
                  <option key={n.id} value={n.id}>{n.label}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-0.5">Range (target entity)</p>
              <select
                value={type.range ?? ""}
                onChange={(e) => { if (e.target.value) onSave(type.id, { range: e.target.value }); }}
                disabled={isDeleted}
                className="w-full text-sm bg-surface-base border border-surface-border rounded px-2 py-1 text-text-primary"
              >
                <option value="">— none —</option>
                {nodeTypes.map((n) => (
                  <option key={n.id} value={n.id}>{n.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-xs text-text-muted mb-0.5">From cardinality</p>
                <select
                  value={type.fromCardinality ?? ""}
                  onChange={(e) => { if (e.target.value) onSave(type.id, { fromCardinality: e.target.value as "0" | "1" | "N" }); }}
                  disabled={isDeleted}
                  className="w-full text-sm bg-surface-base border border-surface-border rounded px-2 py-1 text-text-primary"
                >
                  <option value="">—</option>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="N">N</option>
                </select>
              </div>
              <div className="flex-1">
                <p className="text-xs text-text-muted mb-0.5">To cardinality</p>
                <select
                  value={type.toCardinality ?? ""}
                  onChange={(e) => { if (e.target.value) onSave(type.id, { toCardinality: e.target.value as "0" | "1" | "N" }); }}
                  disabled={isDeleted}
                  className="w-full text-sm bg-surface-base border border-surface-border rounded px-2 py-1 text-text-primary"
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

        {type.kind === "NodeType" && type.parent !== undefined && (
          <div>
            <p className="text-xs text-text-muted mb-0.5">Parent (is-a)</p>
            <p className="text-sm text-text-primary">
              {nodeTypes.find((n) => n.id === type.parent)?.label ?? type.parent}
            </p>
          </div>
        )}

        {/* Attributes section with editing */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-text-muted">Attributes</p>
            {!isDeleted && (
              <button
                type="button"
                onClick={() => setEditingAttr("__new__")}
                className="text-xs text-accent hover:text-accent/80 transition-colors"
              >
                + Add
              </button>
            )}
          </div>

          {attrDefs.length === 0 && editingAttr !== "__new__" && (
            <p className="text-xs text-text-muted italic">No attributes</p>
          )}

          <div className="space-y-1">
            {attrDefs.map((attr) => {
              const override = attributeOverrides?.get(attr.name);
              const locked = override?.locked ?? false;
              const hasOverride = override !== undefined;

              return (
                <div key={attr.name}>
                  <div className="flex items-center gap-1 group rounded px-1 py-0.5 hover:bg-surface-overlay">
                    {/* Lock toggle */}
                    <button
                      type="button"
                      title={locked ? "Locked — click to unlock" : "Unlocked — click to lock"}
                      onClick={() => !isDeleted && onSetAttribute(type.id, attr, !locked)}
                      disabled={isDeleted}
                      className={`text-sm shrink-0 transition-colors ${locked ? "text-amber-400" : "text-text-muted hover:text-text-secondary"}`}
                    >
                      {locked ? "🔒" : "○"}
                    </button>

                    {/* Attribute info */}
                    <span className="flex-1 text-xs text-text-primary truncate">
                      {attr.name}
                      {attr.type && <span className="text-text-muted">: {attr.type}</span>}
                    </span>

                    {/* Edit button */}
                    {!isDeleted && (
                      <button
                        type="button"
                        onClick={() => setEditingAttr(editingAttr === attr.name ? null : attr.name)}
                        className="text-xs text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-all px-1"
                        title="Edit attribute"
                      >
                        ✎
                      </button>
                    )}

                    {/* Delete button — only for user overrides */}
                    {!isDeleted && hasOverride && (
                      <button
                        type="button"
                        onClick={() => { onDeleteAttribute(type.id, attr.name); setEditingAttr(null); }}
                        className="text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-all px-1"
                        title="Remove attribute override"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {editingAttr === attr.name && (
                    <AttributeEditForm
                      initial={attr}
                      initialLocked={locked}
                      isNew={false}
                      onSave={(def, loc) => { onSetAttribute(type.id, def, loc); setEditingAttr(null); }}
                      onCancel={() => setEditingAttr(null)}
                    />
                  )}
                </div>
              );
            })}

            {editingAttr === "__new__" && (
              <AttributeEditForm
                initial={null}
                initialLocked={false}
                isNew
                onSave={(def, loc) => { onSetAttribute(type.id, def, loc); setEditingAttr(null); }}
                onCancel={() => setEditingAttr(null)}
              />
            )}
          </div>
        </div>

        {type.aliases.length > 0 && (
          <div>
            <p className="text-xs text-text-muted mb-1">Aliases ({type.aliases.length})</p>
            <div className="flex flex-wrap gap-1">
              {type.aliases.map((a) => (
                <span key={a} className="text-xs bg-surface-overlay border border-surface-border rounded px-1.5 py-0.5 text-text-muted">{a}</span>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs text-text-muted mb-1">Support count</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full"
                style={{ width: `${Math.min(100, type.supportCount * 10)}%` }}
              />
            </div>
            <span className="text-xs text-text-secondary">{type.supportCount}</span>
          </div>
        </div>

        {type.provenance.length > 0 && (
          <div>
            <p className="text-xs text-text-muted mb-1">Provenance</p>
            <ul className="space-y-0.5">
              {type.provenance.slice(0, 5).map((p, i) => (
                <li key={i} className="text-xs text-text-muted truncate">
                  {p.documentId} · chunk {p.chunkIndex}
                </li>
              ))}
              {type.provenance.length > 5 && (
                <li className="text-xs text-text-muted">+{type.provenance.length - 5} more</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-surface-border shrink-0 flex gap-2">
        {/* Lock / Unlock */}
        <button
          type="button"
          onClick={() => isTypeLocked ? onUnlockType(type.id) : onLockType(type.id)}
          title={isTypeLocked ? "Unlock: allow refinement to update this type" : "Lock: protect from future refinements"}
          className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors ${
            isTypeLocked
              ? "bg-amber-900/20 text-amber-400 border-amber-700/40 hover:bg-amber-900/30"
              : "bg-surface-overlay text-text-secondary border-surface-border hover:text-text-primary hover:bg-surface-elevated"
          }`}
        >
          {isTypeLocked ? "🔒 Locked" : "○ Lock"}
        </button>

        {/* Delete / Restore */}
        {isDeleted ? (
          <button
            type="button"
            onClick={() => onRestore(type.id)}
            className="flex-1 py-1.5 text-xs font-medium rounded bg-accent/20 text-accent border border-accent/40 hover:bg-accent/30 transition-colors"
          >
            Restore
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onDelete(type.id)}
            className="flex-1 py-1.5 text-xs font-medium rounded bg-red-900/20 text-red-400 border border-red-700/40 hover:bg-red-900/30 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
