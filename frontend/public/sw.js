const CACHE_NAME = "connect-hr-shell-v2";
const APP_SHELL = ["/", "/login", "/logobg.png", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Connect HR", message: event.data?.text() || "You have a new notification." };
  }

  const title = payload.title || "Connect HR";
  const options = {
    body: payload.message || "You have a new notification.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.notificationId ? `connect-hr-${payload.notificationId}` : `connect-hr-${Date.now()}`,
    renotify: true,
    silent: false,
    vibrate: [220, 100, 220, 100, 320],
    data: {
      actionUrl: payload.actionUrl || "/",
      notificationId: payload.notificationId || null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedPath = event.notification.data?.actionUrl || "/";
  const targetUrl = new URL(requestedPath, self.location.origin);
  const safeUrl = targetUrl.origin === self.location.origin ? targetUrl.href : self.location.origin;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          if ("navigate" in client) await client.navigate(safeUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(safeUrl) : undefined;
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/_next/static/") || /\.(?:png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        return response;
      })),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/login")));
  }
});
