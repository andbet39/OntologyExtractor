---
title: Tipi dati
---

# Tipi dati

Questa pagina spiega i tipi pubblici piu importanti.

## `InputDocument`

Documento in ingresso.

| Campo | Tipo | Significato |
| --- | --- | --- |
| `id` | `string` | Identificatore stabile del documento. Non puo essere vuoto e deve essere unico nel batch. |
| `text` | `string` | Testo da processare. Non puo essere vuoto. |
| `metadata` | `Record<string, unknown>` | Metadati applicativi opzionali. Non sono usati dalla pipeline core. |

## `DocumentChunk`

Frammento generato da `splitDocuments`.

| Campo | Tipo | Significato |
| --- | --- | --- |
| `documentId` | `string` | Id del documento sorgente. |
| `chunkIndex` | `number` | Indice progressivo nel documento. |
| `text` | `string` | Testo del chunk trimato. |

## `Candidate`

Candidato TBox restituito dall'estrazione.

| Campo | Tipo | Significato |
| --- | --- | --- |
| `label` | `string` | Nome leggibile del concetto o relazione. |
| `definition` | `string` | Definizione concisa basata sul testo. |
| `kind` | `"NodeType" | "RelType"` | Categoria del tipo. |
| `domain` | `string` | Per `RelType`, label del nodo sorgente. |
| `range` | `string` | Per `RelType`, label del nodo destinazione. |
| `attributes` | `string[]` | Attributi legacy semplici. |
| `attributeDefinitions` | `AttributeDefinition[]` | Attributi tipizzati con metadati. |
| `category` | `string` | Categoria funzionale o di dominio. |
| `primaryKeyAttribute` | `string` | Attributo che identifica l'entita. Deve riferire un attributo dichiarato. |
| `labelAttribute` | `string` | Attributo da usare come label display. Deve riferire un attributo dichiarato. |
| `fromCardinality` | `"0" | "1" | "N"` | Cardinalita dal lato sorgente della relazione. |
| `toCardinality` | `"0" | "1" | "N"` | Cardinalita dal lato destinazione della relazione. |
| `visual` | `VisualDefinition` | Icona e colori opzionali. |
| `examples` | `string[]` | Esempi di grounding, massimo 2. |

Per `RelType`, `domain` e `range` sono obbligatori nella risposta validata.

## `AttributeDefinition`

| Campo | Tipo | Significato |
| --- | --- | --- |
| `name` | `string` | Nome tecnico. Obbligatorio e non vuoto. |
| `type` | `AttributeValueType` | Tipo dati: `STRING`, `NUMBER`, `FLOAT`, `BOOLEAN`, `DATE`, `DATETIME`. |
| `label` | `string` | Etichetta leggibile. |
| `description` | `string` | Descrizione dell'attributo. |
| `indexed` | `boolean` | Suggerisce indicizzazione nel modello importabile. |
| `required` | `boolean` | Suggerisce obbligatorieta. |
| `restricted` | `boolean` | Segnala attributo con accesso o uso ristretto. |

I nomi duplicati in `attributeDefinitions` vengono rifiutati durante la validazione della risposta LLM.

## `VisualDefinition`

| Campo | Tipo | Significato |
| --- | --- | --- |
| `icon` | `string` | Nome icona applicativo. |
| `backColor` | `string` | Colore esadecimale `#RRGGBB`. Viene normalizzato uppercase. |
| `textColor` | `string` | Colore esadecimale `#RRGGBB`. Viene normalizzato uppercase. |

## `ExtractedCandidate`, `StoredCandidate`, `AggregatedCandidate`

- `ExtractedCandidate`: aggiunge `documentId` e `chunkIndex` a `Candidate`.
- `StoredCandidate`: aggiunge `supportCount`; nello store in-memory un candidato appena salvato vale `1`.
- `AggregatedCandidate`: rappresenta candidati deduplicati e contiene `supportCount` piu `provenance[]`.

## `CanonicalType`

Tipo finale prima dell'emissione o dentro `Ontology.types`.

| Campo | Significato |
| --- | --- |
| `id` | Id deterministico locale alla proiezione, nel formato `type-0001`. |
| `label` | Etichetta principale. |
| `definition` | Definizione principale. |
| `kind` | `NodeType` o `RelType`. |
| `domain` / `range` | Nei risultati emessi per relazioni, diventano id dei nodi canonici. |
| `parent` | Id del tipo padre per verdetti `SUBTYPE`. |
| `attributes` | Attributi semplici ordinati. |
| `attributeDefinitions` | Attributi ricchi ordinati. |
| `aliases` | Sinonimi fusi durante canonicalizzazione. |
| `supportCount` | Numero di provenienze uniche. |
| `provenance` | Coppie `documentId` + `chunkIndex`. |

## `Ontology`

| Campo | Significato |
| --- | --- |
| `types` | Tipi canonici emessi. |
| `generatedAt` | Timestamp millisecondi. |
| `stats.documentCount` | Numero documenti nello store. |
| `stats.candidateCount` | Numero candidati stored pre-deduplica. |
| `stats.typeCount` | Numero tipi emessi. |
| `stats.droppedBelowThreshold` | Tipi canonici filtrati o relazioni non emesse. |