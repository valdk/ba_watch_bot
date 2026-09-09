function unique(values) {
  return Array.from(new Set(values));
}

function diffLines(previousLines = [], currentLines = []) {
  const previousSet = new Set(previousLines);
  const currentSet = new Set(currentLines);

  return {
    added: unique(currentLines.filter((line) => !previousSet.has(line))).slice(0, 3),
    removed: unique(previousLines.filter((line) => !currentSet.has(line))).slice(0, 2)
  };
}

function summarizeChange(previousPage, currentPage) {
  const lineDiff = diffLines(previousPage?.relevantLines, currentPage.relevantLines);
  const previousLinkCount = previousPage?.candidateLinks?.length ?? 0;
  const currentLinkCount = currentPage.candidateLinks.length;

  return {
    key: currentPage.key,
    name: currentPage.name,
    url: currentPage.url,
    previousEmptyState: previousPage?.flags?.emptyState ?? true,
    currentEmptyState: currentPage.flags.emptyState,
    availabilityLikelyAppeared:
      ((previousPage?.flags?.emptyState ?? true) && !currentPage.flags.emptyState) ||
      currentLinkCount > previousLinkCount,
    pentavillaDetected: currentPage.flags.pentavilla,
    containerDetected: currentPage.flags.container,
    addedLines: lineDiff.added,
    removedLines: lineDiff.removed,
    candidateLinks: currentPage.candidateLinks,
    previousLinkCount,
    currentLinkCount
  };
}

export function createSnapshot(normalizedPages) {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    pages: Object.fromEntries(normalizedPages.map((page) => [page.key, page]))
  };
}

export function compareSnapshots(previousState, currentSnapshot) {
  const changes = [];

  for (const [key, currentPage] of Object.entries(currentSnapshot.pages)) {
    const previousPage = previousState.pages?.[key];

    if (!previousPage || previousPage.hash !== currentPage.hash) {
      changes.push(summarizeChange(previousPage, currentPage));
    }
  }

  return {
    hasChanges: changes.length > 0,
    changes
  };
}

export function formatChangeReport(report) {
  if (!report.hasChanges) {
    return 'No meaningful changes detected.';
  }

  const lines = ['Detected page changes:'];

  for (const change of report.changes) {
    const status = [];

    if (change.availabilityLikelyAppeared) {
      status.push('availability-likely');
    }

    if (change.pentavillaDetected) {
      status.push('pentavilla');
    }

    if (change.containerDetected) {
      status.push('container');
    }

    lines.push(`- ${change.name}: ${status.length > 0 ? status.join(', ') : 'content-changed'}`);

    for (const addedLine of change.addedLines) {
      lines.push(`  + ${addedLine}`);
    }

    for (const removedLine of change.removedLines) {
      lines.push(`  - ${removedLine}`);
    }
  }

  return lines.join('\n');
}

export function buildTelegramMessage(report) {
  const lines = [
    'Brutal Assault accommodation changed.',
    ''
  ];

  for (const change of report.changes) {
    const tags = [];

    if (change.availabilityLikelyAppeared) {
      tags.push('availability likely');
    }

    if (change.pentavillaDetected) {
      tags.push('Pentavilla');
    }

    if (change.containerDetected) {
      tags.push('container');
    }

    lines.push(`${change.name}: ${tags.length > 0 ? tags.join(', ') : 'content changed'}`);

    for (const addedLine of change.addedLines) {
      lines.push(`+ ${addedLine}`);
    }

    if (change.candidateLinks.length > 0) {
      lines.push(`Links: ${change.candidateLinks.slice(0, 2).join(' | ')}`);
    }

    lines.push(change.url);
    lines.push('');
  }

  return lines.join('\n').trim();
}