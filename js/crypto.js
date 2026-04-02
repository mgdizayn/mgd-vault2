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
  async function tx(mode,fn){var d=await open();return new Promise(function(res,rej){var t=d.transaction('notes',mode),s=t.objectStore('notes'),r=fn(s);if(r)r.onsuccess=function(){res(r.result);};t.oncomplete=function(){res(r?r.result:true);};t.onerror=function(e){rej(e.target.error);};}); }
  async function saveNote(n){return tx('readwrite',function(s){return s.put(n);});}
  async function getAllNotes(){return tx('readonly',function(s){return s.getAll();}).then(function(r){return r||[];});}
  async function deleteNote(id){return tx('readwrite',function(s){return s.delete(id);});}
  async function clearAll(){return tx('readwrite',function(s){return s.clear();});}
  function generateId(){return Date.now().toString(36)+Math.random().toString(36).slice(2);}
  return{saveNote,getAllNotes,deleteNote,clearAll,generateId};
})();

// ── GitHub Sync ───────────────────────────────────────────────────
var VaultGitHub=(function(){
  var BASE='https://api.github.com';
  function cfg(){return{token:localStorage.getItem('mgd_ght')||'',repo:localStorage.getItem('mgd_ghr')||''};}
  function hdrs(t){return{'Authorization':'token '+t,'Content-Type':'application/json','Accept':'application/vnd.github.v3+json'};}
  function isConfigured(){var c=cfg();return!!(c.token&&c.repo);}
  async function testConnection(){var c=cfg();if(!c.token||!c.repo)return false;try{var r=await fetch(BASE+'/repos/'+c.repo,{headers:hdrs(c.token)});return r.ok;}catch(e){return false;}}
  async function getFileSha(path){var c=cfg();try{var r=await fetch(BASE+'/repos/'+c.repo+'/contents/'+path,{headers:hdrs(c.token)});if(!r.ok)return null;return(await r.json()).sha||null;}catch(e){return null;}}
  async function pushNotes(enc){var c=cfg();if(!isConfigured())return false;var path='vault/notes.enc',sha=await getFileSha(path);var body={message:'vault: '+new Date().toISOString(),content:btoa(unescape(encodeURIComponent(enc)))};if(sha)body.sha=sha;try{var r=await fetch(BASE+'/repos/'+c.repo+'/contents/'+path,{method:'PUT',headers:hdrs(c.token),body:JSON.stringify(body)});return r.ok;}catch(e){return false;}}
  async function pullNotes(){var c=cfg();if(!isConfigured())return null;try{var r=await fetch(BASE+'/repos/'+c.repo+'/contents/vault/notes.enc',{headers:hdrs(c.token)});if(!r.ok)return null;var d=await r.json();return d.content?decodeURIComponent(escape(atob(d.content.replace(/\n/g,'')))):null;}catch(e){return null;}}
  async function configure(t,r){localStorage.setItem('mgd_ght',t);localStorage.setItem('mgd_ghr',r);return testConnection();}
  function getCfg(){return cfg();}
  return{isConfigured,testConnection,pushNotes,pullNotes,configure,getCfg};
})();
