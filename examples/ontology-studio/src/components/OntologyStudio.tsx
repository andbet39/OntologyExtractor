"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import * as api from "@/lib/client/api";
import {
  applyOperationsToEdits,
  emptyEdits,
  mergeOntology,
  type UserEdits,
} from "@/lib/shared/merge-ontology";
import type {
  AttributeDefinition,
  CanonicalType,
  EditOperation,
  Ontology,
  Progress,
  SessionSnapshot,
  UndoEntry,
  WebExtractorSettings,
} from "@/lib/shared/types";

import { DocumentUploader } from "./sidebar/DocumentUploader";
import { ExtractionProgress } from "./progress/ExtractionProgress";
import { HelpPanel } from "./HelpPanel";
import { OntologyGraph } from "./ontology/OntologyGraph";
import { OntologyTable } from "./ontology/OntologyTable";
import { OntologyToolbar } from "./ontology/OntologyToolbar";
import { TypeDetailPanel } from "./ontology/TypeDetailPanel";
import { AddTypeDialog } from "./ontology/AddTypeDialog";

type Tab = "graph" | "table" | "json";
type SessionStatus = "idle" | "extracting" | "error";

interface StudioState {
  sessionId: string | null;
  sessionStatus: SessionStatus;
  sessionProvider: string;
  progress: Progress | null;
  sessionError: string | undefined;
  documents: SessionSnapshot["documents"];
  extractedOntology: Ontology | null;
  userEdits: UserEdits;
  displayOntology: Ontology | null;
  selectedTypeId: string | null;
  activeTab: Tab;
  layoutName: string;
  undoStack: UndoEntry[];
  undoIndex: number;
  addDialogOpen: boolean;
  addDialogKind: "NodeType" | "RelType";
}

type Action =
  | { type: "SESSION_CREATED"; id: string; provider: string }
  | { type: "EXTRACTION_STARTED" }
  | { type: "PROGRESS"; progress: Progress; snapshot: SessionSnapshot }
  | { type: "EXTRACTION_DONE"; ontology: Ontology }
  | { type: "EXTRACTION_ERROR"; message: string }
  | { type: "SESSION_RESET"; snapshot: SessionSnapshot }
  | { type: "EDIT"; operations: EditOperation[]; undoOps: EditOperation[] }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SELECT"; id: string | null }
  | { type: "SET_TAB"; tab: Tab }
  | { type: "SET_LAYOUT"; layout: string }
  | { type: "OPEN_ADD_DIALOG"; kind: "NodeType" | "RelType" }
  | { type: "CLOSE_ADD_DIALOG" };

function reducer(state: StudioState, action: Action): StudioState {
  switch (action.type) {
    case "SESSION_CREATED":
      return { ...state, sessionId: action.id, sessionProvider: action.provider };

    case "EXTRACTION_STARTED":
      return { ...state, sessionStatus: "extracting", sessionError: undefined };

    case "PROGRESS":
      return {
        ...state,
        progress: action.progress,
        documents: action.snapshot.documents,
        sessionStatus: "extracting",
      };

    case "EXTRACTION_DONE": {
      const displayOntology = mergeOntology(action.ontology, state.userEdits);
      return {
        ...state,
        sessionStatus: "idle",
        extractedOntology: action.ontology,
        displayOntology,
        progress: null,
      };
    }

    case "EXTRACTION_ERROR":
      return { ...state, sessionStatus: "error", sessionError: action.message, progress: null };

    case "SESSION_RESET":
      return {
        ...state,
        sessionStatus: "idle",
        progress: null,
        sessionError: undefined,
        documents: action.snapshot.documents,
        extractedOntology: null,
        userEdits: emptyEdits(),
        displayOntology: null,
        selectedTypeId: null,
        undoStack: [],
        undoIndex: -1,
      };

    case "EDIT": {
      const newEdits = applyOperationsToEdits(state.userEdits, action.operations);
      const displayOntology = mergeOntology(state.extractedOntology, newEdits);
      const entry: UndoEntry = {
        forward: action.operations[0]!,
        backward: action.undoOps[0]!,
      };
      const newStack = [...state.undoStack.slice(0, state.undoIndex + 1), entry];
      return {
        ...state,
        userEdits: newEdits,
        displayOntology,
        undoStack: newStack,
        undoIndex: newStack.length - 1,
      };
    }

    case "UNDO": {
      if (state.undoIndex < 0) return state;
      const entry = state.undoStack[state.undoIndex];
      if (!entry) return state;
      const newEdits = applyOperationsToEdits(state.userEdits, [entry.backward]);
      const displayOntology = mergeOntology(state.extractedOntology, newEdits);
      return {
        ...state,
        userEdits: newEdits,
        displayOntology,
        undoIndex: state.undoIndex - 1,
      };
    }

    case "REDO": {
      if (state.undoIndex >= state.undoStack.length - 1) return state;
      const entry = state.undoStack[state.undoIndex + 1];
      if (!entry) return state;
      const newEdits = applyOperationsToEdits(state.userEdits, [entry.forward]);
      const displayOntology = mergeOntology(state.extractedOntology, newEdits);
      return {
        ...state,
        userEdits: newEdits,
        displayOntology,
        undoIndex: state.undoIndex + 1,
      };
    }

    case "SELECT":
      return { ...state, selectedTypeId: action.id };

    case "SET_TAB":
      return { ...state, activeTab: action.tab };

    case "SET_LAYOUT":
      return { ...state, layoutName: action.layout };

    case "OPEN_ADD_DIALOG":
      return { ...state, addDialogOpen: true, addDialogKind: action.kind };

    case "CLOSE_ADD_DIALOG":
      return { ...state, addDialogOpen: false };

    default:
      return state;
  }
}

const INITIAL_STATE: StudioState = {
  sessionId: null,
  sessionStatus: "idle",
  sessionProvider: "mock",
  progress: null,
  sessionError: undefined,
  documents: [],
  extractedOntology: null,
  userEdits: emptyEdits(),
  displayOntology: null,
  selectedTypeId: null,
  activeTab: "graph",
  layoutName: "cose",
  undoStack: [],
  undoIndex: -1,
  addDialogOpen: false,
  addDialogKind: "NodeType",
};

export function OntologyStudio() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  // Create session on mount; read actual provider from the server snapshot
  useEffect(() => {
    api.createSession()
      .then((id) => api.getSession(id).then((snap) => dispatch({ type: "SESSION_CREATED", id, provider: snap.provider })))
      .catch((err: unknown) => setInitError(err instanceof Error ? err.message : "Failed to initialize session"));
  }, []);

  // Keyboard shortcuts: Ctrl+Z, Ctrl+Shift+Z
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        dispatch({ type: "UNDO" });
        void syncUndo();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "z") {
        e.preventDefault();
        dispatch({ type: "REDO" });
        void syncRedo();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessionId, state.undoIndex, state.undoStack]);

  async function syncUndo() {
    if (!state.sessionId || state.undoIndex < 0) return;
    const entry = state.undoStack[state.undoIndex];
    if (!entry) return;
    await api.patchOntology(state.sessionId, [entry.backward]).catch(() => undefined);
  }

  async function syncRedo() {
    if (!state.sessionId || state.undoIndex >= state.undoStack.length - 1) return;
    const entry = state.undoStack[state.undoIndex + 1];
    if (!entry) return;
    await api.patchOntology(state.sessionId, [entry.forward]).catch(() => undefined);
  }

  function connectSSE(id: string) {
    eventSourceRef.current?.close();
    eventSourceRef.current = api.openEventSource(id, {
      onProgress: (snapshot) => {
        dispatch({ type: "PROGRESS", progress: snapshot.progress!, snapshot });
      },
      onDone: () => {
        eventSourceRef.current?.close();
        void loadOntology(id);
      },
      onError: (data) => {
        dispatch({ type: "EXTRACTION_ERROR", message: data.message });
      },
    });
  }

  async function loadOntology(id: string) {
    try {
      const ontology = await api.getOntology(id);
      dispatch({ type: "EXTRACTION_DONE", ontology });
    } catch (err) {
      dispatch({ type: "EXTRACTION_ERROR", message: err instanceof Error ? err.message : "Failed to load ontology" });
    }
  }

  const handleExtract = useCallback(async (files: File[], settings: WebExtractorSettings) => {
    if (!state.sessionId) return;
    dispatch({ type: "EXTRACTION_STARTED" });
    try {
      await api.startExtract(state.sessionId, files, settings);
      connectSSE(state.sessionId);
    } catch (err) {
      dispatch({ type: "EXTRACTION_ERROR", message: err instanceof Error ? err.message : "Extraction failed" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessionId]);

  const handleReset = useCallback(async () => {
    if (!state.sessionId) return;
    try {
      await api.resetSession(state.sessionId);
      const snapshot = await api.getSession(state.sessionId);
      dispatch({ type: "SESSION_RESET", snapshot });
    } catch {
      // silently ignore
    }
  }, [state.sessionId]);

  async function applyEdit(operations: EditOperation[], undoOps: EditOperation[]) {
    dispatch({ type: "EDIT", operations, undoOps });
    if (state.sessionId) {
      await api.patchOntology(state.sessionId, operations).catch(() => undefined);
    }
  }

  function buildUndoForType(id: string): EditOperation {
    const current = state.displayOntology?.types.find((t) => t.id === id);
    if (!current) return { op: "restore", id };
    return { op: "modify", id, patch: { ...current } };
  }

  const handleSaveType = useCallback(async (id: string, patch: Partial<CanonicalType>) => {
    const undo = buildUndoForType(id);
    await applyEdit([{ op: "modify", id, patch }], [undo]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.displayOntology, state.sessionId]);

  const handleDeleteType = useCallback(async (id: string) => {
    await applyEdit([{ op: "delete", id }], [{ op: "restore", id }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessionId]);

  const handleRestoreType = useCallback(async (id: string) => {
    await applyEdit([{ op: "restore", id }], [{ op: "delete", id }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessionId]);

  const handleAddType = useCallback(async (type: CanonicalType) => {
    await applyEdit(
      [{ op: "add", type }],
      [{ op: "delete", id: type.id }],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessionId]);

  const handleLockType = useCallback(async (id: string) => {
    const snapshot = state.displayOntology?.types.find((t) => t.id === id);
    if (!snapshot) return;
    await applyEdit(
      [{ op: "lock-type", id, snapshot }],
      [{ op: "unlock-type", id }],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.displayOntology, state.sessionId]);

  const handleUnlockType = useCallback(async (id: string) => {
    const snapshot = state.userEdits.lockedTypes.get(id);
    await applyEdit(
      [{ op: "unlock-type", id }],
      // undo restores the snapshot that was captured at lock time
      snapshot !== undefined ? [{ op: "lock-type", id, snapshot }] : [{ op: "unlock-type", id }],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.userEdits, state.sessionId]);

  const handleSetAttribute = useCallback(async (typeId: string, def: AttributeDefinition, locked: boolean) => {
    const prevOverride = state.userEdits.attributeOverrides.get(typeId)?.get(def.name);
    const undoOp: EditOperation = prevOverride !== undefined
      ? { op: "set-attribute", typeId, def: prevOverride.def, locked: prevOverride.locked }
      : { op: "delete-attribute", typeId, attributeName: def.name };
    await applyEdit([{ op: "set-attribute", typeId, def, locked }], [undoOp]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.userEdits, state.sessionId]);

  const handleDeleteAttribute = useCallback(async (typeId: string, attributeName: string) => {
    const prevOverride = state.userEdits.attributeOverrides.get(typeId)?.get(attributeName);
    const extractedDef = state.displayOntology?.types
      .find((t) => t.id === typeId)?.attributeDefinitions?.find((a) => a.name === attributeName);
    const undoDef = prevOverride?.def ?? extractedDef ?? { name: attributeName };
    const undoLocked = prevOverride?.locked ?? false;
    await applyEdit(
      [{ op: "delete-attribute", typeId, attributeName }],
      [{ op: "set-attribute", typeId, def: undoDef, locked: undoLocked }],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.userEdits, state.displayOntology, state.sessionId]);

  function handleExport() {
    if (!state.displayOntology) return;
    const json = JSON.stringify(state.displayOntology, null, 2);
    const url = URL.createObjectURL(new Blob([json + "\n"], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "ontology.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const typeCount = state.displayOntology?.types.length ?? 0;

  if (initError) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-400 text-sm">Failed to initialize: {initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-accent border border-accent/40 rounded px-3 py-1.5 hover:bg-accent/10 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-surface-base text-text-primary overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 flex flex-col border-r border-surface-border bg-surface-elevated overflow-y-auto">
        {/* Logo / title */}
        <div className="px-4 py-4 border-b border-surface-border">
          <h1 className="text-base font-semibold text-text-primary">Ontology Studio</h1>
          <p className="text-xs text-text-muted mt-0.5">Iterative ontology extraction</p>
        </div>

        <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
          <DocumentUploader
            documents={state.documents}
            isExtracting={state.sessionStatus === "extracting"}
            onExtract={handleExtract}
            onReset={handleReset}
            sessionProvider={state.sessionProvider}
          />

          <ExtractionProgress
            progress={state.progress}
            status={state.sessionStatus}
            error={state.sessionError}
          />
        </div>

        {/* Undo/Redo footer */}
        {state.undoStack.length > 0 && (
          <div className="px-4 py-3 border-t border-surface-border flex gap-2">
            <button
              type="button"
              onClick={() => { dispatch({ type: "UNDO" }); void syncUndo(); }}
              disabled={state.undoIndex < 0}
              className="flex-1 text-xs text-text-secondary border border-surface-border rounded py-1.5 hover:bg-surface-overlay disabled:opacity-40 transition-colors"
              title="Undo (Ctrl+Z)"
            >
              ↩ Undo
            </button>
            <button
              type="button"
              onClick={() => { dispatch({ type: "REDO" }); void syncRedo(); }}
              disabled={state.undoIndex >= state.undoStack.length - 1}
              className="flex-1 text-xs text-text-secondary border border-surface-border rounded py-1.5 hover:bg-surface-overlay disabled:opacity-40 transition-colors"
              title="Redo (Ctrl+Shift+Z)"
            >
              ↪ Redo
            </button>
          </div>
        )}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <OntologyToolbar
          typeCount={typeCount}
          layoutName={state.layoutName}
          onAddEntity={() => dispatch({ type: "OPEN_ADD_DIALOG", kind: "NodeType" })}
          onAddRelation={() => dispatch({ type: "OPEN_ADD_DIALOG", kind: "RelType" })}
          onLayoutChange={(layout) => dispatch({ type: "SET_LAYOUT", layout })}
          onExport={handleExport}
          onHelp={() => setHelpOpen(true)}
          disabled={state.sessionStatus === "extracting"}
        />

        {/* Tabs */}
        <div className="flex gap-0 border-b border-surface-border shrink-0 bg-surface-elevated px-4">
          {(["graph", "table", "json"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => dispatch({ type: "SET_TAB", tab })}
              className={`px-4 py-2.5 text-xs font-medium capitalize border-b-2 transition-colors ${
                state.activeTab === tab
                  ? "border-accent text-accent"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tab panels */}
          <div className="flex-1 overflow-hidden relative">
            {state.activeTab === "graph" && (
              <div className="absolute inset-0 p-3">
                <OntologyGraph
                  ontology={state.displayOntology}
                  selectedTypeId={state.selectedTypeId}
                  deletions={state.userEdits.deletions}
                  onSelect={(id) => dispatch({ type: "SELECT", id })}
                  onDelete={handleDeleteType}
                  onRestore={handleRestoreType}
                  layoutName={state.layoutName}
                />
              </div>
            )}
            {state.activeTab === "table" && (
              <div className="absolute inset-0">
                <OntologyTable
                  ontology={state.displayOntology}
                  selectedTypeId={state.selectedTypeId}
                  deletions={state.userEdits.deletions}
                  onSelect={(id) => dispatch({ type: "SELECT", id })}
                  onDelete={handleDeleteType}
                  onRestore={handleRestoreType}
                />
              </div>
            )}
            {state.activeTab === "json" && (
              <div className="absolute inset-0 overflow-auto p-4">
                {state.displayOntology ? (
                  <pre className="text-xs text-text-secondary font-mono leading-relaxed">
                    {JSON.stringify(state.displayOntology, null, 2)}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-text-muted text-sm">
                    No ontology yet.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {state.selectedTypeId !== null && (
            <div className="w-80 shrink-0 border-l border-surface-border overflow-hidden flex flex-col">
              <TypeDetailPanel
                typeId={state.selectedTypeId}
                ontology={state.displayOntology}
                deletions={state.userEdits.deletions}
                isTypeLocked={
                  state.selectedTypeId !== null
                    ? state.userEdits.lockedTypes.has(state.selectedTypeId)
                    : false
                }
                attributeOverrides={
                  state.selectedTypeId !== null
                    ? state.userEdits.attributeOverrides.get(state.selectedTypeId)
                    : undefined
                }
                onClose={() => dispatch({ type: "SELECT", id: null })}
                onSave={handleSaveType}
                onDelete={handleDeleteType}
                onRestore={handleRestoreType}
                onLockType={handleLockType}
                onUnlockType={handleUnlockType}
                onSetAttribute={handleSetAttribute}
                onDeleteAttribute={handleDeleteAttribute}
              />
            </div>
          )}
        </div>
      </div>

      {/* Add Type Dialog */}
      <AddTypeDialog
        open={state.addDialogOpen}
        kind={state.addDialogKind}
        ontology={state.displayOntology}
        onClose={() => dispatch({ type: "CLOSE_ADD_DIALOG" })}
        onAdd={handleAddType}
      />

      {/* Help drawer */}
      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
