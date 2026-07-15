export function normalizeSearchKey(text) {
    return String(text || '')
        .trim()
        .toLowerCase()
        .replace(/[\s\u2019'’]+/g, ' ')
        .replace(/[^a-z0-9 ]/g, '');
}

export const SITE_ARCHIVES = [
    {
        name: "Great Pyramid of Giza",
        slug: "great-pyramid-of-giza",
        lat: 29.9792,
        lng: 31.1342,
        img: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Kheops-Pyramid.jpg",
        desc: "The only surviving Wonder of the Ancient World, built as King Khufu's tomb.",
        categories: { period: "Old Kingdom", region: "Egypt", siteType: "Pyramid" },
        excavationStatus: "Archived",
        leadResearcher: "Flinders Petrie",
        searchKeywords: ["Giza Pyramid", "Khufu", "Cheops"],
        archive: {
            title: "Great Pyramid of Giza",
            summary: "Built around 2560 BCE, the Great Pyramid of Giza is the oldest and largest of the three pyramids on the Giza Plateau. It remains one of the most remarkable engineering achievements in human history.",
            geolocation: { latitude: 29.9792, longitude: 31.1342 },
            statistics: {
                height: "139.3 meters (original)",
                base: "230.4 meters per side",
                constructed: "c. 2560 BCE",
                location: "Giza Plateau, Egypt",
                architects: "Hemiunu"
            },
            timeline: [
                { year: "c. 2580 BCE", event: "Construction of the Great Pyramid is completed during the reign of Pharaoh Khufu." },
                { year: "c. 2500 BCE", event: "The pyramid is recognized as an architectural wonder in early Egyptian records." },
                { year: "14th century CE", event: "Ibn Battuta records the pyramid as an ancient monument during his travels." },
                { year: "15th century CE", event: "European visitors remark on the scale of the structure and its astronomical alignments." },
                { year: "1818 CE", event: "Giovanni Battista Caviglia begins extensive early modern excavations at the pyramid." },
                { year: "1880 CE", event: "Flinders Petrie establishes a systematic field methodology at Giza." },
                { year: "1954 CE", event: "The Egyptian government undertakes a large conservation campaign to preserve the Giza monuments." },
                { year: "2007 CE", event: "The pyramid is included in UNESCO's World Heritage listing for Memphis and its Necropolis." }
            ],
            landmarks: [
                { name: "Khufu Pyramid", description: "The main pyramid, built for Pharaoh Khufu, originally standing at 139 meters.", image: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Great_Pyramid_of_Giza_%28241645333288%29.jpg" },
                { name: "Sphinx", description: "A monumental limestone statue guarding the Giza Plateau, associated with royal funerary complexes.", image: "https://upload.wikimedia.org/wikipedia/commons/1/10/Great_Sphinx_of_Giza_-_20080716a.jpg" }
            ],
            historicalSites: [
                { name: "Valley Temple of Khafre", type: "Mortuary Temple", year: "c. 2558 BCE", description: "A companion temple to the pyramids, constructed from finely dressed limestone." }
            ],
            people: [
                { name: "Pharaoh Khufu", significance: "Commissioned the Great Pyramid and presided over an era of monumental construction." },
                { name: "Imhotep", significance: "Early architect and priest whose legacy influenced later pyramid-building traditions." },
                { name: "Giovanni Battista Caviglia", significance: "One of the first modern explorers to investigate the internal chambers of the Great Pyramid." }
            ],
            imageGallery: [
                { url: "https://upload.wikimedia.org/wikipedia/commons/3/36/All_Gizah_Pyramids.jpg", description: "The pyramids of Giza seen from the plateau", type: "Aerial Photo" },
                { url: "https://upload.wikimedia.org/wikipedia/commons/8/8d/Khufu%27s_Pyramid_The_Great_Pyramid_of_Giza.jpg", description: "Sunlight striking the Great Pyramid", type: "Landscape" }
            ],
            chapters: [
                {
                    title: "Engineering the Tomb",
                    chapterIntro: "The design and construction of the Great Pyramid pushed Bronze Age engineering to its limits.",
                    content: `<h2>Geometric precision</h2><p>The Great Pyramid's base is aligned within fractions of a degree of true north. Its original facing stones created a near-perfect polished surface that reflected sunlight across the desert.</p><blockquote><p>"The Great Pyramid is a monument to the audacity of human ambition and the precision of the ancient Egyptian surveyors."</p></blockquote><h3>Construction methods</h3><p>Scholars believe the core blocks were raised using straight or spiral ramps while teams of masons dressed the outer casing stones on-site. The pyramid contains internal corridors and chambers that demonstrate a high degree of planning.</p><ul><li>Estimated workforce: 20,000–30,000 laborers</li><li>Materials: limestone casing, granite chambers</li><li>Construction duration: c. 20 years</li></ul>`
                },
                {
                    title: "Funerary Rituals",
                    chapterIntro: "The pyramid complex was a stage for royal death and rebirth ceremonies.",
                    content: `<p>The internal layout of the Great Pyramid served as a symbolic journey for the deceased king. The burial chamber, air shafts, and antechambers align with stars important to Egyptian cosmology.</p><h3>Mortuary complex</h3><p>The pyramid is accompanied by a mortuary temple, causeway, and valley temple. These structures hosted offerings, processions, and rituals meant to sustain Khufu in the afterlife.</p>`
                },
                {
                    title: "Legacy and Mystery",
                    chapterIntro: "For millennia, the pyramid has been a touchstone for archaeology, mysticism, and modern tourism.",
                    content: `<p>The Great Pyramid has inspired explorers, scientists, and poets. Its scale and preservation have made it a reference point for studies of ancient Egyptian society and engineering.</p><h3>Modern significance</h3><p>Today, Giza remains one of the world's most visited archaeological sites. Conservation efforts focus on balancing tourism with preservation and urban encroachment.</p>`
                }
            ],
            sources: [
                { name: "UNESCO", url: "https://whc.unesco.org/en/list/86", title: "Giza Pyramid Complex World Heritage listing" },
                { name: "British Museum", url: "https://britishmuseum.org", title: "Research on Old Kingdom Egypt" }
            ]
        }
    },
    {
        name: "Luxor Temple",
        slug: "luxor-temple",
        lat: 25.6872,
        lng: 32.6396,
        img: "https://upload.wikimedia.org/wikipedia/commons/7/72/Luxor_Temple.jpg",
        desc: "A great religious complex dedicated to the rejuvenation of kingship.",
        categories: { period: "New Kingdom", region: "Egypt", siteType: "Temple" },
        excavationStatus: "Active",
        leadResearcher: "Gaston Maspero",
        searchKeywords: ["Thebes", "Amun", "Amenhotep"],
        archive: {
            title: "Luxor Temple",
            summary: "Luxor Temple, founded by Amenhotep III and expanded by Ramses II, was a major cult center on the east bank of the Nile at Thebes.",
            geolocation: { latitude: 25.6872, longitude: 32.6396 },
            statistics: {
                established: "c. 1400 BCE",
                dedicatedTo: "Amun-Ra, Mut, Khonsu",
                location: "Luxor, Egypt",
                material: "Sandstone"
            },
            timeline: [
                { year: "c. 1390 BCE", event: "Amenhotep III begins construction of the temple complex." },
                { year: "c. 1279 BCE", event: "Ramses II adds the first pylon and colonnade." },
                { year: "30 BCE", event: "Roman converts the temple into a fortress and administrative center." },
                { year: "1798 CE", event: "Napoleon's expedition records the temple's reliefs for the first time in Europe." }
            ],
            landmarks: [
                { name: "Ramses II Colossus", description: "A pair of monumental seated statues guarding the original entrance.", image: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Ramses_II%27s_colossus_in_Luxor_Temple.jpg" }
            ],
            historicalSites: [
                { name: "Avenue of Sphinxes", type: "Processional Way", year: "c. 1400 BCE", description: "A thousand-foot avenue linking Luxor Temple to Karnak." }
            ],
            people: [
                { name: "Amenhotep III", significance: "Initiated the original temple construction and established Luxor as a cultic center." },
                { name: "Ramses II", significance: "Expanded the temple with grand colonnades and monumental gateways." }
            ],
            imageGallery: [
                { url: "https://upload.wikimedia.org/wikipedia/commons/4/49/Luxor_Temple_Night.jpg", description: "Luxor Temple illuminated at dusk.", type: "Night Photo" }
            ],
            chapters: [
                {
                    title: "Temple of Rebirth",
                    chapterIntro: "Luxor Temple was the stage for rituals that renewed royal power every year.",
                    content: `<p>The opulent decoration of Luxor Temple celebrates the divine kingship of the pharaoh. Scenes of the Sed festival and divine marriage rituals underline the temple's political role.</p><blockquote><p>"Each stone at Luxor Temple is a proclamation of the living king's bond with the god Amun."</p></blockquote><h3>Processions and pageantry</h3><p>The annual Opet Festival carried the sacred barque from Karnak to Luxor along the Avenue of Sphinxes, renewing the king's strength before the people.</p>`
                },
                {
                    title: "Art and Architecture",
                    chapterIntro: "The temple combines New Kingdom grandeur with later Roman adaptations.",
                    content: `<p>Luxor Temple's architecture blends massive pylons, colonnaded halls, and intimate chapels. The columns of the Great Hypostyle Hall display detailed hieroglyphs and battle scenes.</p><h3>Roman transformation</h3><p>The Romans adapted the temple as a military headquarters, adding barracks and a fortress while preserving much of the original stonework.</p>`
                }
            ],
            sources: [
                { name: "Egyptian Ministry of Tourism", url: "https://egymonuments.gov.eg", title: "Luxor Temple archaeological overview" }
            ]
        }
    },
    {
        name: "Colosseum",
        slug: "colosseum",
        lat: 41.8902,
        lng: 12.4922,
        img: "https://upload.wikimedia.org/wikipedia/commons/d/de/Colosseo_2020.jpg",
        desc: "Ancient Rome's largest amphitheater, still the iconic symbol of imperial spectacle.",
        categories: { period: "Roman Empire", region: "Italy", siteType: "Amphitheater" },
        excavationStatus: "Archived",
        leadResearcher: "Carlo Fea",
        searchKeywords: ["Flavian Amphitheatre", "Rome Arena", "Gladiators"],
        archive: {
            title: "Colosseum",
            summary: "Completed in 80 CE under Emperor Titus, the Colosseum held public spectacles, gladiatorial contests, and staged mythological dramas for tens of thousands of spectators.",
            geolocation: { latitude: 41.8902, longitude: 12.4922 },
            statistics: {
                capacity: "Up to 50,000 spectators",
                inaugurated: "80 CE",
                material: "Travertine, tuff, brick-faced concrete",
                location: "Rome, Italy"
            },
            timeline: [
                { year: "72 CE", event: "Construction begins under Emperor Vespasian." },
                { year: "80 CE", event: "The Colosseum is inaugurated by Titus with 100 days of games." },
                { year: "217 CE", event: "A fire damages much of the wooden upper levels." },
                { year: "523 CE", event: "Severe earthquake leads to partial collapse of the southern facade." },
                { year: "1749 CE", event: "Efforts commence to preserve and restore the surviving monument." }
            ],
            landmarks: [
                { name: "Arena Floor", description: "The central performance area was once covered by timber and sand, with underground hypogeum chambers beneath.", image: "https://upload.wikimedia.org/wikipedia/commons/5/56/Colosseum_ruins_in_Rome_%281999%29.jpg" }
            ],
            historicalSites: [
                { name: "Hypogeum", type: "Underground Chambers", year: "80 CE", description: "The twin-level substructure hosted cages, elevators, and staging machinery for dramatic presentations." }
            ],
            people: [
                { name: "Vespasian", significance: "Commissioned the Colosseum as part of the Flavian amphitheater program." },
                { name: "Titus", significance: "Completed and inaugurated the Colosseum in a spectacular public festival." }
            ],
            imageGallery: [
                { url: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Colosseum_in_Rome%2C_Italy_-_April_2007.jpg", description: "Interior view of the Colosseum seating tiers.", type: "Historical Site Photo" }
            ],
            chapters: [
                {
                    title: "Imperial Spectacle",
                    chapterIntro: "The Colosseum was designed to awe and entertain with dramatic athletic spectacle.",
                    content: `<p>The amphitheater staged gladiatorial combat, wild beast hunts, and naval reenactments. Spectators occupied tiered seating arranged by social rank.</p><blockquote><p>"The roar of the crowd at the Colosseum echoed the power of the emperor and the grandeur of Rome itself."</p></blockquote><h3>Social theater</h3><p>Attendance at games was free, reinforcing civic loyalty while displaying imperial largesse.</p>`
                },
                {
                    title: "Archaeology and Conservation",
                    chapterIntro: "Modern archaeology has revealed the Colosseum's changing roles through the centuries.",
                    content: `<p>After the end of gladiatorial games, the Colosseum was repurposed as a quarry, housing complex, and religious site. Today its ruins are preserved as a symbol of Rome's ancient heritage.</p>`
                }
            ],
            sources: [
                { name: "Parco Archeologico del Colosseo", url: "https://parcocolosseo.it", title: "Official site for the Colosseum archaeological park" }
            ]
        }
    },
    {
        name: "Petra",
        slug: "petra",
        lat: 30.3285,
        lng: 35.4444,
        img: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Travel-Petra-Jordan-2.jpg",
        desc: "A rock-cut city of the Nabataeans hidden in the rose-red canyons of southern Jordan.",
        categories: { period: "Nabataean", region: "Jordan", siteType: "City" },
        excavationStatus: "Active",
        leadResearcher: "Johann Ludwig Burckhardt",
        searchKeywords: ["Rose City", "Nabataeans", "Khazneh"],
        archive: {
            title: "Petra",
            summary: "Founded in the 4th century BCE, Petra became a wealthy trading capital for the Nabataeans and is famous for its carved sandstone facades and water management systems.",
            geolocation: { latitude: 30.3285, longitude: 35.4444 },
            statistics: {
                founded: "c. 312 BCE",
                population: "Estimated 20,000 in its heyday",
                location: "Wadi Musa, Jordan",
                designation: "UNESCO World Heritage Site"
            },
            timeline: [
                { year: "c. 312 BCE", event: "Moses the Nabataean is traditionally credited with founding Petra." },
                { year: "106 CE", event: "Petra becomes part of the Roman province of Arabia Petraea." },
                { year: "363 CE", event: "An earthquake damages major structures, initiating a long period of decline." },
                { year: "1812 CE", event: "Swiss explorer Johann Ludwig Burckhardt rediscovers Petra for the West." }
            ],
            landmarks: [
                { name: "Khazneh", description: "The Treasury's ornate facade is carved directly into the cliff face and is Petra's best-known monument.", image: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Petra_Jordan_BW_21.JPG" }
            ],
            historicalSites: [
                { name: "Royal Tombs", type: "Burial Facades", year: "1st century BCE", description: "Monumental tomb facades carved into the eastern cliffs of the city." }
            ],
            people: [
                { name: "Aretas IV", significance: "One of Petra's most prosperous Nabataean kings, whose reign saw extensive building projects." },
                { name: "Johann Ludwig Burckhardt", significance: "European explorer who introduced Petra to the modern world." }
            ],
            imageGallery: [
                { url: "https://upload.wikimedia.org/wikipedia/commons/3/32/Petra_Jordan_-_October_2014.jpg", description: "The Siq entrance leading to Petra's Treasury.", type: "Landscape" }
            ],
            chapters: [
                {
                    title: "The Nabataean Capital",
                    chapterIntro: "Petra was a crossroads of trade and a center for desert engineering.",
                    content: `<p>Petra's prosperity derived from control of caravan routes carrying incense, spices, and silk. The Nabataeans mastered water collection and storage in an arid environment.</p><h3>Rock-cut architecture</h3><p>Monumental facades were carved directly into the sandstone cliffs, blending Hellenistic detail with local tradition.</p>`
                },
                {
                    title: "Rediscovery and Preservation",
                    chapterIntro: "The modern story of Petra is one of archaeological rediscovery and conservation challenges.",
                    content: `<p>European travelers were captivated by Petra's hidden cityscape. Modern preservation efforts now focus on erosion, tourism impact, and community heritage.</p>`
                }
            ],
            sources: [
                { name: "UNESCO", url: "https://whc.unesco.org/en/list/326", title: "Petra World Heritage Site" }
            ]
        }
    },
    {
        name: "Stonehenge",
        slug: "stonehenge",
        lat: 51.1789,
        lng: -1.8262,
        img: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Stonehenge2007_07_30.jpg",
        desc: "A prehistoric stone circle that remains one of the world's most studied ritual landscapes.",
        categories: { period: "Neolithic", region: "England", siteType: "Monument" },
        excavationStatus: "Planned",
        leadResearcher: "William Stukeley",
        searchKeywords: ["Wiltshire", "Salisbury Plain", "Neolithic Circle"],
        archive: {
            title: "Stonehenge",
            summary: "Constructed in phases between 3000 and 2000 BCE, Stonehenge is a monumental stone circle whose purpose likely combined astronomy, ritual, and ancestral commemoration.",
            geolocation: { latitude: 51.1789, longitude: -1.8262 },
            statistics: {
                constructed: "c. 3000–2000 BCE",
                stones: "Over 90 standing stones remain",
                location: "Salisbury Plain, England",
                siteType: "Ceremonial Monument"
            },
            timeline: [
                { year: "c. 3000 BCE", event: "The first earthwork enclosure and timber structures are built at Stonehenge." },
                { year: "c. 2500 BCE", event: "The large sarsen stones and bluestones are erected into the iconic circle." },
                { year: "1620 CE", event: "The antiquarian William Stukeley publishes influential drawings and interpretations." },
                { year: "1986 CE", event: "Stonehenge is inscribed as a UNESCO World Heritage Site." }
            ],
            landmarks: [
                { name: "Sarsen Circle", description: "Massive sandstone blocks arranged in a ring, aligned with solstitial sunrise and sunset.", image: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Stonehenge2007_07_30.jpg" }
            ],
            historicalSites: [
                { name: "Avenue", type: "Processional Way", year: "c. 3000 BCE", description: "A ceremonial route connecting Stonehenge with the River Avon." }
            ],
            people: [
                { name: "William Stukeley", significance: "Pioneered early archaeological documentation of Stonehenge in the 18th century." }
            ],
            imageGallery: [
                { url: "https://upload.wikimedia.org/wikipedia/commons/6/68/Stonehenge_sunrise.jpg", description: "Stonehenge at sunrise during the solstice.", type: "Event Photo" }
            ],
            chapters: [
                {
                    title: "Monument of the Ancestors",
                    chapterIntro: "Stonehenge was created as a ceremonial landscape for communities of Neolithic Britain.",
                    content: `<p>People transported massive stones from distant sources and arranged them in a precise geometry. The monument's layout suggests a connection to solar cycles and ritual practice.</p><blockquote><p>"Stonehenge remains a quiet witness to the ingenuity of prehistoric builders and their knowledge of the sky."</p></blockquote>`
                },
                {
                    title: "Archaeology in the Field",
                    chapterIntro: "Excavations around Stonehenge reveal successive phases of construction and use.",
                    content: `<p>Excavations have uncovered burial mounds, flint tools, and evidence of feasting. The surrounding landscape includes many contemporary monuments, forming a wider ritual complex.</p>`
                }
            ],
            sources: [
                { name: "English Heritage", url: "https://www.english-heritage.org.uk/visit/places/stonehenge/", title: "Stonehenge visitor and archaeological information" }
            ]
        }
    }
];

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
