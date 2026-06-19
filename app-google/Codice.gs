/**
 * GESTIONE UTENZE — App nativa Google Apps Script
 * Dati nel Foglio (DATI!A1). PDF su Drive. Lettura PDF lato server.
 *
 * ⚠️ RICHIEDE il servizio avanzato "Drive API":
 *    nell'editor → "Servizi" (+) → Drive API → Aggiungi.
 *    Serve per leggere il testo dei PDF. Senza, l'app funziona lo stesso
 *    ma non compila i campi da sola (li inserisci a mano).
 */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Gestione Utenze — Bollette Parrocchie')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

var SHEET_ID = "1YaybNfRIFAttjtEwt3pbuoFoV88RlRXbPF9rDdFlb8U";
function _schedaDati() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName('DATI');
  if (!sh) sh = ss.insertSheet('DATI');
  return sh;
}
function apiCarica() {
  var v = _schedaDati().getRange('A1').getValue();
  return v ? String(v) : '';
}
function _versione() {
  var p = PropertiesService.getScriptProperties().getProperty('versione');
  return p ? Number(p) : 0;
}
// Stato per la UI: dati + numero di versione (per la concorrenza ottimistica).
function apiStato() {
  return { dati: apiCarica(), versione: _versione() };
}
// Salva l'archivio. Con un lock (niente scritture sovrapposte) e controllo di
// versione: se i dati sono cambiati da quando il client li ha letti, NON
// sovrascrive e restituisce la versione aggiornata (così il client ricarica).
function apiSalva(json, versioneAttesa) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var vCorr = _versione();
    if (versioneAttesa != null && Number(versioneAttesa) !== vCorr) {
      return { ok: false, conflitto: true, dati: apiCarica(), versione: vCorr };
    }
    var sh = _schedaDati();
    sh.getRange('A1').setValue(json);
    sh.getRange('B1').setValue(new Date());
    var vNuova = vCorr + 1;
    PropertiesService.getScriptProperties().setProperty('versione', String(vNuova));
    return { ok: true, versione: vNuova };
  } finally {
    lock.releaseLock();
  }
}

var CARTELLA_PDF = "Bollette PDF — Gestione Utenze";
function _cartellaPdf() {
  var it = DriveApp.getFoldersByName(CARTELLA_PDF);
  return it.hasNext() ? it.next() : DriveApp.createFolder(CARTELLA_PDF);
}

// Carica il PDF su Drive E lo legge: ritorna link + righe (bollette) trovate.
function apiCaricaPdf(base64, nome) {
  var pulito = String(base64).replace(/^data:.*?;base64,/, "");
  var blob = Utilities.newBlob(Utilities.base64Decode(pulito), "application/pdf", nome || "bolletta.pdf");
  var file = _cartellaPdf().createFile(blob);
  var out = {
    id: file.getId(),
    nome: file.getName(),
    url: "https://drive.google.com/file/d/" + file.getId() + "/view",
    righe: []
  };
  var testo;
  try {
    testo = _estraiTestoPdf(blob, nome);
  } catch (e) {
    throw new Error("Lettura PDF non riuscita — " + (e && e.message ? e.message : e));
  }
  if (testo) {
    var st = _statoCorrente();
    var blocchi = splitBollette(testo);
    for (var i = 0; i < blocchi.length; i++) {
      var c = parseEnergentium(blocchi[i]);
      c.utenzaId = _matchUtenza(c.codice, st);
      out.righe.push(c);
    }
  }
  return out;
}

// ---- lettura testo da PDF (via conversione in Documento Google) ----
// Converte il PDF in Documento Google (servizio Drive) e ne legge il testo (DocumentApp).
function _estraiTestoPdf(blob, nome) {
  if (typeof Drive === "undefined" || !Drive.Files) {
    throw new Error("Attiva il servizio Drive: editor → 'Servizi' → + → Drive API → Aggiungi, poi ripubblica.");
  }
  var doc = Drive.Files.create
    ? Drive.Files.create({ name: "tmp-doc", mimeType: "application/vnd.google-apps.document" }, blob)
    : Drive.Files.insert({ title: "tmp-doc", mimeType: "application/vnd.google-apps.document" }, blob);
  var id = doc.id;
  var testo = "";
  try {
    testo = DocumentApp.openById(id).getBody().getText();
  } finally {
    // Elimina definitivamente il Doc temporaneo creato dall'app (niente accumulo nel cestino).
    try { Drive.Files.remove(id); }
    catch (e) { try { DriveApp.getFileById(id).setTrashed(true); } catch (e2) {} }
  }
  return testo;
}

// ---- PARSER (fornitore Energentium) ----
function _pad(n){ n = String(n); return n.length < 2 ? "0" + n : n; }
function parseNumIt(s){
  if (s == null) return null;
  var c = String(s).replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
  var n = parseFloat(c); return isNaN(n) ? null : n;
}
function toISO(s){
  if (!s) return "";
  var m = String(s).match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (!m) return "";
  var d = m[1], mo = m[2], y = m[3]; if (y.length === 2) y = "20" + y;
  return y + "-" + _pad(mo) + "-" + _pad(d);
}
function normEnergia(s){ return String(s || "").replace(/\s/g, "").toUpperCase().replace(/^IT0{0,2}1E/, "IT001E"); }
function splitBollette(testo){
  var idx = [], re = /Intestatario:/g, m;
  while ((m = re.exec(testo)) !== null) idx.push(m.index);
  if (idx.length <= 1) return [testo];
  var b = [];
  for (var i = 0; i < idx.length; i++) b.push(testo.slice(idx[i], i + 1 < idx.length ? idx[i + 1] : undefined));
  return b;
}
function parseEnergentium(testo){
  var t = String(testo).replace(/\s+/g, " ");
  var o = {};
  var podLab = t.match(/Codice POD[:\s]+(IT\s?0{0,2}1E\s?\d{8,9})/i);
  var pdrLab = t.match(/Codice PDR[:\s]+(\d{14,15})/i);
  var pod = t.match(/IT\s?0{0,2}1E\s?\d{8,9}/i);
  o.codice = podLab ? podLab[1].replace(/\s/g, "") : pdrLab ? pdrLab[1] : pod ? pod[0].replace(/\s/g, "") : "";
  var per = t.match(/Periodo oggetto di fatturazione[:\s]+(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})/i);
  o.dataInizio = per ? toISO(per[1]) : "";
  o.dataFine = per ? toISO(per[2]) : "";
  var MESI = "Gennaio|Febbraio|Marzo|Aprile|Maggio|Giugno|Luglio|Agosto|Settembre|Ottobre|Novembre|Dicembre";
  var mlist = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
  // Riquadro di sintesi: nella conversione i valori compaiono come blocco a sé,
  // es. "85,75 Euro 08 Luglio 2026 2 kWh" → importo · scadenza · consumo.
  var imp = "", cons = "", scad = "";
  var box = t.match(new RegExp("([\\d.]+,\\d{2})\\s+Euro\\s+(\\d{1,2})\\s+(" + MESI + ")\\s+(20\\d{2})\\s+([\\d.]+)\\s+(?:kWh|Smc)", "i"));
  if (box) {
    imp = box[1];
    scad = box[4] + "-" + _pad(mlist.indexOf(box[3].toLowerCase()) + 1) + "-" + _pad(box[2]);
    cons = box[5];
  }
  var tot = t.match(/TOTALE DA PAGARE\s*=?\s*([\d.]+,\d{2})/i);
  if (tot) imp = tot[1];
  if (!cons){ var c = t.match(/([\d.]+)\s*kWh\s*x/i) || t.match(/([\d.]+)\s*Smc\s*x/i); if (c) cons = c[1]; }
  o.importo = imp ? String(parseNumIt(imp)) : "";
  o.consumo = cons ? String(parseNumIt(cons)) : "";
  o.scadenza = scad;
  var nf = t.match(/nr\.\s*([\d\-]+)\s+del/i); o.numero = nf ? nf[1] : "";
  var qf = 0, found = false;
  var qfm = t.match(/Quota fissa(?:\s+e\s+Quota potenza)?\s+\d+\s*mes[ei]?\s*x?\s*[\d.,]+\s*€?\/?mese\s*\+?\s*([\d.]+,\d{2})/i);
  if (qfm){ qf += parseNumIt(qfm[1]) || 0; found = true; }
  var potm = t.match(/[\d.]+,\d{2}\s*kW\s+per\s+\d+\s*mes[ei]?\s*x?\s*[\d.,]+\s*€\/kW\/mese\s*\+?\s*([\d.]+,\d{2})/i);
  if (potm){ qf += parseNumIt(potm[1]) || 0; found = true; }
  o.quotaFissa = found ? String(qf) : "";
  return o;
}
function _statoCorrente(){ var r = apiCarica(); try { return r ? JSON.parse(r) : {}; } catch (e) { return {}; } }
function _matchUtenza(codice, st){
  if (!codice) return null;
  var n = normEnergia(codice), us = (st && st.utenze) || [];
  for (var i = 0; i < us.length; i++) if (normEnergia(us[i].codice) === n) return us[i].id;
  return null;
}

// DIAGNOSI: scrive in D1 del Foglio il testo grezzo di un PDF (per affinare il parser).
function vediTesto(){
  var it = _cartellaPdf().getFiles();
  if (!it.hasNext()) return "nessun PDF nella cartella";
  var file = it.next();
  var testo = _estraiTestoPdf(file.getBlob(), file.getName());
  _schedaDati().getRange('C1').setValue("TESTO: " + file.getName());
  _schedaDati().getRange('D1').setValue(String(testo).slice(0, 12000));
  return "ok";
}

// Aggiunge le parrocchie/utenze emerse dalle bollette ma mancanti in anagrafica.
function aggiungiParrocchie(){
  var st = _statoCorrente();
  st.intestatari = st.intestatari || [];
  st.utenze = st.utenze || [];
  function addI(o){ if(!st.intestatari.some(function(x){return x.id===o.id;})) st.intestatari.push(o); }
  function addU(o){ if(!st.utenze.some(function(x){return x.id===o.id;})) st.utenze.push(o); }
  addI({id:"int-lorenzo",nome:"Parrocchia San Lorenzo",cf:"91002880507",fornitore:"Energentium",codiceCliente:"526446"});
  addU({id:"u-1888",intestatario:"int-lorenzo",tipo:"elettrico",luogo:"Via Sanminiatese 92 (piano)",indirizzo:"Via Sanminiatese 92",codice:"IT001E45092896",pde:"1888",potenza:3,note:""});
  addU({id:"u-1889",intestatario:"int-lorenzo",tipo:"elettrico",luogo:"Via Sanminiatese 92",indirizzo:"Via Sanminiatese 92",codice:"IT001E45092897",pde:"1889",potenza:6,note:""});
  addI({id:"int-pietro",nome:"Parrocchia di San Pietro alle Fonti",cf:"91001550507",fornitore:"Energentium",codiceCliente:"526460"});
  addU({id:"u-1890",intestatario:"int-pietro",tipo:"elettrico",luogo:"Via Sanminiatese 116",indirizzo:"Via Sanminiatese 116",codice:"IT001E45092906",pde:"1890",potenza:3,note:""});
  addU({id:"u-1891",intestatario:"int-pietro",tipo:"elettrico",luogo:"Chiesa San Pietro (Via S. Pietro 15)",indirizzo:"Via S. Pietro 15",codice:"IT001E45092834",pde:"1891",potenza:15,note:""});
  apiSalva(JSON.stringify(st));
  return "parrocchie aggiunte";
}

// Aggiunge i due contatori gas di San Domenico (1883/1884) se mancanti.
function aggiungiContatoriMancanti(){
  var st=_statoCorrente(); st.utenze=st.utenze||[];
  function addU(o){ if(!st.utenze.some(function(x){return x.id===o.id;})) st.utenze.push(o); }
  addU({id:"u-1883",intestatario:"int-annunziata",tipo:"gas",luogo:"Via Largo San Domenico 2 (gas 1883)",indirizzo:"Via Largo San Domenico 2",codice:"15104203604752",pde:"1883",potenza:null,note:""});
  addU({id:"u-1884",intestatario:"int-annunziata",tipo:"gas",luogo:"Via Largo San Domenico 2 (gas 1884)",indirizzo:"Via Largo San Domenico 2",codice:"15104203604750",pde:"1884",potenza:null,note:""});
  apiSalva(JSON.stringify(st));
  return "contatori 1883/1884 aggiunti";
}

// Svuota TUTTE le bollette (per ricaricare i PDF puliti col parser aggiornato). Le utenze restano.
function svuotaBollette(){
  var st = _statoCorrente();
  st.bollette = [];
  apiSalva(JSON.stringify(st));
  return "bollette svuotate";
}
