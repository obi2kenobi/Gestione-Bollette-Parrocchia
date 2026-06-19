# App nativa Google Apps Script — Tappa 1 (base funzionante)

Obiettivo di questa tappa: **un link Google che apre l'app e mostra i tuoi dati veri**
(parrocchie e utenze), senza password, senza download, senza "scatola protetta".
È la base: nelle prossime tappe aggiungiamo Bollette, Analisi e lettura PDF.

Si lavora nello **stesso progetto Apps Script** che hai già (quello collegato al Foglio).

---

## Passo 1 — Sostituisci Code.gs
1. Apri il Foglio → **Estensioni → Apps Script**.
2. Apri il file **`Code.gs`**, cancella tutto.
3. Apri `1-Code-da-incollare.txt` (clic destro → Apri con → TextEdit), **seleziona tutto, copia, incolla** in `Code.gs`.
4. Controlla che la riga `PAROLA_SEGRETA` contenga ancora **la tua** parola (serve solo alla vecchia app locale). Salva.

## Passo 2 — Aggiungi il file Index
1. In alto a sinistra: **+ → HTML**. Chiamalo esattamente **`Index`** (diventa `Index.html`).
2. Cancella il contenuto di esempio.
3. Apri `2-Index-da-incollare.txt` → **seleziona tutto, copia, incolla** in `Index`. Salva.

## Passo 3 — Pubblica
**Implementa → Gestisci implementazioni → matita (Modifica) → Versione: Nuova versione → Implementa.**
(L'indirizzo `/exec` resta lo stesso.)

## Passo 4 — Apri il link
Apri l'URL che finisce con **`/exec`**: deve comparire l'app **"Gestione Utenze"**
con la scheda **Utenze** piena dei tuoi dati (parrocchie + elenco utenze).

> Le schede Bollette / Analisi / Azioni per ora dicono "in arrivo": è normale,
> le costruiamo nelle prossime tappe.

---

## Se qualcosa non va
- **Resta su "Apertura dell'archivio…"**: fammi sapere, di solito è un permesso da
  autorizzare al primo avvio (Google chiede il consenso una volta).
- **"Errore di lettura"**: copiami il messaggio.

Quando vedi le tue utenze nel link Google, **dimmelo**: l'impianto è validato e
passo alla Tappa 2 (Bollette + caricamento/anteprima PDF + salvataggio).
