"use client";

import { useRef, useState } from "react";
import type { DocumentMeta, WebExtractorSettings } from "@/lib/shared/types";
import { ExtractionSettings } from "./ExtractionSettings";

interface DocumentUploaderProps {
  documents: DocumentMeta[];
  isExtracting: boolean;
  onExtract: (files: File[], settings: WebExtractorSettings) => void;
  onReset: () => void;
  sessionProvider: string;
}

const SUPPORTED_EXTS = /\.(?:txt|md|markdown|html?|pdf)$/i;
const MAX_FILES = 20;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

function formatBytes(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KiB`;
}

export function DocumentUploader({
  documents,
  isExtracting,
  onExtract,
  onReset,
  sessionProvider,
}: DocumentUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [settings, setSettings] = useState<WebExtractorSettings>({
    chunking: { strategy: "recursive", chunkSize: 4000, chunkOverlap: 800 },
    extraction: { accuracy: "medium", concurrency: 8, requireExamples: true },
    canonicalization: { topK: 5, autoMatchThreshold: 0.92, autoNewThreshold: 0.6, useLlmForAmbiguous: true },
    output: { supportCountThreshold: 1 },
  });
  const inputRef = useRef<HTMLInputElement>(null);

  function validateFiles(files: File[]): File[] | null {
    const accepted = files.filter((f) => SUPPORTED_EXTS.test(f.name));
    if (accepted.length !== files.length) {
      setValidationError("Some files have unsupported types. Accepted: .txt, .md, .markdown, .html, .pdf");
      return null;
    }
    if (accepted.length > MAX_FILES) {
      setValidationError(`Too many files. Maximum is ${MAX_FILES}.`);
      return null;
    }
    const oversized = accepted.find((f) => f.size > MAX_FILE_BYTES);
    if (oversized) {
      setValidationError(`File too large: ${oversized.name} (max ${formatBytes(MAX_FILE_BYTES)})`);
      return null;
    }
    setValidationError(null);
    return accepted;
  }

  function handleFiles(files: File[]) {
    const valid = validateFiles(files);
    if (valid) setSelectedFiles(valid);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles([...e.dataTransfer.files]);
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const isFirstBatch = documents.length === 0;
  const buttonLabel = isExtracting ? "Extracting…" : isFirstBatch ? "Extract" : "Refine";

  return (
    <div className="space-y-3">
      {/* Provider badge */}
      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
        <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
        Provider: <span className="text-text-primary">{sessionProvider}</span>
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-accent bg-accent/10"
            : "border-surface-border hover:border-accent/50 hover:bg-surface-overlay"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".txt,.md,.markdown,.html,.htm,.pdf"
          className="hidden"
          onChange={(e) => handleFiles([...(e.target.files ?? [])])}
        />
        <div className="text-2xl mb-1">📄</div>
        <p className="text-xs text-text-secondary">
          Drop documents here or <span className="text-accent">browse</span>
        </p>
        <p className="text-xs text-text-muted mt-0.5">TXT · MD · HTML · PDF</p>
      </div>

      {validationError && (
        <p className="text-xs text-red-400">{validationError}</p>
      )}

      {/* Selected files */}
      {selectedFiles.length > 0 && (
        <ul className="space-y-1">
          {selectedFiles.map((file, i) => (
            <li key={file.name} className="flex items-center justify-between text-xs bg-surface-overlay rounded px-2 py-1">
              <span className="truncate text-text-primary max-w-[180px]" title={file.name}>{file.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-text-muted">{formatBytes(file.size)}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-text-muted hover:text-red-400 transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Extract button */}
      <button
        type="button"
        onClick={() => onExtract(selectedFiles, settings)}
        disabled={isExtracting || selectedFiles.length === 0}
        className="w-full py-2 px-3 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {buttonLabel}
        {selectedFiles.length > 0 && ` (${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""})`}
      </button>

      {/* Processed documents list */}
      {documents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-text-secondary">Processed ({documents.length})</p>
            <button
              type="button"
              onClick={onReset}
              disabled={isExtracting}
              className="text-xs text-text-muted hover:text-red-400 transition-colors disabled:opacity-50"
            >
              Reset session
            </button>
          </div>
          <ul className="space-y-0.5 max-h-32 overflow-y-auto">
            {documents.map((doc) => (
              <li key={doc.id} className="text-xs text-text-secondary truncate px-1" title={doc.name}>
                ✓ {doc.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ExtractionSettings value={settings} onChange={setSettings} disabled={isExtracting} />
    </div>
  );
}
