---
title: Configurazione
---

# Configurazione

La configurazione pubblica e `OntologyExtractorConfig`; `resolveConfig` la trasforma in `ResolvedOntologyExtractorConfig` applicando default e validazioni.

## Default

| Campo | Default | Significato |
| --- | --- | --- |
| `store` | `new InMemoryCandidateStore()` | Persistenza candidati volatile. |
| `chunking.strategy` | `"recursive"` | Separatori generici per testo naturale. |
| `chunking.chunkSize` | `4000` | Lunghezza massima chunk. |
| `chunking.chunkOverlap` | `800` | Caratteri di contesto ripetuti fra chunk. |
| `extraction.concurrency` | `8` | Numero massimo di chunk estratti in parallelo. |
| `extraction.accuracy` | `"medium"` | Trade-off recall/precision in estrazione. |
| `extraction.requireExamples` | `true` | Richiede esempi di grounding per ogni candidato. |
| `canonicalization.topK` | `5` | Numero di vicini passati al giudizio ambiguo. |
| `canonicalization.autoNewThreshold` | `0.6` | Sotto questa similarita nasce un nuovo tipo. |
| `canonicalization.autoMatchThreshold` | `0.92` | Sopra questa similarita avviene match automatico. |
| `canonicalization.useLlmForAmbiguous` | `true` | Usa LLM fra le due soglie. |
| `output.supportCountThreshold` | `2` | Supporto minimo per emettere un tipo. |

## `llm`

Obbligatorio. Implementa `LlmAdapter`. Deve rispettare lo schema passato dalla libreria e restituire dati gia parseati come oggetti JavaScript.

## `embeddings`

Obbligatorio. Implementa `EmbeddingAdapter`. `dimensions` deve essere un intero positivo. Ogni vettore restituito deve avere la stessa dimensione, contenere numeri finiti e non essere un vettore zero.

## `store`

Opzionale. Implementa `CandidateStore`. Se omesso, viene usato `InMemoryCandidateStore`.

## `chunking`

### `strategy`

Valori: `"recursive" | "markdown" | "html"`.

Sceglie la lista di separatori preferiti. Non cambia il formato dei documenti: indica solo quali boundary cercare quando si taglia il testo.

### `chunkSize`

Intero positivo. Determina la lunghezza massima del chunk prima del trim. Deve essere maggiore di `chunkOverlap`.

### `chunkOverlap`

Intero non negativo. Determina quanto testo precedente viene ripreso nel chunk successivo. Aiuta l'LLM a non perdere relazioni che attraversano boundary.

## `extraction`

### `concurrency`

Intero positivo. Limita il numero di chiamate LLM di estrazione contemporanee. Un valore piu alto aumenta throughput ma anche carico su provider, memoria e rate limit.

### `accuracy`

Valori: `"low" | "medium" | "high"`.

- `low`: recall ampio, fino a 12 candidati per chunk.
- `medium`: filtro bilanciato, fino a 7 candidati per chunk.
- `high`: filtro stretto, fino a 4 candidati per chunk.

Questa opzione influenza il prompt e lo schema di estrazione. Agisce prima di deduplica e canonicalizzazione.

### `requireExamples`

Booleano. Se `true`, lo schema richiede `examples` con almeno un valore. Gli esempi aiutano a fare review e grounding, ma aumentano il volume della risposta.

### `systemPrompt`

Stringa opzionale. Sostituisce completamente il system prompt di estrazione predefinito.

### `prompt`

Stringa o funzione `(chunk: DocumentChunk) => string`. Sostituisce il prompt utente di estrazione. Se omessa, il prompt e `JSON.stringify({ text: chunk.text })`.

## `canonicalization`

### `topK`

Intero positivo. Numero massimo di vicini canonici dello stesso `kind` valutati per ogni candidato ambiguo.

### `autoNewThreshold`

Numero fra 0 e 1. Se il miglior vicino e sotto questa soglia, il candidato diventa automaticamente nuovo tipo.

### `autoMatchThreshold`

Numero fra 0 e 1. Se il miglior vicino e sopra o uguale a questa soglia, il candidato viene fuso automaticamente nel tipo esistente.

Deve essere maggiore di `autoNewThreshold`.

### `useLlmForAmbiguous`

Booleano. Se `true`, i casi tra le due soglie vengono mandati all'LLM per un verdetto. Se `false`, i casi ambigui diventano nuovi tipi.

### `systemPrompt`

Stringa opzionale. Sostituisce il system prompt di canonicalizzazione.

### `prompt`

Stringa o funzione `(input: CanonicalizationPromptInput) => string`. Riceve il candidato e i vicini top-K con score.

## `output`

### `supportCountThreshold`

Intero positivo. Filtra i tipi canonici prima dell'emissione. Il supporto e il numero di provenienze uniche, non il numero di documenti in senso stretto.

## Validazioni

`resolveConfig` solleva `ConfigurationError` quando:

- `chunkSize`, `concurrency`, `topK`, `supportCountThreshold` o `embeddings.dimensions` non sono interi positivi;
- `chunkOverlap` e negativo o maggiore/uguale a `chunkSize`;
- le soglie non sono numeri finiti fra 0 e 1;
- `autoNewThreshold >= autoMatchThreshold`;
- `accuracy` non e uno dei preset supportati.