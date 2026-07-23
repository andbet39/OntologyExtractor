"use client";

import { useMemo, useState } from "react";
import type { CanonicalType, Ontology } from "@/lib/shared/types";
import { Badge } from "@/components/ui/Badge";

interface OntologyTableProps {
  ontology: Ontology | null;
  selectedTypeId: string | null;
  deletions: Set<string>;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
}

type SortKey = "label" | "kind" | "supportCount" | "category";

export function OntologyTable({
  ontology, selectedTypeId, deletions, onSelect, onDelete, onRestore,
}: OntologyTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("label");
  const [sortAsc, setSortAsc] = useState(true);
  const [kindFilter, setKindFilter] = useState<"all" | "NodeType" | "RelType">("all");

  const types = useMemo<CanonicalType[]>(() => {
    if (!ontology) return [];
    let list = [...ontology.types];
    if (kindFilter !== "all") list = list.filter((t) => t.kind === kindFilter);
    if (search.trim()) {
      const q = search.trim().toLocaleLowerCase("en");
      list = list.filter(
        (t) =>
          t.label.toLocaleLowerCase("en").includes(q) ||
          t.definition.toLocaleLowerCase("en").includes(q) ||
          t.aliases.some((a) => a.toLocaleLowerCase("en").includes(q)),
      );
    }
    list.sort((a, b) => {
      let av: string | number = a[sortKey] ?? "";
      let bv: string | number = b[sortKey] ?? "";
      if (typeof av === "string") av = av.toLocaleLowerCase("en");
      if (typeof bv === "string") bv = bv.toLocaleLowerCase("en");
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [ontology, search, sortKey, sortAsc, kindFilter]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(true); }
  }

  function SortHeader({ label, field }: { label: string; field: SortKey }) {
    const active = sortKey === field;
    return (
      <th
        className="px-3 py-2 text-left text-xs font-medium text-text-secondary cursor-pointer hover:text-text-primary select-none"
        onClick={() => toggleSort(field)}
      >
        {label} {active ? (sortAsc ? "↑" : "↓") : ""}
      </th>
    );
  }

  if (!ontology || ontology.types.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        No types extracted yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex gap-2 p-3 border-b border-surface-border shrink-0">
        <input
          type="search"
          placeholder="Search types…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-xs bg-surface-base border border-surface-border rounded px-2 py-1.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as "all" | "NodeType" | "RelType")}
          className="text-xs bg-surface-base border border-surface-border rounded px-2 py-1.5 text-text-primary"
        >
          <option value="all">All kinds</option>
          <option value="NodeType">Entities only</option>
          <option value="RelType">Relations only</option>
        </select>
        <span className="text-xs text-text-muted self-center whitespace-nowrap">{types.length} types</span>
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-surface-elevated border-b border-surface-border">
            <tr>
              <SortHeader label="Label" field="label" />
              <SortHeader label="Kind" field="kind" />
              <SortHeader label="Support" field="supportCount" />
              <SortHeader label="Category" field="category" />
              <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">Definition</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {types.map((type) => {
              const isDeleted = deletions.has(type.id);
              const isSelected = selectedTypeId === type.id;
              return (
                <tr
                  key={type.id}
                  onClick={() => onSelect(type.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? "bg-accent/10" : "hover:bg-surface-overlay"
                  } ${isDeleted ? "opacity-40" : ""}`}
                >
                  <td className="px-3 py-2 font-medium text-text-primary">
                    <span className={isDeleted ? "line-through" : ""}>{type.label}</span>
                    {type.aliases.length > 0 && (
                      <span className="text-text-muted ml-1">+{type.aliases.length}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={type.kind === "NodeType" ? "node" : "rel"}>
                      {type.kind === "NodeType" ? "Entity" : "Relation"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-text-secondary text-center">{type.supportCount}</td>
                  <td className="px-3 py-2 text-text-muted">{type.category ?? "—"}</td>
                  <td className="px-3 py-2 text-text-secondary max-w-[240px] truncate" title={type.definition}>
                    {type.definition}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-end">
                      {isDeleted ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onRestore(type.id); }}
                          className="text-xs text-accent hover:text-accent-hover transition-colors px-1.5 py-0.5 rounded"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onDelete(type.id); }}
                          className="text-xs text-text-muted hover:text-red-400 transition-colors px-1.5 py-0.5 rounded"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
