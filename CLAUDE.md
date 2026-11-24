# CLAUDE.md — Gestione Bollette Parrocchia

Standard di lavoro per ogni sessione sul repo `Gestione-Bollette-Parrocchia`.

## Scopo
App per la gestione delle utenze e bollette (luce/gas/acqua) delle parrocchie
del Gruppo Camarlinghi. Fornitore: **Energentium**. Dati in Google Fogli, PDF
in Drive. App in uso: **Google Apps Script** in `app-google/`.

## Struttura
- `app-google/` — app nativa GAS: `Codice.gs` (backend: serve l'interfaccia,
  legge/salva dati sul Foglio DATI scheda, carica PDF da Drive, parser Energentium),
  `Index.html` (interfaccia HTML/JS puro), `ISTRUZIONI.md`, `appsscript.json`,
  `.clasp.json`.
- `tools/gas-gate.sh` — controllo sintassi dei `.gs`/HTML (node --check).
- `index.html` — vecchia app mono-file (React CDN, locale). **Superata, non toccare.**
- `apps-script/` — prima integrazione cloud. **Superata, non toccare.**
- `backup-estratto-parziale.json` — estrazione bollette di prova.
- `docs/` — inventario/revisione (`_inventario.tsv`, `_revisione.tsv`, `_guida-lista.txt`),
  `LLM-GUIDA.md`, `REGOLE-CLAUDE-originale.md` (regola pre-R4, archiviata).

## Comandi (stati verificati in questo ciclo)
- `bash tools/gas-gate.sh` — **non verificato** in questo ciclo.
- `clasp push` — **non verificato**; procedura manuale in `app-google/ISTRUZIONI.md`.
- Verifica R4 (Capo): `python3 -I ~/openclaw-lab/mandati/verifiche/m006-verifica.py r4 <worktree> 4b55167b577f8422c6ecc8270f2e8d53639f4abe op/M-006-4 Gestione-Bollette-Parrocchia`

## Convenzioni
- HTML/JS puro, niente librerie esterne nell'app GAS.
- Dati in Foglio `DATI` (ID in `app-google/Codice.gs` righe 17-24, non verificato qui).
- PDF in cartella Drive "Bollette PDF — Gestione Utenze".
- Commit `<type>: <descrizione breve>`; push mai dal lavoro: il push lo fa il Capo.

## Cosa non toccare
- `index.html`, `apps-script/` (superati).
- Segreti: mai committare chiavi/parole segrete; segnaposto solo.

## Dati e segreti
- Nessun segreto nel repo. Se servono credenziali, usare segnaposto e chiedere al titolare.

## Rimando
Guida per LLM: `docs/LLM-GUIDA.md`.
