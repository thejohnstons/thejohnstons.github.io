/* =====================================================================
   family.js: shared by the Kids' corner, Someday list and Family calendar.
   Sign-in, the family database (households/johnston), each person's
   style, and the read-only Google Calendar + Google Tasks connection.
   ===================================================================== */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache,
  collection, doc, setDoc, deleteDoc, getDoc, getDocs, onSnapshot, writeBatch, query, where }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const DEMO = new URLSearchParams(location.search).has('demo');
const cfg = window.FIREBASE_CONFIG || {};
const HOUSEHOLD = window.HOUSEHOLD_ID || 'johnston';
let auth = null, db = null;
if(!DEMO && cfg.apiKey){
  const app = initializeApp(cfg);
  auth = getAuth(app);
  try{ db = initializeFirestore(app, {localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})}); }
  catch(e){ db = initializeFirestore(app, {localCache: memoryLocalCache()}); }
  getRedirectResult(auth).catch(()=>{});
}
export const hasConfig = () => !!(cfg && cfg.apiKey);

/* ---------- Helpers ---------- */
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2,'0');
export const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
export const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

/* ---------- Sign-in ---------- */
export function watchUser(cb){
  if(DEMO){ setTimeout(()=>cb({email:'demo', displayName:'Demo'}), 0); return; }
  if(!auth){ setTimeout(()=>cb(null, 'noConfig'), 0); return; }
  onAuthStateChanged(auth, u=>cb(u));
}
export async function signIn(){
  const provider = new GoogleAuthProvider(); provider.setCustomParameters({prompt:'select_account'});
  try{ await signInWithPopup(auth, provider); }
  catch(e){
    if(e && (e.code==='auth/popup-blocked' || e.code==='auth/operation-not-supported-in-this-environment')) await signInWithRedirect(auth, provider);
    else if(e && e.code!=='auth/popup-closed-by-user' && e.code!=='auth/cancelled-popup-request') throw e;
  }
}
export function logOut(){ clearToken(); if(DEMO){ location.href = location.pathname; return; } return signOut(auth); }

/* ---------- Database (with an in-memory stand-in for demo mode) ---------- */
const mem = {};
const path = (c, id) => id ? [...['households', HOUSEHOLD], c, id] : [...['households', HOUSEHOLD], c];
export function listen(c, cb, onErr){
  if(DEMO){ mem[c] = mem[c] || {}; const fire=()=>cb(Object.entries(mem[c]).map(([id,v])=>({...v, id}))); (mem.__subs = mem.__subs || []).push([c, fire]); setTimeout(fire,0); return ()=>{}; }
  return onSnapshot(collection(db, ...path(c)), snap=>cb(snap.docs.map(d=>({...d.data(), id:d.id}))), err=>onErr && onErr(err));
}
function demoFire(c){ (mem.__subs||[]).filter(([cc])=>cc===c).forEach(([,f])=>f()); }
export async function put(c, item){
  const {id, ...rest} = item;
  if(DEMO){ mem[c] = mem[c] || {}; mem[c][id] = rest; demoFire(c); return; }
  await setDoc(doc(db, ...path(c, id)), rest);
}
export async function patch(c, id, data){
  if(DEMO){ mem[c] = mem[c] || {}; mem[c][id] = {...(mem[c][id]||{}), ...data}; demoFire(c); return; }
  await setDoc(doc(db, ...path(c, id)), data, {merge:true});
}
export async function remove(c, id){
  if(DEMO){ if(mem[c]) delete mem[c][id]; demoFire(c); return; }
  await deleteDoc(doc(db, ...path(c, id)));
}
export async function getOne(c, id){
  if(DEMO){ const v = mem[c] && mem[c][id]; return v ? {...v, id} : null; }
  const d = await getDoc(doc(db, ...path(c, id))); return d.exists() ? {...d.data(), id:d.id} : null;
}
export async function getAll(c, field, value){
  if(DEMO){ return Object.entries(mem[c]||{}).map(([id,v])=>({...v,id})).filter(x=>field ? x[field]===value : true); }
  const q = field ? query(collection(db, ...path(c)), where(field,'==',value)) : collection(db, ...path(c));
  const snap = await getDocs(q); return snap.docs.map(d=>({...d.data(), id:d.id}));
}
// Writes starting data the first time only; a marker stops it ever running again.
export async function seedOnce(marker, writes){
  if(DEMO){ if(mem.__seeded && mem.__seeded[marker]) return; (mem.__seeded = mem.__seeded || {})[marker]=1;
    for(const [c, items] of writes){ mem[c] = mem[c] || {}; items.forEach(({id,...r})=>{ mem[c][id]=r; }); demoFire(c); } return; }
  const m = await getDoc(doc(db, ...path('meta', marker)));
  if(m.exists()) return;
  const b = writeBatch(db);
  for(const [c, items] of writes) items.forEach(({id,...r})=>b.set(doc(db, ...path(c, id)), r));
  b.set(doc(db, ...path('meta', marker)), {at:Date.now()});
  await b.commit();
}

/* ---------- Each person's style (shared by all the family apps) ---------- */
export const currentStyle = () => document.documentElement.dataset.style==='green' ? 'green' : 'default';
export function applyStyle(st){
  const s = st==='green' ? 'green' : 'default';
  document.documentElement.dataset.style = s;
  try{ localStorage.setItem('johnston-style', s); }catch(e){}
}
export async function loadStyle(email){
  if(DEMO || !email) return currentStyle();
  try{
    const d = await getDoc(doc(db, ...path('prefs', String(email).toLowerCase())));
    const fallback = (window.STYLE_BY_EMAIL||{})[String(email).toLowerCase()];
    applyStyle((d.exists() && d.data().style) || fallback || 'default');
  }catch(e){}
  return currentStyle();
}
export async function saveStyle(email, st){
  applyStyle(st);
  if(DEMO || !email) return;
  try{ await setDoc(doc(db, ...path('prefs', String(email).toLowerCase())), {style:st}, {merge:true}); }catch(e){}
}
export function stylePicker(onPick){
  const cur = currentStyle();
  return `My style: <button class="style-btn" aria-pressed="${cur==='default'}" data-style-pick="default">Original</button> · <button class="style-btn" aria-pressed="${cur==='green'}" data-style-pick="green">Classic green</button>`;
}

/* ---------- Google Calendar + Tasks (one connection, shared with the dashboard) ---------- */
export const CAL_CLIENT_ID = window.GOOGLE_CALENDAR_CLIENT_ID || '';
export const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks';
export function savedToken(){
  try{ const t = JSON.parse(localStorage.getItem('jd-cal-token')||'null'); return t && t.exp > Date.now()+60000 ? t : null; }catch(e){ return null; }
}
export function saveToken(token, secs, scope){ try{ localStorage.setItem('jd-cal-token', JSON.stringify({token, exp:Date.now()+(secs||3600)*1000, scope:scope||''})); }catch(e){} }
export function clearToken(){ try{ localStorage.removeItem('jd-cal-token'); }catch(e){} }
let tokenClient = null, pendingCb = null;
// Needs a tap (a browser rule for Google's pop-up). Calls back with the token, or null.
export function connectGoogle(cb, email){
  if(!CAL_CLIENT_ID){ cb(null, 'notSetUp'); return; }
  if(!(window.google && google.accounts && google.accounts.oauth2)){ cb(null, 'loading'); return; }
  pendingCb = cb;
  if(!tokenClient) tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CAL_CLIENT_ID, scope: SCOPES,
    callback: resp=>{ const f = pendingCb; pendingCb = null;
      if(resp.error){ f && f(null, 'refused'); return; }
      saveToken(resp.access_token, +resp.expires_in, resp.scope); f && f(resp.access_token); }
  });
  tokenClient.requestAccessToken({prompt:'', hint: email || undefined});
}
export async function gfetch(url, token, opts={}){
  const r = await fetch(url, {...opts, headers:{Authorization:'Bearer '+token, 'Content-Type':'application/json', ...(opts.headers||{})}});
  if(r.status===401){ clearToken(); const e=new Error('expired'); e.code=401; throw e; }
  if(!r.ok){ const e=new Error('http '+r.status); e.code=r.status; throw e; }
  return r.status===204 ? null : r.json();
}
