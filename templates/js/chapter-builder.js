/**
 * Sawah Chapter Builder
 * Creates the HTML content for various page types (cover, TOC, chapters)
 * from a structured archive object. This module does not handle pagination.
 */
import { SAWAH_CONFIG } from './config.js';

/**
 * Creates the HTML for the book's front cover.
 * @param {string} title - The title of the archive.
 * @returns {string} HTML string for the cover page.
 */
export function buildCoverPage(title) {
    return `
        <div class="archive-cover">
            <p class="uppercase tracking-[4px] text-sm text-stone-500 mb-8">${SAWAH_CONFIG.APP_NAME}</p>
            <h1 class="text-5xl font-serif text-stone-800">${title}</h1>
            <p class="text-stone-600 mt-4">${SAWAH_CONFIG.APP_TAGLINE}</p>
            <div class="mt-16 w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-5xl text-primary">history_edu</span>
            </div>
        </div>
    `;
}

/**
 * Creates the HTML for a chapter's title page.
 * @param {string} chapterTitle - The title of the chapter.
 * @param {number} chapterIndex - The index of the chapter (0-based).
 * @returns {string} HTML string for the chapter page.
 */
export function buildChapterCoverPage(chapterTitle, chapterIndex) {
    const romanNumeral = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][chapterIndex] || chapterIndex + 1;
    return `
        <div class="chapter-page"><div class="chapter-ornament">◆</div><div class="chapter-number">${romanNumeral}</div><h1>${chapterTitle}</h1><p>Chapter ${chapterIndex + 1}</p><div class="chapter-ornament">— ✦ —</div></div>
    `;
}

/**
 * Creates the HTML for the Table of Contents.
 * The page numbers are placeholders to be filled in by the paginator.
 * @param {Array<object>} chapters - The chapters array from the archive.
 * @returns {string} HTML string for the TOC page.
 */
export function buildTocPage(chapters) {
    const listItems = chapters.map(ch => `
        <li class="flex justify-between items-baseline text-lg py-2 border-b border-stone-200">
            <span class="chapter-title">${ch.title}</span>
            <span class="dots flex-grow border-b border-dotted border-stone-300 mx-2"></span>
            <span class="page-num" data-chapter-title="${ch.title}">...</span>
        </li>
    `).join('');

    return `
        <div class="toc-page">
            <h1 class="text-4xl font-serif text-center mb-8">Table of Contents</h1>
            <ul class="toc-list">${listItems}</ul>
        </div>
    `;
}

/**
 * Assembles all pages for the book.
 * This is a preliminary step before pagination.
 * @param {object} archive - The structured archive object.
 * @returns {Array<object>} An array of page objects with type and content.
 */
export function buildBookPages(archive) {
    const pages = [];

    // 1. Cover Page
    pages.push({ type: 'cover', content: buildCoverPage(archive.title) });

    // 2. Table of Contents Page
    pages.push({ type: 'toc', content: buildTocPage(archive.chapters) });

    // 3. Chapter Pages
    archive.chapters.forEach((chapter, index) => {
        // Chapter Cover
        pages.push({ type: 'chapter_cover', content: buildChapterCoverPage(chapter.title, index) });
        // Chapter Content (to be paginated later)
        pages.push({ type: 'content', content: chapter.content, chapterTitle: chapter.title });
    });

    // 4. Sources/Footnotes page
    const sourcesContent = `
        <div class="p-8">
            <h2 class="text-2xl font-serif mb-4">Sources</h2>
            <ul class="list-disc pl-5">
                ${archive.sources.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name}</a></li>`).join('')}
            </ul>
        </div>
    `;
    pages.push({ type: 'sources', content: sourcesContent, chapterTitle: 'Sources' });

    return pages;
}