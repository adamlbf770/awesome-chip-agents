type Payload = Record<string, unknown>;
type Tracker = { track: (transform: (props: Payload) => Payload) => unknown };
declare global {
  interface Window {
    umami?: Tracker;
    chipCatalogBeforeSend?: (type: string, payload: Payload) => Payload;
  }
}

let ready = false;
const queue: { name: string; data: Payload }[] = [];
const enabled = () => Boolean(
  import.meta.env.VITE_UMAMI_SCRIPT_URL && import.meta.env.VITE_UMAMI_WEBSITE_ID &&
  navigator.doNotTrack !== '1' && !(navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl
);

function send(name?: string, data?: Payload) {
  try {
    window.umami?.track(props => ({
      ...props, url: location.pathname, referrer: '', ...(name ? { name, data } : {}),
    }));
  } catch { /* Analytics must not interrupt navigation. */ }
}

export function track(name: string, data: Payload = {}) {
  if (!enabled()) return;
  if (ready) send(name, data);
  else if (queue.length < 50) queue.push({ name, data });
}

export function initAnalytics() {
  if (!enabled() || document.querySelector('#site-analytics')) return;
  let url: URL;
  try { url = new URL(import.meta.env.VITE_UMAMI_SCRIPT_URL); } catch { return; }
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') return;
  const script = document.createElement('script');
  script.id = 'site-analytics';
  script.src = url.href;
  script.defer = true;
  script.dataset.websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
  // Umami >= 3.2.0: use manual pageviews to exclude query strings.
  script.dataset.autoPageview = 'false';
  script.dataset.excludeSearch = 'true';
  script.dataset.excludeHash = 'true';
  window.chipCatalogBeforeSend = (_type, payload) => ({
    ...payload, url: location.pathname, referrer: '',
  });
  script.dataset.beforeSend = 'chipCatalogBeforeSend';
  if (import.meta.env.VITE_UMAMI_DOMAINS) script.dataset.domains = import.meta.env.VITE_UMAMI_DOMAINS;
  script.onload = () => {
    ready = true;
    send();
    for (const event of queue.splice(0)) send(event.name, event.data);
  };
  document.head.append(script);
}
