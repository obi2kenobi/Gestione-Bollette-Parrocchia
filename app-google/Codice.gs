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
      var c = parseBolletta(blocchi[i]);
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
// Rimuove gli escape markdown ("\=" -> "=", "\+" -> "+", ...): a seconda di come
// viene letto il PDF il testo puo' averli; cosi' le regex valgono in ogni caso.
function _deEscape(t){ return String(t).replace(/\\([=+\-*_\[\]<>!#`])/g, "$1"); }

function parseEnergentium(testo){
  var t = _deEscape(String(testo)).replace(/\s+/g, " ");
  var o = { fornitore: "energentium" };

  // tipo (luce/gas)
  o.tipo = /Codice PDR|GAS NATURALE/i.test(t) ? "gas" : "elettrico";

  // anagrafica intestatario
  var inte = t.match(/Intestatario:\s*([\s\S]+?)\s*Sede legale/i);
  o.intestatario = inte ? inte[1].trim() : "";
  var cc = t.match(/Codice cliente:\s*(\d+)/i);
  o.codiceCliente = cc ? cc[1] : "";
  var cf = t.match(/C\.F\.\/P\.IVA:\s*(\d{11,16})/i);
  o.cf = cf ? cf[1] : "";

  // codice fornitura (POD elettrico / PDR gas) e PDE
  var podLab = t.match(/Codice POD[:\s]+(IT\s?0{0,2}1E\s?\d{8,9})/i);
  var pdrLab = t.match(/Codice PDR[:\s]+(\d{14,15})/i);
  var pod = t.match(/IT\s?0{0,2}1E\s?\d{8,9}/i);
  o.codice = podLab ? podLab[1].replace(/\s/g, "") : pdrLab ? pdrLab[1] : pod ? pod[0].replace(/\s/g, "") : "";
  var pde = t.match(/PDE:\s*(\d+)/i);
  o.pde = pde ? pde[1] : "";

  // periodo
  var per = t.match(/Periodo oggetto di fatturazione[:\s]+(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})/i);
  o.dataInizio = per ? toISO(per[1]) : "";
  o.dataFine = per ? toISO(per[2]) : "";

  // riquadro di sintesi: importo Euro gg mese aaaa consumo (kWh|Smc)
  var MESI = "Gennaio|Febbraio|Marzo|Aprile|Maggio|Giugno|Luglio|Agosto|Settembre|Ottobre|Novembre|Dicembre";
  var mlist = ["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
  var imp = "", cons = "", scad = "";
  var box = t.match(new RegExp("([\\d.]+,\\d{2})\\s+Euro\\s+(\\d{1,2})\\s+(" + MESI + ")\\s+(20\\d{2})\\s+([\\d.]+)\\s+(?:kWh|Smc)", "i"));
  if (box) {
    imp = box[1];
    scad = box[4] + "-" + _pad(mlist.indexOf(box[3].toLowerCase()) + 1) + "-" + _pad(box[2]);
    cons = box[5];
  }
  var tot = t.match(/TOTALE DA PAGARE\s*=?\s*([\d.]+,\d{2})/i);
  if (tot) imp = tot[1];
  if (cons === ""){ var c = t.match(/([\d.]+)\s*kWh\s*x/i) || t.match(/([\d.]+)\s*Smc\s*x/i); if (c) cons = c[1]; }
  o.importo = imp ? parseNumIt(imp) : null;
  o.consumo = cons !== "" ? parseNumIt(cons) : null;
  o.scadenza = scad;

  var nf = t.match(/nr\.\s*([\d\-]+)\s+del/i); o.numero = nf ? nf[1] : "";

  // quota fissa (+ quota potenza per la luce)
  var qf = 0, found = false;
  var qfm = t.match(/Quota fissa(?:\s+e\s+Quota potenza)?\s+\d+\s*mes[ei]?\s*x?\s*[\d.,]+\s*€?\/?mese\s*\+?\s*([\d.]+,\d{2})/i);
  if (qfm){ qf += parseNumIt(qfm[1]) || 0; found = true; }
  var potm = t.match(/[\d.]+,\d{2}\s*kW\s+per\s+\d+\s*mes[ei]?\s*x?\s*[\d.,]+\s*€\/kW\/mese\s*\+?\s*([\d.]+,\d{2})/i);
  if (potm){ qf += parseNumIt(potm[1]) || 0; found = true; }
  o.quotaFissa = found ? qf : null;

  // campi aggiuntivi per le analisi
  var pu = t.match(/Quota per consumi\s+[\d.]+\s*(?:kWh|Smc)\s*x\s*([\d.,]+)\s*€\/(?:kWh|Smc)/i);
  o.prezzoUnitario = pu ? parseNumIt(pu[1]) : null;
  var ca = t.match(/Consumo annuo aggiornato:?\s*([\d.]+)\s*(?:kWh|Smc)/i);
  o.consumoAnnuo = ca ? parseNumIt(ca[1]) : null;
  var sa = t.match(/Spesa annua sostenuta:?\s*([\d.]+,\d{2})\s*€/i);
  o.spesaAnnua = sa ? parseNumIt(sa[1]) : null;
  var po = t.match(/Potenza Impegnata:?\s*([\d.]+,\d{2})\s*kW/i);
  o.potenza = po ? parseNumIt(po[1]) : null;
  var off = t.match(/Offerta:\s*(.+?)\s*Data di scadenza/i);
  o.offerta = off ? off[1].trim() : "";
  var ind = t.match(/Indirizzo di fornitura:\s*(.+?)\s*-\s*\d{5}\s/i);
  o.indirizzoFornitura = ind ? ind[1].trim() : "";
  o.avvisoInsoluti = /risultano non pagate/i.test(t);

  return o;
}

// Riconosce il fornitore. Oggi: Energentium. Gli altri -> "sconosciuto"
// (vengono segnalati, non parsati a caso).
function rilevaFornitore(testo){
  if (/energentium/i.test(String(testo))) return "energentium";
  return "sconosciuto";
}
var PARSERS = { energentium: parseEnergentium };
// Punto d'ingresso: per ogni blocco rileva il fornitore e applica il parser giusto.
function parseBolletta(blocco){
  var fornitore = rilevaFornitore(blocco);
  if (PARSERS[fornitore]) { var o = PARSERS[fornitore](blocco); o.fornitore = fornitore; return o; }
  return { fornitore: "sconosciuto", riconosciuta: false };
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

// Rimuove le parrocchie "fantasma" (senza utenze collegate e senza codice cliente).
function pulisciAnagrafica(){
  var st=_statoCorrente(); st.intestatari=st.intestatari||[]; st.utenze=st.utenze||[];
  var usati={}; st.utenze.forEach(function(u){usati[u.intestatario]=true;});
  var prima=st.intestatari.length;
  st.intestatari=st.intestatari.filter(function(x){ return usati[x.id] || (x.codiceCliente && x.codiceCliente!==""); });
  apiSalva(JSON.stringify(st));
  return "rimossi "+(prima-st.intestatari.length)+" intestatari fantasma";
}

// ---- IMPORT IN BLOCCO da una cartella Drive (stessa logica incrementale del caricamento UI) ----
function _recDaParse(c, url, nome){
  return { id:"", utenza:"", numero:c.numero||"", fornitore:c.fornitore||"",
    dataInizio:c.dataInizio||"", dataFine:c.dataFine||"",
    consumo:(c.consumo!=null?c.consumo:""), importo:(c.importo!=null?c.importo:""),
    quotaFissa:(c.quotaFissa!=null?c.quotaFissa:""), scadenza:c.scadenza||"",
    prezzoUnitario:(c.prezzoUnitario!=null?c.prezzoUnitario:""), consumoAnnuo:(c.consumoAnnuo!=null?c.consumoAnnuo:""),
    spesaAnnua:(c.spesaAnnua!=null?c.spesaAnnua:""), avvisoInsoluti:!!c.avvisoInsoluti,
    pagata:false, linkDrive:url||"", fileNome:nome||"" };
}
function _trovaOCreaIntStato(c, st, cr){
  var cod=c.codiceCliente||"";
  for(var i=0;i<st.intestatari.length;i++) if(cod && st.intestatari[i].codiceCliente===cod) return st.intestatari[i].id;
  if(c.intestatario) for(var j=0;j<st.intestatari.length;j++) if((st.intestatari[j].nome||"").toUpperCase()===c.intestatario.toUpperCase()) return st.intestatari[j].id;
  var id="int-"+(cod||("x"+st.intestatari.length));
  st.intestatari.push({id:id,nome:c.intestatario||("Cliente "+cod),cf:c.cf||"",codiceCliente:cod,fornitore:"Energentium"});
  cr.intestatari++; return id;
}
// Aggancia la bolletta a un'utenza: se il POD/PDR esiste, la riusa col suo
// intestatario; SOLO se l'utenza è nuova crea (o ritrova) la parrocchia.
function _agganciaUtenza(c, st, cr){
  if(!c.codice) return "";
  var n=normEnergia(c.codice);
  for(var i=0;i<st.utenze.length;i++){ var u=st.utenze[i]; if(normEnergia(u.codice)===n){
    if((u.potenza==null||u.potenza==="")&&c.potenza!=null) u.potenza=c.potenza;
    if(!u.indirizzo&&c.indirizzoFornitura) u.indirizzo=c.indirizzoFornitura;
    if(!u.pde&&c.pde) u.pde=c.pde; return u.id; } }
  var intId=_trovaOCreaIntStato(c, st, cr);
  var id="u-"+(c.pde||("x"+st.utenze.length));
  for(var k=0;k<st.utenze.length;k++) if(st.utenze[k].id===id){ id="u-x"+st.utenze.length; break; }
  var luogo=c.indirizzoFornitura?(c.indirizzoFornitura+(c.pde?" (PDE "+c.pde+")":"")):("PDE "+(c.pde||"?"));
  st.utenze.push({id:id,intestatario:intId,tipo:c.tipo||"elettrico",luogo:luogo,indirizzo:c.indirizzoFornitura||"",codice:c.codice,pde:c.pde||"",potenza:(c.potenza!=null?c.potenza:null),note:""});
  cr.utenze++; return id;
}
function _esisteBollettaStato(rec, st){
  for(var i=0;i<st.bollette.length;i++){ var b=st.bollette[i];
    if(rec.numero && b.numero){ if(String(b.numero).trim()===String(rec.numero).trim()) return true; }
    else if(rec.dataInizio && b.utenza===rec.utenza && b.dataInizio===rec.dataInizio) return true; }
  return false;
}
function _importaFile(file, st, cr){
  var url="https://drive.google.com/file/d/"+file.getId()+"/view";
  var testo=_estraiTestoPdf(file.getBlob(), file.getName());
  var blocchi=splitBollette(testo);
  for(var i=0;i<blocchi.length;i++){
    var c=parseBolletta(blocchi[i]);
    var rec=_recDaParse(c, url, file.getName());
    if(c.fornitore!=="energentium"){ rec.utenza=""; rec.note="fornitore non riconosciuto — compila a mano"; rec.id="b-"+new Date().getTime()+"-"+Math.floor(Math.random()*1e6); st.bollette.push(rec); cr.nonric++; continue; }
    rec.utenza=_agganciaUtenza(c, st, cr);
    if(_esisteBollettaStato(rec, st)){ cr.dup++; continue; }
    rec.id="b-"+new Date().getTime()+"-"+Math.floor(Math.random()*1e6);
    st.bollette.push(rec); cr.bollette++;
  }
}
function _importaRic(folder, st, cr){
  var files=folder.getFilesByType("application/pdf");
  while(files.hasNext()){ var f=files.next(); cr.file++; try{ _importaFile(f, st, cr); }catch(e){ cr.errori++; } }
  var subs=folder.getFolders();
  while(subs.hasNext()) _importaRic(subs.next(), st, cr);
}
// Importa ricorsivamente tutti i PDF di una cartella Drive. Sicuro da rilanciare (dedup per n° fattura).
function importaCartella(folderId){
  var st=_statoCorrente();
  st.intestatari=st.intestatari||[]; st.utenze=st.utenze||[]; st.bollette=st.bollette||[]; st.azioni=st.azioni||[];
  var cr={file:0,bollette:0,intestatari:0,utenze:0,dup:0,nonric:0,errori:0};
  _importaRic(DriveApp.getFolderById(folderId), st, cr);
  apiSalva(JSON.stringify(st));
  return cr;
}
// Comando "uno e via": svuota le bollette e reimporta l'intero archivio storico.
function reimportaArchivio(){
  svuotaBollette();
  var giugno = importaCartella("111rRESpsxfALneO7bvQ6I0CMzy1LmmBW"); // giugno 2026 bollete
  var storico = importaCartella("1Hgs3jFSdv1VQE5UBuZKWP5mBaLnLbNSi"); // BOLLETTE (GAS+LUCE)
  var pulizia = pulisciAnagrafica();
  var esito = { giugno: giugno, storico: storico, pulizia: pulizia };
  Logger.log(JSON.stringify(esito));
  return esito;
}
