// Кеш плиток карти. Адреса плитки містить версію (?v=…): плитка з тією самою адресою не змінюється, тому береться з кешу без запиту в мережу.
const NAME = "triolis-tiles-v1", MAX = 6000, KEEP = 4000;
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== NAME && k.indexOf("triolis-tiles-") === 0) await caches.delete(k);
  await self.clients.claim();
})()));
let trimming = false;
async function trim(c) {
  if (trimming) return;
  trimming = true;
  try { const ks = await c.keys(); if (ks.length > MAX) for (const k of ks.slice(0, ks.length - KEEP)) await c.delete(k); } finally { trimming = false; }
}
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin || !u.searchParams.has("v") || !/\/tiles\/.+\.png$/.test(u.pathname)) return;
  e.respondWith((async () => {
    const c = await caches.open(NAME);
    const hit = await c.match(r);
    if (hit) return hit;
    const res = await fetch(r);
    if (res.ok) c.put(r, res.clone()).then(() => trim(c)).catch(() => {});
    return res;
  })());
});
