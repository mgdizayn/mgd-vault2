// ── Note Editor ──────────────────────────────────────────────────
var Editor = (function(){

  var note = null, dirty=false, autoTimer=null;

  function wc(){ return MD.wordCount(document.getElementById('editorBody').value); }

  function setStatus(s){
    var el=document.getElementById('editorStatus');
    if(el) el.textContent=s;
  }

  function showSaved(){
    var b=document.getElementById('saveBadge');
    if(!b) return;
    b.classList.add('show');
    clearTimeout(window._sbTimer);
    window._sbTimer=setTimeout(function(){b.classList.remove('show');},2000);
  }

  function updateMeta(){
    var wcel=document.getElementById('editorWC');
    if(wcel) wcel.textContent=wc()+' kelime';
    if(dirty) setStatus('Kaydedilmedi •');
  }

  async function save(silent){
    var title=document.getElementById('editorTitle').value.trim();
    var body =document.getElementById('editorBody').value.trim();
    if(!title&&!body){ if(!silent) toast('Not boş'); return; }
    if(!note) return;
    try{
      note.encTitle  = await VaultCrypto.encryptText(title||'(Başlıksız)');
      note.encBody   = await VaultCrypto.encryptText(body||'');
      note.updatedAt = new Date().toISOString();
      await VaultStorage.saveNote(note);
      dirty=false;
      setStatus('Kaydedildi');
      showSaved();
      if(!silent) toast('Kaydedildi ✓');
      // Refresh note list in background
      var srch=document.getElementById('listSearch');
      if(typeof loadList==='function') loadList(srch?srch.value:'');
      if(VaultGitHub.isConfigured()) syncGH();
    }catch(e){ toast('Hata: '+e.message); }
  }

  async function syncGH(){
    try{
      var all=await VaultStorage.getAllNotes();
      var enc=await VaultCrypto.encryptText(JSON.stringify(all));
      await VaultGitHub.pushNotes(enc);
    }catch(e){}
  }

  function openNew(category){
    note={
      id:VaultStorage.generateId(),
      category:category||'notes',
      pinned:false,
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
    };
    dirty=false;
    document.getElementById('editorTitle').value='';
    document.getElementById('editorBody').value='';
    document.getElementById('editorWC').textContent='0 kelime';
    document.getElementById('editorStatus').textContent='Yeni not';
    document.getElementById('tbPin').style.opacity='0.4';
    Router.go('pgEditor');
    setTimeout(function(){ document.getElementById('editorTitle').focus(); },350);
  }

  async function openExisting(n){
    note=Object.assign({},n);
    dirty=false;
    try{
      var title=await VaultCrypto.decryptText(n.encTitle);
      var body =await VaultCrypto.decryptText(n.encBody);
      document.getElementById('editorTitle').value=title;
      document.getElementById('editorBody').value=body;
    }catch(e){ toast('Şifre çözme hatası'); return; }
    updateMeta();
    document.getElementById('tbPin').style.opacity=note.pinned?'1':'0.4';
    setStatus('');
    Router.go('pgEditor');
  }

  async function del(){
    if(!note) return;
    if(!confirm('Bu notu silmek istediğinizden emin misiniz?')) return;
    await VaultStorage.deleteNote(note.id);
    note=null;
    Router.back();
    toast('Not silindi');
  }

  function init(){
    var titleEl=document.getElementById('editorTitle');
    var bodyEl =document.getElementById('editorBody');

    // Auto-resize title
    function resizeTitle(){
      titleEl.style.height='auto';
      titleEl.style.height=titleEl.scrollHeight+'px';
    }
    if(titleEl){ titleEl.addEventListener('input',function(){ resizeTitle(); dirty=true; updateMeta(); }); }

    if(bodyEl){
      bodyEl.addEventListener('input',function(){
        dirty=true; updateMeta();
        clearTimeout(autoTimer);
        autoTimer=setTimeout(function(){save(true);},1800);
      });
      // Tab key → indent
      bodyEl.addEventListener('keydown',function(e){
        if(e.key==='Tab'){ e.preventDefault();
          var s=bodyEl.selectionStart;
          bodyEl.value=bodyEl.value.slice(0,s)+'  '+bodyEl.value.slice(bodyEl.selectionEnd);
          bodyEl.selectionStart=bodyEl.selectionEnd=s+2;
        }
      });
    }

    // Toolbar
    document.querySelectorAll('.tb-btn[data-cmd]').forEach(function(btn){
      btn.addEventListener('click',function(){
        var cmd=btn.dataset.cmd;
        if(cmd==='del'){ del(); return; }
        if(cmd==='pin'){ if(note){note.pinned=!note.pinned;btn.style.opacity=note.pinned?'1':'0.4';dirty=true;} return; }
        var ta=document.getElementById('editorBody');
        var s=ta.selectionStart,e=ta.selectionEnd,sel=ta.value.slice(s,e);
        var rep='';
        if(cmd==='b')     rep='**'+sel+'**';
        if(cmd==='i')     rep='_'+sel+'_';
        if(cmd==='h1')    rep='# '+sel;
        if(cmd==='h2')    rep='## '+sel;
        if(cmd==='ul')    rep='- '+sel;
        if(cmd==='todo')  rep='[ ] '+sel;
        if(cmd==='quote') rep='> '+sel;
        if(rep){ ta.value=ta.value.slice(0,s)+rep+ta.value.slice(e); ta.focus(); dirty=true; updateMeta(); }
      });
    });

    document.getElementById('btnEditorSave').addEventListener('click',function(){ save(false); });
    document.getElementById('btnEditorBack').addEventListener('click',function(){
      if(dirty){ save(true); }
      Router.back();
    });
  }

  function getCurrent(){ return note; }

  return {init, openNew, openExisting, save, del, getCurrent};
})();
