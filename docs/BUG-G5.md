# BUG-G5 — caccia ai bug (M-032.30b)

Riferimento G4: `origin/fix/g4-2026-11:docs/BUG-G4.md` NON esiste (git show → "nome oggetto non valido"); proceduto senza modello.

## BUG-1 — oggiISO usa UTC: scadenze sbagliate per 1-2 ore dopo mezzanotte

Dove: index.html:557 (`const oggiISO = () => new Date().toISOString().slice(0, 10);`), usata da `isScaduta` (riga 559) e in altri 6 punti (1211, 1290, 1329, 1364, 1381, 2752).

Gravità: alta — le bollette non pagate con scadenza "oggi" non risultano scadute (falso negativo) dalla mezzanotte locale fino a 01:00/02:00 (ora solare/legale); StatoPagamento mostra "in attesa" invece di "scaduta" (rosso), e ogni logica basata su oggiISO è spostata di un giorno indietro.

Prova (PRIMA): `TZ=Europe/Rome node -e` con `new Date("2026-11-27T00:30:00+01:00")`:
`toISOString().slice(0,10)` → `2026-11-26` mentre a Roma è già il 27; `isScaduta` su scadenza `2026-11-27` non pagata → `false` (doveva essere `true`).

Correzione: commit `1debb9a` — oggiISO costruisce la data dai componenti locali (`getFullYear/getMonth/getDate`) invece di `toISOString()` (UTC).

Test (DOPO): stesso scenario → oggiISO = `2026-11-27`, `isScaduta` corretta. `bash tools/gas-gate.sh` → "✓ 4 file compilano". Test del repo non peggiorati.

## NON TROVATO

NON TROVATO: altri 2 bug confermabili entro il tempo del mandato (15 min). File letti: index.html (sezioni: utility 488-620, parser 619-1010, splitBollette, parseNumIt, toISO, MESI_ABBR, parseEnergentium, parseEnel, parseAcque, validazione campi, applicaEstrazione 3136, StatoPagamento 3164, Consumi 3991), app-google/Codice.gs (369 righe), apps-script/Codice.gs (76 righe). Ricerche fatte: grep su `oggiISO`, `isScaduta`, `normEnergia`, componenti React (Pill/Modal/Utenze/Bollette/PdfModal/ImportModal/Azioni). Candidati annotati ma NON verificati come bug: nessuno con prova riproducibile nel tempo disponibile.
