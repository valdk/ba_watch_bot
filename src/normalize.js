import crypto from 'node:crypto';
import { load } from 'cheerio';

const END_MARKERS = [
  'payment methods',
  'manage consent to cookies',
  'gdpr',
  'about brutal',
  '© 1996',
  'whatsapp',
  'shop@brutalassault.com'
];

const GENERIC_LINK_PATHS = new Set([
  '/en/',
  '/en/tickets',
  '/en/accommodation',
  '/en/ac-71/hotels',
  '/en/ac-72/camps',
  '/en/ac-76/car-by-tent',
  '/en/c/news',
  '/en/press',
  '/en/contact',
  '/en/line-up',
  '/en/festival-info',
  '/en/program',
  '/en/user/login',
  '/en/meet-greet',
  '/en/brutal-assault-x-savage-lands',
  '/en/terms-conditions',
  '/en/gdpr',
  '/en/about-brutal'
]);

function cleanText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function canonical(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function uniqueConsecutive(values) {
  const result = [];

  for (const value of values) {
    if (result[result.length - 1] !== value) {
      result.push(value);
    }
  }

  return result;
}

function extractRelevantLines($, pageName) {
  const rawLines = $('body')
    .text()
    .split(/\n+/)
    .map(cleanText)
    .filter(Boolean);

  const lines = uniqueConsecutive(rawLines);
  const pageKey = canonical(pageName);
  const startIndex = lines.findIndex((line, index) => {
    const current = canonical(line);

    if (!current) {
      return false;
    }

    if (current === pageKey || current.includes(pageKey)) {
      return true;
    }

    if (pageKey === 'accommodation' && current.includes('accommodation')) {
      return true;
    }

    return lines.slice(index, index + 8).some((candidate) => /coming soon|no tickets/i.test(candidate));
  });

  const sliceStart = startIndex === -1 ? 0 : startIndex;
  let sliceEnd = lines.length;

  for (let index = sliceStart + 1; index < lines.length; index += 1) {
    const lower = lines[index].toLowerCase();

    if (END_MARKERS.some((marker) => lower.includes(marker))) {
      sliceEnd = index;
      break;
    }
  }

  return uniqueConsecutive(lines.slice(sliceStart, sliceEnd));
}

function extractCandidateLinks($) {
  const links = new Set();

  $('a[href]').each((_, element) => {
    const rawHref = $(element).attr('href');

    if (!rawHref) {
      return;
    }

    try {
      const url = new URL(rawHref, 'https://brutalassault.cz');

      if (url.host !== 'brutalassault.cz') {
        return;
      }

      if (!url.pathname.startsWith('/en/')) {
        return;
      }

      if (GENERIC_LINK_PATHS.has(url.pathname)) {
        return;
      }

      if (url.pathname.startsWith('/en/sc-') || url.pathname.startsWith('/en/cookiebanner/')) {
        return;
      }

      links.add(url.toString());
    } catch {
      // Ignore malformed links.
    }
  });

  return Array.from(links).sort();
}

function createHash(payload) {
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export function normalizePage(page) {
  const $ = load(page.html);
  $('script, style, noscript, svg, path, iframe').remove();

  const relevantLines = extractRelevantLines($, page.name);
  const candidateLinks = extractCandidateLinks($);
  const relevantText = relevantLines.join('\n');
  const lowerText = relevantText.toLowerCase();
  const hash = createHash(JSON.stringify({ relevantLines, candidateLinks }));

  return {
    key: page.key,
    name: page.name,
    url: page.url,
    fetchedAt: page.fetchedAt,
    hash,
    relevantLines,
    relevantText,
    candidateLinks,
    flags: {
      emptyState:
        lowerText.includes('camps and hotels for ba 2027 coming soon') ||
        lowerText.includes('no tickets'),
      pentavilla: /penta\s*villa|pentavilla/i.test(relevantText),
      container: /container/i.test(relevantText)
    }
  };
}