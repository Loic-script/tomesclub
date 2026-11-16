// Service worker de Tomes Club.
// 1) Il rend l'application installable.
// 2) Il affiche les notifications push (appels, messages, événements…), même application fermée.
// Il ne garde rien en cache (les appels vidéo et les données restent toujours à jour).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Tomes Club", body: event.data ? event.data.text() : "" };
  }
  const call = data.kind === "call";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    data: { url: data.url || "/" },
    // Un appel : vibre longtemps et reste à l'écran jusqu'à ce qu'on réponde.
    requireInteraction: call,
    vibrate: call ? [800, 400, 800, 400, 800, 400, 800, 400, 800] : [200, 100, 200],
    actions: call
      ? [
          { action: "answer", title: "Answer" },
          { action: "dismiss", title: "Decline" },
        ]
      : [],
  };
  event.waitUntil(self.registration.showNotification(data.title || "Tomes Club", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") {
    // Refuser l'appel : il se coupe aussi chez la personne qui appelle.
    const link = event.notification.data?.url;
    if (link && link.startsWith("/call/")) {
      event.waitUntil(
        fetch("/api/rings/decline", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ link }),
        }).catch(() => {}),
      );
    }
    return;
  }
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // L'application est déjà ouverte : on y va.
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin && "focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(target).catch(() => {});
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
