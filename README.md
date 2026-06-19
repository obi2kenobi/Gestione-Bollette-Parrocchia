# Gestione Bollette Parrocchia

App per la gestione delle utenze e bollette (luce/gas/acqua) delle parrocchie del
Gruppo Camarlinghi. Fornitore principale: **Energentium**.

## App in uso — `app-google/`
App nativa **Google Apps Script** (un link, niente download, multiutente):

- **`Code.gs`** — backend: serve l'interfaccia, legge/salva i dati sul Foglio
  (`DATI!A1`, blob JSON), salva i PDF su Drive e li **legge automaticamente**
  (parser Energentium: importo, consumo, scadenza, n° fattura, quota fissa).
- **`Index.html`** — interfaccia (HTML/JS puro, niente librerie esterne).
- **`ISTRUZIONI.md`** — come pubblicare.

Dati nel Foglio "Archivio Utenze" · PDF nella cartella Drive "Bollette PDF — Gestione Utenze".

## Materiale storico
- `index.html` — vecchia app mono-file (React via CDN, girava in locale). Superata.
- `apps-script/` — prima integrazione cloud (web-app + parola segreta). Superata.
- `backup-estratto-parziale.json` — estrazione bollette di prova.

## Pubblicazione
Vedi `app-google/ISTRUZIONI.md`. In prospettiva: deploy diretto con **clasp**
(`clasp push`) per non copiare/incollare più nulla.
