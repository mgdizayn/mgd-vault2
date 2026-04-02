var C='mgd-v2';var A=['/','/index.html','/manifest.json','/css/vars.css','/css/base.css','/css/lock.css','/css/dial.css','/css/screens.css','/js/noise.js','/js/crypto.js','/js/router.js','/js/dial.js','/js/markdown.js','/js/editor.js','/js/app.js'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(C).then(function(c){return c.addAll(A);}));self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C;}).map(function(x){return caches.delete(x);}));}));self.clients.claim();});
self.addEventListener('fetch',function(e){e.respondWith(caches.match(e.request).then(function(r){return r||fetch(e.request);}));});
