# BUG-G4 — Candidati bug (analisi)
CANDIDATO-1: apps-script/Codice.gs:16 — parola segreta placeholder
`PAROLA_SEGRETA = "cambiami-con-una-parola-segreta"` resta il default. Chi conosce il repo (pubblica/condivisa) può accedere all'archivio e leggere/sovrascrivere DATI!A1: perdita di riservatezza/corruzione dati. Verifica: `grep -n PAROLA_SEGRETA apps-script/Codice.gs` — valore non cambiato.
CANDIDATO-2: app-google/Codice.gs:~_agganciaUtenza — dedup dopo mutazione dello stato
In `_importaFile`, la chiamata a `_agganciaUtenza` aggiunge nuove utenze/intestatari in `st` PRIMA del controllo `_esisteBollettaStato`. Se la bolletta è duplicata, si ritorna dal dedup ma le utenze create sono già persistite da `apiSalva(JSON.stringify(st))` — utenze/parrocchie fantasma accumulate a ogni reimport. Logica errata / corruzione dati.
CANDIDATO-3: app-google/Codice.gs — parseNumIt logica errata per formati non italiani
`parseNumIt` fa `.replace(/\./g,"")` prima di sostituire `,` con `.`: per input "1,234.56" (formato anglosassone, o "1.234" senza decimali) produce "1234.56"/"1234" errato invece di 1234.56 / 1.234. Verifica: input "1,234.56" → "1234.56" (10x troppo grande per 1.234,56 in formato italiano? no: ital. "1.234,56" → "1234.56" corretto; anglosassone errato). Test: node -e 'console.log(parseNumIt("1,234.56"))' → non corretto.
