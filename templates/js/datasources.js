/**
 * Sawah Datasource Simulators
 * This module simulates fetching data from various real-world APIs like Wikipedia,
 * Wikidata, and Wikimedia Commons. In a production application, these would
 * make live network requests. Here, they return detailed, hardcoded data
 * for "Tokyo" to demonstrate the data pipeline.
 */

// Simulates fetching a summary and basic info from the Wikipedia API.
async function fetchWikipedia(query) {
    console.log(`[DataSource] Fetching live Wikipedia summary for "${query}"...`);
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json; charset=utf-8; profile="https://www.mediawiki.org/wiki/Specs/Summary/1.2.0"'
            }
        });

        if (!response.ok) {
            throw new Error(`Wikipedia API returned status ${response.status}`);
        }

        const data = await response.json();
        
        return {
            title: data.title || query,
            summary: data.extract || `No summary available for ${query}.`,
            extract_html: data.extract_html || `<p>No detailed extract available for ${query}.</p>`
        };
    } catch (error) {
        console.warn(`[DataSource] Failed to fetch from Wikipedia for "${query}": ${error.message}`);
        // Return a placeholder on failure to avoid breaking the pipeline
        return { title: query, summary: `Could not retrieve Wikipedia summary for ${query}.`, extract_html: `<p>Could not retrieve Wikipedia summary.</p>` };
    }
}

// Simulates fetching structured data from Wikidata.
async function fetchWikidata(query) {
    console.log(`[DataSource] Fetching Wikidata entities for "${query}"...`);
    // In a real app: SPARQL query to Wikidata
    if (query.toLowerCase() !== 'tokyo') {
        return { statistics: {}, historicalSites: [] };
    }
    return {
        statistics: {
            population: "14.04 million (Metropolis, 2021)",
            metroPopulation: "37.4 million (Greater Tokyo Area)",
            area: "2,194 km² (847 sq mi)",
            gdp: "$1.9 Trillion (Nominal, 2020)",
            founded: "1457 (as Edo)"
        },
        historicalSites: [
            { name: "Sensō-ji", type: "Buddhist Temple", year: "645", description: "Tokyo's oldest temple, located in Asakusa." },
            { name: "Meiji Shrine", type: "Shinto Shrine", year: "1920", description: "Dedicated to the deified spirits of Emperor Meiji and his wife, Empress Shōken." },
            { name: "Tokyo Imperial Palace", type: "Imperial Residence", year: "1888", description: "The primary residence of the Emperor of Japan, built on the site of the old Edo Castle." },
            { name: "Edo Castle", type: "Castle", year: "1457", description: "The seat of power for the Tokugawa shogunate, which ruled Japan from 1603 to 1868." }
        ]
    };
}

// Simulates fetching images from Wikimedia Commons.
async function fetchWikimediaCommons(query) {
    console.log(`[DataSource] Fetching Wikimedia Commons images for "${query}"...`);
    if (query.toLowerCase() !== 'tokyo') {
        return { images: [] };
    }
    return {
        images: [
            { url: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800", description: "Shibuya Crossing at night", type: "Modern Photo" },
            { url: "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=800", description: "Shinjuku skyline with neon lights", type: "Modern Photo" },
            { url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800", description: "Sensō-ji Temple in Asakusa", type: "Landmark" },
            { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Tokyo_Station_Marunouchi_Building_2022.jpg/1280px-Tokyo_Station_Marunouchi_Building_2022.jpg", description: "Tokyo Station, Marunouchi entrance", type: "Landmark" },
            { url: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Ginza_1930s.jpg", description: "Ginza district in the 1930s", type: "Historical Photo" },
            { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Map_of_Edo_and_its_surroundings_in_1844-1848.jpg/1280px-Map_of_Edo_and_its_surroundings_in_1844-1848.jpg", description: "Map of Edo (old Tokyo) circa 1844-1848", type: "Map" }
        ]
    };
}

/**
 * The main data gathering pipeline. It calls all the simulated datasource
 * functions and consolidates their results.
 * @param {string} query The user's search query.
 * @returns {Promise<object>} An object containing all gathered data and sources.
 */
export async function gatherAllSources(query) {
    console.log(`[Research Engine] Starting data gathering for "${query}"...`);

    const [wikiData, wikidataData, commonsData] = await Promise.all([
        fetchWikipedia(query),
        fetchWikidata(query),
        fetchWikimediaCommons(query)
    ]);

    const consolidatedData = {
        summary: wikiData.summary,
        ...wikidataData,
        ...commonsData
    };

    const sources = [
        { name: "Wikipedia", url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`, title: `${query} on Wikipedia` },
        { name: "Wikidata", url: "https://www.wikidata.org", title: "Wikidata Structured Database" },
        { name: "Wikimedia Commons", url: "https://commons.wikimedia.org", title: "Wikimedia Commons Media Repository" }
    ];

    console.log("[Research Engine] Data gathering complete.");
    return {
        context: consolidatedData,
        sources: sources
    };
}