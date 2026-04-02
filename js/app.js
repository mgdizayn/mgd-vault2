// ══════════════════════════════════════════════════════════════════
//  MGD Vault — App Controller  v2.1
//  Flyout item → filtre → liste/arama/ayarlar tam bağlı
// ══════════════════════════════════════════════════════════════════

// ── Utilities ────────────────────────────────────────────────────
function toast(msg,dur){
  var t=document.getElementById('toast');
  if(!t)return;
  t.textContent=msg;t.classList.add('show');
  clearTimeout(window._tT);
  window._tT=setTimeout(function(){t.classList.remove('show');},dur||2400);
}
function escH(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

// ── Flyout Item → Filter mapping ─────────────────────────────────
// Her flyout item için {title, filter(note,decTitle,decBody)} tanımı
var ITEM_DEFS = {
  // NOTLAR
  'all':      { title:'Tüm Notlar',      filter:function(n){return true;} },
  'recent':   { title:'Son Eklenenler',  filter:function(n){return true;}, sort:'recent' },
  'ideas':    { title:'Fikirler',        filter:function(n){return n.category==='ideas';},    newCat:'ideas' },
  'work':     { title:'İş Notları',      filter:function(n){return n.category==='work';},     newCat:'work' },
  'personal': { title:'Kişisel',         filter:function(n){return n.category==='personal';}, newCat:'personal' },
  // AJANDA
  'today':    { title:'Bugün',           filter:function(n){ return sameDay(n.updatedAt, 0); } },
  'week':     { title:'Bu Hafta',        filter:function(n){ return withinDays(n.updatedAt, 7); } },
  'month':    { title:'Bu Ay',           filter:function(n){ return sameMonth(n.updatedAt); } },
  // SABİTLER
  'pinall':   { title:'Sabitlenmiş',     filter:function(n){return n.pinned===true;} },
  'pinimp':   { title:'Önemli',          filter:function(n){return n.pinned===true;} },
  // ARAMA
  'srchall':  { title:'Tümünde Ara',     filter:function(n){return true;}, mode:'search' },
  'srchday':  { title:'Bugün — Ara',     filter:function(n){return sameDay(n.updatedAt,0);}, mode:'search' },
  // VAULT
  'vlt1':     { title:'Gizli Notlar',    filter:function(n){return n.category==='vault';},     newCat:'vault' },
  'vlt2':     { title:'Şifreler',        filter:function(n){return n.category==='passwords';}, newCat:'passwords' },
  // AYARLAR
  'st1':      { title:'Hesap',           mode:'settings' },
  'st2':      { title:'Güvenlik',        mode:'settings' },
};

// ── Date helpers ─────────────────────────────────────────────────
function sameDay(iso, offsetDays){
  var d=new Date(iso), now=new Date();
  now.setDate(now.getDate()+offsetDays);
  return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()&&d.getDate()===now.getDate();
}
function withinDays(iso, days){
  return (Date.now()-new Date(iso).getTime()) < days*86400000;
}
function sameMonth(iso){
  var d=new Date(iso), now=new Date();
  return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();
}

// ── Active filter state ───────────────────────────────────────────
var _activeFilter = { id:'all', def: ITEM_DEFS['all'] };

function setActiveFilter(itemId){
  var def = ITEM_DEFS[itemId] || ITEM_DEFS['all'];
  _activeFilter = { id:itemId, def:def };
}

// ── Open from flyout item ─────────────────────────────────────────
function openFromFlyout(item){
  var def = ITEM_DEFS[item.id] || ITEM_DEFS['all'];

  // Settings items → settings screen
  if(def.mode==='settings'){
    Router.go('pgSettings');
    return;
  }

  // Search items → open list in search mode
  if(def.mode==='search'){
    setActiveFilter(item.id);
    document.getElementById('listTitle').textContent = def.title;
    Router.go('pgList');
    setTimeout(function(){
      var s=document.getElementById('listSearch');
      if(s){s.value='';s.focus();}
    },360);
    loadList('');
    return;
  }

  // Normal list
  setActiveFilter(item.id);
  document.getElementById('listTitle').textContent = def.title;
  Router.go('pgList');
  loadList('');
}

// ── Lock / Setup UI ──────────────────────────────────────────────
function buildSetupForm(){
  document.getElementById('lockSub').textContent='Vault\'ı ilk kez kuruyorsunuz.';
  document.getElementById('bioRingWrap').style.display='none';
  document.getElementById('lockDivider').style.display='none';
  document.getElementById('lockForm').innerHTML=
    '<div style="background:rgba(232,137,59,0.08);border:1px solid rgba(232,137,59,0.2);border-radius:10px;padding:11px 14px;font-size:0.72rem;color:rgba(232,137,59,0.85);line-height:1.6;margin-bottom:4px;">'+
    '⚠️ Bu parola <strong>kurtarılamaz</strong>. Kaybedersen notlarına erişemezsin.</div>'+
    '<input class="input" type="password" id="fPass"  placeholder="Master parola (min. 6 karakter)" autocomplete="new-password" style="margin-top:4px;">'+
    '<input class="input" type="password" id="fPass2" placeholder="Parolayı onayla"                 autocomplete="new-password" style="margin-top:8px;">'+
    '<button class="btn btn-dark" id="btnSetup" style="width:100%;height:48px;margin-top:10px;border-radius:14px;font-size:0.9rem;">Vault\'u Kur &amp; Parmak İzi Ekle</button>';
  document.getElementById('lockFooter').style.display='none';

  document.getElementById('btnSetup').addEventListener('click',async function(){
    var p1=document.getElementById('fPass').value;
    var p2=document.getElementById('fPass2').value;
    if(p1.length<6){toast('En az 6 karakter gerekli');return;}
    if(p1!==p2){toast('Parolalar eşleşmiyor');return;}
    this.textContent='Kuruluyor…';this.disabled=true;
    await VaultCrypto.setup(p1);
    sessionStorage.setItem('mgd_sk',p1);
    if(VaultAuth.supported()){
      try{await VaultAuth.register();toast('Parmak izi kaydedildi ✓');}
      catch(e){toast('Biyometrik atlandı');}
    }
    initDial();
  });
}

function buildUnlockForm(){
  document.getElementById('lockSub').textContent='Hoş geldin 👋';
  var hasBio=VaultAuth.supported()&&VaultAuth.hasCred();
  document.getElementById('bioRingWrap').style.display=hasBio?'block':'none';
  document.getElementById('lockDivider').style.display=hasBio?'flex':'none';
  document.getElementById('lockForm').innerHTML=
    '<input class="input" type="password" id="fPass" placeholder="Master parola" autocomplete="current-password">'+
    '<button class="btn btn-dark" id="btnUnlock" style="width:100%;height:48px;margin-top:8px;border-radius:14px;font-size:0.9rem;">Aç</button>';

  document.getElementById('fPass').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('btnUnlock').click();});
  document.getElementById('btnUnlock').addEventListener('click',async function(){
    var p=document.getElementById('fPass').value;
    if(!p){toast('Parola girin');return;}
    this.textContent='Açılıyor…';this.disabled=true;
    var ok=await VaultCrypto.unlock(p);
    if(ok){sessionStorage.setItem('mgd_sk',p);document.getElementById('fPass').value='';initDial();}
    else{toast('Yanlış parola');this.textContent='Aç';this.disabled=false;}
  });

  var lf=document.getElementById('lockFooter');
  lf.style.display='block';
  lf.textContent='';

  if(hasBio) setTimeout(doBio,600);
}

async function doBio(){
  var btn=document.getElementById('btnBio');
  if(!btn)return;
  btn.classList.add('scanning');
  try{
    var ok=await VaultAuth.authenticate();
    btn.classList.remove('scanning');
    if(ok){
      var cached=sessionStorage.getItem('mgd_sk');
      if(cached){var ok2=await VaultCrypto.unlock(cached);if(ok2){initDial();return;}}
      toast('Parolayı bir kez girin');
    }
  }catch(e){btn.classList.remove('scanning');toast('Biyometrik: '+e.message);}
}

// ── Dial Screen ──────────────────────────────────────────────────
var _dialInited=false;
function initDial(){
  Router.go('pgDial');

  // Date/greeting
  var h=new Date().getHours();
  var g=h<6?'İyi geceler 🌙':h<12?'Günaydın ☀️':h<18?'İyi günler 👋':'İyi akşamlar 🌙';
  document.getElementById('dialGreet').textContent=g;
  var d=new Date();
  var days=['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
  var months=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  document.getElementById('dialDate').textContent=days[d.getDay()]+', '+d.getDate()+' '+months[d.getMonth()]+' '+d.getFullYear();

  if(_dialInited) return;  // prevent double-binding
  _dialInited=true;

  // Init dial with flyout item callback
  Dial.init({
    onSelect: function(seg){ /* segment changed — flyout already re-rendered by dial */ },
    onItemSelect: function(item){ openFromFlyout(item); }
  });

  // Bottom buttons
  document.getElementById('btnOpenList').addEventListener('click',function(){
    var item=Dial.getActiveFlyoutItem();
    if(item) openFromFlyout(item);
  });
  document.getElementById('btnNewNote').addEventListener('click',function(){
    var item=Dial.getActiveFlyoutItem();
    var cat=(item&&ITEM_DEFS[item.id]&&ITEM_DEFS[item.id].newCat)||Dial.getActive().id;
    Editor.openNew(cat);
  });
  document.getElementById('btnDialSearch').addEventListener('click',function(){
    setActiveFilter('srchall');
    document.getElementById('listTitle').textContent='Tümünde Ara';
    Router.go('pgList');
    setTimeout(function(){var s=document.getElementById('listSearch');if(s){s.value='';s.focus();}},360);
    loadList('');
  });
  document.getElementById('btnDialSettings').addEventListener('click',function(){Router.go('pgSettings');});
  document.getElementById('btnDialLock').addEventListener('click',doLock);
}

// ── Note List ─────────────────────────────────────────────────────
async function loadList(search){
  var listEl=document.getElementById('noteList');
  listEl.innerHTML='<div style="padding:30px;text-align:center;color:var(--t-lo);font-size:0.78rem;">Yükleniyor…</div>';

  var all=await VaultStorage.getAllNotes();
  var def=_activeFilter.def;

  // Apply filter
  var filtered=all.filter(def.filter||function(){return true;});

  // Decrypt
  var rendered=[];
  for(var i=0;i<filtered.length;i++){
    var n=filtered[i];
    try{
      var title=await VaultCrypto.decryptText(n.encTitle);
      var body =await VaultCrypto.decryptText(n.encBody);
      if(search&&search.trim()){
        var q=search.toLowerCase();
        if(!title.toLowerCase().includes(q)&&!body.toLowerCase().includes(q)) continue;
      }
      rendered.push({note:n,title:title,body:body});
    }catch(e){}
  }

  // Sort
  if(def.sort==='recent'){
    rendered.sort(function(a,b){return new Date(b.note.createdAt)-new Date(a.note.createdAt);});
  } else {
    rendered.sort(function(a,b){
      if(a.note.pinned&&!b.note.pinned)return -1;
      if(!a.note.pinned&&b.note.pinned)return 1;
      return new Date(b.note.updatedAt)-new Date(a.note.updatedAt);
    });
  }

  listEl.innerHTML='';

  if(!rendered.length){
    var emptyLabel=def.title||'bu filtre';
    listEl.innerHTML=
      '<div class="note-empty">'+
        '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'+
        '<p>'+escH(emptyLabel)+' için not yok</p>'+
        (def.newCat?'<button class="btn btn-dark" onclick="Editor.openNew(\''+def.newCat+'\')" style="margin-top:8px;height:38px;font-size:0.78rem;border-radius:10px;padding:0 16px;">+ İlk notu ekle</button>':'')+
      '</div>';
    return;
  }

  rendered.forEach(function(r){
    var card=document.createElement('div');
    card.className='note-card';
    var d=new Date(r.note.updatedAt);
    var ds=d.toLocaleDateString('tr-TR',{day:'numeric',month:'short'});
    var preview=r.body.replace(/[#*_`>[\]]/g,'').slice(0,120);

    card.innerHTML=
      '<div class="nc-header">'+
        '<div class="nc-title">'+escH(r.title)+'</div>'+
        (r.note.pinned?'<div class="nc-pin">📌</div>':'')+
      '</div>'+
      (preview?'<div class="nc-preview">'+escH(preview)+'</div>':'')+
      '<div class="nc-footer">'+
        '<div class="nc-date">'+ds+'</div>'+
        '<div class="nc-cat">'+escH(r.note.category)+'</div>'+
      '</div>';

    card.addEventListener('click',function(){openReader(r.note);});
    listEl.appendChild(card);
  });
}

// ── Note Reader ───────────────────────────────────────────────────
var _readNote=null;
async function openReader(note){
  _readNote=note;
  Router.go('pgReader');
  document.getElementById('readerTitle').textContent='';
  document.getElementById('readerBody').innerHTML='<div style="padding:20px;text-align:center;color:var(--t-lo);font-size:0.78rem;">Yükleniyor…</div>';
  try{
    var title=await VaultCrypto.decryptText(note.encTitle);
    var body =await VaultCrypto.decryptText(note.encBody);
    document.getElementById('readerTitle').textContent=title;
    document.getElementById('readerBody').innerHTML=MD.render(body);
    var d=new Date(note.updatedAt);
    document.getElementById('readerDate').textContent=d.toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'});
    document.getElementById('readerCat').textContent=note.category;
    document.getElementById('readerWords').textContent=MD.wordCount(body)+' kelime';
    document.getElementById('readerScroll').scrollTop=0;
    document.getElementById('btnReaderPin').style.color=note.pinned?'var(--amber)':'';
  }catch(e){toast('Şifre çözme hatası');}
}

// ── Settings ──────────────────────────────────────────────────────
function initSettings(){
  document.getElementById('sGithub').addEventListener('click',function(){
    var c=document.getElementById('ghConfig');
    c.style.display=c.style.display==='none'?'flex':'none';
  });
  document.getElementById('btnGhConnect').addEventListener('click',async function(){
    var t=document.getElementById('ghToken').value.trim();
    var r=document.getElementById('ghRepo').value.trim();
    if(!t||!r){toast('Token ve repo gerekli');return;}
    this.textContent='Test ediliyor…';
    var ok=await VaultGitHub.configure(t,r);
    document.getElementById('ghDot').className='s-dot '+(ok?'green':'red');
    document.getElementById('ghStatusTxt').textContent=ok?'Bağlandı ✓':'Başarısız';
    document.getElementById('ghDesc').textContent=ok?'Bağlı: '+r:'Bağlı değil';
    toast(ok?'GitHub bağlandı ✓':'Bağlantı başarısız');
    this.textContent='Bağlan & Test Et';
  });
  document.getElementById('sExport').addEventListener('click',async function(){
    var all=await VaultStorage.getAllNotes();
    var blob=new Blob([JSON.stringify(all,null,2)],{type:'application/json'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');a.href=url;a.download='mgd-vault-'+Date.now()+'.json';a.click();
    URL.revokeObjectURL(url);toast('Dışa aktarıldı');
  });
  document.getElementById('toggleBio').addEventListener('click',async function(){
    if(this.classList.contains('on')){
      localStorage.removeItem('mgd_cid');this.classList.remove('on');toast('Biyometrik kapatıldı');
    } else {
      try{await VaultAuth.register();this.classList.add('on');toast('Biyometrik eklendi ✓');}
      catch(e){toast('Hata: '+e.message);}
    }
  });
  document.getElementById('sReset').addEventListener('click',async function(){
    if(!confirm('TÜM notlar ve ayarlar silinecek. Devam?'))return;
    if(!confirm('Son onay — geri alınamaz!'))return;
    await VaultStorage.clearAll();
    ['mgd_salt','mgd_v','mgd_cid','mgd_ght','mgd_ghr'].forEach(function(k){localStorage.removeItem(k);});
    VaultCrypto.lock();sessionStorage.clear();
    toast('Sıfırlandı');setTimeout(function(){location.reload();},1200);
  });
}

// ── Lock ──────────────────────────────────────────────────────────
function doLock(){
  VaultCrypto.lock();sessionStorage.removeItem('mgd_sk');
  _dialInited=false;
  Router.go('pgLock');buildUnlockForm();toast('Kilitlendi 🔒');
}

// ── DOMContentLoaded ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',function(){
  Router.init();
  Editor.init();
  initSettings();

  if(!VaultCrypto.isSetup()) buildSetupForm();
  else buildUnlockForm();

  // List screen
  document.getElementById('btnListBack').addEventListener('click',function(){Router.back();});
  document.getElementById('btnListAdd').addEventListener('click',function(){
    var cat=(ITEM_DEFS[_activeFilter.id]&&ITEM_DEFS[_activeFilter.id].newCat)||'notes';
    Editor.openNew(cat);
  });
  document.getElementById('fabNew').addEventListener('click',function(){
    var cat=(ITEM_DEFS[_activeFilter.id]&&ITEM_DEFS[_activeFilter.id].newCat)||'notes';
    Editor.openNew(cat);
  });
  document.getElementById('listSearch').addEventListener('input',function(){loadList(this.value);});

  // Reader screen
  document.getElementById('btnReaderBack').addEventListener('click',function(){Router.back();});
  document.getElementById('btnReaderEdit').addEventListener('click',function(){if(_readNote)Editor.openExisting(_readNote);});
  document.getElementById('btnReaderPin').addEventListener('click',async function(){
    if(!_readNote)return;
    _readNote.pinned=!_readNote.pinned;
    this.style.color=_readNote.pinned?'var(--amber)':'';
    try{
      var title=await VaultCrypto.decryptText(_readNote.encTitle);
      var body =await VaultCrypto.decryptText(_readNote.encBody);
      _readNote.encTitle=await VaultCrypto.encryptText(title);
      _readNote.encBody =await VaultCrypto.encryptText(body);
      _readNote.updatedAt=new Date().toISOString();
      await VaultStorage.saveNote(_readNote);
      toast(_readNote.pinned?'Sabitlendi 📌':'Sabit kaldırıldı');
    }catch(e){}
  });
  document.getElementById('btnReaderDelete').addEventListener('click',async function(){
    if(!_readNote)return;
    if(!confirm('Bu notu silmek istediğinizden emin misiniz?'))return;
    await VaultStorage.deleteNote(_readNote.id);
    _readNote=null;Router.back();
    // Reload list
    loadList(document.getElementById('listSearch').value||'');
    toast('Silindi');
  });

  // Editor — after save, refresh list if it's open
  // (handled inside editor.js autoSave + manual save)

  // Settings
  document.getElementById('btnSettingsBack').addEventListener('click',function(){Router.back();});

  // Android hardware back
  history.pushState(null,'',location.href);
  window.addEventListener('popstate',function(){Router.back();history.pushState(null,'',location.href);});
});

// ── Service Worker ────────────────────────────────────────────────
if('serviceWorker' in navigator){
  window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
}
