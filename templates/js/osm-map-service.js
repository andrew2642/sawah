/**
 * Sawah OpenStreetMap Map Service
 * Fetches historical and cultural places from the OpenStreetMap Overpass API
 * based on the current map viewport (bounding box).
 *
 * Scale strategy (mirrors how Google Maps works):
 *   - The user never downloads "the whole world".
 *   - Each time the map stops moving we query only the visible bounding box.
 *   - OSM is the base dataset (tourism=museum, historic=* tags) and is enriched
 *     with Wikidata/Wikipedia metadata at render time.
 */

const OVERPASS_ENDPOINTS = [
    // Reliable community mirrors first (faster failover when an endpoint is dead).
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
    'https://overpass.openstreetmap.ru/api/interpreter',
    'https://overpass.ncku.edu.tw/api/interpreter',
    // The main German instance and lz4 mirror (often overloaded / unreliable).
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter' // Last resort (often times out)
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * The Sawah atlas layer hierarchy. Each layer maps to a set of OpenStreetMap
 * tag pairs (key/value). A wildcard value ('*') matches any value for that key.
 */
export const ATLAS_CATEGORIES = {
    museums: {
        key: 'museums',
        label: 'Museums',
        icon: '🏛',
        color: '#884e08',
        osm: [['tourism', 'museum']],
        wikidata: 'Q33506' // Wikidata QID for "museum"
    },
    archaeology: {
        key: 'archaeology',
        label: 'Archaeological Sites',
        icon: '🏺',
        color: '#4a7c59',
        osm: [
            ['historic', 'archaeological_site'],
            ['historic', 'necropolis'],
            ['historic', 'settlement'],
        ],
        wikidata: 'Q839954', // Wikidata QID for "archaeological site"
        osm_zoom_gate: 9 // Don't fetch this dense category at low zoom
    },
    castles: {
        key: 'castles',
        label: 'Castles & Fortresses',
        icon: '🏰',
        color: '#4c6078',
        osm: [
            ['historic', 'castle'],
            ['historic', 'fort'],
            ['historic', 'fortress'],
            ['historic', 'manor'],
            ['historic', 'palace'],
        ],
        wikidata: 'Q23413' // Wikidata QID for "castle"
    },
    religious: {
        key: 'religious',
        label: 'Historic Religious Sites',
        icon: '⛪',
        color: '#914634',
        // Use more common OSM tags for places of worship.
        osm: [
            ['amenity', 'place_of_worship'],
            ['building', 'cathedral'], ['building', 'church'], ['building', 'chapel'],
            ['building', 'mosque'], ['building', 'temple'], ['building', 'synagogue']
        ]
    },
    battlefields: {
        key: 'battlefields',
        label: 'Battlefields',
        icon: '⚔',
        color: '#ba1a1a',
        osm: [['historic', 'battlefield']]
    },
    monuments: {
        key: 'monuments',
        label: 'Monuments',
        icon: '🗿',
        color: '#6b3b00',
        osm: [
            ['historic', 'memorial'],
            ['historic', 'monument']
        ]
    },
    tombs: {
        key: 'tombs',
        label: 'Tombs',
        icon: '⚰️',
        color: '#5f4b3a',
        osm: [['historic', 'tomb'], ['historic', 'mausoleum'], ['historic', 'tumulus']],
        wikidata: 'Q381885' // Wikidata QID for "tomb"
    },
    ruins: {
        key: 'ruins',
        label: 'Ruins',
        icon: '🏚',
        color: '#857467',
        osm: [['historic', 'ruins']],
        wikidata: 'Q135423', // Wikidata QID for "ruin"
        osm_zoom_gate: 9 // Don't fetch this dense category at low zoom
    },
    unesco: {
        key: 'unesco',
        label: 'UNESCO Site',
        icon: '⭐',
        color: '#b8860b',
        osm: [['heritage', '1']], // OSM tag for UNESCO World Heritage Site
        wikidata: 'Q9259' // Wikidata QID for "UNESCO World Heritage Site"
    },
    capitals: {
        key: 'capitals',
        label: 'Ancient Capitals',
        icon: '👑',
        color: '#7a4a2b',
        osm: [
            ['historic', 'capital'],
            ['historic', 'city']
        ]
    },
    cities: {
        key: 'cities',
        label: 'Historic Cities',
        icon: '🏙',
        color: '#51647d',
        osm: [
            ['place', 'city'],
            ['place', 'town']
        ]
    }
};
/**
 * Builds an Overpass QL query string for the given bounding box and category keys.
 * @param {string} bbox The Overpass bbox string "south,west,north,east".
 * @param {string[]} categoryKeys Array of ATLAS_CATEGORIES keys to include.
 * @returns {string} The Overpass QL query.
 */
export function buildOverpassQuery(bbox, categoryKeys, zoom) {
    const parts = [];
    categoryKeys.forEach(key => {
        const def = ATLAS_CATEGORIES[key];
        if (!def) return;

        // Query for ways/relations only at mid-zoom levels for performance.
        // At high zoom, nodes are sufficient. At low zoom, we don't query anyway.
        // Temporarily disabled to prevent 504 Gateway Timeout errors on complex viewports.
        // This ensures map responsiveness by only fetching lightweight node data.
        const includeWaysAndRelations = false; // zoom >= 8 && zoom < 14 && ['castles', 'ruins'].includes(key);

        def.osm.forEach(([tagKey, tagVal]) => {
            const selector = tagVal === '*' ? `["${tagKey}"]` : `["${tagKey}"="${tagVal}"]`;
            // Query for nodes on all categories.
            parts.push(`node${selector}(${bbox});`);

            if (includeWaysAndRelations) {
                parts.push(`way${selector}(${bbox});`);
                parts.push(`relation${selector}(${bbox});`);
            }
        });
    });

    return `[out:json][timeout:35][maxsize:268435456];
(
${parts.join('')}
)->.all;
(.all;); out center 50;`;
}

/**
 * Determines which category a set of OSM tags belongs to.
 * @param {object} tags The element's tags.
 * @returns {string|null} The ATLAS_CATEGORIES key, or null if not matched.
 */
export function classifyOsmTags(tags) {
    for (const key of Object.keys(ATLAS_CATEGORIES)) {
        const def = ATLAS_CATEGORIES[key];
        for (const [tagKey, tagVal] of def.osm) {
            const actual = tags[tagKey];
            if (actual !== undefined && (tagVal === '*' || actual === tagVal)) {
                return key;
            }
        }
    }
    return null;
}

/**
 * Executes a query against the Overpass API, trying multiple community
 * endpoints in sequence so a busy/overloaded server doesn't break the map.
 * @param {string} query The Overpass QL query.
 * @returns {Promise<Array<Object>>} The matching OSM elements.
 */
async function executeOverpassQuery(query, signal) {
    let lastError = null;

    // Cap the number of endpoints tried per category so a slow/unreachable
    // network doesn't block the streaming atlas for minutes.
    const MAX_ENDPOINTS = 3;

    // If the user has already cancelled, don't attempt any requests.
    if (signal.aborted) {
        console.log('[OsmMapService] Request aborted before fetch.');
        return [];
    }

    for (let endpointIndex = 0; endpointIndex < Math.min(OVERPASS_ENDPOINTS.length, MAX_ENDPOINTS); endpointIndex++) {
        const endpoint = OVERPASS_ENDPOINTS[endpointIndex];
        // If the user cancelled during a previous endpoint's retries, bail out.
        if (signal.aborted) {
            console.log('[OsmMapService] Request aborted by user, stopping all retries.');
            return [];
        }

        for (let attempt = 0; attempt < 2; attempt++) {
            let timedOut = false;
            const abortController = new AbortController();
            const timeoutId = setTimeout(() => {
                timedOut = true;
                abortController.abort();
            }, 8000); // 8s per-request timeout — fast failover for interactive UX.

            // Link the user's abort signal to our internal controller so a
            // user cancellation also cancels the in-flight fetch.
            const onUserAbort = () => abortController.abort();
            signal.addEventListener('abort', onUserAbort);

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `data=${encodeURIComponent(query)}`,
                    signal: abortController.signal
                });

                clearTimeout(timeoutId);
                signal.removeEventListener('abort', onUserAbort);

                if (response.ok) {
                    const data = await response.json();
                    return data.elements || [];
                }
                if (response.status === 429) {
                    console.warn(`[OsmMapService] Overpass rate limit hit on ${endpoint}. Aborting retries for this endpoint.`);
                    break; // Stop trying this endpoint for this request cycle
                } else if (response.status === 504) {
                    console.warn(`[OsmMapService] Overpass gateway timeout on ${endpoint}. Retrying...`);
                    continue;
                }
                throw new Error(`Overpass ${endpoint} returned status ${response.status}`);
            } catch (error) {
                clearTimeout(timeoutId);
                signal.removeEventListener('abort', onUserAbort);

                if (timedOut) {
                    // Our internal timeout fired — this is NOT a user cancellation.
                    // Log it and fall through to the retry / next-endpoint logic.
                    console.warn(`[OsmMapService] Overpass endpoint ${endpoint} timed out after 8s.`);
                    lastError = new Error(`Timeout: ${endpoint}`);
                } else if (error.name === 'AbortError') {
                    // Distinguish true user cancellation from timeout-driven aborts.
                    if (signal.aborted) {
                        console.log('[OsmMapService] Overpass fetch aborted by user.');
                        return []; // Don't retry on user-initiated abort
                    }
                    // The abort was caused by something else (e.g. timeout race); retry.
                    lastError = new Error(`Abort (non-user): ${endpoint}`);
                } else {
                    lastError = error;
                }
                console.warn(`[OsmMapService] Overpass endpoint ${endpoint} attempt ${attempt + 1} failed: ${lastError.message}`);
                // Brief pause before retrying the same endpoint with exponential backoff.
                await sleep(500 * (attempt + 1));
            }
        }
        console.log(`[OsmMapService] Endpoint ${endpoint} failed after 2 attempts. Trying next endpoint...`);
    }

    console.error('[OsmMapService] All Overpass endpoints failed:', lastError);
    return [];
}

/**
 * Extracts a representative coordinate from an OSM element (handles both nodes
 * and ways/relations via their center).
 * @param {object} element An OSM element.
 * @returns {Array<number>|null} [longitude, latitude] or null.
 */
function elementCoordinates(element) {
    if (typeof element.lat === 'number' && typeof element.lon === 'number') {
        return [element.lon, element.lat];
    }
    if (element.center && typeof element.center.lat === 'number' && typeof element.center.lon === 'number') {
        return [element.center.lon, element.center.lat];
    }
    return null;
}

/**
 * Fetches historical places from OpenStreetMap for the current viewport and
 * converts them into a GeoJSON FeatureCollection.
 * @param {MapLibre.LngLatBounds} bounds The map's current bounding box.
 * @param {string[]} categoryKeys The ATLAS_CATEGORIES keys to fetch.
 * @returns {Promise<GeoJSON.FeatureCollection>} A GeoJSON FeatureCollection.
 */
export async function fetchOsmHistoricalPlacesAsGeoJSON(bounds, categoryKeys, zoom, signal) {
    const emptyFc = { type: 'FeatureCollection', features: [] };
    if (!categoryKeys || categoryKeys.length === 0) {
        return emptyFc;
    }

    // --- INTELLIGENT FETCH GATES ---
    // 1. Don't query for dense categories at low zoom levels.
    if (zoom < 9 && (categoryKeys.includes('archaeology') || categoryKeys.includes('ruins'))) {
        console.log(`[OsmMapService] Zoom level ${zoom} is too low for dense categories like 'archaeology'. Skipping fetch.`);
        return emptyFc;
    }

    // 2. Don't query if the bounding box is excessively large (e.g., continental scale).
    const width = Math.abs(bounds.getEast() - bounds.getWest());
    const height = Math.abs(bounds.getNorth() - bounds.getSouth());
    if (width > 20 || height > 20) {
        console.log(`[OsmMapService] Bounding box is too large (${width.toFixed(1)}x${height.toFixed(1)} degrees). Skipping fetch to prevent timeout.`);
        return { type: 'FeatureCollection', features: [] };
    }
    // --- END GATES ---

    // Overpass API requires commas for the bounding box, not spaces.
    const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
    const query = buildOverpassQuery(bbox, categoryKeys, zoom);
    // console.log(query); // For debugging in Overpass Turbo
    const elements = await executeOverpassQuery(query, signal);

    const seen = new Set();
    const features = [];

    elements.forEach(element => {
        const tags = element.tags || {};
        const category = classifyOsmTags(tags);
        if (!category) return;

        const coordinates = elementCoordinates(element);
        if (!coordinates) return;

        // De-duplicate using Wikidata ID if available, as it's a more robust
        // unique identifier than the OSM element ID.
        const dedupeKey = tags.wikidata || `${element.type}/${element.id}`;
        if (seen.has(dedupeKey)) return;
        seen.add(dedupeKey);

        const def = ATLAS_CATEGORIES[category];
        const name =
            tags.name ||
            tags['name:en'] ||
            tags.wikipedia ||
            tags.wikidata ||
            `${def.label} (${element.type} ${element.id})`;

        features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates },
            properties: {
                id: dedupeKey,
                name,
                category,
                iconKey: def.key,
                icon: def.icon,
                color: def.color,
                source: 'OSM',
                type: def.label,
                description: tags.description || tags.historic || tags.tourism || '',
                wikidata: tags.wikidata || '',
                wikipedia: tags.wikipedia || '',
                osmUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`
            }
        });
    });

    console.log(`[OsmMapService] Fetched ${features.length} places from OSM.`);
    return { type: 'FeatureCollection', features };
}

/**
 * Converts an array of Overpass elements to a GeoJSON FeatureCollection.
 * This is an internal helper used by both viewport fetches and global search.
 * @param {Array<object>} elements - The array of OSM elements from Overpass.
 * @returns {GeoJSON.FeatureCollection}
 */
function elementsToGeoJSON(elements) {
    const seen = new Set();
    const features = [];

    elements.forEach(element => {
        const tags = element.tags || {};
        const category = classifyOsmTags(tags);
        if (!category) return;

        const coordinates = elementCoordinates(element);
        if (!coordinates) return;

        const dedupeKey = `${element.type}/${element.id}`;
        if (seen.has(dedupeKey)) return;
        seen.add(dedupeKey);

        const def = ATLAS_CATEGORIES[category];
        const name = tags.name || tags['name:en'] || tags.wikipedia || tags.wikidata || `${def.label} (${element.type} ${element.id})`;

        features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates },
            properties: {
                id: dedupeKey, name, category,
                iconKey: def.key, icon: def.icon, color: def.color,
                source: 'OSM', type: def.label,
                description: tags.description || tags.historic || tags.tourism || '',
                wikidata: tags.wikidata || '', wikipedia: tags.wikipedia || '',
                osmUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`
            }
        });
    });
    return { type: 'FeatureCollection', features };
}

/**
 * Searches for a single historical place by name across the globe using Overpass.
 * @param {string} name The name of the place to search for.
 * @param {AbortSignal} signal An AbortSignal to cancel the request.
 * @returns {Promise<object|null>} A GeoJSON feature for the found place, or null.
 */
export async function searchOsmByName(name, signal) {
    console.log(`[OsmMapService] Searching globally for "${name}"...`);

    // Build a comprehensive query part that includes all relevant OSM tags from ATLAS_CATEGORIES.
    const categoryFilters = Object.values(ATLAS_CATEGORIES)
        .flatMap(def => def.osm) // Get all [['key', 'value'], ...] pairs
        .map(([key, value]) => `[~"name"~"${name}",i]["${key}"="${value}"]`) // Create a filter for each
        .join(';\n          ');

    // A query to find nodes/ways/relations with a matching name tag across all relevant historic/cultural categories.
    const query = `
        [out:json][timeout:15];
        (
          node${categoryFilters};
          way${categoryFilters};
          relation${categoryFilters};
        );
        out center 1;
    `;

    const elements = await executeOverpassQuery(query, signal);
    const geojson = elementsToGeoJSON(elements);

    if (!geojson.features || geojson.features.length === 0) {
        console.log(`[OsmMapService] No global results found for "${name}".`);
        return [];
    }

    console.log(`[OsmMapService] Found ${geojson.features.length} global matches for "${name}".`);
    return geojson.features;
}