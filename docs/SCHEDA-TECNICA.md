---
repo: Gestione-Bollette-Parrocchia
linguaggi: JavaScript (Google Apps Script / V8), HTML/CSS/JS, Bash, JSON
stato: in uso (app-google), con materiale storico superato
aggiornato: 2026-11-26
---

# Scheda tecnica — Gestione Bollette Parrocchia

## Scopo
App per la gestione delle utenze e bollette (luce/gas/acqua) delle parrocchie
del Gruppo Camarlinghi. Fornitore principale: **Energentium**. Dati in Google
Fogli (`DATI!A1`, blob JSON), PDF in Google Drive. App in uso: **Google Apps
Script** in `app-google/` (un link, multiutente, niente download).

## Architettura
- Backend GAS (`app-google/Codice.gs`): serve l'interfaccia via `HtmlService`,
  legge/salva i dati sul Foglio, carica i PDF su Drive e li legge via parser
  Energentium (importo, consumo, scadenza, n° fattura, quota fissa).
- Frontend (`app-google/Index.html`): HTML/JS puro, niente librerie esterne.
- Manifest (`app-google/appsscript.json`): runtime V8, timezone Europe/Rome,
  servizio avanzato Drive API v3, webapp `ANYONE_ANONYMOUS`, executeAs USER_DEPLOYING.
- `tools/gas-gate.sh`: controllo sintassi `.gs`/`.html` via `node --check`.
- Storico (superato, non toccare): `index.html` (React CDN), `apps-script/`
  (web-app + parola segreta), `backup-estratto-parziale.json` (dati di prova).

## Componenti
| nome | ruolo | file |
|------|-------|------|
| app-google/Codice.gs | backend GAS (doGet, apiCarica, apiSalva con lock e versione, apiCaricaPdf, parser PDF) | app-google/Codice.gs |
| app-google/Index.html | interfaccia HTML/JS | app-google/Index.html |
| app-google/appsscript.json | manifest (V8, Drive API, webapp) | app-google/appsscript.json |
| app-google/ISTRUZIONI.md | come pubblicare/deploy | app-google/ISTRUZIONI.md |
| tools/gas-gate.sh | gate sintassi | tools/gas-gate.sh |
| docs/_inventario.tsv | inventario documenti | docs/_inventario.tsv |
| docs/LLM-GUIDA.md | guida per LLM | docs/LLM-GUIDA.md |
| docs/ISTRUZIONI.md | istruzioni d'uso | docs/ISTRUZIONI.md |

## Dati e interfacce
- Foglio `DATI`, ID in `app-google/Codice.gs` (righe ~17-24), campo `A1` = blob JSON;
  `B1` = timestamp ultima scrittura; versione negli script properties (`versione`).
- Concorrenza ottimistica: `apiSalva(json, versioneAttesa)` restituisce conflitto se
  la versione non coincide.
- PDF in cartella Drive "Bollette PDF — Gestione Utenze"; `apiCaricaPdf` crea file,
  legge il testo via Drive API avanzata e ritorna righe estratte.
- Chiamate web: `doGet` serve `Index.html`.
- Nessun endpoint HTTP esterno; la webapp è accessibile pubblicamente (ANYONE_ANONYMOUS).

## Dipendenze
- Google Apps Script runtime (V8), GAS services: SpreadsheetApp, DriveApp, HtmlService, LockService, PropertiesService, Utilities.
- Servizio avanzato Drive API v3.
- Tooling locale: `node` (per gate), `bash`, `python3` (script di verifica Capo).
- clasp (opzionale, deploy manuale; versione non verificata).
- Nessuna dipendenza npm nel repo.

## Configurazione
- `SHEET_ID` (id Foglio, in codice — non un segreto).
- `CARTELLA_PDF` (nome cartella Drive).
- `versione` (script property per concorrenza ottimistica).
- Segreti: nessuno nel repo; usare `<NOME_VARIABILE>` come segnaposto se servissero.

## Build e test
- `bash tools/gas-gate.sh` → esito verificato 2026-11-26: ✓ 4 file compilano
  (Codice.gs ×2, Index.html inline, index.html inline); exit 0.
- Nessun test automatico oltre il gate; pubblicazione Apps Script manuale e non verificata.

## Deploy
- Pubblicazione manuale nel menu Apps Script (Implementa → Gestisci implementazioni),
  procedura in `app-google/ISTRUZIONI.md`. **Non verificata** in questo ciclo.
- Prospettiva: `clasp push` (non verificato).
- Push Git: mai dal lavoro; il Capo lo esegue dopo l'integrazione.

## Rischi e debito tecnico
- Pubblicazione manuale, non verificata; deploy via clasp da mettere a punto.
- Foglio/cartella identificati per nome/ID hardcoded nel codice; nome esatto del
  Foglio "Archivio Utenze" non verificabile dal repo.
- Materiale storico superato (`index.html`, `apps-script/`) resta nel repo: debito da rimuovere in una sessione dedicata.
- Webapp accessibile a chiunque (ANYONE_ANONYMOUS): dati accessibili a chiunque abbia l'URL — non verificato in questo ciclo.
- Parser PDF dipende dalla Drive API avanzata; senza di essa l'app funziona ma non compila i campi da sola.
