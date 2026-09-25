function shouldRegister(): boolean {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  const host = window.location.hostname;
  if (host === "localhost" || host.endsWith(".grok.me") || host.includes("grok.me")) return false;
  return window.location.protocol === "https:";
}

export function registerOffline() {
  if (!shouldRegister()) return;
  void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
}

export function subscribeOnline(onChange: (online: boolean) => void): () => void {
  const sync = () => onChange(navigator.onLine);
  sync();
  window.addEventListener("online", sync);
  window.addEventListener("offline", sync);
  return () => {
    window.removeEventListener("online", sync);
    window.removeEventListener("offline", sync);
  };
}
