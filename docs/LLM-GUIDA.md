# LLM GUIDA — Gestione Bollette Parrocchia

Guida per un LLM che deve lavorare su questo repo. Ultimo aggiornamento: 2026-11-24 (R4).

## Struttura reale
- `app-google/` — app nativa Google Apps Script (backend `Codice.gs` + `Index.html` + `ISTRUZIONI.md` + `appsscript.json`). È l'app in uso.
- `tools/gas-gate.sh` — script di controllo/gate (56 righe).
- `index.html` — vecchia app mono-file (React via CDN, girava in locale). **Superata**.
- `apps-script/` — prima integrazione cloud (web-app + parola segreta). **Superata**.
- `backup-estratto-parziale.json` — estrazione bollette di prova.
- `docs/` — inventario e revisione documenti (`_guida-lista.txt`, `_inventario.tsv`, `_revisione.tsv`).
- `GUIDA.md`, `README.md`, `CLAUDE.md` — guide/standard; le sezioni non verificate sono marcate in `docs/_revisione.tsv`.

## Cosa NON fare
- Non modificare `index.html` o `apps-script/`: storici, superati.
- Non committare segreti (chiavi, password, parole segrete). Usa segnaposto.
- Non fare `git push` dal ramo di lavoro: il push lo fa il Capo.

## Comandi
- `bash tools/gas-gate.sh` — **non verificato** (non eseguito in questo ciclo).
- `clasp push` / pubblicazione Apps Script — **non verificato** (non eseguito in questo ciclo; procedura in `app-google/ISTRUZIONI.md` e va fatta a mano dal titolare).

## Dati e PDF
- Dati nel Foglio "Archivio Utenze" (scheda `DATI`, ID in `app-google/Codice.gs` righe 17-24, NON verificato qui).
- PDF in cartella Drive "Bollette PDF — Gestione Utenze".
- Il nome esatto del foglio "Archivio Utenze" non è verificabile dal repo (vedi `docs/_revisione.tsv`).

## Documenti superati in docs/archivio/
- `docs/archivio/` **non esiste** in questo ramo: nessun documento archiviato. Le guide storiche (`index.html`, `apps-script/`) sono sostituite da `app-google/`.

## Verifica
Comando di verifica R4 (da Capo):
`python3 -I ~/openclaw-lab/mandati/verifiche/m006-verifica.py r4 <worktree> 4b55167b577f8422c6ecc8270f2e8d53639f4abe op/M-006-4 Gestione-Bollette-Parrocchia`
