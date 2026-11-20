// Service worker presentasi BESTIE: simpan semua slide agar bisa dipakai tanpa internet.
// Ubah VERSI setiap kali slide diganti supaya perangkat mengunduh versi baru.
var VERSI = 'bestie-pres-2';
var BERKAS = ['./', 'index.html', 'catatan.json'];
['smp', 'sma'].forEach(function (j) { for (var n = 1; n <= 12; n++) BERKAS.push(j + '/' + n + '.webp'); });

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSI).then(function (c) { return c.addAll(BERKAS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) {
    return Promise.all(k.filter(function (x) { return x.indexOf('bestie-pres-') === 0 && x !== VERSI; }).map(function (x) { return caches.delete(x); }));
  }).then(function () { return self.clients.claim(); }));
});
// halaman & catatan: coba jaringan dulu (supaya ikut versi terbaru), gambar: dari simpanan dulu
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (/\.webp$/.test(u.pathname)) {
    e.respondWith(caches.match(e.request).then(function (r) {
      return r || fetch(e.request).then(function (res) { var c = res.clone(); caches.open(VERSI).then(function (x) { x.put(e.request, c); }); return res; });
    }));
  } else {
    e.respondWith(fetch(e.request).then(function (res) {
      if (res.ok) { var c = res.clone(); caches.open(VERSI).then(function (x) { x.put(e.request, c); }); }
      return res;
    }).catch(function () { return caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || caches.match('index.html'); }); }));
  }
});
self.addEventListener('message', function (e) {
  if (e.data !== 'cek' || !e.ports[0]) return;
  caches.open(VERSI).then(function (c) {
    return Promise.all(BERKAS.map(function (b) { return c.match(b).then(function (r) { return !!r; }); }));
  }).then(function (a) {
    var ada = a.filter(Boolean).length;
    e.ports[0].postMessage({ ok: ada === BERKAS.length, ada: ada, total: BERKAS.length });
  });
});
