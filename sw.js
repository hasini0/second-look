/* Second Look — offline support. Caches the app's own files; never touches anything else. */
// Bump V (and the ?v= in index.html) on every release. A test checks the two agree.
const V = "7";
const VERSION = "second-look-v" + V;
const FILES = [
  "./", "./index.html", "./styles.css?v=" + V, "./manifest.webmanifest",
  ...["links", "analyzer", "redact", "recovery", "samples", "qr", "call", "regions", "app"].map((f) => `./js/${f}.js?v=${V}`),
  "./icons/icon.svg", "./icons/icon-192.png", "./icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  // "Share to Second Look" puts the shared text in the query string. Answer those page loads
  // from the cache only, so shared text never reaches the web server.
  if (e.request.mode === "navigate" && url.search) {
    e.respondWith(caches.match("./index.html").then((r) => r || new Response("Open Second Look once while online first.", { status: 503 })));
    return;
  }
  // Everything else is the app's own files: fetch fresh when online, fall back to the cached copy offline.
  e.respondWith(
    fetch(e.request, { cache: "no-cache" })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("./index.html")))
  );
});
