const CACHE = "forge-shell-v2";

const PRECACHE = [
  "/",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/art/push.jpg",
  "/art/pull.jpg",
  "/art/legs.jpg",
  "/art/home.jpg",
  "/art/bands.jpg",
  "/art/cardio.jpg",
  "/art/full.jpg",
  "/art/coach.jpg",
  "/art/muscle-front.jpg",
  "/art/muscle-back.jpg",
  "/art/muscles/front-chest.png",
  "/art/muscles/front-shoulders.png",
  "/art/muscles/front-biceps.png",
  "/art/muscles/front-core.png",
  "/art/muscles/front-quads.png",
  "/art/muscles/front-calves.png",
  "/art/muscles/back-back.png",
  "/art/muscles/back-shoulders.png",
  "/art/muscles/back-triceps.png",
  "/art/muscles/back-glutes.png",
  "/art/muscles/back-hamstrings.png",
  "/art/muscles/back-calves.png",
  "/splash/1.jpg",
  "/splash/2.jpg",
  "/splash/3.jpg",
  "/splash/4.jpg",
  "/splash/5.jpg",
  "/splash/6.jpg",
  "/splash/7.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.all(PRECACHE.map((url) => cache.add(new Request(url, { cache: "reload" })).catch(() => null))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isBypass(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.includes("_server") ||
    url.pathname.includes("assetlinks")
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (isBypass(url)) return;

  const isNav = req.mode === "navigate" || req.destination === "document";
  if (isNav) {
    event.respondWith(navigation(event, req));
    return;
  }

  if (
    url.origin === self.location.origin ||
    url.hostname.includes("fonts.gstatic") ||
    url.hostname.includes("fonts.googleapis")
  ) {
    event.respondWith(staleWhileRevalidate(req));
  }
});

async function navigation(event, req) {
  const cache = await caches.open(CACHE);
  const cached = (await cache.match("/")) || (await cache.match(req));
  if (cached) {
    event.waitUntil(refreshShell(cache, req));
    return cached;
  }
  try {
    const fresh = await fetch(req);
    if (fresh.ok) await cache.put("/", fresh.clone());
    return fresh;
  } catch {
    return new Response(FALLBACK_HTML, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

async function refreshShell(cache, req) {
  try {
    const fresh = await fetch(req);
    if (fresh.ok) await cache.put("/", fresh.clone());
  } catch {
    /* still offline */
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  try {
    const fresh = await fetch(req);
    if (fresh.ok) await cache.put(req, fresh.clone());
    return cached || fresh;
  } catch {
    if (cached) return cached;
    return new Response("", { status: 504 });
  }
}

const FALLBACK_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
  <meta name="theme-color" content="#07090c"/>
  <title>Forge</title>
  <style>
    html,body{margin:0;height:100%;background:#07090c;color:#f4f7fb;font-family:Outfit,system-ui,sans-serif}
    main{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center}
    button{margin-top:16px;border:0;border-radius:999px;background:#2ee6c5;color:#04221c;font-weight:700;padding:12px 20px}
  </style>
</head>
<body>
  <main>
    <p>Open Forge once with wifi or data so it can save itself on this phone. After that, gym with no signal still logs.</p>
    <button type="button" onclick="location.reload()">Retry</button>
  </main>
</body>
</html>`;
