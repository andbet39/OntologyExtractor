# Standard Operating Procedure (SOP)

**Titolo:** Procedura di Gowning e Controllo della Contaminazione Particellare in Ambiente Cleanroom

| Campo | Valore |
|---|---|
| Codice documento | SOP-FAC-009 |
| Versione | 3.0 |
| Data emissione | 22/07/2026 |
| Data revisione precedente | 11/04/2023 |
| Owner processo | Facility Management / Contamination Control |
| Approvato da | Fab Director, EHS Manager, QA Director |
| Classificazione | Interno — Controllato |
| Area applicabile | Cleanroom Classe ISO 5 / ISO 6, Gowning Room, Gray Area |

---

## 1. Scopo

La presente procedura definisce le modalità corrette di vestizione (gowning), comportamento e controllo della contaminazione particellare per tutto il personale che accede alle aree cleanroom, al fine di mantenere i livelli di classificazione ISO richiesti e prevenire difettosità da contaminazione sui wafer in produzione.

## 2. Campo di applicazione

La procedura si applica a:

- Operatori di produzione e manutenzione con accesso regolare alla cleanroom
- Personale tecnico e ingegneristico con accesso occasionale
- Visitatori, auditor e personale di fornitori terzi autorizzati all'ingresso
- Personale addetto alla pulizia e manutenzione delle facility (housekeeping)

Sono escluse le aree Gray Area a bassa classificazione (ISO 8 e superiore), per le quali si applica una procedura semplificata (SOP-FAC-010).

## 3. Riferimenti normativi

- ISO 14644-1 — *Cleanrooms and associated controlled environments — Classification of air cleanliness*
- ISO 14644-5 — *Cleanrooms and associated controlled environments — Operations*
- SEMI E116 — *Guide for Cleanroom Garment System Considerations*
- Manuale Qualità Aziendale, sez. 7.1.4 — Ambiente per il funzionamento dei processi

## 4. Definizioni e acronimi

| Termine | Definizione |
|---|---|
| Gowning | Procedura di vestizione con indumenti cleanroom certificati |
| Gray Area | Area di transizione a classificazione intermedia tra esterno e cleanroom |
| Particle Count | Conteggio delle particelle per unità di volume d'aria |
| ULPA/HEPA | Filtri ad altissima efficienza per particolato aereo |
| CFU | Colony Forming Unit — unità di misura della contaminazione biologica |
| Bunny Suit | Tuta integrale cleanroom in tessuto a bassa emissione particellare |

## 5. Responsabilità

| Ruolo | Responsabilità |
|---|---|
| **Operatore** | Eseguire correttamente la sequenza di gowning, rispettare i comportamenti previsti in cleanroom |
| **Team Leader di reparto** | Verificare la compliance quotidiana del personale, gestire le segnalazioni |
| **Contamination Control Engineer** | Monitorare i livelli di particle count, gestire le indagini su eventi di contaminazione |
| **Facility Manager** | Manutenzione HVAC, filtri HEPA/ULPA, differenziale di pressione tra aree |
| **EHS Manager** | Validare l'idoneità e la sicurezza degli indumenti e delle sostanze di pulizia utilizzate |

## 6. Prerequisiti e materiali

- Bunny suit, cappuccio, mascherina, guanti e calzari cleanroom certificati per la classe ISO dell'area
- Occhiali cleanroom (dove richiesto da specifica di reparto)
- Sistema di air shower all'ingresso della cleanroom
- Sticky mat (tappeti adesivi) nelle zone di transizione
- Particle counter portatile per verifiche puntuali
- Registro degli accessi con tracciabilità del personale per fascia oraria

## 7. Procedura operativa

### 7.1 Sequenza di gowning

1. Nella Gray Area, rimuovere effetti personali non ammessi (gioielli, cosmetici, carta, penne non cleanroom) e depositarli negli armadietti dedicati.
2. Indossare cuffia e mascherina prima di accedere alla Gowning Room.
3. Indossare il bunny suit seguendo la sequenza "dall'alto verso il basso": cappuccio integrato, chiusura del colletto, poi calzari, evitando il contatto del suit con il pavimento della Gray Area.
4. Indossare i guanti solo dopo aver completato la vestizione del suit, evitando di toccare superfici non cleanroom con i guanti puliti.
5. Attraversare l'air shower per la rimozione delle particelle residue prima dell'ingresso in cleanroom.

### 7.2 Comportamento in cleanroom

1. Muoversi con movimenti lenti e controllati; evitare movimenti bruschi delle braccia che generano turbolenza e rilascio particellare.
2. Non appoggiare materiali, documenti o strumenti non certificati direttamente su superfici di lavoro cleanroom.
3. Utilizzare esclusivamente carta e penne certificate a basso rilascio particellare (cleanroom paper).
4. In caso di danneggiamento visibile del guanto o del suit, l'operatore deve uscire immediatamente dall'area e ripetere la procedura di gowning.

### 7.3 Uscita dalla cleanroom

1. Rimuovere i guanti prima di uscire dall'area di produzione, seguendo la sequenza inversa del gowning.
2. Depositare gli indumenti cleanroom riutilizzabili negli appositi contenitori per il lavaggio certificato; gli indumenti monouso vanno smaltiti secondo la procedura di gestione rifiuti di reparto.
3. Non riutilizzare indumenti cleanroom monouso anche per accessi di breve durata.

### 7.4 Gestione di visitatori e personale occasionale

1. I visitatori devono essere accompagnati da personale qualificato per l'intera durata dell'accesso.
2. È richiesta una formazione minima di 15 minuti su comportamento cleanroom prima del primo accesso.
3. Il numero di visitatori simultanei in una singola bay è limitato secondo la matrice di capacità definita da Facility Management.

## 8. Controlli e verifiche

| Controllo | Frequenza | Responsabile | Registrazione |
|---|---|---|---|
| Particle count ambientale (ISO 14644-1) | Continuo (monitoraggio automatico) | Contamination Control Engineer | Sistema SCADA facility |
| Audit visivo compliance gowning | Giornaliero | Team Leader | Checklist reparto |
| Verifica differenziale di pressione tra aree | Giornaliero | Facility Manager | Log automatico BMS |
| Ispezione integrità filtri HEPA/ULPA | Semestrale | Facility Manager | Report tecnico manutenzione |
| Audit formale contamination control | Trimestrale | QA Director | Report di audit interno |
| Verifica CFU (contaminazione biologica) | Mensile | Contamination Control Engineer | Report laboratorio |

## 9. Gestione delle non conformità

Nel caso in cui si rilevi un superamento delle soglie di particle count o una violazione della procedura di gowning:

1. Identificare e isolare l'area/bay interessata, se il superamento è localizzato.
2. Aprire una non conformità secondo la procedura SOP-QA-002 *Gestione delle Non Conformità*.
3. Il Contamination Control Engineer esegue un'indagine delle cause (fonte di emissione, guasto HVAC, comportamento non conforme).
4. Valutare l'impatto sui lotti in produzione nella finestra temporale dell'evento e definire l'eventuale disposizione (rework, scrap, rilascio con deroga).

## 10. Formazione

- Tutto il personale con accesso regolare deve completare il corso *Cleanroom Behavior & Gowning Certification* prima del primo accesso autonomo.
- Rinfresco formativo obbligatorio con frequenza annuale.
- La qualifica del personale è tracciata nel sistema HR/LMS aziendale e verificata in fase di audit.

## 11. Storico delle revisioni

| Versione | Data | Descrizione modifica | Autore |
|---|---|---|---|
| 1.0 | 06/2019 | Prima emissione | Facility Management |
| 2.0 | 11/04/2023 | Aggiornamento sequenza gowning, introduzione air shower | Facility Management |
| 3.0 | 22/07/2026 | Aggiunta gestione visitatori, aggiornamento riferimenti ISO 14644-5 | Facility Management |

## 12. Allegati

- Allegato A — Diagramma sequenza gowning (step-by-step)
- Allegato B — Matrice di capacità bay per visitatori
- Allegato C — Modulo di formazione Cleanroom Behavior

---

*Documento di esempio a scopo illustrativo. Adattare codici, soglie, riferimenti normativi e responsabilità organizzative al contesto specifico del sito produttivo.*
