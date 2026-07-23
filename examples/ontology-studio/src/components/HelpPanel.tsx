"use client";

import { useEffect, useRef, useState } from "react";

interface Section {
  id: string;
  step: string;
  title: string;
}

const SECTIONS: Section[] = [
  { id: "overview",  step: "Intro", title: "What is Ontology Studio?" },
  { id: "session",   step: "1",     title: "Start a session" },
  { id: "extract",   step: "2",     title: "Upload & Extract" },
  { id: "explore",   step: "3",     title: "Explore the ontology" },
  { id: "edit",      step: "4",     title: "Edit entities & relations" },
  { id: "lock",      step: "5",     title: "Lock types & attributes" },
  { id: "refine",    step: "6",     title: "Refine with more documents" },
  { id: "export",    step: "7",     title: "Export" },
];

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1 py-0.5 rounded bg-surface-base border border-surface-border text-xs font-mono text-accent">
      {children}
    </code>
  );
}

function Example({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded border border-surface-border bg-surface-base p-3 text-xs text-text-secondary space-y-1">
      <p className="text-text-muted uppercase tracking-wide text-[10px] font-semibold mb-2">{label}</p>
      {children}
    </div>
  );
}

function Step({ icon, text }: { icon: string; text: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 items-start">
      <span className="mt-0.5 text-base leading-none">{icon}</span>
      <span className="text-sm text-text-secondary leading-snug">{text}</span>
    </div>
  );
}

function SectionHeader({ id, step, title }: Section) {
  return (
    <div id={id} className="flex items-center gap-2.5 mb-3 scroll-mt-4">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold shrink-0">
        {step}
      </span>
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
    </div>
  );
}

function Divider() {
  return <hr className="border-surface-border my-6" />;
}

function HelpContent() {
  return (
    <div className="space-y-0 text-sm">

      {/* Overview */}
      <div id="overview" className="scroll-mt-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">What is Ontology Studio?</h3>
        <p className="text-text-secondary leading-relaxed">
          Ontology Studio is an iterative, document-driven ontology editor. You feed it batches of
          documents and it extracts entities (NodeTypes) and relations (RelTypes) using an LLM.
          Between rounds you can review, edit, and lock what you want to keep — then add more
          documents and refine without losing your work.
        </p>
        <Example label="Typical workflow">
          <Step icon="📄" text="Upload a set of related documents → Extract" />
          <Step icon="🔍" text="Review the graph, fix labels and definitions" />
          <Step icon="🔒" text="Lock the entities you're happy with" />
          <Step icon="📄" text="Upload more documents → Refine" />
          <Step icon="↩" text="Undo mistakes, export when done" />
        </Example>
      </div>

      <Divider />

      {/* Step 1 */}
      <SectionHeader {...SECTIONS[1]!} />
      <p className="text-text-secondary leading-relaxed">
        A <strong className="text-text-primary">session</strong> is created automatically when the
        page loads. It holds your ontology and document history in memory. The LLM provider is
        configured via environment variables in <Code>.env.local</Code>.
      </p>
      <ul className="mt-3 space-y-1.5 text-text-secondary">
        <li className="flex gap-2">
          <Code>mock</Code>
          <span>Deterministic fake extraction — no LLM needed, great for testing the UI.</span>
        </li>
        <li className="flex gap-2">
          <Code>azure</Code>
          <span>Azure OpenAI — set <Code>AZURE_OPENAI_*</Code> variables.</span>
        </li>
        <li className="flex gap-2">
          <Code>lmstudio</Code>
          <span>Local LM Studio server on <Code>localhost:1234</Code>.</span>
        </li>
      </ul>
      <Example label="Reset">
        <Step icon="🔄" text={<>Click <strong>Reset session</strong> in the sidebar to start over. All extracted data and edits are cleared.</>} />
      </Example>

      <Divider />

      {/* Step 2 */}
      <SectionHeader {...SECTIONS[2]!} />
      <p className="text-text-secondary leading-relaxed">
        Drag files onto the upload area or click to browse. Supported formats:{" "}
        <Code>.txt</Code>, <Code>.md</Code>, <Code>.pdf</Code>. Up to 20 files per batch,
        2 MB per file.
      </p>
      <p className="mt-2 text-text-secondary leading-relaxed">
        Click <strong className="text-text-primary">Extract</strong> to start the first batch. The
        sidebar shows a progress bar with the current phase (chunking → extraction → canonicalization).
      </p>
      <Example label="Example: first batch">
        <Step icon="1." text="Drop architecture.md and api-spec.txt onto the upload area." />
        <Step icon="2." text={<>Click <strong>Extract</strong>. Wait for the progress to complete.</>} />
        <Step icon="3." text="The graph appears with extracted NodeTypes and RelTypes." />
      </Example>
      <Example label="Extraction settings (advanced)">
        <Step icon="⚙️" text={<><strong>Accuracy</strong>: low = faster/cheaper, high = more thorough. Default: low.</>} />
        <Step icon="⚙️" text={<><strong>Support threshold</strong>: minimum number of document chunks that must mention a type for it to appear. Default: 1.</>} />
        <Step icon="⚙️" text={<><strong>Chunk size / overlap</strong>: controls how documents are split before feeding the LLM.</>} />
      </Example>

      <Divider />

      {/* Step 3 */}
      <SectionHeader {...SECTIONS[3]!} />
      <p className="text-text-secondary leading-relaxed">
        Three views are available via the tab bar:
      </p>
      <ul className="mt-2 space-y-2 text-text-secondary">
        <li>
          <strong className="text-text-primary">Graph</strong> — Interactive Cytoscape graph.
          Rectangles are EntityTypes, diamonds are RelTypes. Dashed arrows indicate inheritance
          (is-a). Use the layout selector to rearrange.
        </li>
        <li>
          <strong className="text-text-primary">Table</strong> — Sortable list of all types. Good
          for a quick overview and bulk selection.
        </li>
        <li>
          <strong className="text-text-primary">JSON</strong> — Raw ontology JSON. What you'll
          download when you export.
        </li>
      </ul>
      <Example label="Graph interaction">
        <Step icon="👆" text="Click a node → opens the Detail Panel on the right." />
        <Step icon="🖱️" text="Right-click a node → context menu with Edit / Delete / Restore." />
        <Step icon="🔍" text="Scroll to zoom, drag to pan. Use the Fit button to reset the view." />
      </Example>

      <Divider />

      {/* Step 4 */}
      <SectionHeader {...SECTIONS[4]!} />
      <p className="text-text-secondary leading-relaxed">
        Click any node or row to open its <strong className="text-text-primary">Detail Panel</strong>.
        All fields are inline-editable: click a value to edit, press{" "}
        <Code>Enter</Code> or blur to save, <Code>Esc</Code> to cancel.
      </p>
      <ul className="mt-2 space-y-1.5 text-text-secondary">
        <li><strong className="text-text-primary">Label</strong> — human-readable name shown in the graph.</li>
        <li><strong className="text-text-primary">Definition</strong> — description of the concept.</li>
        <li><strong className="text-text-primary">Category</strong> — free-form grouping tag.</li>
        <li><strong className="text-text-primary">Domain / Range</strong> — for RelTypes, the source and target EntityTypes.</li>
        <li><strong className="text-text-primary">Attributes</strong> — typed properties of the entity (see below).</li>
      </ul>
      <p className="mt-3 text-text-secondary leading-relaxed">
        Use <strong className="text-text-primary">+ Entity</strong> and{" "}
        <strong className="text-text-primary">+ Relation</strong> in the toolbar to add types
        manually.
      </p>
      <Example label="Example: fix a label">
        <Step icon="1." text='Click the "Svc" node in the graph.' />
        <Step icon="2." text='In the Detail Panel, click the Label field → type "Service" → Enter.' />
        <Step icon="3." text="The graph updates immediately. Use Ctrl+Z to undo." />
      </Example>
      <Example label="Example: add an attribute">
        <Step icon="1." text='Select any EntityType, scroll to Attributes in the Detail Panel.' />
        <Step icon="2." text='Click "+ Add", type name "status", choose type STRING, click Save.' />
        <Step icon="3." text="The attribute appears in the list with an unlock indicator (○)." />
      </Example>

      <Divider />

      {/* Step 5 */}
      <SectionHeader {...SECTIONS[5]!} />
      <p className="text-text-secondary leading-relaxed">
        By default, every Refine run can update or even drop types and attributes. Locking
        protects what matters to you.
      </p>

      <p className="mt-3 text-text-primary font-medium text-xs uppercase tracking-wide">Lock a whole type</p>
      <p className="mt-1 text-text-secondary leading-relaxed">
        In the Detail Panel footer, click <strong className="text-text-primary">○ Lock</strong>.
        The button turns amber (<strong className="text-amber-400">🔒 Locked</strong>) and the
        header shows the lock badge. A locked type:
      </p>
      <ul className="mt-2 space-y-1.5 text-text-secondary list-disc list-inside">
        <li>Retains all its current field values after Refine, even if the LLM would change them.</li>
        <li>Reappears even if Refine drops it below the support threshold.</li>
        <li>Can still be edited manually in the Detail Panel.</li>
      </ul>

      <p className="mt-3 text-text-primary font-medium text-xs uppercase tracking-wide">Lock an attribute</p>
      <p className="mt-1 text-text-secondary leading-relaxed">
        In the Attributes list, click <strong className="text-text-primary">○</strong> next to an
        attribute to lock it (<strong className="text-amber-400">🔒</strong>). A locked attribute:
      </p>
      <ul className="mt-2 space-y-1.5 text-text-secondary list-disc list-inside">
        <li>Keeps its definition (name, type, description) even if Refine would overwrite it.</li>
        <li>Survives if Refine removes the attribute entirely from the extracted type.</li>
        <li>Unlocked attributes revert to the extraction value on the next Refine.</li>
      </ul>

      <Example label="Example: protect a curated entity">
        <Step icon="1." text='Select "Service" and edit its Definition to a precise, domain-specific text.' />
        <Step icon="2." text='Click "○ Lock" in the footer. The button turns amber.' />
        <Step icon="3." text="Load more documents and Refine. The Definition stays unchanged." />
      </Example>
      <Example label="Example: lock the primary key attribute">
        <Step icon="1." text='In Attributes, click "+ Add" → name "id", type STRING.' />
        <Step icon="2." text='Click ○ next to "id" to lock it (turns 🔒).' />
        <Step icon="3." text="Subsequent refinements will always keep the id attribute." />
      </Example>

      <Divider />

      {/* Step 6 */}
      <SectionHeader {...SECTIONS[6]!} />
      <p className="text-text-secondary leading-relaxed">
        After the first Extract you can load additional documents and click{" "}
        <strong className="text-text-primary">Refine</strong>. The library:
      </p>
      <ul className="mt-2 space-y-1.5 text-text-secondary list-disc list-inside">
        <li>Skips documents already processed (deduplication by file name/hash).</li>
        <li>Merges new candidates with the existing ontology via embedding similarity.</li>
        <li>Applies your locks before updating the display.</li>
      </ul>
      <p className="mt-3 text-text-secondary leading-relaxed">
        You can Refine as many times as you want. The{" "}
        <strong className="text-text-primary">Documents</strong> counter in the sidebar shows
        how many files have been processed.
      </p>
      <Example label="Example: iterative domain build-up">
        <Step icon="Round 1" text="Upload 3 architecture docs → Extract. Review, fix labels, lock core entities." />
        <Step icon="Round 2" text="Upload 5 API specs → Refine. New RelTypes appear; locked EntityTypes unchanged." />
        <Step icon="Round 3" text="Upload deployment runbooks → Refine. Infrastructure concepts merged in." />
      </Example>

      <Divider />

      {/* Step 7 */}
      <SectionHeader {...SECTIONS[7]!} />
      <p className="text-text-secondary leading-relaxed">
        Click <strong className="text-text-primary">↓ Export JSON</strong> in the toolbar.
        The file <Code>ontology.json</Code> is downloaded — it contains the full merged ontology
        (extracted + your edits + locked overrides) in the standard{" "}
        <Code>Ontology</Code> format used by the <Code>ontology-extractor</Code> library.
      </p>
      <p className="mt-2 text-text-secondary leading-relaxed">
        The JSON is directly loadable by any application that consumes the library's output — the
        same format produced by the CLI and the batch report tool.
      </p>
      <Example label="JSON structure">
        <pre className="font-mono text-[11px] text-text-secondary leading-relaxed overflow-x-auto">{`{
  "types": [
    {
      "id": "nt_service",
      "label": "Service",
      "kind": "NodeType",
      "definition": "A deployable microservice unit.",
      "attributes": ["id", "status"],
      "attributeDefinitions": [
        { "name": "id",     "type": "STRING" },
        { "name": "status", "type": "STRING" }
      ],
      "aliases": ["Svc", "Microservice"],
      "supportCount": 7,
      "provenance": [...]
    },
    {
      "id": "rt_depends_on",
      "label": "depends on",
      "kind": "RelType",
      "domain": "nt_service",
      "range":  "nt_service",
      "supportCount": 3,
      "provenance": [...]
    }
  ],
  "generatedAt": 1753200000000,
  "stats": { "typeCount": 12, ... }
}`}</pre>
      </Example>
    </div>
  );
}

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
}

export function HelpPanel({ open, onClose }: HelpPanelProps) {
  const [activeSection, setActiveSection] = useState<string>("overview");
  const contentRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Track which section is in view
  useEffect(() => {
    if (!open) return;
    const container = contentRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      { root: container, threshold: 0.5 },
    );

    for (const s of SECTIONS) {
      const el = container.querySelector(`#${s.id}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [open]);

  function scrollTo(id: string) {
    const el = contentRef.current?.querySelector(`#${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[580px] max-w-[95vw] flex flex-col bg-surface-elevated border-l border-surface-border shadow-2xl transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border shrink-0">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Help & Guide</h2>
            <p className="text-xs text-text-muted mt-0.5">How to use Ontology Studio</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors text-lg leading-none p-1"
            aria-label="Close help"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Table of contents */}
          <nav className="w-44 shrink-0 border-r border-surface-border py-4 overflow-y-auto">
            <ul className="space-y-0.5 px-2">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => scrollTo(s.id)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${
                      activeSection === s.id
                        ? "bg-accent/15 text-accent font-medium"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-overlay"
                    }`}
                  >
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 ${
                      activeSection === s.id ? "bg-accent text-surface-base" : "bg-surface-overlay text-text-muted"
                    }`}>
                      {s.step}
                    </span>
                    <span className="leading-snug">{s.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content */}
          <div ref={contentRef} className="flex-1 overflow-y-auto p-6">
            <HelpContent />
            <div className="h-12" />
          </div>
        </div>
      </div>
    </>
  );
}
