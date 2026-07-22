---
title: Overview API
---

# Overview API

Il pacchetto `ontology-extractor` esporta classi, funzioni e tipi per comporre una pipeline completa.

## Classi principali

- `OntologyExtractor`: orchestratore della pipeline.
- `ExtractionJobHandle`: implementazione del contratto `ExtractionJob`, esportata per test e scenari avanzati.
- `InMemoryCandidateStore`: store volatile con semantiche document-level append.

## Funzioni principali

- `resolveConfig`: applica default e valida invarianti.
- `splitDocuments`: valida documenti e produce chunk.
- `deduplicateCandidates`: aggrega candidati uguali.
- `canonicalizeCandidates`: costruisce tipi canonici con embedding e LLM opzionale.
- `emitOntology`: usata internamente per filtrare e pubblicare l'ontologia.
- `toOntologyImportModel`: converte `Ontology` nel modello importabile.
- `cosineSimilarity`: calcola similarita fra vettori embedding.
- `selectTopK`: seleziona item con punteggio massimo e tie-break stabile.
- `normalizeLabel`: normalizza etichette collassando whitespace.

## Tipi centrali

- Input: `InputDocument`, `DocumentChunk`.
- Candidati: `Candidate`, `ExtractedCandidate`, `StoredCandidate`, `AggregatedCandidate`.
- Output: `CanonicalType`, `Ontology`.
- Adapter: `LlmAdapter`, `EmbeddingAdapter`, `CandidateStore`.
- Configurazione: `OntologyExtractorConfig`, `ResolvedOntologyExtractorConfig`.
- Job: `ExtractionJob`, `Progress`, `Phase`.
- Serializer: `OntologyImportModel` e tipi `Import*`.

## Errori tipizzati

Tutti gli errori specifici della libreria estendono `OntologyExtractorError`: `ConfigurationError`, `SchemaValidationError`, `LlmAdapterError`, `EmbeddingAdapterError`, `StoreConflictError`, `ConcurrentJobError` e `CancelledError`.