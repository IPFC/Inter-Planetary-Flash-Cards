
/* eslint-disable no-console */

self._precacheManifest = [].concat(self._precacheManifest || []);
console.log(workbox)
workbox.core.setCacheNameDetails({prefix: "lumpsum"})

workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self._precacheManifest, {});

// install new service worker when ok, then reload page.
self.addEventListener("message", msg =>{
    if (msg.data.action == 'skipWaiting'){
        self.skipWaiting()
    }
})