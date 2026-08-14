/**
 * Sawah Wikidata Map Service
 * Fetches geographical data (museums, archaeological sites) from Wikidata
 * based on the current map viewport (bounding box). This is a scalable approach
 * that avoids downloading the entire dataset at once.
 */

const WIKIDATA_SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

// To use bounding box queries, we need the geofunc service.
const WIKIDATA_SERVICE_PREFIX = 'PREFIX wd: <http://www.wikidata.org/entity/> PREFIX wdt: <http://www.wikidata.org/prop/direct/> PREFIX wikibase: <http://wikiba.se/ontology#> PREFIX p: <http://www.wikidata.org/prop/> PREFIX ps: <http://www.wikidata.org/prop/statement/> PREFIX pq: <http://www.wikidata.org/prop/qualifier/> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX bd: <http://www.bigdata.com/rdf#> PREFIX geo: <http://www.opengis.net/ont/geosparql#> PREFIX geof: <http://www.opengis.net/def/function/geosparql/>';

/**
 * Executes a SPARQL query against the Wikidata endpoint.
 * @param {string} sparqlQuery The SPARQL query string. 
 * @param {AbortSignal} signal An AbortSignal to cancel the request.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of raw Wikidata bindings.
 */
async function executeWikidataSparqlQuery(sparqlQuery, signal) {
    const url = `${WIKIDATA_SPARQL_ENDPOINT}?query=${encodeURIComponent(sparqlQuery)}&format=json`;
    console.log(`[WikidataMapService] Executing SPARQL query: ${sparqlQuery.substring(0, 100)}...`);

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            },
            signal: signal
        });

        if (!response.ok) {
            throw new Error(`Wikidata SPARQL API returned status ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.results.bindings;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('[WikidataMapService] SPARQL query aborted.');
            return [];
        }
        console.error(`[WikidataMapService] Error executing SPARQL query:`, error);
        return [];
    }
}

/**
 * Parses a Wikidata coordinate string (e.g., "Point(LON LAT)") into [longitude, latitude].
 * @param {string} coordString The coordinate string from Wikidata.
 * @returns {Array<number>|null} An array [longitude, latitude] or null if parsing fails.
 */
function parseWikidataCoordinates(coordString) {
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
 * Fetches UNESCO World Heritage Sites from Wikidata and converts them to
 * GeoJSON features. UNESCO designation is recorded on Wikidata via
 * P1435 (heritage designation) = Q9259 (UNESCO World Heritage Site).
 * @param {MapLibre.LngLatBounds} bounds The map's current bounding box.
 * @param {AbortSignal} signal An AbortSignal to cancel the request.
 * @returns {Promise<GeoJSON.FeatureCollection>} A GeoJSON FeatureCollection.
 */
export async function fetchUnescoAsGeoJSON(bounds, signal) {
    const sparqlQuery = `${WIKIDATA_SERVICE_PREFIX}
        SELECT ?place ?placeLabel ?coord WHERE {
          SERVICE wikibase:box {
            ?place wdt:P625 ?coord .
            bd:serviceParam wikibase:cornerWest "Point(${bounds.getWest()} ${bounds.getSouth()})"^^geo:wktLiteral .
            bd:serviceParam wikibase:cornerEast "Point(${bounds.getEast()} ${bounds.getNorth()})"^^geo:wktLiteral .
          }
          ?place wdt:P1435 wd:Q9259 . # Heritage designation = UNESCO World Heritage Site
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        LIMIT 500
    `;

    const bindings = await executeWikidataSparqlQuery(sparqlQuery, signal);

    const features = bindings.map(binding => {
        const coordinates = parseWikidataCoordinates(binding.coord.value);
        if (coordinates) {
            return {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: coordinates },
                properties: {
                    id: binding.place.value.split('/').pop(),
                    name: binding.placeLabel.value,
                    category: 'unesco',
                    iconKey: 'unesco',
                    icon: '⭐',
                    color: '#b8860b',
                    type: 'UNESCO Site',
                    source: 'Wikidata',
                    wikidata: binding.place.value,
                    wikipedia: '',
                    description: 'UNESCO World Heritage Site',
                    osmUrl: ''
                }
            };
        }
        return null;
    }).filter(Boolean);

    console.log(`[WikidataMapService] Fetched ${features.length} UNESCO sites.`);
    return {
        type: 'FeatureCollection',
        features: features
    };
}

/**
 * Fetches a generic category of places from Wikidata by instance-of QID.
 * @param {MapLibre.LngLatBounds} bounds The map's current bounding box.
 * @param {string} categoryKey The ATLAS_CATEGORIES key this data maps to.
 * @param {string} label The display label for the category.
 * @param {string} icon The emoji icon for the category.
 * @param {string} color The hex color for the category.
 * @param {string} qid The Wikidata QID (e.g. 'Q33506' for museum).
 * @param {AbortSignal} signal An AbortSignal to cancel the request.
 * @returns {Promise<GeoJSON.FeatureCollection>} A GeoJSON FeatureCollection.
 */
export async function fetchWikidataCategoryAsGeoJSON(bounds, categoryKey, label, icon, color, qid, signal) {
    // --- INTELLIGENT FETCH GATE ---
    // Don't query if the bounding box is excessively large to prevent server timeouts.
    const width = Math.abs(bounds.getEast() - bounds.getWest());
    const height = Math.abs(bounds.getNorth() - bounds.getSouth());
    if (width > 25 || height > 25) { // Using a slightly more generous limit than OSM
        console.log(`[WikidataMapService] Bounding box is too large for ${categoryKey} (${width.toFixed(1)}x${height.toFixed(1)} degrees). Skipping fetch.`);
        return { type: 'FeatureCollection', features: [] };
    }

    const sparqlQuery = `${WIKIDATA_SERVICE_PREFIX}
        SELECT ?place ?placeLabel ?coord ?unescoID WHERE {
          SERVICE wikibase:box {
            ?place wdt:P625 ?coord .
            bd:serviceParam wikibase:cornerWest "Point(${bounds.getWest()} ${bounds.getSouth()})"^^geo:wktLiteral .
            bd:serviceParam wikibase:cornerEast "Point(${bounds.getEast()} ${bounds.getNorth()})"^^geo:wktLiteral .
          }
          # Use a property path to find instances of the QID or any of its subclasses.
          ?place wdt:P31/wdt:P279* wd:${qid} .
          OPTIONAL { ?place wdt:P1435 ?unescoID . }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        LIMIT 500
    `;

    const bindings = await executeWikidataSparqlQuery(sparqlQuery, signal);

    const features = bindings.map(binding => {
        const coordinates = parseWikidataCoordinates(binding.coord.value);
        if (coordinates) {
            return {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: coordinates },
                properties: {
                    id: binding.place.value.split('/').pop(),
                    name: binding.placeLabel.value,
                    category: categoryKey,
                    iconKey: categoryKey,
                    icon: icon,
                    color: color,
                    type: label,
                    source: 'Wikidata',
                    isUnesco: !!binding.unescoID,
                    wikidata: binding.place.value,
                    wikipedia: '',
                    description: '',
                    osmUrl: ''
                }
            };
        }
        return null;
    }).filter(Boolean);

    console.log(`[WikidataMapService] Fetched ${features.length} ${label}.`);
    return {
        type: 'FeatureCollection',
        features: features
    };
}