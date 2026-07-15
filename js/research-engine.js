/**
 * Sawah Research Engine v2
 * Gathers information from multiple sources (planned), synthesizes it with AI,
 * and produces a structured JSON archive object.
 */
import { queryAI } from './oracle.js';
import { gatherAllSources } from './datasources.js';

/**
 * Uses the AI to synthesize gathered research into a structured archive.
 * @param {string} query The user's research query.
 * @param {object} sourceData The data gathered from sources.
 * @returns {Promise<object>} A structured archive object.
 */
async function synthesizeArchive(query, sourceData) {
    const systemPrompt = `You are a world-class historian and digital archivist. Return ONLY valid JSON. Do not use markdown. Do not use code fences. Do not include explanations.

Your response must be a single, complete JSON object adhering to the following schema:
{
  "title": "string",
  "summary": "string",
  "geolocation": { "latitude": "number", "longitude": "number" },
  "timeline": [ { "year": "number or string", "event": "string" } ],
  "landmarks": [ { "name": "string", "description": "string" } ],
  "historicalSites": [ { "name": "string", "type": "string", "year": "string", "description": "string" } ],
  "people": [ { "name": "string", "significance": "string" } ],
  "statistics": { "population": "string", "area": "string", "gdp": "string" },
  "imageGallery": [ { "url": "string", "description": "string", "type": "string" } ],
  "chapters": [ { "title": "string", "chapterIntro": "string", "content": "string (HTML with <p>, <h2>, <h3>, <ul>, <li>, and <blockquote>)" } ]
}`;

    const userPrompt = `
        Create a comprehensive, encyclopedic, documentary-style archive about "${query}".
        Your response must be a single JSON object.

    Requirements:
        - Use the provided context data to generate a rich, detailed, and accurate archive.
        - Generate 2 to 3 distinct, well-developed chapters based on the context. The chapter title must be specific and academic.
        - For each chapter, provide a short, italicized 'chapterIntro' paragraph.
        - The main 'content' for each chapter must contain multiple, detailed paragraphs formatted in valid HTML. Use <p>, <h2>, <h3>, <ul>, <li> tags.
        - Importantly, include at least one <blockquote> element within the chapter 'content' to highlight a key fact or quote.
        - Use the provided 'statistics' data to populate the statistics object.
        - Use the provided 'historicalSites' data to populate the historicalSites array.
        - Use the provided 'images' data to populate the imageGallery array.
        - Generate a 'timeline' array with at least 10 significant historical events based on the context.
        - Generate a 'landmarks' array with at least 5 major landmarks based on the context.
        - Generate a 'people' array with at least 5 key historical figures based on the context.
        - The content should be scholarly, rich with facts, dates, people, and events.
        
    Context Data:
        ---
        ${JSON.stringify(sourceData.context, null, 2)}
        ---
    `;

    console.log("Research Engine: Synthesizing archive with AI...");
    // Removed token override to use the safer default from config.js.
    const archiveObject = await queryAI(systemPrompt, userPrompt, true); // true for JSON mode
    return archiveObject;
}

/**
 * Main function for the research pipeline.
 * @param {string} query The historical topic to generate an archive for.
 * @returns {Promise<object>} The final, structured archive object with sources.
 */
export async function generateArchive(query) {
    try {
        // Step 1: Gather data from various sources (currently a placeholder)
        const sourceData = await gatherAllSources(query);

        // Step 2: Use AI to synthesize the data into a structured JSON object
        const archive = await synthesizeArchive(query, sourceData);

        // Step 3: Add sources to the final object
        archive.sources = sourceData.sources;

        // Basic validation
        if (!archive.title || !archive.summary || !archive.geolocation || !Array.isArray(archive.chapters) || archive.chapters.length === 0 || !archive.timeline) {
            throw new Error("AI returned an invalid archive structure.");
        }

        // Filter out any malformed chapters
        archive.chapters = archive.chapters.filter(ch => ch && ch.title && ch.content);

        console.log("Research Engine: Archive generation successful.", archive);
        return archive;

    } catch (e) {
        console.warn("AI generation failed, using a locally generated fallback archive:", e.message);
        // This robust fallback prevents application crashes and ensures the book is always readable,
        // even if the AI service is down or misconfigured.
        return {
            title: query,
            summary: `A historical archive documenting the significance and evolution of ${query}. This record has been compiled from available sources and provides an overview of key events, cultural context, and lasting impact.`,
            geolocation: {
                latitude: 0,
                longitude: 0
            },
            // Add rich placeholder data for a better fallback UI
            imageGallery: [
                { url: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=800", description: "Ancient library illustration", type: "Illustration" },
                { url: "https://images.unsplash.com/photo-1585620385399-8001383f8865?w=800", description: "A weathered map on a wooden table.", type: "Map" },
                { url: "https://images.unsplash.com/photo-1555633514-91342827a518?w=800", description: "Close-up of ancient stone carvings.", type: "Artifact" }
            ],
            statistics: {
                population: "N/A",
                area: "N/A",
                gdp: "N/A",
                founded: "c. 3100 BCE",
                location: "Placeholder Location",
                status: "UNESCO Site (Simulated)"
            },
            timeline: [
                { year: "c. 3500 BCE", event: "Invention of writing in Mesopotamia, marking the beginning of recorded history." },
                { year: "c. 753 BCE", event: "Legendary founding of Rome, which would grow into a vast empire." },
                { year: "476 CE", event: "Fall of the Western Roman Empire, a pivotal event leading into the Middle Ages." },
                { year: "1453 CE", event: "Fall of Constantinople, marking the end of the Byzantine Empire." },
                { year: "1789 CE", event: "The beginning of the French Revolution, a major turning point in modern European history." }
            ],
            landmarks: [
                { name: "Placeholder Landmark", description: "This is a placeholder as the AI engine is currently unavailable.", image: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400" }
            ],
            historicalSites: [
                { name: "Simulated Historical Site", type: "Monument", year: "Ancient", description: "This is a placeholder site description. The AI engine is currently unavailable." }
            ],
            people: [
                { name: "Placeholder Figure", significance: "This is a placeholder as the AI engine is currently unavailable.", image: "https://images.unsplash.com/photo-1610991603552-2b7937e0a9be?w=400" }
            ],
            chapters: [
                {
                    title: "Origins",
                    chapterIntro: "The story of History begins in a period of significant historical change, where early records and archaeological findings paint a picture of thriving ancient communities.",
                    content: `<p>The story of ${query} begins in a period of significant historical change. Early records indicate that the area was originally inhabited by indigenous peoples who established thriving communities.</p><p>Archaeological evidence suggests continuous settlement dating back several centuries, with artifacts revealing sophisticated social structures and cultural practices. The natural resources of the region made it an attractive site for permanent settlement.</p>`
                },
                {
                    title: "Historical Development",
                    chapterIntro: "Tracing the trajectory of this region reveals a dynamic interplay of growth and challenge, from the establishment of medieval institutions to the transformative waves of modernization.",
                    content: `<p>Throughout its history, ${query} has experienced periods of both remarkable growth and profound challenge. The medieval era saw the establishment of key institutions that would define the region's trajectory for centuries.</p><p>The early modern period brought transformative changes. New technologies, shifting political landscapes, and evolving social norms all contributed to a dynamic environment. Industrialization and modernization in the 19th and 20th centuries accelerated change at an unprecedented pace.</p>`
                },
                {
                    title: "Significance and Legacy",
                    chapterIntro: "Today, the area stands as a testament to human resilience and ingenuity, its legacy extending beyond local boundaries to contribute to a global cultural and historical tapestry.",
                    content: `<p>Today, ${query} stands as a testament to human resilience and ingenuity. Its significance extends beyond local boundaries, contributing to national identity, cultural heritage, and global understanding.</p><p>Modern developments have positioned ${query} as a center of innovation and culture. Its economy has diversified to embrace technology, education, and creative industries. This evolution reflects the enduring spirit of the community and its ability to embrace change while honoring its roots.</p>`
                }
            ],
            sources: [
                { name: "Wikipedia", url: "#", title: "Primary historical summary and chronology reference." },
                { name: "Wikidata", url: "#", title: "Structured data and entity relationships." },
                { name: "System Fallback", url: "#", title: "This archive was generated locally due to an AI service error." }
            ]
        };
    }
}

/**
 * Bridge for older pages like map.html that may rely on a global function
 * to open an archive. The modern approach is to navigate directly to:
 * archive.html?placeName=...
 */
window.openAIDossier = function(placeName) {
    window.location.href = `archive.html?placeName=${encodeURIComponent(placeName)}`;
};
