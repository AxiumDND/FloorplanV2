// A page button switches the panel to another page (floor plan). It is purely in-app navigation:
// the eDIN+ GATEWAY documentation (docs/gateway-interface.md vols 1-3) defines no page or panel
// navigation command, so nothing is sent to the gateway.

export const MAX_PAGES = 6;

// Returns the target page number, or null when the button does not point at a usable page.
// pageCount is the number of pages currently configured; omit it to check only the 1..MAX_PAGES range.
export function targetPage(button, pageCount = MAX_PAGES) {
    const text = String((button && button.target) ?? '').trim();
    if (!/^\d+$/.test(text)) {
        return null;
    }
    const page = Number(text);
    const limit = Math.min(Number.isInteger(pageCount) ? pageCount : MAX_PAGES, MAX_PAGES);
    return page >= 1 && page <= limit ? page : null;
}

export function describeTarget(button, pageNames = []) {
    const page = targetPage(button, pageNames.length || MAX_PAGES);
    if (page === null) {
        return 'No page assigned';
    }
    return `Opens ${pageNames[page - 1] || `Page ${page}`}`;
}
