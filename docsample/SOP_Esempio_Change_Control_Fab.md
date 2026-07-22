# Standard Operating Procedure (SOP)

**Titolo:** Gestione delle Modifiche di Processo (Change Control) in Ambiente Fabbricazione Semiconduttori

| Campo | Valore |
|---|---|
| Codice documento | SOP-ENG-027 |
| Versione | 1.3 |
| Data emissione | 22/07/2026 |
| Data revisione precedente | 08/09/2024 |
| Owner processo | Process Engineering / Quality Assurance |
| Approvato da | Fab Director, QA Director, Customer Quality Manager |
| Classificazione | Interno — Controllato |
| Area applicabile | Front-End Fab, Process Engineering, Equipment Engineering |

---

## 1. Scopo

La presente procedura definisce il flusso di valutazione, approvazione, implementazione e verifica di qualsiasi modifica (Change) che impatti processi, materiali, attrezzature, software di controllo o layout di fabbricazione dei dispositivi a semiconduttore, al fine di garantire che nessuna variazione non controllata influisca su resa, affidabilità o conformità alle specifiche cliente.

## 2. Campo di applicazione

La procedura si applica a tutte le modifiche pianificate riguardanti:

- Ricette di processo (litografia, deposizione, etching, impiantazione ionica, diffusione)
- Materiali di consumo qualificati (gas di processo, chimica, target, wafer carrier)
- Attrezzature di produzione (tool di processo, metrologia, software di controllo statistico)
- Layout di linea e routing dei lotti (WIP flow)
- Fornitori qualificati di materiali critici

Sono escluse le modifiche puramente amministrative prive di impatto tecnico sul processo, salvo diversa valutazione del Process Engineering.

## 3. Riferimenti normativi

- AEC-Q100 / IATF 16949 — requisiti Change Notification per componenti automotive
- SEMI E10 — *Guideline for Equipment Reliability, Availability and Maintainability*
- JEDEC JESD46 — *Customer Notification of Product/Process Changes*
- Procedura Cliente-Specifica PCN (Process Change Notification), ove applicabile
- Manuale Qualità Aziendale, sez. 8.3 — Controllo delle progettazioni e modifiche

## 4. Definizioni e acronimi

| Termine | Definizione |
|---|---|
| ECR | Engineering Change Request — richiesta iniziale di modifica |
| ECN | Engineering Change Notice — notifica formale di modifica approvata |
| PCN | Process Change Notification — comunicazione formale al cliente |
| CCB | Change Control Board — comitato di approvazione delle modifiche |
| Qual Lot | Lotto di qualifica prodotto per validare l'impatto della modifica |
| Impact Level | Classificazione del rischio della modifica (Minor / Major / Critical) |

## 5. Responsabilità

| Ruolo | Responsabilità |
|---|---|
| **Process Engineer proponente** | Redige l'ECR, definisce il piano di qualifica tecnica |
| **Change Control Board (CCB)** | Valuta rischio, approva/respinge la richiesta, assegna Impact Level |
| **QA Engineer** | Verifica impatto su specifiche cliente, gestisce eventuale PCN |
| **Equipment Engineer** | Esegue e documenta le modifiche su attrezzature/tool |
| **Customer Quality Manager** | Gestisce comunicazione e approvazione con il cliente, se richiesta |

## 6. Prerequisiti e materiali

- Modulo ECR (Engineering Change Request) compilato con descrizione tecnica della modifica
- Analisi del rischio preliminare (FMEA di processo aggiornata, se applicabile)
- Piano di qualifica con criteri di accettazione (resa, parametri elettrici, difettosità)
- Disponibilità di capacità per lotti di qualifica (Qual Lot) senza impatto su commitment di produzione
- Storico delle Process Change Notification precedenti per il medesimo processo/prodotto

## 7. Procedura operativa

### 7.1 Apertura della richiesta (ECR)

1. Il Process Engineer proponente compila l'ECR indicando: motivazione della modifica, processo/tool impattato, rischio atteso, alternative valutate.
2. L'ECR viene protocollata nel sistema di Change Management aziendale con numero univoco.
3. Il CCB viene convocato entro 5 giorni lavorativi dall'apertura per la prima valutazione.

### 7.2 Classificazione del rischio (Impact Level)

1. Il CCB classifica la modifica secondo tre livelli:
   - **Minor**: nessun impatto atteso su form/fit/function, non richiede PCN cliente.
   - **Major**: impatto potenziale su parametri elettrici o resa, richiede qualifica formale e PCN cliente.
   - **Critical**: impatto su affidabilità a lungo termine o su die già qualificati presso il cliente; richiede approvazione esplicita del cliente prima dell'implementazione.
2. Per le modifiche Major e Critical, il QA Engineer avvia la procedura di notifica PCN secondo JEDEC JESD46.

### 7.3 Qualifica tecnica

1. Per Impact Level Major/Critical, viene eseguito un Qual Lot dedicato, isolato dal flusso di produzione standard.
2. I criteri di accettazione (resa, parametri parametrici, difettosità in-line) sono definiti prima dell'avvio del lotto e non modificabili in corso di qualifica.
3. I risultati sono raccolti in un report di qualifica firmato da Process Engineering e QA.

### 7.4 Approvazione e implementazione

1. Il CCB approva formalmente l'ECN (Engineering Change Notice) sulla base del report di qualifica.
2. Per modifiche Critical, l'implementazione in produzione è subordinata alla ricezione dell'approvazione scritta del cliente.
3. L'Equipment/Process Engineer implementa la modifica in produzione, aggiornando la documentazione di processo (Process Traveler, Recipe Control Sheet).

### 7.5 Verifica post-implementazione

1. Monitoraggio rinforzato dei parametri di processo (SPC) per un periodo minimo di 4 settimane o 3 lotti consecutivi dopo l'implementazione.
2. In caso di deviazione dai limiti di controllo, la modifica può essere sospesa e ripristinata la configurazione precedente (rollback).

## 8. Controlli e verifiche

| Controllo | Frequenza | Responsabile | Registrazione |
|---|---|---|---|
| Revisione ECR aperte | Settimanale | CCB | Minute di riunione CCB |
| Verifica criteri Qual Lot | Ad ogni qualifica | QA Engineer | Report di qualifica |
| Monitoraggio SPC post-change | 4 settimane / 3 lotti | Process Engineer | Chart SPC dedicato |
| Audit stato PCN verso clienti | Mensile | Customer Quality Manager | Tracker PCN |
| Revisione storico ECN | Annuale | QA Director | Report di revisione annuale |

## 9. Gestione delle non conformità

Nel caso in cui una modifica venga implementata senza completare l'iter di approvazione, oppure il Qual Lot non soddisfi i criteri di accettazione:

1. Sospendere immediatamente ogni ulteriore produzione con la configurazione modificata.
2. Aprire una non conformità secondo la procedura SOP-QA-002 *Gestione delle Non Conformità*.
3. Valutare l'impatto retroattivo su tutti i lotti già prodotti con la modifica non autorizzata (contenimento e disposizione).
4. Se coinvolti prodotti già spediti, il Customer Quality Manager valuta la necessità di una comunicazione formale al cliente (containment notification).

## 10. Formazione

- I Process Engineer devono completare il corso *Change Control & Risk Classification* prima di poter aprire ECR autonomamente.
- I membri del CCB partecipano a un aggiornamento annuale sulle normative JEDEC/AEC-Q100 applicabili.
- La qualifica del personale è tracciata nel sistema HR/LMS aziendale e verificata in fase di audit.

## 11. Storico delle revisioni

| Versione | Data | Descrizione modifica | Autore |
|---|---|---|---|
| 1.0 | 02/2020 | Prima emissione | Process Engineering |
| 1.2 | 08/09/2024 | Introduzione classificazione Impact Level a 3 livelli | Process Engineering |
| 1.3 | 22/07/2026 | Aggiunta procedura di rollback post-implementazione, aggiornamento riferimenti JESD46 | Process Engineering |

## 12. Allegati

- Allegato A — Modulo ECR (Engineering Change Request)
- Allegato B — Template Report di Qualifica Qual Lot
- Allegato C — Tracker PCN verso clienti

---

*Documento di esempio a scopo illustrativo. Adattare codici, soglie, riferimenti normativi e responsabilità organizzative al contesto specifico del sito produttivo.*
