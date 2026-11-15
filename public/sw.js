// Service worker minimal : il rend l'application installable.
// Il ne garde rien en cache (les appels vidéo et les données restent toujours à jour).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
