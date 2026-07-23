"use client";

import cytoscape, { type Core, type ElementDefinition, type LayoutOptions } from "cytoscape";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CanonicalType, Ontology } from "@/lib/shared/types";

interface ContextMenu {
  x: number;
  y: number;
  typeId: string;
}

interface OntologyGraphInnerProps {
  ontology: Ontology | null;
  selectedTypeId: string | null;
  deletions: Set<string>;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  layoutName: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Software Architecture": "#1f6b8a",
  "Data": "#1a6b45",
  "Process": "#6b4a1a",
  "Organization": "#4a1a6b",
  "Document": "#1a4a6b",
  "Person": "#6b1a1a",
};

function categoryColor(category: string | undefined): string {
  if (!category) return "#1f8a6e";
  return CATEGORY_COLORS[category] ?? "#1f8a6e";
}

function toGraphElements(types: CanonicalType[], deletions: Set<string>): ElementDefinition[] {
  const nodes = types
    .filter((t) => t.kind === "NodeType")
    .map((t) => ({
      data: {
        id: t.id, label: t.label, definition: t.definition, kind: t.kind,
        category: t.category, supportCount: t.supportCount, aliases: t.aliases,
        backColor: t.visual?.backColor ?? categoryColor(t.category),
        deleted: deletions.has(t.id),
      },
      classes: deletions.has(t.id) ? "deleted" : "",
    }));

  const edges = types
    .filter((t) => t.kind === "RelType" && t.domain !== undefined && t.range !== undefined)
    .map((t) => ({
      data: {
        id: t.id, label: t.label, definition: t.definition, kind: t.kind,
        source: t.domain!, target: t.range!, supportCount: t.supportCount,
        deleted: deletions.has(t.id),
      },
      classes: deletions.has(t.id) ? "deleted" : "",
    }));

  const parentEdges = types
    .filter((t) => t.kind === "NodeType" && t.parent !== undefined)
    .map((t) => ({
      data: {
        id: `isa-${t.id}`, source: t.id, target: t.parent!, label: "is-a",
        kind: "Subtype",
      },
      classes: "isa-edge",
    }));

  return [...nodes, ...edges, ...parentEdges];
}

export function OntologyGraphInner({
  ontology, selectedTypeId, deletions, onSelect, onDelete, onRestore, layoutName,
}: OntologyGraphInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            shape: "round-rectangle",
            "background-color": "data(backColor)",
            color: "#e6edf3",
            "text-valign": "center",
            "text-halign": "center",
            "font-family": "Inter, system-ui, sans-serif",
            "font-size": "11px",
            "text-wrap": "wrap",
            "text-max-width": "80px",
            width: 90,
            height: 44,
            "border-width": 2,
            "border-color": "#30363d",
            "text-outline-width": 0,
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-color": "#25a882",
            "border-width": 3,
            "background-color": "data(backColor)",
          },
        },
        {
          selector: "node.deleted",
          style: {
            opacity: 0.35,
            "border-color": "#6e4040",
            "border-style": "dashed",
          },
        },
        {
          selector: "edge",
          style: {
            label: "data(label)",
            "line-color": "#484f58",
            "target-arrow-color": "#484f58",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "font-size": "9px",
            color: "#8b949e",
            "text-background-color": "#0d1117",
            "text-background-opacity": 0.8,
            "text-background-padding": "2px",
            width: 1.5,
          },
        },
        {
          selector: "edge:selected",
          style: {
            "line-color": "#25a882",
            "target-arrow-color": "#25a882",
            color: "#e6edf3",
          },
        },
        {
          selector: "edge.isa-edge",
          style: {
            "line-style": "dashed",
            "line-color": "#484f58",
            "target-arrow-shape": "triangle-backcurve",
          },
        },
        {
          selector: "edge.deleted",
          style: { opacity: 0.3 },
        },
      ],
      layout: { name: "cose", animate: false, randomize: false } as LayoutOptions,
    });

    cy.on("tap", (event) => {
      if (event.target === cy) {
        onSelect(null);
        setContextMenu(null);
      }
    });
    cy.on("tap", "node, edge", (event) => {
      const id = String(event.target.id());
      if (!id.startsWith("isa-")) {
        onSelect(id);
      }
      setContextMenu(null);
    });
    cy.on("cxttap", "node, edge", (event) => {
      const id = String(event.target.id());
      if (!id.startsWith("isa-")) {
        const pos = event.renderedPosition;
        setContextMenu({ x: pos.x, y: pos.y, typeId: id });
      }
    });

    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update elements when ontology or deletions change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const elements = ontology ? toGraphElements(ontology.types, deletions) : [];
    cy.elements().remove();
    if (elements.length > 0) {
      cy.add(elements);
      cy.layout({ name: layoutName as LayoutOptions["name"], animate: false, randomize: false } as LayoutOptions).run();
    }
  }, [ontology, deletions, layoutName]);

  // Sync selection
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().unselect();
    if (selectedTypeId) {
      cy.getElementById(selectedTypeId).select();
    }
  }, [selectedTypeId]);

  const handleFit = useCallback(() => {
    cyRef.current?.fit(undefined, 48);
  }, []);

  const handleRelayout = useCallback(() => {
    cyRef.current?.layout({ name: layoutName as LayoutOptions["name"], animate: true, randomize: false } as LayoutOptions).run();
  }, [layoutName]);

  const isDeleted = contextMenu ? deletions.has(contextMenu.typeId) : false;

  return (
    <div className="relative w-full h-full bg-surface-base rounded-lg overflow-hidden">
      {/* Graph container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Empty state */}
      {(!ontology || ontology.types.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-text-muted">
            <div className="text-4xl mb-2">🕸️</div>
            <p className="text-sm">Extract documents to build the ontology graph</p>
          </div>
        </div>
      )}

      {/* Toolbar overlay */}
      <div className="absolute top-3 right-3 flex gap-1.5">
        <button
          type="button"
          onClick={handleFit}
          className="px-2 py-1 text-xs bg-surface-elevated border border-surface-border rounded text-text-secondary hover:text-text-primary transition-colors"
          title="Fit to screen"
        >
          ⊞ Fit
        </button>
        <button
          type="button"
          onClick={handleRelayout}
          className="px-2 py-1 text-xs bg-surface-elevated border border-surface-border rounded text-text-secondary hover:text-text-primary transition-colors"
          title="Re-run layout"
        >
          ↻ Layout
        </button>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="absolute bg-surface-elevated border border-surface-border rounded-lg shadow-xl py-1 z-50 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            onClick={() => { onSelect(contextMenu.typeId); setContextMenu(null); }}
            className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-overlay transition-colors"
          >
            Edit
          </button>
          {isDeleted ? (
            <button
              type="button"
              onClick={() => { onRestore(contextMenu.typeId); setContextMenu(null); }}
              className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-overlay transition-colors"
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { onDelete(contextMenu.typeId); setContextMenu(null); }}
              className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-surface-overlay transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      )}

      {/* Click outside context menu */}
      {contextMenu && (
        <div
          className="absolute inset-0 z-40"
          onClick={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
