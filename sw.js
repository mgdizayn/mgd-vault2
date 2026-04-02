var C='mgd-v3';
var BASE='/mgd-vault2';
var A=[
  BASE+'/',
  BASE+'/index.html',
  BASE+'/manifest.json',
  BASE+'/css/vars.css',
  BASE+'/css/base.css',
  BASE+'/css/lock.css',
  BASE+'/css/dial.css',
  BASE+'/css/screens.css',
  BASE+'/js/noise.js',
  BASE+'/js/crypto.js',
  BASE+'/js/router.js',
  BASE+'/js/dial.js',
  BASE+'/js/markdown.js',
  BASE+'/js/editor.js',
  BASE+'/js/app.js',
  BASE+'/icons/icon-192.png',
  BASE+'/icons/icon-512.png',
];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(C).then(function(c){return c.addAll(A);}));
  self.skipWaiting();
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(k){
    return Promise.all(k.filter(function(x){return x!==C;}).map(function(x){return caches.delete(x);}));
  }));
  self.clients.claim();
});
self.addEventListener('fetch',function(e){
  e.respondWith(caches.match(e.request).then(function(r){
    return r||fetch(e.request).catch(function(){
      return caches.match(BASE+'/index.html');
    });
  }));
});
