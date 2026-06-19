# Collegare l'app a un archivio su Google Fogli

Segui questi passi **una volta sola**. Servono ~15 minuti.
Al termine avrai un indirizzo (URL) e una parola segreta: li incollerai dentro l'app.

---

## Passo 1 — Crea il Foglio
1. Vai su https://drive.google.com e apri la cartella che hai preparato.
2. **Nuovo → Fogli Google**. Chiamalo ad esempio `Archivio Utenze`.

## Passo 2 — Apri l'editor dello script
1. Nel Foglio: menu **Estensioni → Apps Script**.
2. Si apre una pagina con un file `Codice.gs` e dentro `function myFunction() {}`.
3. **Cancella tutto** quello che c'è e **incolla** il contenuto del file
   `Codice.gs` (quello che ti ho creato in questa cartella).
4. In alto trovi la riga:
   ```
   const PAROLA_SEGRETA = "cambiami-con-una-parola-segreta";
   ```
   Sostituisci `cambiami-con-una-parola-segreta` con **una tua parola/frase segreta**
   (lettere e numeri, niente spazi). Segnatela: ti servirà nell'app.
5. Salva con l'icona del dischetto (o Ctrl/Cmd+S).

## Passo 3 — Pubblica come applicazione web
1. In alto a destra: **Implementa → Nuova implementazione**.
2. Clicca l'ingranaggio accanto a "Seleziona tipo" e scegli **App web**.
3. Imposta:
   - **Descrizione**: `Archivio Utenze`
   - **Esegui come**: *Io* (il tuo indirizzo)
   - **Chi può accedere**: **Chiunque**
4. Clicca **Implementa**.
5. Google chiederà di **autorizzare**: consenti (è il tuo stesso script che accede
   al tuo Foglio). Se compare "App non verificata", scegli
   *Avanzate → Vai a … (non sicuro)*: è normale, lo script è tuo.
6. Alla fine compare un **URL dell'app web** tipo:
   ```
   https://script.google.com/macros/s/AKfyc.../exec
   ```
   **Copialo**: è l'indirizzo dell'archivio.

## Passo 4 — Dammi i due dati (o incollali nell'app)
Mi servono — o li incollerai tu nel pannello "Collegamento Google" dell'app,
appena lo avrò aggiunto:
- **URL dell'app web** (quello che finisce con `/exec`)
- **la parola segreta** che hai scelto al Passo 2

> Suggerimento: l'URL puoi anche incollarlo nel browser per verificare:
> deve rispondere `{"ok":true,"messaggio":"Archivio Gestione Utenze attivo."}`.

---

## Se in futuro modifichi lo script
Ogni volta che cambi `Codice.gs` devi **ripubblicare**:
**Implementa → Gestisci implementazioni → (matita) → Versione: Nuova versione → Implementa**.
L'URL resta lo stesso.

## Note di sicurezza
- L'archivio è raggiungibile solo da chi conosce **URL + parola segreta**: tienili privati.
- Il salvataggio nel cloud **non sostituisce** il backup `.json`: continua a farlo ogni tanto.
- La data dell'ultimo salvataggio finisce nella cella **B1** del foglio `DATI`.
