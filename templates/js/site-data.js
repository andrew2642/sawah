export function normalizeSearchKey(text) {
    return String(text || '')
        .trim()
        .toLowerCase()
        .replace(/[\s\u2019'’]+/g, ' ')
        .replace(/[^a-z0-9 ]/g, '');
}

export const SITE_ARCHIVES = [];

export function getSites() {
    return SITE_ARCHIVES.map(site => ({
        name: site.name,
        slug: site.slug,
        lat: site.lat,
        lng: site.lng,
        img: site.img,
        desc: site.desc,
        categories: site.categories,
        searchKeywords: site.searchKeywords
    }));
}

export function getLocalArchive(query) {
    const normalized = normalizeSearchKey(query);
    if (!normalized) return null;
    return SITE_ARCHIVES.find(site => {
        if (normalizeSearchKey(site.name) === normalized) return true;
        if (site.slug === normalized) return true;
        if (site.searchKeywords.some(keyword => normalizeSearchKey(keyword) === normalized)) return true;
        return false;
    })?.archive || null;
}

export function findSiteByQuery(query) {
    const normalized = normalizeSearchKey(query);
    return SITE_ARCHIVES.find(site => {
        if (normalizeSearchKey(site.name) === normalized) return true;
        if (site.slug === normalized) return true;
        if (site.searchKeywords.some(keyword => normalizeSearchKey(keyword) === normalized)) return true;
        return site.name.toLowerCase().includes(normalized) || site.desc.toLowerCase().includes(normalized);
    }) || null;
}
