import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// VANTA_DEV_CLEANUP_BOOT: DEV-only hard cleanup (evita precisar Clear site data)
(async () => {
  try {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1" || host === "[::1]";
    if (!isLocal) return;

    // 1) Service Workers
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }

    // 2) Cache Storage
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }

    // 3) Local/session storage
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}

    // 4) IndexedDB (melhor esforço)
    try {
      const anyIDB: any = indexedDB as any;
      if (anyIDB?.databases) {
        const dbs = await anyIDB.databases();
        await Promise.all((dbs || []).map((db: any) => db?.name ? new Promise<void>((resolve) => {
          const req = indexedDB.deleteDatabase(db.name);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
          req.onblocked = () => resolve();
        }) : Promise.resolve()));
      }
    } catch {}
  } catch {}
})();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
