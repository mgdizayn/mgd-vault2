// ── WebCrypto AES-256-GCM ────────────────────────────────────────
var VaultCrypto=(function(){
  var _k=null;
  function ab2b64(b){return btoa(String.fromCharCode(...new Uint8Array(b)));}
  function b642ab(s){var b=atob(s),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a.buffer;}
  function rnd(n){return crypto.getRandomValues(new Uint8Array(n));}
  async function deriveKey(pass,salt){
    var km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:310000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  }
  async function setup(pass){
    var salt=rnd(16),key=await deriveKey(pass,salt);
    localStorage.setItem('mgd_salt',ab2b64(salt.buffer));
    var iv=rnd(12),enc=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode('MGD_OK'));
    localStorage.setItem('mgd_v',JSON.stringify({iv:ab2b64(iv.buffer),ct:ab2b64(enc)}));
    _k=key; return true;
  }
  async function unlock(pass){
    var sb=localStorage.getItem('mgd_salt'); if(!sb)return false;
    var key=await deriveKey(pass,new Uint8Array(b642ab(sb)));
    try{
      var v=JSON.parse(localStorage.getItem('mgd_v'));
      await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(b642ab(v.iv))},key,b642ab(v.ct));
      _k=key; return true;
    }catch(e){return false;}
  }
  // ── GitHub yedeğinden geri yükleme ───────────────────────────────
  // Cihaz temizlendiğinde mgd_salt da silindiği için, sadece parolayı
  // bilmek anahtarı yeniden türetmeye yetmez (PBKDF2 salt'a bağlıdır).
  // Bu yüzden salt+doğrulama bloğu da GitHub'a "vault/meta.json" olarak
  // (şifrelenmemiş, salt zaten tek başına gizli bilgi taşımaz) yedeklenir.
  function getMetaForBackup(){
    var sb=localStorage.getItem('mgd_salt');
    var vb=localStorage.getItem('mgd_v');
    if(!sb||!vb) return null;
    return JSON.stringify({salt:sb,v:JSON.parse(vb)});
  }
  // meta.json'dan salt'ı okur → parolayla anahtarı türetir → meta içindeki
  // doğrulama bloğuyla doğrular → başarılıysa localStorage'a salt+v yazar
  // ve kasayı açar (_k set edilir).
  async function restoreFromBackup(pass,metaBlob){
    if(!metaBlob) return {ok:false,reason:'no_meta'};
    var meta;
    try{ meta=JSON.parse(metaBlob); }catch(e){ return {ok:false,reason:'no_meta'}; }
    if(!meta||!meta.salt||!meta.v) return {ok:false,reason:'no_meta'};
    try{
      var key=await deriveKey(pass,new Uint8Array(b642ab(meta.salt)));
      await crypto.subtle.decrypt(
        {name:'AES-GCM',iv:new Uint8Array(b642ab(meta.v.iv))},
        key, b642ab(meta.v.ct)
      );
      localStorage.setItem('mgd_salt',meta.salt);
      localStorage.setItem('mgd_v',JSON.stringify(meta.v));
      _k=key;
      return {ok:true};
    }catch(e){
      return {ok:false,reason:'wrong_pass'};
    }
  }
  async function encryptText(text){
    if(!_k)throw new Error('locked');
    var iv=rnd(12),enc=await crypto.subtle.encrypt({name:'AES-GCM',iv},_k,new TextEncoder().encode(text));
    return JSON.stringify({iv:ab2b64(iv.buffer),ct:ab2b64(enc)});
  }
  async function decryptText(blob){
    if(!_k)throw new Error('locked');
    var v=JSON.parse(blob);
    var dec=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(b642ab(v.iv))},_k,b642ab(v.ct));
    return new TextDecoder().decode(dec);
  }
  function lock(){_k=null;}
  function isSetup(){return!!localStorage.getItem('mgd_salt');}
  function isUnlocked(){return!!_k;}

  // ── Biyometrik için parolayı şifreli localStorage'a kaydet ──────
  // Sabit bir "device key" türetiriz — cihaza özgü sabit değerlerden.
  // WebAuthn doğrulandıktan sonra bu key ile parolayı açarız.
  async function _deviceKey(){
    // Cihaza özgü sabit materyal: salt + hostname + user agent hash
    var raw = (localStorage.getItem('mgd_dksalt')||'');
    if(!raw){
      var s=rnd(16); raw=ab2b64(s.buffer);
      localStorage.setItem('mgd_dksalt',raw);
    }
    var material = raw + window.location.hostname;
    var km = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(material), 'PBKDF2', false, ['deriveKey']
    );
    var saltBytes = new TextEncoder().encode('mgd_device_v1');
    return crypto.subtle.deriveKey(
      {name:'PBKDF2', salt:saltBytes, iterations:10000, hash:'SHA-256'},
      km, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']
    );
  }

  async function savePassForBio(pass){
    try{
      var dk  = await _deviceKey();
      var iv  = rnd(12);
      var enc = await crypto.subtle.encrypt(
        {name:'AES-GCM', iv}, dk, new TextEncoder().encode(pass)
      );
      localStorage.setItem('mgd_bpass', JSON.stringify({
        iv: ab2b64(iv.buffer), ct: ab2b64(enc)
      }));
      return true;
    }catch(e){ return false; }
  }

  async function loadPassForBio(){
    try{
      var stored = localStorage.getItem('mgd_bpass');
      if(!stored) return null;
      var v   = JSON.parse(stored);
      var dk  = await _deviceKey();
      var dec = await crypto.subtle.decrypt(
        {name:'AES-GCM', iv:new Uint8Array(b642ab(v.iv))}, dk, b642ab(v.ct)
      );
      return new TextDecoder().decode(dec);
    }catch(e){ return null; }
  }

  function clearPassForBio(){ localStorage.removeItem('mgd_bpass'); }

  return{setup,unlock,encryptText,decryptText,lock,isSetup,isUnlocked,
         getMetaForBackup,restoreFromBackup,
         savePassForBio,loadPassForBio,clearPassForBio};
})();

// ── WebAuthn ──────────────────────────────────────────────────────
var VaultAuth=(function(){
  var RID=window.location.hostname||'localhost';
  function b2u(b){return btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');}
  function u2b(s){var b=atob(s.replace(/-/g,'+').replace(/_/g,'/')),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a.buffer;}
  function supported(){return!!(window.PublicKeyCredential&&navigator.credentials);}
  function hasCred(){return!!localStorage.getItem('mgd_cid');}
  async function register(){
    if(!supported())throw new Error('Desteklenmiyor');
    var ch=crypto.getRandomValues(new Uint8Array(32)),uid=crypto.getRandomValues(new Uint8Array(16));
    var cred=await navigator.credentials.create({publicKey:{
      challenge:ch,rp:{id:RID,name:'MGD Vault'},
      user:{id:uid,name:'vault_user',displayName:'MGD Vault'},
      pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
      authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required'},
      timeout:60000,attestation:'none'
    }});
    localStorage.setItem('mgd_cid',b2u(cred.rawId));
    return true;
  }
  async function authenticate(){
    if(!supported())throw new Error('Desteklenmiyor');
    var cid=localStorage.getItem('mgd_cid'); if(!cid)throw new Error('Kayıtlı değil');
    var ch=crypto.getRandomValues(new Uint8Array(32));
    var a=await navigator.credentials.get({publicKey:{
      challenge:ch,rpId:RID,
      allowCredentials:[{type:'public-key',id:u2b(cid),transports:['internal']}],
      userVerification:'required',timeout:60000
    }});
    return!!a;
  }
  return{supported,hasCred,register,authenticate};
})();

// ── IndexedDB Storage ─────────────────────────────────────────────
// NOT: Soft-delete modeli kullanılır. deleteNote() satırı fiziksel olarak
// silmez; n.deleted=true + n.deletedAt damgası koyar (tombstone). Böylece
// bir cihazda silinen not, GitHub sync sırasında başka bir cihazdan geri
// "dirilmez". Gerçek temizlik (tombstone'ların kalıcı silinmesi) yapılmaz —
// veri hacmi notlar için ihmal edilebilir düzeydedir.
var VaultStorage=(function(){
  var db=null;
  async function open(){
    if(db)return db;
    return new Promise(function(res,rej){
      var r=indexedDB.open('mgd_vault2',1);
      r.onupgradeneeded=function(e){
        var d=e.target.result;
        if(!d.objectStoreNames.contains('notes'))
          d.createObjectStore('notes',{keyPath:'id'}).createIndex('cat','category',{unique:false});
      };
      r.onsuccess=function(e){db=e.target.result;res(db);};
      r.onerror=function(e){rej(e.target.error);};
    });
  }
  // saveNote: transaction tamamlanana kadar bekle (oncomplete = gerçek başarı)
  async function saveNote(n){
    var d=await open();
    return new Promise(function(res,rej){
      var t=d.transaction('notes','readwrite');
      t.oncomplete=function(){res(true);};
      t.onerror=function(e){rej(e.target.error);};
      t.onabort=function(e){rej(new Error('Transaction aborted'));};
      t.objectStore('notes').put(n);
    });
  }

  // getAllNotes: request.onsuccess ile veriyi al (varsayılan: sadece silinmemiş notlar)
  async function getAllNotes(includeDeleted){
    var d=await open();
    var all=await new Promise(function(res,rej){
      var t=d.transaction('notes','readonly');
      var r=t.objectStore('notes').getAll();
      r.onsuccess=function(){res(r.result||[]);};
      r.onerror=function(e){rej(e.target.error);};
    });
    if(includeDeleted) return all;
    return all.filter(function(n){return !n.deleted;});
  }

  // deleteNote: SOFT DELETE — tombstone bırakır, fiziksel olarak silmez
  async function deleteNote(id){
    var d=await open();
    return new Promise(function(res,rej){
      var t=d.transaction('notes','readwrite');
      var store=t.objectStore('notes');
      var g=store.get(id);
      g.onsuccess=function(){
        var n=g.result;
        if(!n){res(true);return;}
        n.deleted=true;
        n.deletedAt=new Date().toISOString();
        n.updatedAt=n.deletedAt;
        // Şifreli içerik artık gereksiz — alanları boşaltıp tasarrufu sağlarız
        n.encTitle=null; n.encBody=null;
        store.put(n);
      };
      t.oncomplete=function(){res(true);};
      t.onerror=function(e){rej(e.target.error);};
    });
  }

  // putRaw: sync (merge) sırasında ham not nesnesini doğrudan yazmak için
  async function putRaw(n){
    var d=await open();
    return new Promise(function(res,rej){
      var t=d.transaction('notes','readwrite');
      t.oncomplete=function(){res(true);};
      t.onerror=function(e){rej(e.target.error);};
      t.objectStore('notes').put(n);
    });
  }

  // clearAll: transaction oncomplete bekle
  async function clearAll(){
    var d=await open();
    return new Promise(function(res,rej){
      var t=d.transaction('notes','readwrite');
      t.oncomplete=function(){res(true);};
      t.onerror=function(e){rej(e.target.error);};
      t.objectStore('notes').clear();
    });
  }
  function generateId(){return Date.now().toString(36)+Math.random().toString(36).slice(2);}
  return{saveNote,getAllNotes,deleteNote,putRaw,clearAll,generateId};
})();

// ── Sync Merge Engine ──────────────────────────────────────────────
// İki not listesini (yerel + uzak) id bazında birleştirir.
// Kazanan kural: updatedAt en yeni olan kazanır (deleted alanı dahil,
// yani bir tombstone da "güncelleme" sayılır ve daha yeni ise kazanır).
var VaultMerge=(function(){
  function mergeLists(localList,remoteList){
    var byId={};
    (localList||[]).forEach(function(n){byId[n.id]={local:n};});
    (remoteList||[]).forEach(function(n){
      if(!byId[n.id]) byId[n.id]={};
      byId[n.id].remote=n;
    });
    var merged=[],localWins=[],remoteWins=[];
    Object.keys(byId).forEach(function(id){
      var pair=byId[id],l=pair.local,r=pair.remote;
      if(l&&r){
        var lt=new Date(l.updatedAt||0).getTime();
        var rt=new Date(r.updatedAt||0).getTime();
        if(rt>lt){ merged.push(r); remoteWins.push(r); }
        else{ merged.push(l); if(lt>rt) localWins.push(l); }
      } else if(l){ merged.push(l); localWins.push(l); }
      else if(r){ merged.push(r); remoteWins.push(r); }
    });
    return {merged:merged,localWins:localWins,remoteWins:remoteWins};
  }
  return {mergeLists};
})();

// ── GitHub Sync ───────────────────────────────────────────────────
var VaultGitHub=(function(){
  var BASE='https://api.github.com';
  function cfg(){return{token:localStorage.getItem('mgd_ght')||'',repo:localStorage.getItem('mgd_ghr')||''};}
  function hdrs(t){return{'Authorization':'token '+t,'Content-Type':'application/json','Accept':'application/vnd.github.v3+json'};}
  function isConfigured(){var c=cfg();return!!(c.token&&c.repo);}
  async function testConnection(){var c=cfg();if(!c.token||!c.repo)return false;try{var r=await fetch(BASE+'/repos/'+c.repo,{headers:hdrs(c.token)});return r.ok;}catch(e){return false;}}
  async function getFileSha(path){var c=cfg();try{var r=await fetch(BASE+'/repos/'+c.repo+'/contents/'+path,{headers:hdrs(c.token)});if(!r.ok)return null;return(await r.json()).sha||null;}catch(e){return null;}}

  // Genel amaçlı dosya yazma — sha çatışmasında (409) tazelenmiş sha ile
  // tekrar dener (maxRetry kez). notes.enc VE meta.json için kullanılır.
  async function _putFile(path,contentStr,maxRetry){
    var c=cfg();if(!isConfigured())return false;
    maxRetry = (maxRetry==null)?2:maxRetry;
    for(var attempt=0; attempt<=maxRetry; attempt++){
      var sha=await getFileSha(path);
      var body={message:'vault: '+new Date().toISOString(),content:btoa(unescape(encodeURIComponent(contentStr)))};
      if(sha)body.sha=sha;
      try{
        var r=await fetch(BASE+'/repos/'+c.repo+'/contents/'+path,{method:'PUT',headers:hdrs(c.token),body:JSON.stringify(body)});
        if(r.ok) return true;
        if(r.status!==409) return false; // sha çatışması dışındaki hatalarda anında çık
        // 409 ise sha'yı yeniden okuyup tekrar dene
      }catch(e){ return false; }
    }
    return false;
  }
  async function _getFile(path){
    var c=cfg();if(!isConfigured())return null;
    try{
      var r=await fetch(BASE+'/repos/'+c.repo+'/contents/'+path,{headers:hdrs(c.token)});
      if(!r.ok)return null;
      var d=await r.json();
      return d.content?decodeURIComponent(escape(atob(d.content.replace(/\n/g,'')))):null;
    }catch(e){ return null; }
  }

  async function pushNotes(enc,maxRetry){ return _putFile('vault/notes.enc',enc,maxRetry); }
  async function pullNotes(){ return _getFile('vault/notes.enc'); }

  // meta.json: PBKDF2 salt + doğrulama bloğunu (şifrelenmemiş) taşır.
  // Bu, başka bir cihazdan/temizlenmiş bir cihazdan "Geri Yükle" akışının
  // doğru AES anahtarını yeniden türetebilmesi için gereklidir. Salt
  // tek başına gizli bilgi taşımaz (parola ile birleşmeden anahtar üretmez).
  async function pushMeta(metaStr){ return _putFile('vault/meta.json',metaStr,2); }
  async function pullMeta(){ return _getFile('vault/meta.json'); }

  async function configure(t,r){localStorage.setItem('mgd_ght',t);localStorage.setItem('mgd_ghr',r);return testConnection();}
  function getCfg(){return cfg();}
  function getLastSync(){return localStorage.getItem('mgd_gh_lastsync')||null;}
  function setLastSync(iso){localStorage.setItem('mgd_gh_lastsync',iso);}
  return{isConfigured,testConnection,pushNotes,pullNotes,pushMeta,pullMeta,
         configure,getCfg,getLastSync,setLastSync};
})();

// ── Vault Sync Orchestrator ─────────────────────────────────────────
// Tek noktadan iki yönlü senkronizasyon:
//  1. Uzaktaki (GitHub) şifreli not listesini çek ve çöz
//  2. Yereldeki (IndexedDB, tombstone'lar dahil) listeyle id+updatedAt
//     bazında birleştir (VaultMerge)
//  3. Uzakta kaybeden ama yerelde kazanan notlar varsa, birleşmiş listeyi
//     tekrar şifrele ve GitHub'a yaz (push)
//  4. Yerelde kaybeden ama uzakta kazanan notlar varsa, IndexedDB'ye yaz
// Not: encryptText/decryptText kullanıldığı için kasa AÇIK (unlock edilmiş)
// olmalıdır — kilitliyken sync çağrılmaz.
var VaultSync=(function(){
  var running=false;
  async function run(opts){
    opts=opts||{};
    if(running) return {ok:false,reason:'already_running'};
    if(!VaultGitHub.isConfigured()) return {ok:false,reason:'not_configured'};
    if(!VaultCrypto.isUnlocked()) return {ok:false,reason:'locked'};
    running=true;
    try{
      // 1) Uzak veriyi çek + çöz (yoksa boş liste say)
      var remoteList=[];
      var remoteBlob=await VaultGitHub.pullNotes();
      if(remoteBlob){
        try{
          var remoteJson=await VaultCrypto.decryptText(remoteBlob);
          remoteList=JSON.parse(remoteJson);
        }catch(e){
          // Uzaktaki veri farklı bir parola ile şifrelenmişse buraya düşer.
          return {ok:false,reason:'decrypt_failed'};
        }
      }
      // 2) Yerel veriyi (tombstone'lar dahil) al ve birleştir
      var localList=await VaultStorage.getAllNotes(true);
      var m=VaultMerge.mergeLists(localList,remoteList);

      // 3) Yerelde kazanan/yeni notları IndexedDB'ye yaz
      for(var i=0;i<m.remoteWins.length;i++){
        await VaultStorage.putRaw(m.remoteWins[i]);
      }

      // 4) Birleşmiş tam liste her zaman uzağa push edilir (tek kaynak
      //    dosyası olduğundan, merge sonucu zaten en güncel hâldir).
      var enc=await VaultCrypto.encryptText(JSON.stringify(m.merged));
      var pushed=await VaultGitHub.pushNotes(enc);

      // 5) meta.json'ı (salt + doğrulama bloğu) da senkron tut — başka bir
      //    cihazdan/Chrome temizliği sonrası "Geri Yükle" akışı bunu kullanır.
      //    Şifrelenmemiş gönderilir (salt parolasız anahtar türetemez).
      if(pushed){
        var meta=VaultCrypto.getMetaForBackup();
        if(meta) await VaultGitHub.pushMeta(meta);
        VaultGitHub.setLastSync(new Date().toISOString());
      }

      return {
        ok:pushed,
        pulled:m.remoteWins.length,
        pushed:m.localWins.length,
        total:m.merged.length
      };
    } finally {
      running=false;
    }
  }
  function isRunning(){return running;}
  return {run,isRunning};
})();
