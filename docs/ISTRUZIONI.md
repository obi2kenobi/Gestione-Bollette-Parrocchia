---
repo: Gestione-Bollette-Parrocchia
software: [app-google (Google Apps Script), tools/gas-gate.sh, index.html (storico), apps-script (storico), backup-estratto-parziale.json (dati di prova)]
aggiornato: 2026-11-25
---

# ISTRUZIONI — Gestione Bollette Parrocchia

Istruzioni d'uso di ogni software del repo. Per l'architettura vedi `CLAUDE.md` e `docs/LLM-GUIDA.md`.

## app-google (Google Apps Script — l'app in uso)

### Requisiti
- Account Google con accesso al Foglio "Archivio Utenze" e alla cartella Drive "Bollette PDF — Gestione Utenze".
- Editor Apps Script (Estensioni → Apps Script nel Foglio) oppure `clasp` (opzionale).

### Installazione
- Copia `Codice.gs` e `Index.html` nel progetto Apps Script collegato al Foglio (vedi `app-google/ISTRUZIONI.md`).
- `appsscript.json` descrive il manifest; `.clasp.json` per `clasp` (ID non verificato).

### Avvio
- Pubblica dal menu **Implementa → Gestisci implementazioni** (vedi `app-google/ISTRUZIONI.md`).
- Apri l'URL `/exec`: si carica "Gestione Utenze".

### Uso
- Foglio DATI (`A1`, blob JSON): parrocchie, utenze, bollette.
- PDF delle bollette letti automaticamente via parser Energentium (importo, consumo, scadenza, n° fattura, quota fissa).

### Verifica
- `bash tools/gas-gate.sh` → tutti i `.gs`/`.html` compilano (verificato 2026-11-25: ✓ 4 file).

### Problemi noti
- Deploy/pubblicazione manuale: non verificata in questo ciclo (va fatta a mano dal titolare).
- Il nome esatto del Foglio "Archivio Utenze" non è verificabile dal repo.
- Segreti: nessuno nel repo; usare `<NOME_VARIABILE>` come segnaposto.

## tools/gas-gate.sh

### Requisiti
- `node`, `python3`, `git`.

### Installazione
- Nessuna: è uno script del repo.

### Avvio
- `bash tools/gas-gate.sh [dir]` (default: la repo che lo contiene).

### Uso
- Verifica che ogni `.gs` e `.html` tracciato compili (estrae lo script inline dei `.html` e usa `node --check`).

### Verifica
- Esito 0 = OK; exit 1 = almeno un file non compila; exit 2 = perimetro non giudicabile.
- Eseguito 2026-11-25: ✓ 4 file compilano.

### Problemi noti
- Nessuno.

## index.html (storico — superata)

### Requisiti
- Nessuno: vecchia app mono-file React via CDN, girava in locale.

### Installazione
- Non installare: non usata.

### Avvio
- Non avviare.

### Uso
- Fuori perimetro attivo. NON modificare.

### Verifica
- Non verificata come app attiva.

### Problemi noti
- Superata da `app-google/`.

## apps-script/ (storico — superata)

### Requisiti
- Nessuno: prima integrazione cloud (web-app + parola segreta).

### Installazione
- Non installare.

### Avvio
- Non avviare.

### Uso
- Fuori perimetro attivo. NON modificare.

### Verifica
- Non verificata come app attiva.

### Problemi noti
- Superata da `app-google/`.

## backup-estratto-parziale.json

### Requisiti
- Nessuno: dato di prova.

### Installazione
- Nessuna.

### Avvio
- Non avviare.

### Uso
- Estensione bollette di prova; non usata in produzione.

### Verifica
- Non verificata come dato di produzione.

### Problemi noti
- Parziale per definizione.
