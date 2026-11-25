# BUG-G4 — Candidati bug (analisi)
## BUG-1
Dove: apps-script/Codice.gs:16-17
Gravità: alta (riservatezza/corruzione dati)
Prova: `grep -n PAROLA_SEGRETA apps-script/Codice.gs` — placeholder hardcoded nel repo.
Correzione: `PAROLA_SEGRETA` letta da Script Properties ("PAROLA_SEGRETA"); fail-closed se assente. Commit 89c6921.
Test: `bash tools/gas-gate.sh` → OK 4 file.

## BUG-2
Dove: app-google/Codice.gs `_importaFile` (~riga 340)
Gravità: alta (corruzione dati: utenze/intestatari fantasma)
Prova: `_agganciaUtenza` mutava `st` prima di `_esisteBollettaStato`; duplicati persistevano record mutati.
Correzione: dedup per numero prima della mutazione + rollback (truncate) degli elementi creati in caso di fallback dedup. Commit 4177870.
Test: `bash tools/gas-gate.sh` → OK 4 file.

CANDIDATO-3: app-google/Codice.gs — parseNumIt logica errata per formati non italiani
`parseNumIt` fa `.replace(/\./g,"")` prima di sostituire `,` con `.`: per input "1,234.56" (formato anglosassone, o "1.234" senza decimali) produce "1234.56"/"1234" errato invece di 1234.56 / 1.234. Verifica: input "1,234.56" → "1234.56" (10x troppo grande per 1.234,56 in formato italiano? no: ital. "1.234,56" → "1234.56" corretto; anglosassone errato). Test: node -e 'console.log(parseNumIt("1,234.56"))' → non corretto.
