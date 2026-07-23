"use client";

import { useState } from "react";
import type { WebExtractorSettings } from "@/lib/shared/types";

interface ExtractionSettingsProps {
  value: WebExtractorSettings;
  onChange: (settings: WebExtractorSettings) => void;
  disabled?: boolean;
}

export function ExtractionSettings({ value, onChange, disabled }: ExtractionSettingsProps) {
  const [open, setOpen] = useState(false);

  function updateChunking(patch: NonNullable<WebExtractorSettings["chunking"]>) {
    onChange({ ...value, chunking: { ...value.chunking, ...patch } });
  }
  function updateExtraction(patch: NonNullable<WebExtractorSettings["extraction"]>) {
    onChange({ ...value, extraction: { ...value.extraction, ...patch } });
  }
  function updateCanon(patch: NonNullable<WebExtractorSettings["canonicalization"]>) {
    onChange({ ...value, canonicalization: { ...value.canonicalization, ...patch } });
  }
  function updateOutput(patch: NonNullable<WebExtractorSettings["output"]>) {
    onChange({ ...value, output: { ...value.output, ...patch } });
  }

  return (
    <div className="border border-surface-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-overlay transition-colors"
        disabled={disabled}
      >
        <span>Extraction Settings</span>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-surface-border">
          {/* Chunking */}
          <section>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Chunking</p>
            <div className="space-y-1.5">
              <label className="flex items-center justify-between gap-2">
                <span className="text-xs text-text-secondary">Strategy</span>
                <select
                  value={value.chunking?.strategy ?? "recursive"}
                  onChange={(e) => updateChunking({ strategy: e.target.value as "recursive" | "markdown" | "html" })}
                  disabled={disabled}
                  className="text-xs bg-surface-base border border-surface-border rounded px-1.5 py-0.5 text-text-primary"
                >
                  <option value="recursive">Recursive</option>
                  <option value="markdown">Markdown</option>
                  <option value="html">HTML</option>
                </select>
              </label>
              <label className="flex items-center justify-between gap-2">
                <span className="text-xs text-text-secondary">Chunk size</span>
                <input
                  type="number"
                  min={100}
                  max={100000}
                  value={value.chunking?.chunkSize ?? 4000}
                  onChange={(e) => updateChunking({ chunkSize: Number(e.target.value) })}
                  disabled={disabled}
                  className="text-xs bg-surface-base border border-surface-border rounded px-1.5 py-0.5 text-text-primary w-20 text-right"
                />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span className="text-xs text-text-secondary">Overlap</span>
                <input
                  type="number"
                  min={0}
                  max={99999}
                  value={value.chunking?.chunkOverlap ?? 800}
                  onChange={(e) => updateChunking({ chunkOverlap: Number(e.target.value) })}
                  disabled={disabled}
                  className="text-xs bg-surface-base border border-surface-border rounded px-1.5 py-0.5 text-text-primary w-20 text-right"
                />
              </label>
            </div>
          </section>

          {/* Extraction */}
          <section>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Extraction</p>
            <div className="space-y-1.5">
              <label className="flex items-center justify-between gap-2">
                <span className="text-xs text-text-secondary">Accuracy</span>
                <select
                  value={value.extraction?.accuracy ?? "medium"}
                  onChange={(e) => updateExtraction({ accuracy: e.target.value as "low" | "medium" | "high" })}
                  disabled={disabled}
                  className="text-xs bg-surface-base border border-surface-border rounded px-1.5 py-0.5 text-text-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label className="flex items-center justify-between gap-2">
                <span className="text-xs text-text-secondary">Concurrency</span>
                <input
                  type="number"
                  min={1}
                  max={64}
                  value={value.extraction?.concurrency ?? 8}
                  onChange={(e) => updateExtraction({ concurrency: Number(e.target.value) })}
                  disabled={disabled}
                  className="text-xs bg-surface-base border border-surface-border rounded px-1.5 py-0.5 text-text-primary w-16 text-right"
                />
              </label>
            </div>
          </section>

          {/* Canonicalization */}
          <section>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Canonicalization</p>
            <div className="space-y-1.5">
              <label className="flex items-center justify-between gap-2">
                <span className="text-xs text-text-secondary">Auto-match threshold</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={value.canonicalization?.autoMatchThreshold ?? 0.92}
                  onChange={(e) => updateCanon({ autoMatchThreshold: Number(e.target.value) })}
                  disabled={disabled}
                  className="text-xs bg-surface-base border border-surface-border rounded px-1.5 py-0.5 text-text-primary w-16 text-right"
                />
              </label>
              <label className="flex items-center justify-between gap-2">
                <span className="text-xs text-text-secondary">Auto-new threshold</span>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={value.canonicalization?.autoNewThreshold ?? 0.6}
                  onChange={(e) => updateCanon({ autoNewThreshold: Number(e.target.value) })}
                  disabled={disabled}
                  className="text-xs bg-surface-base border border-surface-border rounded px-1.5 py-0.5 text-text-primary w-16 text-right"
                />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value.canonicalization?.useLlmForAmbiguous ?? true}
                  onChange={(e) => updateCanon({ useLlmForAmbiguous: e.target.checked })}
                  disabled={disabled}
                  className="rounded"
                />
                <span className="text-xs text-text-secondary">Use LLM for ambiguous</span>
              </label>
            </div>
          </section>

          {/* Output */}
          <section>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Output</p>
            <label className="flex items-center justify-between gap-2">
              <span className="text-xs text-text-secondary">Support threshold</span>
              <input
                type="number"
                min={1}
                max={100}
                value={value.output?.supportCountThreshold ?? 1}
                onChange={(e) => updateOutput({ supportCountThreshold: Number(e.target.value) })}
                disabled={disabled}
                className="text-xs bg-surface-base border border-surface-border rounded px-1.5 py-0.5 text-text-primary w-16 text-right"
              />
            </label>
          </section>
        </div>
      )}
    </div>
  );
}
