const CACHE = "living-oils-customer-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./firebase-config.js",
  "./manifest.json",
  "./assets/logo.svg",
  "./assets/living-oils-logo.jpg",
  "./assets/living-oils-store.jpg",
  "./assets/icon.svg",
  "./assets/oil-bottle.svg",
  "./assets/coconut.svg",
  "./assets/groundnut.svg",
  "./assets/groundnut-product.jpg",
  "./assets/kuridi-coconut-photo.jpg",
  "./assets/sunflower-product.jpg",
  "./assets/white-sesame-product.jpg",
  "./assets/black-sesame-product.jpg",
  "./assets/coconut-product.jpg",
  "./assets/sesame.svg",
  "./assets/white-sesame.svg",
  "./assets/sunflower.svg",
  "./assets/black-sesame-photo.jpg",
  "./assets/cold-pressed-photo.jpg",
  "./assets/sunflower-photo.jpg",
  "./assets/coconut-photo.jpg",
  "./assets/white-sesame-photo.jpg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(
      (cached) =>
        cached ||
        fetch(e.request)
          .then((r) => {
            const copy = r.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
            return r;
          })
          .catch(() => caches.match("./index.html"))
    )
  );
});
