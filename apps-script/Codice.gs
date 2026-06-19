/**
 * GESTIONE UTENZE — Archivio su Google Fogli
 * ------------------------------------------------------------
 * Questo script trasforma un Foglio Google in un piccolo "server"
 * gratuito che custodisce l'archivio dell'app (parrocchie, utenze,
 * bollette, scadenze, azioni).
 *
 * COME SI INSTALLA: vedi il file ISTRUZIONI.md nella stessa cartella.
 *
 * L'app NON salva nulla qui senza la PAROLA SEGRETA qui sotto:
 * cambiala con una tua parola/frase difficile da indovinare e
 * tienila privata. La stessa parola va incollata dentro l'app.
 */

// 🔑 CAMBIA QUESTA PAROLA con una tua, segreta (lettere e numeri, niente spazi):
const PAROLA_SEGRETA = "cambiami-con-una-parola-segreta";

// Nome della scheda e cella dove vive l'archivio (non serve toccarli).
const SCHEDA_DATI = "DATI";
const CELLA = "A1";

/**
 * Apertura nel browser (solo per verificare che la pubblicazione funzioni).
 * Mostra un messaggio; NON espone i dati.
 * (Nota: servire l'app da qui non è praticabile — l'ambiente Apps Script
 *  blocca il caricamento delle librerie. L'app gira come file in locale.)
 */
function doGet() {
  return rispondi({ ok: true, messaggio: "Archivio Gestione Utenze attivo." });
}

/**
 * Tutte le operazioni dell'app passano da qui (POST).
 * Riceve un JSON: { parola, azione: "carica"|"salva", contenuto?: "<json>" }
 */
function doPost(e) {
  try {
    var corpo = {};
    if (e && e.postData && e.postData.contents) {
      corpo = JSON.parse(e.postData.contents);
    }

    // Controllo della parola segreta
    if (String(corpo.parola || "") !== PAROLA_SEGRETA) {
      return rispondi({ ok: false, errore: "parola-errata" });
    }

    var foglio = SpreadsheetApp.getActiveSpreadsheet();
    var scheda = foglio.getSheetByName(SCHEDA_DATI);
    if (!scheda) scheda = foglio.insertSheet(SCHEDA_DATI);

    var azione = corpo.azione || "carica";

    if (azione === "salva") {
      // Salva il blocco JSON dell'archivio nella cella A1.
      scheda.getRange(CELLA).setValue(corpo.contenuto || "");
      // Annota data/ora dell'ultimo salvataggio in B1 (comodo da consultare).
      scheda.getRange("B1").setValue(new Date());
      return rispondi({ ok: true });
    }

    // azione "carica": restituisce il blocco JSON salvato (o vuoto).
    var valore = scheda.getRange(CELLA).getValue();
    return rispondi({ ok: true, contenuto: valore ? String(valore) : "" });

  } catch (err) {
    return rispondi({ ok: false, errore: String(err) });
  }
}

/** Costruisce la risposta in formato JSON. */
function rispondi(oggetto) {
  return ContentService
    .createTextOutput(JSON.stringify(oggetto))
    .setMimeType(ContentService.MimeType.JSON);
}
