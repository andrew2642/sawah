
/**
 * Sawah Search Manager
 *
 * Provides a unified, weighted, and fuzzy search interface for Sawah. It queries
 * multiple sources (local historical index, local atlas features, Nominatim for geocoding)
 * and returns a single, scored, and sorted list of results.
 */

/**
 * The standard result format used across the application.
 * @typedef {object} SearchResult
 * @property {string} id - A unique identifier for the result.
 * @property {string} name - The primary display name.
 * @property {string} subtitle - Additional context or description.
 * @property {string} type - The type of result (e.g., 'atlas', 'nominatim').
 * @property {string} icon - The emoji icon for the result.
 * @property {string} source - The original data source ('OSM', 'Nominatim').
 * @property {Array<number>} coordinates - The [lng, lat] coordinates.
 * @property {object} raw - The original, raw data object.
 */

import { SITE_ARCHIVES } from './site-data.js';
import { searchOsmByName, ATLAS_CATEGORIES } from './osm-map-service.js';

/**
 * Calculates the similarity between two strings. A simple character-matching approach.
 * @param {string} a The first string.
 * @param {string} b The second string.
 * @returns {number} A similarity score between 0 and 1.
 */
function similarity(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();
    let matches = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i] === b[i]) matches++;
    }
    return matches / Math.max(a.length, b.length);
}

/**
 * Scores a generic item (from SITE_ARCHIVES, localAtlasFeatures, or Nominatim) against a search query.
 * @param {object} item The item to score.
 * @param {string} query The user's search query.
 * @returns {number} The calculated score for the feature.
 */
function scoreItem(item, query) {
    const q = query.toLowerCase();
    const name = (item.name || item.properties?.name || item.display_name?.split(',')[0] || '').toLowerCase();
    let score = 0;

    // Handle SITE_ARCHIVES structure
    if (item.slug && item.name) { // Heuristic for SITE_ARCHIVES entry
        const name = item.name.toLowerCase();
        const desc = item.desc?.toLowerCase() || '';
        const categories = item.categories || {};
        const searchKeywords = item.searchKeywords || [];

        if (name.includes(q)) score += 150; // Highest boost for direct name match
        if (similarity(q, name) > 0.6) score += 75; // Fuzzy name match

        if (categories.period?.toLowerCase().includes(q)) score += 60;
        if (categories.region?.toLowerCase().includes(q)) score += 50;
        if (categories.siteType?.toLowerCase().includes(q)) score += 40;
        if (desc.includes(q)) score += 30;
        if (searchKeywords.some(kw => kw.toLowerCase().includes(q))) score += 80;

        score += 50; // Base boost for all SITE_ARCHIVES entries
    }
    // Handle localAtlasFeatures (GeoJSON properties)
    else if (item.properties && item.geometry) { // Heuristic for GeoJSON feature
        const props = item.properties;
        const type = props.type?.toLowerCase() || '';
        const description = props.description?.toLowerCase() || '';
        const source = props.source?.toLowerCase() || '';

        if (name === q) score += 100; // Exact match
        else if (name.startsWith(q)) score += 50; // Starts with
        else if (name.includes(q)) score += 20; // Contains
        if (type.includes(q)) score += 40;
        if (description.includes(q)) score += 20;
        if (source.includes('osm') || source.includes('wikidata')) score += 10; // Slight boost for known historical sources
    }
    // Handle Nominatim results
    else if (item.place_id && item.display_name) { // Heuristic for Nominatim result
        const displayName = item.display_name.toLowerCase();
        const type = item.type?.toLowerCase() || '';
        const address = item.address || {};

        if (name === q) score += 80;
        else if (name.startsWith(q)) score += 40;
        else if (displayName.includes(q)) score += 15;
        if (type.includes(q)) score += 30;
        if (address.city?.toLowerCase().includes(q)) score += 20;
        if (address.country?.toLowerCase().includes(q)) score += 10;

        // Boost for historical/tourism tags from Nominatim extratags
        if (item.extratags) { // This check prevents a TypeError if extratags is undefined
            if (item.extratags.historic) score += 70;
            if (item.extratags.tourism) score += 40;
        }
    }
    return score;
}

/**
 * Parses a Wikidata coordinate string (e.g., "Point(LON LAT)") into [longitude, latitude].
 * @param {string} coordString The coordinate string from Wikidata.
 * @returns {Array<number>|null} An array [longitude, latitude] or null if parsing fails.
 */
function parseWikidataCoord(coordString) {
    const match = coordString.match(/Point\(([-+]?\d+\.?\d*)\s+([-+]?\d+\.?\d*)\)/);
    if (match && match.length === 3) {
        const lon = parseFloat(match[1]);
        const lat = parseFloat(match[2]);
        if (!isNaN(lon) && !isNaN(lat)) {
            return [lon, lat];
        }
    }
    return null;
}

/**
 * Searches Wikidata for entities matching the query that are instances of historical categories.
 * @param {string} query The search query.
 * @param {AbortSignal} signal An AbortSignal to cancel the request.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of GeoJSON features.
 */
async function searchWikidataGlobally(query, signal) {
    // Filter out categories that don't have a Wikidata QID to avoid 'wd:undefined' in the SPARQL query
    const historicalQIDs = Object.values(ATLAS_CATEGORIES).filter(c => c.wikidata).map(c => `wd:${c.wikidata}`).join(' ');

    // Convert raw SPARQL bindings to GeoJSON features for consistent processing downstream
    const toFeatures = (bindings) => {
        return (bindings || []).map(binding => {
            if (!binding.coord?.value) return null;
            const coordinates = parseWikidataCoord(binding.coord.value);
            if (!coordinates) return null;
            const qid = binding.item.value.split('/').pop();
            return {
                type: 'Feature',
                geometry: { type: 'Point', coordinates },
                properties: {
                    id: qid,
                    name: binding.itemLabel?.value || qid,
                    category: 'wikidata',
                    iconKey: 'wikidata',
                    icon: '🌍',
                    color: '#666',
                    type: binding.typeLabel?.value || 'Wikidata Place',
                    source: 'Wikidata',
                    description: '',
                    wikidata: binding.item.value,
                    wikipedia: '',
                    osmUrl: ''
                }
            };
        }).filter(Boolean);
    };

    // Generic fetch wrapper that returns bindings or null on any failure.
    const runQuery = async (sparql) => {
        const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
        try {
            const response = await fetch(url, { headers: { 'Accept': 'application/json' }, signal });
            if (!response.ok) return null;
            const data = await response.json();
            return data.results?.bindings || [];
        } catch (error) {
            if (error.name !== 'AbortError') console.warn('[SearchManager] Global Wikidata query error:', error.message);
            return null;
        }
    };

    // 1) Preferred query: restrict to historical categories. Uses transitive
    //    subclass matching (P31/P279*) but this can be slow / 500 on Wikidata's
    //    public endpoint, so we fall back to a simpler query below if it fails.
    if (historicalQIDs) {
        const sparql = `
            SELECT ?item ?itemLabel ?coord ?typeLabel WHERE {
              SERVICE wikibase:mwapi { bd:serviceParam wikibase:api "EntitySearch". bd:serviceParam wikibase:endpoint "www.wikidata.org". bd:serviceParam wikibase:language "en". bd:serviceParam mwapi:search "${query}". bd:serviceParam mwapi:limit "20". ?item wikibase:apiOutputItem mwapi:item. }
              ?item wdt:P625 ?coord.
              ?item wdt:P31/wdt:P279* ?type. VALUES ?type { ${historicalQIDs} }
              SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
            } LIMIT 10`;
        const bindings = await runQuery(sparql);
        if (bindings && bindings.length > 0) {
            return toFeatures(bindings);
        }
    }

    // 2) Fallback: no category filter, just items matching the name that have
    //    coordinates. Slower to appear but far less likely to 500. The category
    //    label is still captured when present to keep the result informative.
    const fallbackSparql = `
        SELECT ?item ?itemLabel ?coord ?typeLabel WHERE {
          SERVICE wikibase:mwapi { bd:serviceParam wikibase:api "EntitySearch". bd:serviceParam wikibase:endpoint "www.wikidata.org". bd:serviceParam wikibase:language "en". bd:serviceParam mwapi:search "${query}". bd:serviceParam mwapi:limit "10". ?item wikibase:apiOutputItem mwapi:item. }
          ?item wdt:P625 ?coord.
          OPTIONAL { ?item wdt:P31 ?type . }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        } LIMIT 10`;
    const bindings = await runQuery(fallbackSparql);
    return toFeatures(bindings || []);
}
/**
 * Searches for a general place name using the Nominatim API.
 * @param {string} query The search query.
 * @returns {Promise<Array<object>>} An array of raw Nominatim results, with increased limit and address details.
 */
async function searchNominatim(query, signal) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=50&addressdetails=1&extratags=1`;
    
    // Retry logic to handle transient network errors like timeouts
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            if (signal.aborted) return [];

            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' },
                signal: signal // Pass the abort signal to the fetch request
            });

            if (response.ok) {
                return await response.json();
            }
            // Don't retry on client-side or server-side errors, only on network failures
            break;
        } catch (e) {
            if (e.name === 'AbortError') {
                console.log('[SearchManager] Nominatim search aborted.');
                return [];
            }
            // On the last attempt, log the error
            if (attempt === 1) {
        console.error('[SearchManager] Nominatim search failed:', e);
            }
        }
    }
    return []; // Return empty array if all attempts fail
}

/**
 * The main search function with streaming partial results.
 * Orchestrates searching across local data and remote services.
 * Local sources (SITE_ARCHIVES, localAtlasFeatures) emit instantly,
 * remote sources (Wikidata, Nominatim) emit as each resolves.
 *
 * @param {string} query - The user's search query.
 * @param {Array<object>} localAtlasFeatures - GeoJSON features currently loaded on the map (from OSM/Wikidata).
 * @param {AbortSignal} signal - An AbortSignal to cancel the request.
 * @param {function} [onPartial] - Optional callback invoked with the sorted results so far as each source arrives.
 * @returns {Promise<Array<SearchResult>>} A promise that resolves to the full sorted array of results.
 */
export async function performSearch(query, localAtlasFeatures = [], signal, onPartial) {
    const normalizedQuery = query.toLowerCase().trim();
    if (normalizedQuery.length < 2) return [];

    const seenIds = new Set(); // To prevent duplicates across different sources
    let combinedResults = [];

    // Internal: processes a batch of items, merges with existing results, notifies via onPartial
    function ingestBatch(items, getResultFn) {
        let newCount = 0;
        items.forEach(item => {
            const result = getResultFn(item);
            if (result) {
                combinedResults.push(result);
                newCount++;
            }
        });
        if (newCount > 0) {
            // Re-sort with new items included
            combinedResults.sort((a, b) => (b.score || 0) - (a.score || 0));
            if (onPartial) onPartial(combinedResults);
        }
    }

    // --- 1. SITE_ARCHIVES (instant - local data) ---
    ingestBatch(SITE_ARCHIVES, site => {
        const score = scoreItem(site, normalizedQuery);
        if (score <= 0) return null;
        const id = `archive-${site.slug}`;
        if (seenIds.has(id)) return null;
        seenIds.add(id);
        return {
            id, score,
            name: site.name,
            subtitle: `${site.categories.siteType} • ${site.categories.region}`,
            type: 'Sawah Archive', icon: '🏛', source: 'Sawah Archive',
            coordinates: [site.lng, site.lat], raw: site
        };
    });

    // --- 2. Local Atlas Features (instant - already on map) ---
    ingestBatch(localAtlasFeatures || [], feature => {
        const score = scoreItem(feature, normalizedQuery);
        if (score <= 0) return null;
        const id = `atlas-${feature.properties.id}`;
        if (seenIds.has(id)) return null;
        seenIds.add(id);
        return {
            id, score,
            name: feature.properties.name,
            subtitle: `${feature.properties.type} • ${feature.properties.source}`,
            type: 'Map Feature',
            icon: feature.properties.icon || '🏺', source: feature.properties.source,
            coordinates: feature.geometry.coordinates, raw: feature
        };
    });

    // --- 3. Fire remote searches in parallel, emit each as it completes ---
    const remotePromises = [
        searchWikidataGlobally(normalizedQuery, signal).then(features => {
            const results = [];
            (features || []).forEach(feature => {
                const score = scoreItem(feature, normalizedQuery) + 50; // Boost global results slightly
                if (score <= 0) return;
                const id = `atlas-${feature.properties.id}`;
                if (seenIds.has(id)) return;
                seenIds.add(id);
                results.push({
                    id, score,
                    name: feature.properties.name,
                    subtitle: `${feature.properties.type} • ${feature.properties.source}`,
                    type: 'atlas', icon: feature.properties.icon || '🌍',
                    source: feature.properties.source,
                    coordinates: feature.geometry.coordinates, raw: feature
                });
            });
            if (results.length > 0) {
                combinedResults.push(...results);
                combinedResults.sort((a, b) => (b.score || 0) - (a.score || 0));
                if (onPartial) onPartial(combinedResults);
            }
        }),

        searchNominatim(normalizedQuery, signal).then(places => {
            if (!Array.isArray(places)) return;
            const results = [];
            places.forEach(place => {
                const score = scoreItem(place, normalizedQuery);
                if (score <= 0) return;
                const id = `nominatim-${place.place_id}`;
                if (seenIds.has(id)) return;
                seenIds.add(id);
                results.push({
                    id, score,
                    name: place.name || place.display_name.split(',')[0],
                    subtitle: place.display_name.split(', ').slice(1).join(', '),
                    type: 'nominatim', icon: '📍', source: 'Nominatim',
                    coordinates: [parseFloat(place.lon), parseFloat(place.lat)], raw: place
                });
            });
            if (results.length > 0) {
                combinedResults.push(...results);
                combinedResults.sort((a, b) => (b.score || 0) - (a.score || 0));
                if (onPartial) onPartial(combinedResults);
            }
        }).catch(() => {}),

        // Global OSM name search — finds historical/cultural places by name
        // across the whole world via Overpass (complements Wikidata/Nominatim).
        // Aborts fast now that Overpass has a short per-request timeout.
        searchOsmByName(normalizedQuery, signal).then(features => {
            if (!Array.isArray(features)) return;
            const results = [];
            (features || []).forEach(feature => {
                const score = scoreItem(feature, normalizedQuery) + 45; // Boost global matches slightly
                if (score <= 0) return;
                const id = `osm-global-${feature.properties.id}`;
                if (seenIds.has(id)) return;
                seenIds.add(id);
                results.push({
                    id, score,
                    name: feature.properties.name,
                    subtitle: `${feature.properties.type} • ${feature.properties.source}`,
                    type: 'Map Feature', icon: feature.properties.icon || '🏺',
                    source: feature.properties.source,
                    coordinates: feature.geometry.coordinates, raw: feature
                });
            });
            if (results.length > 0) {
                combinedResults.push(...results);
                combinedResults.sort((a, b) => (b.score || 0) - (a.score || 0));
                if (onPartial) onPartial(combinedResults);
            }
        }).catch(() => {})
    ];

    await Promise.all(remotePromises);

    // Final sort before returning
    combinedResults.sort((a, b) => (b.score || 0) - (a.score || 0));
    return combinedResults;
}