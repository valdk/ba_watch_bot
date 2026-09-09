export const WATCHED_PAGES = [
  {
    key: 'accommodation',
    name: 'Accommodation',
    url: 'https://brutalassault.cz/en/accommodation'
  },
  {
    key: 'hotels',
    name: 'Hotels',
    url: 'https://brutalassault.cz/en/ac-71/hotels'
  },
  {
    key: 'camps',
    name: 'Camps',
    url: 'https://brutalassault.cz/en/ac-72/camps'
  },
  {
    key: 'car-by-tent',
    name: 'Car by tent',
    url: 'https://brutalassault.cz/en/ac-76/car-by-tent'
  }
];

const DEFAULT_HEADERS = {
  'accept-language': 'en-US,en;q=0.9',
  'cache-control': 'no-cache',
  pragma: 'no-cache',
  'user-agent': 'BA_bot/1.0 (+local watcher)'
};

async function fetchPage(page, timeoutMs) {
  const response = await fetch(page.url, {
    headers: DEFAULT_HEADERS,
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs)
  });

  if (!response.ok) {
    throw new Error(`Fetch failed for ${page.name}: HTTP ${response.status}`);
  }

  return {
    ...page,
    fetchedAt: new Date().toISOString(),
    html: await response.text(),
    status: response.status
  };
}

export async function fetchPages({ timeoutMs = 15000 } = {}) {
  return Promise.all(WATCHED_PAGES.map((page) => fetchPage(page, timeoutMs)));
}