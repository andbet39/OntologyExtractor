"use client";

interface OntologyToolbarProps {
  typeCount: number;
  layoutName: string;
  onAddEntity: () => void;
  onAddRelation: () => void;
  onLayoutChange: (layout: string) => void;
  onExport: () => void;
  onHelp: () => void;
  disabled?: boolean;
}

const LAYOUTS = [
  { value: "cose", label: "Force-directed" },
  { value: "breadthfirst", label: "Breadth-first" },
  { value: "circle", label: "Circle" },
  { value: "grid", label: "Grid" },
  { value: "concentric", label: "Concentric" },
];

export function OntologyToolbar({
  typeCount, layoutName, onAddEntity, onAddRelation, onLayoutChange, onExport, onHelp, disabled,
}: OntologyToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-border bg-surface-elevated shrink-0">
      {/* Add buttons */}
      <button
        type="button"
        onClick={onAddEntity}
        disabled={disabled}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-accent/20 text-accent border border-accent/40 hover:bg-accent/30 transition-colors disabled:opacity-50"
      >
        <span>+</span> Entity
      </button>
      <button
        type="button"
        onClick={onAddRelation}
        disabled={disabled}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-purple-900/20 text-purple-300 border border-purple-700/40 hover:bg-purple-900/30 transition-colors disabled:opacity-50"
      >
        <span>+</span> Relation
      </button>

      <div className="w-px h-4 bg-surface-border mx-1" />

      {/* Layout */}
      <select
        value={layoutName}
        onChange={(e) => onLayoutChange(e.target.value)}
        className="text-xs bg-surface-base border border-surface-border rounded px-2 py-1 text-text-secondary hover:text-text-primary"
        title="Graph layout"
      >
        {LAYOUTS.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>

      {/* Stats */}
      <div className="flex-1" />
      {typeCount > 0 && (
        <span className="text-xs text-text-muted">{typeCount} types</span>
      )}

      <div className="w-px h-4 bg-surface-border mx-1" />

      {/* Export */}
      <button
        type="button"
        onClick={onExport}
        disabled={typeCount === 0}
        className="flex items-center gap-1 px-2.5 py-1 text-xs text-text-secondary border border-surface-border rounded hover:text-text-primary hover:border-text-secondary transition-colors disabled:opacity-40"
      >
        ↓ Export JSON
      </button>

      {/* Help */}
      <button
        type="button"
        onClick={onHelp}
        className="flex items-center justify-center w-6 h-6 rounded-full border border-surface-border text-text-muted hover:text-text-primary hover:border-text-secondary transition-colors text-xs font-bold"
        title="Help & Guide"
      >
        ?
      </button>
    </div>
  );
}
