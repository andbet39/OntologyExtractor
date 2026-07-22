# Standard Operating Procedure (SOP)

**Titolo:** Controllo Contaminazione da Scariche Elettrostatiche (ESD) nelle Aree di Manipolazione Dispositivi a Semiconduttore

| Campo | Valore |
|---|---|
| Codice documento | SOP-QA-014 |
| Versione | 2.1 |
| Data emissione | 22/07/2026 |
| Data revisione precedente | 15/01/2025 |
| Owner processo | Quality Assurance / Fab Operations |
| Approvato da | Plant Manager, EHS Manager, QA Director |
| Classificazione | Interno — Controllato |
| Area applicabile | Cleanroom, Test & Assembly, Magazzino WIP |

---

## 1. Scopo

La presente procedura definisce i requisiti minimi e le modalità operative per la prevenzione dei danni da scariche elettrostatiche (Electrostatic Discharge, ESD) durante la manipolazione, il trasporto e lo stoccaggio di componenti, wafer e dispositivi a semiconduttore sensibili alle ESD (ESDS — ElectroStatic Discharge Sensitive devices).

## 2. Campo di applicazione

La procedura si applica a tutto il personale, diretto e in appalto, che opera nelle seguenti aree:

- Reparti cleanroom (Fab Front-End, Back-End)
- Stazioni di test e assemblaggio (ATE, wire bonding, packaging)
- Magazzini WIP (Work In Progress) e aree di kitting
- Laboratori di failure analysis e affidabilità

Sono esclusi i reparti amministrativi e le aree prive di manipolazione diretta di dispositivi ESDS, salvo diversa indicazione del Responsabile QA.

## 3. Riferimenti normativi

- ANSI/ESD S20.20 — *Protection of Electrical and Electronic Parts, Assemblies and Equipment*
- IEC 61340-5-1 — *Protection of electronic devices from electrostatic phenomena*
- JEDEC JESD625 — *Requirements for Handling Electrostatic-Discharge-Sensitive (ESDS) Devices*
- Manuale Qualità Aziendale, sez. 7.5 — Controllo dei processi speciali

## 4. Definizioni e acronimi

| Termine | Definizione |
|---|---|
| ESD | Scarica elettrostatica non controllata tra corpi a diverso potenziale |
| ESDS | Dispositivo sensibile alle scariche elettrostatiche |
| EPA | ESD Protected Area — area a protezione elettrostatica controllata |
| Wrist Strap | Bracciale di messa a terra personale |
| Ionizzatore | Dispositivo che neutralizza le cariche elettrostatiche nell'aria |
| FOUP | Front Opening Unified Pod — contenitore di trasporto wafer |

## 5. Responsabilità

| Ruolo | Responsabilità |
|---|---|
| **Operatore di linea** | Applicare la procedura, indossare i DPI antistatici, segnalare anomalie |
| **Team Leader di reparto** | Verificare la compliance quotidiana, gestire le non conformità di primo livello |
| **QA Engineer** | Eseguire audit periodici EPA, gestire la qualifica dei materiali ESD |
| **EHS Manager** | Validare la sicurezza degli impianti di messa a terra |
| **Facility Manager** | Manutenzione e calibrazione periodica degli strumenti di monitoraggio ESD |

## 6. Prerequisiti e materiali

- Bracciali antistatici (wrist strap) con monitor di continuità in tempo reale
- Calzature conduttive o talloniere ESD abbinate a pavimentazione conduttiva certificata
- Contenitori e vassoi antistatici (shielding bags, conductive tote box)
- Ionizzatori a soffitto o a banco nelle aree a umidità critica (< 30% RH)
- Wrist strap tester e footwear tester calibrati (verifica giornaliera)
- Cartellonistica EPA visibile agli accessi di reparto

## 7. Procedura operativa

### 7.1 Accesso all'area EPA

1. L'operatore indossa il camice antistatico e le calzature conduttive prima dell'ingresso in cleanroom.
2. Al banco di lavoro, collegare il wrist strap e verificarne la continuità tramite il tester dedicato (range accettabile: 0.75–10 MΩ).
3. In caso di esito negativo, l'operatore **non deve** procedere alla manipolazione e deve segnalare immediatamente al Team Leader.

### 7.2 Manipolazione di dispositivi ESDS

1. Movimentare i dispositivi esclusivamente all'interno di packaging antistatico qualificato (shielding bag Moisture Barrier o tote conduttivo).
2. Non rimuovere il dispositivo dal packaging protettivo se non all'interno di un'area EPA verificata.
3. Evitare materiali isolanti non autorizzati (plastica comune, appunti cartacei non trattati) a diretto contatto con i dispositivi o entro 30 cm dall'area di lavoro.
4. Per operazioni su wafer, utilizzare esclusivamente FOUP e wafer carrier conformi SEMI E78.

### 7.3 Trasporto interreparto

1. Il trasporto tra reparti avviene tramite carrelli con ruote conduttive e messa a terra continua.
2. Ogni contenitore di trasporto deve riportare l'etichetta ESD CAUTION conforme ANSI/ESD S8.1.
3. È vietato il trasporto manuale di dispositivi ESDS privi di packaging protettivo, anche per tragitti brevi.

### 7.4 Monitoraggio ambientale

1. Il livello di umidità relativa nelle aree EPA critiche deve essere mantenuto tra 30% e 60% RH, con verifica tramite data logger continuo.
2. Gli ionizzatori devono essere sottoposti a verifica di bilanciamento (offset voltage) con frequenza mensile.

## 8. Controlli e verifiche

| Controllo | Frequenza | Responsabile | Registrazione |
|---|---|---|---|
| Test continuità wrist strap | Ogni turno / ogni accesso | Operatore | Log elettronico stazione |
| Test calzature conduttive | Giornaliero | Operatore | Log elettronico stazione |
| Audit visivo area EPA | Settimanale | QA Engineer | Modulo QA-F-014 |
| Calibrazione strumenti ESD | Trimestrale | Facility Manager | Certificato di calibrazione |
| Verifica ionizzatori | Mensile | Facility Manager | Report tecnico |
| Audit di conformità S20.20 | Annuale | QA Director | Report di audit interno |

## 9. Gestione delle non conformità

In caso di rilevazione di una deviazione (es. wrist strap non funzionante, packaging danneggiato, superamento soglia di umidità):

1. Fermare immediatamente l'attività di manipolazione in corso.
2. Isolare il lotto potenzialmente compromesso e apporre etichetta di "Hold — Sospetta contaminazione ESD".
3. Aprire una non conformità (NC) secondo la procedura SOP-QA-002 *Gestione delle Non Conformità*.
4. Il QA Engineer valuta l'impatto sul lotto tramite analisi del rischio ESD e decide l'eventuale disposizione (rework, scrap, rilascio con deroga).

## 10. Formazione

- Tutto il personale operativo deve completare il corso *ESD Awareness Training* prima dell'assegnazione a reparti EPA.
- Rinfresco formativo obbligatorio con frequenza annuale.
- La qualifica del personale è tracciata nel sistema HR/LMS aziendale e verificata in fase di audit.

## 11. Storico delle revisioni

| Versione | Data | Descrizione modifica | Autore |
|---|---|---|---|
| 1.0 | 03/2021 | Prima emissione | QA Dept |
| 2.0 | 15/01/2025 | Aggiornamento riferimenti IEC 61340-5-1, revisione soglie RH | QA Dept |
| 2.1 | 22/07/2026 | Aggiunta sezione monitoraggio ionizzatori, aggiornamento moduli di audit | QA Dept |

## 12. Allegati

- Allegato A — Modulo QA-F-014 (Checklist Audit Area EPA)
- Allegato B — Planimetria aree EPA per reparto
- Allegato C — Scheda tecnica wrist strap tester

---

*Documento di esempio a scopo illustrativo. Adattare codici, soglie, riferimenti normativi e responsabilità organizzative al contesto specifico del sito produttivo.*
