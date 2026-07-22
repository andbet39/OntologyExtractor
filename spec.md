# SPEC — `ontology-extractor`

**Libreria TypeScript per l'estrazione di ontologia (TBox) da un corpus documentale tramite LLM.**

Versione spec: `0.2.0` (MVP)
Stato: contratto MVP congelato per l'implementazione iniziale.

Le parole chiave MUST, MUST NOT, SHOULD, SHOULD NOT, MAY sono usate secondo RFC 2119.

---

## 1. Scopo

La libreria estrae la **TBox** (schema di un knowledge graph: tipi di nodo, tipi di relazione, gerarchia is-a, attributi) da un insieme di documenti testuali, usando un LLM per l'estrazione strutturata e un modello di embedding per la canonicalizzazione.

La libreria **NON** estrae l'ABox (istanze). La libreria **NON** gestisce versioning, review o pubblicazione: produce un artefatto ontologico che consumatori esterni trattano come preferiscono.

### 1.1 Non-goal (espliciti)

- MUST NOT gestire persistenza versionata dell'ontologia.
- MUST NOT implementare workflow di review/HITL: espone solo dati, la decisione è esterna.
- MUST NOT assumere uno schema seed. Il cold start parte da registry vuoto; il seed è supportato come caso degenere (vedi §7.3) ma non richiesto.
- MUST NOT accoppiarsi a un provider LLM specifico: l'LLM è iniettato (§4.2).

---

## 2. Principi di design (invarianti)

Questi principi vincolano l'implementazione e NON devono essere violati per convenienza.

1. **Separazione candidati / ontologia.** Lo strato dei *candidati grezzi* (output dell'estrazione per-chunk) è la fonte di verità persistita. L'*ontologia consolidata* è una **proiezione pura** e rigenerabile dei candidati. Un consolidamento fallito o mediocre non distrugge informazione: se ne rifà un altro.

2. **Map parallelo, reduce seriale.** L'estrazione per-chunk è stateless e MUST essere parallelizzabile con concorrenza limitata. La canonicalizzazione MUST essere seriale (single-writer sul registry) per costruzione, così da eliminare le race condition sui tipi duplicati senza locking.

3. **Gate di similarità prima dell'LLM.** La canonicalizzazione MUST filtrare i candidati per similarità di embedding prima di invocare l'LLM: auto-MATCH sopra soglia alta, auto-NEW sotto soglia bassa, giudizio LLM solo nella fascia ambigua.

4. **`support_count` cumulativo.** Il supporto di un tipo MUST accumularsi tra run successivi (rifinitura), non ripartire da zero, così che i tipi legittimi ma poco frequenti emergano nel tempo.

5. **Non bloccante.** I metodi di estrazione MUST ritornare immediatamente un handle di job; il lavoro procede in background. Il progresso MUST essere osservabile senza bloccare.

6. **Chunk effimeri.** I chunk esistono solo come finestra di estrazione, non vengono indicizzati. L'implementazione SHOULD preferire overlap generoso e chunk grandi per non spezzare le relazioni, poiché il costo di duplicazione tipico del RAG qui non si applica.

---

## 3. Architettura

```
                     ┌─────────────────────────────────────────────┐
  InputDocument[] ──▶│  chunk            (recursive + overlap alto)  │
                     └───────────────────────┬─────────────────────┘
                                             │ chunk[]  (effimeri)
                     ┌───────────────────────▼─────────────────────┐
                     │  extract   ● PARALLELO (concurrency cap)      │
                     │            LLM structured output per chunk    │
                     └───────────────────────┬─────────────────────┘
                                             │ RawCandidate[]
                     ┌───────────────────────▼─────────────────────┐
                     │  dedup pre-canonicalizzazione                 │
                     │  (collassa label identiche, somma support)    │
                     └───────────────────────┬─────────────────────┘
                                             │ Candidate[]
        ┌────── persist ──────▶  CandidateStore  ◀────── read ───────┐
        │                                                             │
        │            ┌───────────────────────▼─────────────────────┐ │
        │            │  canonicalize  ● SERIALE (single-writer)      │ │
        │            │  similarity gate → [LLM verdict] → registry   │ │
        │            └───────────────────────┬─────────────────────┘ │
        │                                    │ CanonicalType[]        │
        │            ┌───────────────────────▼─────────────────────┐ │
        └───────────▶│  consolidate (globale, a registry pieno)      │◀┘
                     │  merge quasi-duplicati, is-a, domain/range     │
                     └───────────────────────┬─────────────────────┘
                                             │
                     ┌───────────────────────▼─────────────────────┐
                     │  emit   (filtro support_count → Ontology JSON)│
                     └───────────────────────────────────────────────┘
```

**Cold start** esegue l'intera pipeline. **Refinement** (`refine`) esegue `chunk`+`extract` **solo** sui nuovi documenti, appende alla `CandidateStore`, poi riesegue `consolidate`+`emit` sull'intero insieme dei candidati (vecchi da cache + nuovi). Questo rende il risultato tendenzialmente **indipendente dall'ordine** di caricamento dei documenti.

---

## 4. API pubblica

### 4.1 Classe principale e ciclo di vita

```typescript
class OntologyExtractor {
  constructor(config: OntologyExtractorConfig);

  /** Cold start su store vuoto. Non bloccante: ritorna subito un handle. */
  extract(documents: InputDocument[]): ExtractionJob;

  /** Aggiunge documenti alla cache e riconsolida su tutto. Non bloccante. */
  refine(documents: InputDocument[]): ExtractionJob;

  /** Riconsolida senza estrarre nuovi documenti (es. dopo tuning soglie). Non bloccante. */
  consolidate(): ExtractionJob;

  /** Proiezione corrente dell'ontologia (ultimo consolidamento riuscito). */
  getOntology(): Promise<Ontology>;

  /** Ispezione dello strato candidati (debug/provenance). */
  getCandidates(): Promise<StoredCandidate[]>;
}
```

- `extract` e `refine` MUST essere non bloccanti e MUST ritornare un `ExtractionJob` prima che il lavoro sia completato.
- `extract` MUST essere usato per il cold start e MUST rifiutare uno store che contiene gia documenti. `refine` MUST saltare gli id gia presenti e riconsolidare l'intero store.
- Se un job è già in corso, una seconda chiamata a `extract`/`refine`/`consolidate` SHOULD essere rifiutata con errore (`ConcurrentJobError`) oppure accodata; l'implementazione MUST documentare quale delle due. La modalità di default MUST essere il rifiuto (una sola pipeline attiva alla volta, dato il vincolo di reduce seriale).

### 4.2 Ports iniettabili (dipendenze)

Tutte le dipendenze esterne sono iniettate. La libreria MUST NOT importare direttamente SDK di provider.

```typescript
/** Adapter LLM, provider-agnostico. La libreria possiede i prompt e passa lo schema. */
interface LlmAdapter {
  /**
   * Genera output strutturato conforme a `schema`.
   * L'implementazione MUST ritornare JSON già parsato e validato contro lo schema,
   * oppure sollevare un errore. La libreria NON esegue retry di parsing: è compito
   * dell'adapter (structured output nativo, tool-calling, o retry con reminder).
   */
  generateStructured<T>(req: {
    system?: string;
    prompt: string;
    schema: JsonSchema;
    signal?: AbortSignal;
  }): Promise<T>;
}

/** Adapter di embedding per il gate di similarità. */
interface EmbeddingAdapter {
  /** Ritorna un vettore per ciascun testo, nello stesso ordine. */
  embed(texts: string[], signal?: AbortSignal): Promise<number[][]>;
  /** Dimensione dei vettori (per validazione). */
  readonly dimensions: number;
}

/** Persistenza dei candidati. Default: implementazione in-memory. */
interface CandidateStore {
  hasDocument(docId: string): Promise<boolean>;
  appendCandidates(docId: string, candidates: ExtractedCandidate[]): Promise<void>;
  getDocumentIds(): Promise<string[]>;
  getAllCandidates(): Promise<StoredCandidate[]>;
  removeDocument(docId: string): Promise<void>;
  clear(): Promise<void>;
}
```

- `appendCandidates` MUST registrare `docId` anche quando `candidates` e vuoto, cosi un documento senza candidati non viene estratto nuovamente durante `refine`.
- L'append di un documento e dei relativi candidati MUST essere atomico dal punto di vista dello store.
- `getDocumentIds` MUST includere anche i documenti senza candidati ed e la fonte per `Ontology.stats.documentCount`.

Note di design:

- L'adapter LLM è **sottile** di proposito: espone una sola operazione generica (`generateStructured`). L'estrazione e il giudizio di canonicalizzazione sono entrambi realizzati dalla libreria componendo prompt + schema differenti su questa stessa primitiva. Questo massimizza la sostituibilità del modello ("l'LLM è un parametro").
- Un `LangChainLlmAdapter` che avvolge un `BaseChatModel` di LangChain.js SHOULD essere fornito come implementazione di riferimento, ma MUST risiedere in un entrypoint separato per non forzare la dipendenza da LangChain su chi non la usa.
- `CandidateStore` è il punto di estensione per la persistenza (es. Postgres). L'implementazione in-memory di default MUST essere sufficiente per l'uso senza persistenza.

### 4.3 Configurazione

```typescript
interface OntologyExtractorConfig {
  llm: LlmAdapter;               // obbligatorio
  embeddings: EmbeddingAdapter;  // obbligatorio
  store?: CandidateStore;        // default: InMemoryCandidateStore

  chunking?: {
    strategy?: 'recursive' | 'markdown' | 'html'; // default: 'recursive'
    chunkSize?: number;          // default: grande (es. 4000 char) — chunk effimeri
    chunkOverlap?: number;       // default: ~20% di chunkSize
  };

  extraction?: {
    concurrency?: number;        // default: 8 — cap sui worker paralleli
    systemPrompt?: string;       // override del prompt di estrazione
    /** Trade-off recall/precisione per chunk. Default: 'medium'. */
    accuracy?: 'low' | 'medium' | 'high';
    /** Se true, richiede 1-2 istanze di esempio per grounding. Default: true. */
    requireExamples?: boolean;
  };

  canonicalization?: {
    topK?: number;               // vicini recuperati dal registry. Default: 5
    autoMatchThreshold?: number; // coseno ≥ ⇒ MATCH senza LLM. Default: 0.92
    autoNewThreshold?: number;   // coseno < ⇒ NEW senza LLM.  Default: 0.60
    /** Se true, la fascia ambigua [autoNew, autoMatch) va all'LLM. Default: true. */
    useLlmForAmbiguous?: boolean;
  };

  output?: {
    /** Tipi con support_count < soglia esclusi dall'ontologia emessa. Default: 2. */
    supportCountThreshold?: number;
  };
}
```

Le due soglie di similarità, `extraction.accuracy` e la soglia di `supportCountThreshold` MUST essere configurabili perché determinano il trade-off costo/qualità e vanno tarate empiricamente sul corpus, non a priori. `extraction.accuracy` limita la produzione iniziale di candidati per chunk; `supportCountThreshold` filtra solo i tipi emessi nell'ontologia finale.

### 4.4 Job handle e progress

```typescript
interface ExtractionJob {
  readonly id: string;

  /** Snapshot corrente del progresso. Getter NON bloccante e sincrono. */
  readonly progress: Progress;

  /** Sottoscrizione a eventi. Ritorna `this` per chaining. */
  on(event: 'progress', cb: (p: Progress) => void): this;
  on(event: 'phase',    cb: (phase: Phase) => void): this;
  on(event: 'error',    cb: (err: Error) => void): this;
  on(event: 'done',     cb: (ontology: Ontology) => void): this;
  off(event: string, cb: (...args: unknown[]) => void): this;

  /** Promise risolta col risultato finale, o rigettata su errore/cancellazione. */
  completed(): Promise<Ontology>;

  /** Richiede la cancellazione cooperativa. Non garantisce interruzione immediata. */
  cancel(): Promise<void>;
}
```

Il progresso è esposto in **due modalità complementari**, entrambe MUST essere disponibili:

1. **Pull** — `job.progress` è un getter sincrono non bloccante che ritorna lo snapshot corrente. Adatto a polling da UI.
2. **Push** — evento `'progress'` emesso a ogni avanzamento significativo. Adatto a stream reattivi.

```typescript
type Phase =
  | 'idle' | 'chunking' | 'extracting'
  | 'canonicalizing' | 'consolidating' | 'emitting'
  | 'done' | 'error' | 'cancelled';

interface Progress {
  phase: Phase;
  documents:  { total: number; processed: number };
  chunks:     { total: number; processed: number };
  candidates: { raw: number; deduped: number };
  canonicalTypes: number;
  /** Contatori di chiamate LLM, utili per il tracking dei costi. */
  llmCalls: { extraction: number; canonicalization: number };
  startedAt: number;   // epoch ms
  updatedAt: number;   // epoch ms
  error?: { message: string; phase: Phase };
}
```

- `chunks.total` MAY essere `0` finché la fase `chunking` non è completata (non sempre noto in anticipo).
- Il getter `progress` MUST riflettere sempre l'ultimo stato coerente, anche mentre il job è in corso.

---

## 5. Modello dati

### 5.1 Input

```typescript
interface InputDocument {
  id: string;            // identificatore stabile: usato per dedup e provenance
  text: string;
  metadata?: Record<string, unknown>;
}
```

- `id` MUST essere stabile per documento: `refine` USA `id` per saltare documenti già estratti (via `CandidateStore.hasDocument`). Ripresentare lo stesso `id` MUST NOT ri-estrarre a meno di rimozione esplicita.

### 5.2 Candidato (strato di verità persistito)

```typescript
type TypeKind = 'NodeType' | 'RelType';

interface Candidate {
  label: string;
  definition: string;            // 1 frase — chiave per il match, non solo la label
  kind: TypeKind;
  domain?: string;               // solo RelType: label del tipo sorgente
  range?: string;                // solo RelType: label del tipo destinazione
  attributes?: string[];
  examples?: string[];           // 1-2 istanze per grounding
}

interface ExtractedCandidate extends Candidate {
  documentId: string;
  chunkIndex: number;            // posizione nel documento — provenance
}

interface StoredCandidate extends ExtractedCandidate {
  supportCount: number;          // # provenance distinte che supportano il candidato
}
```

L'LLM MUST NOT assegnare `supportCount`. Ogni candidato distinto prodotto da un chunk vale un supporto. Dedup e store MUST calcolare il supporto contando coppie `documentId` + `chunkIndex` distinte, cosi retry o duplicati nello stesso chunk non gonfiano il conteggio.

### 5.3 Tipo canonico e ontologia (proiezione)

```typescript
interface Provenance {
  documentId: string;
  chunkIndex: number;
}

interface CanonicalType {
  id: string;                    // stabile entro una sessione di consolidamento
  label: string;
  definition: string;
  kind: TypeKind;
  domain?: string;               // riferimento a CanonicalType.id (RelType)
  range?: string;                // riferimento a CanonicalType.id (RelType)
  parent?: string;               // is-a: riferimento a CanonicalType.id
  attributes: string[];
  aliases: string[];             // label collassate in fase di merge
  supportCount: number;          // cumulativo
  provenance: Provenance[];
}

interface Ontology {
  types: CanonicalType[];
  generatedAt: number;
  stats: {
    documentCount: number;
    candidateCount: number;
    typeCount: number;
    droppedBelowThreshold: number;
  };
}
```

Nota: gli `id` dei `CanonicalType` sono stabili **entro** una proiezione ma MAY cambiare tra consolidamenti diversi, poiché l'ontologia è draft e liberamente modificabile. La stabilità cross-run degli id NON è un requisito di questa versione.

---

## 6. Comportamento delle fasi (normativo)

### 6.1 `chunk`
- MUST usare uno splitter conforme a `chunking.strategy`.
- SHOULD preferire chunk grandi e overlap generoso (i chunk sono effimeri).
- Ogni chunk MUST mantenere `documentId` e `chunkIndex` per la provenance.

### 6.2 `extract`
- MUST processare i chunk in parallelo con al più `extraction.concurrency` chiamate LLM in volo (semaforo / pool).
- Per ogni chunk MUST invocare `llm.generateStructured` con lo schema dei candidati.
- MUST essere stateless: nessuna scrittura su stato condiviso in questa fase.
- Un fallimento su un singolo chunk SHOULD essere isolato (il chunk fallito viene loggato e saltato) e MUST NOT abortire l'intero job, salvo che l'errore sia dell'adapter LLM in modo persistente (vedi §8).
- I candidati di un nuovo batch MUST essere persistiti solo dopo il completamento della fase di estrazione del batch. Una cancellazione durante l'estrazione MUST NOT lasciare documenti parzialmente registrati.

### 6.3 dedup pre-canonicalizzazione
- MUST collassare i candidati con `label`+`kind` normalizzati identici, contando provenance distinte e unendo attributi ed esempi, **prima** di entrare nella fase seriale.

### 6.4 `canonicalize` (seriale)
- MUST processare i candidati uno alla volta con un solo writer sul registry.
- Per ogni candidato:
  1. calcola embedding di `label + " — " + definition`;
  2. recupera i `topK` tipi canonici più simili dal registry;
  3. se il miglior coseno ≥ `autoMatchThreshold` ⇒ **MATCH** (nessuna LLM): fonde nel canonico, aggiorna `supportCount`, `aliases`, `provenance`;
  4. se il miglior coseno < `autoNewThreshold` ⇒ **NEW** (nessuna LLM): crea nuovo canonico;
  5. altrimenti (fascia ambigua) e se `useLlmForAmbiguous`, invoca `llm.generateStructured` per un verdetto `MATCH | NEW | SUBTYPE`, passando il candidato e i vicini; applica il verdetto.
- Il verdetto `SUBTYPE` MUST creare un nuovo canonico con `parent` impostato al canonico indicato.

### 6.5 `consolidate` (globale)
- MUST girare a registry pieno.
- MUST ricostruire il registry dall'intero contenuto della `CandidateStore`; non deve riutilizzare contatori mutabili del consolidamento precedente.
- SHOULD eseguire all-pairs similarity sui canonici (cardinalità bassa) per individuare quasi-duplicati sfuggiti al gate incrementale, con eventuale giudizio LLM sui cluster ambigui.
- MUST risolvere `domain`/`range` e `parent` in riferimenti a `id` validi; riferimenti irrisolti MUST essere rimossi o segnalati, mai lasciati pendenti.
- MUST pubblicare il nuovo snapshot di `Ontology` solo al completamento riuscito. In caso di errore, `getOntology()` MUST continuare a restituire l'ultimo snapshot valido.

### 6.6 `emit`
- MUST escludere dall'`Ontology` i tipi con `supportCount < output.supportCountThreshold`.
- MUST NOT eliminare i candidati sottosoglia dalla `CandidateStore` (potrebbero superare la soglia in un refinement futuro grazie al supporto cumulativo).
- MUST escludere i `RelType` i cui `domain` o `range` non sono risolti oppure non sopravvivono al filtro di supporto.

---

## 7. Modello di concorrenza e casi limite

### 7.1 Async / cancellazione
- Ogni fase MUST propagare un `AbortSignal` agli adapter (`llm`, `embeddings`).
- `cancel()` MUST impostare lo stato a `cancelled` appena possibile; le chiamate in volo SHOULD essere abortite via signal.
- `completed()` MUST rigettare con `CancelledError` se il job è cancellato.

### 7.2 Un solo job attivo
- Dato il reduce seriale, l'implementazione MUST garantire che al più una pipeline scriva sul registry per istanza di `OntologyExtractor`. Chiamate concorrenti MUST essere rifiutate (`ConcurrentJobError`) di default.

### 7.3 Seed opzionale (caso degenere)
- La libreria MAY accettare un `Ontology` iniziale con cui pre-popolare il registry (equivalente a caricare candidati sintetici con provenance vuota). NON è un requisito di questa versione ma il modello dati non lo preclude.

---

## 8. Gestione errori

- MUST definire una gerarchia di errori tipizzati: `ConcurrentJobError`, `CancelledError`, `LlmAdapterError`, `EmbeddingAdapterError`, `SchemaValidationError`.
- Errori transitori dell'adapter (rate limit, timeout) SONO responsabilità dell'adapter (retry/backoff). La libreria MUST NOT implementare retry di rete propri.
- Un errore non recuperabile in `canonicalize`/`consolidate` MUST portare il job a `phase: 'error'` con `progress.error` popolato, e MUST rigettare `completed()`. Poiché i candidati sono persistiti, l'utente PUÒ rilanciare `consolidate()` senza ri-estrarre.

---

## 9. Esempio d'uso (illustrativo, non normativo)

```typescript
const extractor = new OntologyExtractor({
  llm: new LangChainLlmAdapter(chatModel),      // adapter di riferimento
  embeddings: new LangChainEmbeddingAdapter(embModel),
  chunking: { strategy: 'markdown', chunkSize: 4000, chunkOverlap: 800 },
  canonicalization: { autoMatchThreshold: 0.9, autoNewThreshold: 0.62 },
  output: { supportCountThreshold: 2 },
});

const job = extractor.extract(documents);        // ritorna subito, non blocca

job.on('progress', (p) => {
  render(`${p.phase} — doc ${p.documents.processed}/${p.documents.total}, `
       + `tipi: ${p.canonicalTypes}, LLM calls: ${p.llmCalls.extraction}`);
});

const ontology = await job.completed();          // JSON generico, pronto per conversione

// Più tardi: l'utente aggiunge documenti
const job2 = extractor.refine(moreDocuments);    // estrae solo i nuovi, riconsolida su tutto
await job2.completed();
```

---

## 10. Domande aperte (da chiudere in v0.2)

1. **Formato di output finale (risolto in v0.3).** `Ontology` resta la rappresentazione interna generica. La funzione pura `toOntologyImportModel` fornisce una proiezione interoperabile con entità, relazioni, categorie, variabili e metadati strutturati. Le sezioni di access control sono escluse perché esterne alla TBox.
2. **Cross-run id stability.** Non richiesta ora (ontologia draft). Se in futuro servisse, introdurre id deterministici derivati da label canonica normalizzata.
3. **Determinismo del consolidamento.** L'uso dell'LLM sui cluster ambigui rende `consolidate` non perfettamente riproducibile run-su-run. Accettabile in fase di design; da rivedere se servirà riproducibilità.
4. **Batching delle chiamate LLM in estrazione.** MAY raggruppare più chunk in una singola chiamata per ammortizzare l'overhead; da valutare rispetto alla qualità dell'output strutturato.