# Gestione Utenze — Guida d'uso e di consegna

Registro delle bollette (luce, gas, acqua) delle parrocchie. Questa guida spiega
come usare il programma, come salvare i dati al sicuro e come passare la gestione
a un'altra persona.

---

## 1. Come si avvia

Il programma è un unico file: **`index.html`**.

- Fai **doppio click** su `index.html`: si apre nel browser (Chrome, Edge, Firefox o Safari).
- Al **primo avvio** serve la **connessione a Internet**: il programma scarica una volta
  sola le librerie che gli servono. Dalle volte successive parte anche senza rete
  (tranne la lettura di nuovi PDF, vedi sotto).
- Se vedi a lungo la scritta "Avvio in corso…", controlla la connessione e ricarica con **F5**.

Non serve installare nulla.

---

## 2. Dove vivono i dati (LEGGERE — è il punto importante)

I dati che inserisci (parrocchie, utenze, bollette, scadenze) **restano salvati dentro
il browser di QUESTO computer**. Non sono su Internet e non si spostano da soli.

Conseguenze pratiche:
- Se apri il programma da un **altro computer** o da un **altro browser**, NON trovi i dati:
  vanno trasferiti con un backup (vedi punto 4).
- Se **svuoti la cronologia / i dati di navigazione** del browser, rischi di **cancellare
  l'archivio**. Per questo conta tantissimo fare backup regolari.

Pensa al browser come al "tavolo di lavoro" e al file di backup come all'"archivio vero".

---

## 3. I PDF originali delle bollette

Il programma è un **registro**: conserva i dati di ogni bolletta, ma **non** custodisce
dentro di sé i file PDF. I PDF vanno tenuti **in una cartella ordinata** (consigliato:
su Google Drive, una cartella per anno o per parrocchia).

Quando importi una bolletta, il programma memorizza il **nome del file** e crea in
automatico un **collegamento**: nella lista delle bollette compare un'icona di link che
apre il PDF (ricerca per nome su Google Drive). Puoi anche incollare a mano il link.

➡️ **Regola d'oro:** non rinominare i PDF dopo averli archiviati, altrimenti il
collegamento per nome non li ritrova.

---

## 4. Backup e ripristino (il cuore della sicurezza)

### Fare un backup (da fare spesso!)
1. Nel programma, usa il comando **Backup**.
2. Viene scaricato un file tipo `backup-utenze-2026-06-19.json`.
3. **Conserva quel file in un posto sicuro** (Google Drive, una cartella dedicata).
   Contiene TUTTO: parrocchie, utenze, bollette, scadenze, azioni.

Il programma ti **ricorda** di fare il backup se non lo fai da più di 30 giorni.
Consiglio: un backup al mese e dopo ogni sessione in cui inserisci molte bollette.

### Ripristinare un backup (su un nuovo PC, o per recuperare i dati)
1. Apri `index.html`.
2. Usa il comando **Ripristina** e seleziona un file `backup-utenze-....json`.
3. Conferma: l'archivio viene ricostruito identico.

⚠️ Il ripristino **sostituisce** i dati presenti: fai prima un backup di sicurezza
se nel programma ci sono già dati che non vuoi perdere.

---

## 5. Importare le bollette

1. Comando **Importa** → si apre la finestra del sistema.
2. **Seleziona anche più PDF insieme** (tienili in una cartella; puoi selezionarli tutti).
   In alternativa, **trascina** i file dentro la finestra del programma.
3. Il programma legge ogni bolletta (anche i PDF che contengono più bollette insieme,
   es. tutte le utenze di una parrocchia), estrae importi, consumi, scadenze e codici POD,
   e segnala con un avviso le letture da controllare.
4. Rivedi e conferma.

> Nota: la **lettura dei PDF** richiede la connessione a Internet (scarica il lettore PDF).
> La consultazione dei dati già inseriti, no.

---

## 6. Altre esportazioni utili
- **CSV**: esporta il registro in un foglio di calcolo (Excel / Google Fogli).
- **Scadenze (.ics)**: esporta le scadenze come eventi da importare nel calendario
  (Google Calendar, Outlook, Apple Calendario), per non dimenticare i pagamenti.

---

## 7. Passare la gestione a un'altra persona

Il trasferimento è completo e semplice. Consegna **tre cose**:

1. **`index.html`** — il programma (basta copiarlo).
2. **L'ultimo file di backup** `backup-utenze-....json` — l'archivio dei dati.
3. **La cartella dei PDF** (o l'accesso al Drive dove sono archiviati).

Chi subentra:
- apre `index.html`,
- fa **Ripristina** e carica il file di backup → si ritrova tutto l'archivio,
- per i link ai PDF: deve avere accesso allo stesso Drive/cartella. Se sposta i PDF su
  un proprio Drive, va bene purché **mantenga gli stessi nomi dei file**.

Da quel momento è autonomo. Conviene anche consegnargli questa guida.

> Se in futuro più persone dovessero lavorarci **contemporaneamente**, questo schema
> (dati nel browser + backup su file) non basta: servirebbe un archivio condiviso su
> server. Per un passaggio di consegne o per una persona alla volta, invece, va benissimo così.

---

## 8. Promemoria rapido (da tenere a mente)
- 💾 **Backup spesso** e su Drive: il browser da solo non è un archivio sicuro.
- 📁 **PDF in cartelle ordinate**, nomi file **mai cambiati** dopo l'archiviazione.
- 🌐 **Internet** serve al primo avvio e per leggere nuovi PDF.
- 🔁 **Consegna** = index.html + backup .json + cartella PDF.
