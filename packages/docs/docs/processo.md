---
sidebar_position: 2
title: Processo end-to-end
---

# Processo end-to-end

Questo capitolo descrive effettivamente il processo realizzato dalla libreria. Il punto importante e che l'ontologia pubblicata non viene costruita direttamente dalle risposte del modello: la sorgente di verita intermedia e il `CandidateStore`. Ogni esecuzione consolida lo store e pubblica un nuovo snapshot solo se tutte le fasi critiche completano con successo.

## Vista d'insieme

1. L'applicazione crea un `OntologyExtractor` con `llm`, `embeddings` e opzioni.
2. L'applicazione avvia `extract`, `refine` o `consolidate`.
3. La libreria valida e spezza i documenti in chunk stabili e sovrapposti.
4. Ogni chunk viene inviato all'LLM con uno schema JSON per ottenere candidati TBox.
5. I candidati estratti vengono persistiti per documento nel `CandidateStore`.
6. Tutti i candidati salvati vengono deduplicati per `kind` ed etichetta normalizzata.
7. Ogni candidato aggregato viene confrontato con i tipi canonici gia creati tramite embedding cosine similarity.
8. I casi evidenti vengono decisi automaticamente; quelli ambigui possono essere inviati all'LLM per un verdetto `MATCH`, `NEW` o `SUBTYPE`.
9. La fase di emissione filtra i tipi con poco supporto, risolve le relazioni verso nodi emessi e pubblica l'ontologia.

## Diagramma logico

```text
InputDocument[]
  -> splitDocuments
  -> DocumentChunk[]
  -> extractChunks + LlmAdapter.generateStructured
  -> ExtractedCandidate[]
  -> CandidateStore.appendCandidates
  -> CandidateStore.getAllCandidates
  -> deduplicateCandidates
  -> canonicalizeCandidates + EmbeddingAdapter.embed + eventuale LlmAdapter.generateStructured
  -> emitOntology
  -> Ontology
```

## Modalita di esecuzione

### `extract(documents)`

Avvia una estrazione a freddo. Prima di elaborare, la pipeline controlla lo store: se contiene gia documenti, solleva `StoreConflictError`. Questa scelta evita di confondere una prima estrazione con una raffinazione incrementale.

### `refine(documents)`

Elabora solo i documenti non ancora presenti nello store. I documenti con `id` gia processato vengono saltati, poi la libreria ricostruisce l'ontologia usando tutti i candidati presenti nello store, inclusi quelli precedenti.

### `consolidate()`

Non chiama l'LLM di estrazione e non aggiunge documenti. Rilegge lo store, deduplica, canonicalizza ed emette una nuova ontologia. Serve quando si vuole ricalcolare il risultato dopo aver cambiato configurazione o store, oppure dopo aver ripristinato candidati persistiti.

## Chunking

`splitDocuments` valida i documenti e crea chunk con `chunkSize` massimo e `chunkOverlap`. L'overlap conserva contesto fra frammenti vicini. La strategia sceglie separatori preferiti:

- `recursive`: paragrafi, righe, frasi e spazi.
- `markdown`: heading Markdown, paragrafi, righe, frasi e spazi.
- `html`: chiusure di sezioni/articoli/div/paragrafi, righe e spazi.

La funzione cerca un boundary utile nella seconda meta del chunk. Se non lo trova, taglia a `chunkSize`. Ogni chunk mantiene `documentId` e `chunkIndex`, che diventano la provenienza dei candidati.

## Estrazione candidati

Per ogni chunk, `extractChunks` invoca `llm.generateStructured` con:

- un `system` prompt predefinito o personalizzato;
- un `prompt` per il chunk;
- uno schema JSON che richiede un array `candidates`.

Un candidato rappresenta un tipo di ontologia, non una istanza. `NodeType` descrive concetti o entita; `RelType` descrive relazioni e deve includere `domain` e `range`.

La pipeline usa concorrenza limitata (`extraction.concurrency`). Se un singolo chunk fallisce, quel fallimento viene isolato e il chunk contribuisce zero candidati. Se falliscono tutti i chunk, viene sollevato `LlmAdapterError`.

## Persistenza dei candidati

La pipeline estrae l'intero batch prima di persistere i documenti. Poi chiama `appendCandidates` una volta per documento. Questo mantiene la granularita documentale: lo store sa quali documenti sono stati processati anche se non hanno prodotto candidati.

Lo store predefinito e `InMemoryCandidateStore`; in produzione si puo implementare `CandidateStore` per usare database o file, rispettando le stesse semantiche di append atomico per documento.

## Deduplica

`deduplicateCandidates` raggruppa i candidati con stessa coppia `kind` + `label` normalizzata. La normalizzazione trimma e collassa whitespace; il confronto e case-insensitive. Il risultato aggregato:

- unisce attributi, attributeDefinitions ed esempi in modo deterministico;
- completa metadati mancanti senza sovrascrivere quelli gia stabiliti;
- conta supporto per provenienze uniche `documentId + chunkIndex`;
- ordina i risultati per avere output stabile.

## Canonicalizzazione

La canonicalizzazione lavora serialmente, in ordine deterministico, per costruire un registry di tipi canonici.

Per ogni candidato aggregato:

1. viene creato un embedding del testo `${label} — ${definition}`;
2. vengono scelti i top-K vicini dello stesso `kind` gia presenti nel registry;
3. se non ci sono vicini o il miglior score e sotto `autoNewThreshold`, nasce un nuovo tipo;
4. se il miglior score e sopra `autoMatchThreshold`, il candidato viene fuso nel tipo esistente;
5. se lo score e ambiguo e `useLlmForAmbiguous` e `true`, l'LLM decide fra `MATCH`, `NEW` e `SUBTYPE`;
6. se lo score e ambiguo e `useLlmForAmbiguous` e `false`, nasce un nuovo tipo.

Il verdetto LLM puo puntare solo a uno degli id forniti nei vicini top-K. Questo impedisce riferimenti inventati.

## Fusione dei tipi

Quando un candidato viene fuso in un tipo canonico:

- etichette diverse diventano `aliases` ordinati;
- attributi e attributeDefinitions vengono uniti;
- categoria, primary key, label attribute e cardinalita completano campi mancanti;
- `visual` conserva i campi gia presenti e aggiunge quelli nuovi;
- provenienze duplicate non vengono contate due volte;
- `supportCount` diventa il numero di provenienze uniche.

## Emissione dell'ontologia

`emitOntology` pubblica solo tipi con `supportCount >= output.supportCountThreshold`. I nodi supportati vengono emessi per primi. Le relazioni vengono emesse solo se:

- sono `RelType` supportati;
- hanno `domain` e `range`;
- `domain` e `range` risolvono a nodi emessi tramite label o alias.

Se un parent punta a un nodo filtrato, il campo `parent` viene rimosso. Se `primaryKeyAttribute` o `labelAttribute` non identificano attributi emessi, vengono rimossi. L'obiettivo e evitare output internamente incoerenti.

## Pubblicazione atomica

L'istanza mantiene l'ultima ontologia valida in memoria. Se una nuova consolidazione fallisce, `getOntology()` continua a restituire l'ultimo snapshot pubblicato con successo. Questo comportamento evita di sostituire un risultato valido con uno parziale.

## Osservabilita e cancellazione

Ogni chiamata restituisce un `ExtractionJob`. Il job parte in microtask, quindi la creazione e non bloccante. Espone progressi, fasi, conteggi di chiamate LLM e un `AbortSignal` interno passato agli adapter. `cancel()` richiede cancellazione cooperativa e porta il job in fase `cancelled`.

## Confini di sicurezza e qualita

La libreria non inventa credenziali, policy o sezioni access-control. Il serializer omette esplicitamente `userGroups`, `securityProfiles` e `policies`, perche non sono parte della TBox estratta e non possono essere dedotte in sicurezza da documenti generici. Per dati sensibili, la classificazione del corpus e le policy di retention devono essere gestite prima di inviare chunk a provider esterni.