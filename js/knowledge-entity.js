/* =========================================================
   BAJEE JRF AI
   KNOWLEDGE ENTITY
   STEP 10.4 — ENTITY DETAILS
========================================================= */

"use strict";


/* =========================================================
   STORAGE KEYS
========================================================= */

const GRAPH_STORAGE_KEYS = [
    "bajee_knowledge_graph",
    "bajee_knowledge_graph_data",
    "knowledgeGraph",
    "knowledgeGraphData",
    "bajeeKnowledgeGraph"
];


const PERFORMANCE_STORAGE_KEYS = [
    "bajee_performance",
    "bajee_performance_data",
    "bajeePerformance",
    "performanceData",
    "jrfPerformance"
];


const REVISION_STORAGE_KEYS = [
    "bajee_revision_intelligence",
    "bajee_revision_data",
    "revisionIntelligence",
    "revisionQueue"
];


const ADAPTIVE_STORAGE_KEYS = [
    "bajee_adaptive_recommendations",
    "bajee_adaptive_data",
    "adaptiveRecommendations",
    "adaptiveRecommendationData"
];


const RETEST_HISTORY_KEY =
    "bajee_revision_retest_history";


/* =========================================================
   FALLBACK KNOWLEDGE GRAPH
   ---------------------------------------------------------
   Used when the graph has not yet been exposed through
   localStorage. This mirrors the Step 10.3 foundation
   already visible in the Knowledge Graph.
========================================================= */

const FALLBACK_GRAPH = {

    entities: [

        {
            id: "derrida",
            name: "Jacques Derrida",
            type: "theorist",
            icon: "🎓",
            description:
                "French philosopher and theorist associated with deconstruction.",
            unit: "Unit IX",
            topics: [
                "Post-Structuralism",
                "Deconstruction",
                "Différance"
            ]
        },

        {
            id: "geoffrey-chaucer",
            name: "Geoffrey Chaucer",
            type: "author",
            icon: "👤",
            description:
                "Master Storage identifies Geoffrey Chaucer as a major figure of Late Middle English and notes The Canterbury Tales for its pilgrimage frame, presentation of social classes and voices, and comic-realistic picture of medieval life. The source also highlights characterisation, realism, humour, frame narrative, pilgrims and tale-character matching as examination angles.",
            unit: "Module 01 · British Literature",
            units: [
                "Module 01 · British Literature"
            ],
            curriculum: {
                module: "Module 01 · British Literature",
                chapter: "Chapter 02 · Age of Chaucer (1300 TO 1400 AD)",
                lesson: "Lesson 6 · Geoffrey Chaucer"
            },
            masterSources: [
                {
                    title: "Corrected Exact JRF Style Booklet",
                    type: "DOCX",
                    storage: "Master Storage",
                    evidenceState: "Direct Source",
                    matchReason: "Contains a dedicated Geoffrey Chaucer entry with period, works, Canterbury Tales pilgrimage frame, characters, critical reception and NET angle."
                },
                {
                    title: "Final Clean JRF Booklet",
                    type: "DOCX",
                    storage: "Master Storage",
                    evidenceState: "Direct Source",
                    matchReason: "Contains a dedicated Geoffrey Chaucer entry covering period, works, pilgrimage frame, characters, realism, humour, characterisation and NET angle."
                },
                {
                    title: "UGC NET / JRF Premium Aspirant Revision Booklet",
                    type: "PDF",
                    storage: "Master Storage",
                    evidenceState: "Direct Source",
                    matchReason: "Contains a Geoffrey Chaucer revision entry with period, works, pilgrimage frame, characters, critical reception and NET angle."
                }
            ],
            topics: [
                "Late Middle English",
                "The Canterbury Tales",
                "pilgrimage frame",
                "characterisation",
                "frame narrative",
                "pilgrims",
                "tale-character matching"
            ],
            works: [
                "The Book of the Duchess",
                "Troilus and Criseyde",
                "The Canterbury Tales"
            ]
        },

        {
            id: "deconstruction",
            name: "Deconstruction",
            type: "concept",
            icon: "💡",
            description:
                "A mode of reading associated with Derrida that examines tensions, assumptions and instability within texts and systems of meaning.",
            unit: "Unit IX",
            topics: [
                "Derrida",
                "Différance",
                "Binary Opposition",
                "Logocentrism"
            ]
        },

        {
            id: "differance",
            name: "Différance",
            type: "concept",
            icon: "💡",
            description:
                "Derrida's term describing the simultaneous deferral and differentiation through which meaning is produced without becoming fully present.",
            unit: "Unit IX",
            topics: [
                "Derrida",
                "Deconstruction",
                "Signifier / Signified"
            ]
        },

        {
            id: "binary-opposition",
            name: "Binary Opposition",
            type: "concept",
            icon: "💡",
            description:
                "A structuralist pattern in which meaning is organised through paired oppositions such as presence and absence.",
            unit: "Unit IX",
            topics: [
                "Structuralism",
                "Post-Structuralism",
                "Deconstruction"
            ]
        },

        {
            id: "logocentrism",
            name: "Logocentrism",
            type: "concept",
            icon: "💡",
            description:
                "Derrida's critique of the tendency in Western thought to privilege a stable centre, presence or ultimate source of meaning.",
            unit: "Unit IX",
            topics: [
                "Derrida",
                "Deconstruction",
                "Phonocentrism"
            ]
        },

        {
            id: "structuralism",
            name: "Structuralism",
            type: "movement",
            icon: "📚",
            description:
                "A critical and intellectual movement that studies underlying structures and systems governing language, culture and meaning.",
            unit: "Unit IX",
            topics: [
                "Saussure",
                "Signifier / Signified",
                "Binary Opposition"
            ]
        },

        {
            id: "post-structuralism",
            name: "Post-Structuralism",
            type: "movement",
            icon: "📚",
            description:
                "A broad critical movement associated with questioning stable structures, fixed meanings and universal interpretive systems.",
            unit: "Unit IX",
            topics: [
                "Derrida",
                "Foucault",
                "Barthes"
            ]
        },

        {
            id: "saussure",
            name: "Ferdinand de Saussure",
            type: "author",
            icon: "👤",
            description:
                "Swiss linguist whose account of the signifier and signified became foundational to structuralist thought.",
            unit: "Unit IX",
            topics: [
                "Structuralism",
                "Linguistics",
                "Signifier / Signified"
            ]
        },

        {
            id: "barthes",
            name: "Roland Barthes",
            type: "theorist",
            icon: "🎓",
            description:
                "French literary theorist and critic associated with structuralism and post-structuralism.",
            unit: "Unit IX",
            topics: [
                "Structuralism",
                "Post-Structuralism",
                "Death of the Author"
            ]
        },

        {
            id: "foucault",
            name: "Michel Foucault",
            type: "theorist",
            icon: "🎓",
            description:
                "French philosopher and theorist whose work examined discourse, knowledge, power and systems of thought.",
            unit: "Unit IX",
            topics: [
                "Post-Structuralism",
                "Discourse",
                "Power"
            ]
        },

        {
            id: "la-differance",
            name: "La Différance",
            type: "work",
            icon: "📖",
            description:
                "Derrida's 1968 essay introducing and developing the concept of différance.",
            unit: "Unit IX",
            topics: [
                "Derrida",
                "Différance",
                "Deconstruction"
            ]
        },

        {
            id: "death-of-author",
            name: "The Death of the Author",
            type: "work",
            icon: "📖",
            description:
                "Roland Barthes's influential essay challenging the author's privileged role in determining textual meaning.",
            unit: "Unit IX",
            topics: [
                "Barthes",
                "Author",
                "Reader"
            ]
        },

        {
            id: "signifier-signified",
            name: "Signifier / Signified",
            type: "concept",
            icon: "💡",
            description:
                "Saussurean terms describing the two aspects of the linguistic sign.",
            unit: "Unit IX",
            topics: [
                "Saussure",
                "Structuralism",
                "Linguistics"
            ]
        },

        {
            id: "post-structuralism-topic",
            name: "Post-Structuralism",
            type: "topic",
            icon: "🔎",
            description:
                "A UGC NET English preparation topic connecting major theorists, concepts and critical debates.",
            unit: "Unit IX",
            topics: [
                "Derrida",
                "Foucault",
                "Barthes"
            ]
        },

        {
            id: "objective-correlative",
            name: "Objective Correlative",
            type: "concept",
            icon: "💡",
            description:
                "T. S. Eliot's critical concept concerning a set of objects, situations or events that evokes a particular emotion.",
            unit: "Unit VIII",
            topics: [
                "T. S. Eliot",
                "Modernism",
                "Poetic Theory"
            ]
        },

        {
            id: "modernism",
            name: "Modernism",
            type: "movement",
            icon: "📚",
            description:
                "A literary movement associated with experimentation, fragmentation and new forms of representation.",
            unit: "Unit VIII",
            topics: [
                "Eliot",
                "Joyce",
                "Modernist Poetry"
            ]
        },

        {
            id: "t-s-eliot",
            name: "T. S. Eliot",
            type: "author",
            icon: "👤",
            description:
                "Modernist poet, critic and dramatist associated with major developments in twentieth-century English literature.",
            unit: "Unit VIII",
            topics: [
                "Modernism",
                "Objective Correlative",
                "Tradition"
            ]
        },

        {
            id: "pyq-derrida",
            name: "PYQ: Derrida / Différance",
            type: "pyq",
            icon: "📝",
            description:
                "Previous-year-question connection associated with Derrida and the concept of différance.",
            unit: "Unit IX",
            topics: [
                "PYQ",
                "Derrida",
                "Différance"
            ]
        },

        {
            id: "pyq-elliot",
            name: "PYQ: Eliot",
            type: "pyq",
            icon: "📝",
            description:
                "Previous-year-question connection associated with T. S. Eliot and modernist criticism.",
            unit: "Unit VIII",
            topics: [
                "PYQ",
                "Eliot",
                "Modernism"
            ]
        },

        {
            id: "discourse",
            name: "Discourse",
            type: "concept",
            icon: "💡",
            description:
                "A key concept in modern critical theory concerning systems of language, knowledge and representation.",
            unit: "Unit IX",
            topics: [
                "Foucault",
                "Power",
                "Post-Structuralism"
            ]
        },

        {
            id: "death-of-author-topic",
            name: "Death of the Author",
            type: "topic",
            icon: "🔎",
            description:
                "A UGC NET English preparation topic associated particularly with Roland Barthes.",
            unit: "Unit IX",
            topics: [
                "Barthes",
                "Authorship",
                "Reader"
            ]
        }

    ],


    relationships: [

        {
            source: "derrida",
            target: "deconstruction",
            type: "developed"
        },

        {
            source: "derrida",
            target: "differance",
            type: "developed"
        },

        {
            source: "derrida",
            target: "la-differance",
            type: "wrote"
        },

        {
            source: "derrida",
            target: "post-structuralism",
            type: "associated_with"
        },

        {
            source: "derrida",
            target: "pyq-derrida",
            type: "tested_in"
        },

        {
            source: "deconstruction",
            target: "differance",
            type: "includes"
        },

        {
            source: "deconstruction",
            target: "binary-opposition",
            type: "questions"
        },

        {
            source: "deconstruction",
            target: "logocentrism",
            type: "related_to"
        },

        {
            source: "deconstruction",
            target: "derrida",
            type: "associated_with"
        },

        {
            source: "differance",
            target: "deconstruction",
            type: "related_to"
        },

        {
            source: "differance",
            target: "la-differance",
            type: "explained_in"
        },

        {
            source: "binary-opposition",
            target: "structuralism",
            type: "belongs_to"
        },

        {
            source: "binary-opposition",
            target: "deconstruction",
            type: "questioned_by"
        },

        {
            source: "logocentrism",
            target: "derrida",
            type: "criticised_by"
        },

        {
            source: "structuralism",
            target: "saussure",
            type: "associated_with"
        },

        {
            source: "saussure",
            target: "signifier-signified",
            type: "developed"
        },

        {
            source: "saussure",
            target: "structuralism",
            type: "associated_with"
        },

        {
            source: "post-structuralism",
            target: "derrida",
            type: "includes"
        },

        {
            source: "post-structuralism",
            target: "foucault",
            type: "includes"
        },

        {
            source: "post-structuralism",
            target: "barthes",
            type: "includes"
        },

        {
            source: "barthes",
            target: "death-of-author",
            type: "wrote"
        },

        {
            source: "death-of-author",
            target: "death-of-author-topic",
            type: "associated_with"
        },

        {
            source: "foucault",
            target: "discourse",
            type: "developed"
        },

        {
            source: "t-s-eliot",
            target: "objective-correlative",
            type: "developed"
        },

        {
            source: "objective-correlative",
            target: "modernism",
            type: "belongs_to"
        },

        {
            source: "t-s-eliot",
            target: "modernism",
            type: "associated_with"
        },

        {
            source: "t-s-eliot",
            target: "pyq-elliot",
            type: "tested_in"
        },

        {
            source: "pyq-derrida",
            target: "differance",
            type: "tests"
        }

    ]

};


const ENTITY_PAGE_BUILD = "10.5.1-chaucer-pyq-bridge";

/* =========================================================
   APPLICATION STATE
========================================================= */

let graphData = {
    entities: [],
    relationships: []
};


let selectedEntity = null;
let studyResourceDatabase = [];


/* =========================================================
   BASIC HELPERS
========================================================= */

function byId(id) {

    return document.getElementById(id);

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();

}


function slugify(value) {

    return normalize(value)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

}


/* =========================================================
   LOCAL STORAGE HELPERS
========================================================= */

function readStorage(keys) {

    for (const key of keys) {

        try {

            const raw =
                localStorage.getItem(key);

            if (!raw) {
                continue;
            }


            const parsed =
                JSON.parse(raw);

            if (parsed) {
                return parsed;
            }

        } catch (error) {

            console.warn(
                "Unable to read storage:",
                key,
                error
            );

        }

    }


    return null;

}


/* =========================================================
   GRAPH NORMALISATION
========================================================= */

function normalizeGraph(raw) {

    if (!raw) {

        return {
            entities: [],
            relationships: []
        };

    }


    let entities = [];

    let relationships = [];


    if (Array.isArray(raw)) {

        entities = raw;

    } else {

        entities =
            raw.entities ||
            raw.nodes ||
            raw.knowledgeEntities ||
            [];

        relationships =
            raw.relationships ||
            raw.links ||
            raw.edges ||
            [];

    }


    if (!Array.isArray(entities)) {
        entities = [];
    }


    if (!Array.isArray(relationships)) {
        relationships = [];
    }


    entities =
        entities
            .map((entity, index) => {

                if (!entity) {
                    return null;
                }


                const name =
                    entity.name ||
                    entity.label ||
                    entity.title ||
                    `Entity ${index + 1}`;


                return {

                    ...entity,

                    id:
                        entity.id ||
                        entity.key ||
                        slugify(name),

                    name,

                    type:
                        entity.type ||
                        entity.entityType ||
                        "entity",

                    icon:
                        entity.icon ||
                        "🧠",

                    description:
                        entity.description ||
                        entity.summary ||
                        "Knowledge entity connected to the BAJEE JRF AI preparation model.",

                    unit:
                        entity.unit ||
                        entity.unitName ||
                        (Array.isArray(entity.units) && entity.units.length > 0
                            ? entity.units[0]
                            : "Not mapped"),

                    units:
                        Array.isArray(entity.units)
                            ? entity.units
                            : [],

                    curriculum:
                        entity.curriculum ||
                        null,

                    masterSources:
                        Array.isArray(entity.masterSources)
                            ? entity.masterSources
                            : [],

                    topics:
                        Array.isArray(entity.topics)
                            ? entity.topics
                            : []

                };

            })
            .filter(Boolean);


    relationships =
        relationships
            .map((relation) => {

                if (!relation) {
                    return null;
                }


                return {

                    ...relation,

                    source:
                        relation.source ||
                        relation.from ||
                        relation.sourceId,

                    target:
                        relation.target ||
                        relation.to ||
                        relation.targetId,

                    type:
                        relation.type ||
                        relation.label ||
                        "related_to"

                };

            })
            .filter(
                relation =>
                    relation &&
                    relation.source &&
                    relation.target
            );


    /*
     * Chaucer was added after the original browser graph was created.
     * If an older localStorage copy still contains the old Chaucer record,
     * preserve the record but restore the verified curriculum/source fields.
     */
    entities = entities.map(entity => {

        if (normalize(entity.id) !== "geoffrey-chaucer") {
            return entity;
        }

        const fallback =
            FALLBACK_GRAPH.entities.find(
                item => normalize(item.id) === "geoffrey-chaucer"
            );

        if (!fallback) {
            return entity;
        }

        return {
            ...fallback,
            ...entity,
            unit:
                entity.unit &&
                normalize(entity.unit) !== "not mapped"
                    ? entity.unit
                    : fallback.unit,
            units:
                Array.isArray(entity.units) && entity.units.length > 0
                    ? entity.units
                    : fallback.units,
            curriculum:
                entity.curriculum ||
                fallback.curriculum,
            masterSources:
                Array.isArray(entity.masterSources) && entity.masterSources.length > 0
                    ? entity.masterSources
                    : fallback.masterSources
        };

    });


    return {
        entities,
        relationships
    };

}


/* =========================================================
   LOAD KNOWLEDGE GRAPH
========================================================= */

function loadGraph() {

    const stored =
        readStorage(GRAPH_STORAGE_KEYS);


    const normalized =
        stored
            ? normalizeGraph(stored)
            : {
                entities: [],
                relationships: []
            };


    /*
     * Keep the existing stored graph, but add any fallback
     * entities that are missing from it. This prevents a stale
     * localStorage graph from hiding newly verified entities.
     */
    const mergedEntities = [

        ...normalized.entities.map(
            entity => ({ ...entity })
        ),

        ...FALLBACK_GRAPH.entities
            .filter(fallbackEntity =>
                !normalized.entities.some(existingEntity =>
                    normalize(existingEntity.id) ===
                    normalize(fallbackEntity.id)
                )
            )
            .map(entity => ({ ...entity }))

    ];


    const mergedRelationships = [

        ...normalized.relationships.map(
            relation => ({ ...relation })
        ),

        ...FALLBACK_GRAPH.relationships
            .filter(fallbackRelation =>
                !normalized.relationships.some(existingRelation =>
                    normalize(existingRelation.source) === normalize(fallbackRelation.source) &&
                    normalize(existingRelation.target) === normalize(fallbackRelation.target) &&
                    normalize(existingRelation.type) === normalize(fallbackRelation.type)
                )
            )
            .map(relation => ({ ...relation }))

    ];


    return {
        entities: mergedEntities,
        relationships: mergedRelationships
    };

}


/* =========================================================
   ENTITY LOOKUP
========================================================= */

function findEntity(value) {

    if (!value) {
        return null;
    }


    const search =
        normalize(
            decodeURIComponent(
                String(value)
            )
        );


    const slug =
        slugify(search);


    return (
        graphData.entities.find(
            entity =>
                normalize(entity.id) === search
        ) ||

        graphData.entities.find(
            entity =>
                slugify(entity.id) === slug
        ) ||

        graphData.entities.find(
            entity =>
                normalize(entity.name) === search
        ) ||

        graphData.entities.find(
            entity =>
                slugify(entity.name) === slug
        ) ||

        graphData.entities.find(
            entity =>
                normalize(entity.label) === search
        )
    );

}


/* =========================================================
   GET ENTITY FROM URL
========================================================= */

function getRequestedEntity() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const requested =
        params.get("id") ||
        params.get("entity") ||
        params.get("name");

    /*
     * EXPLICIT URL REQUEST RULE
     * -------------------------
     * If the URL asks for an entity, return ONLY that entity.
     * Never substitute Derrida (or any other entity) when the
     * requested entity is missing.
     */
    if (requested) {

        return findEntity(requested) || null;

    }

    /* Default landing entity is preserved only when no entity
       parameter was supplied at all. */
    return (
        graphData.entities.find(
            entity =>
                slugify(entity.id) === "derrida"
        ) ||

        graphData.entities.find(
            entity =>
                slugify(entity.name) === "jacques-derrida"
        ) ||

        graphData.entities[0] ||

        null
    );

}



/* =========================================================
   PERFORMANCE DATA
========================================================= */

function collectPerformanceRecords() {

    const raw =
        readStorage(PERFORMANCE_STORAGE_KEYS);


    const records = [];


    function add(value) {

        if (!value) {
            return;
        }


        if (Array.isArray(value)) {

            value.forEach(add);

            return;

        }


        if (
            value.records &&
            Array.isArray(value.records)
        ) {

            value.records.forEach(add);

            return;

        }


        if (
            value.attempts &&
            Array.isArray(value.attempts)
        ) {

            value.attempts.forEach(add);

            return;

        }


        if (
            typeof value === "object"
        ) {

            records.push(value);

        }

    }


    add(raw);


    return records;

}


/* =========================================================
   RECORD MATCHING
========================================================= */

function recordMatchesEntity(
    record,
    entity
) {

    if (!record || !entity) {
        return false;
    }


    const values = [

        record.entity,

        record.entityId,

        record.entityName,

        record.knowledgeEntity,

        record.knowledgeEntityId,

        record.knowledgeEntityName,

        record.author,

        record.theorist,

        record.concept,

        record.topic,

        record.questionData &&
        record.questionData.entity,

        record.questionData &&
        record.questionData.entityId,

        record.questionData &&
        record.questionData.knowledgeEntity,

        record.questionData &&
        record.questionData.concept

    ];


    const entityId =
        normalize(entity.id);


    const entityName =
        normalize(entity.name);


    const entitySlug =
        slugify(entity.id);


    const entityNameSlug =
        slugify(entity.name);


    return values.some(value => {

        if (
            value === null ||
            value === undefined
        ) {
            return false;
        }


        const normal =
            normalize(value);


        const slug =
            slugify(value);


        return (
            normal === entityId ||
            normal === entityName ||
            slug === entitySlug ||
            slug === entityNameSlug
        );

    });

}


/* =========================================================
   PERFORMANCE CALCULATION
   ---------------------------------------------------------
   STEP 10.5 — PYQ → AI PRACTICE → ENTITY PERFORMANCE
   ---------------------------------------------------------
   Connected PYQ answers are stored by AI Practice in:

   bajee_jrf_ai_vertical_slice_performance_v2

   This reader converts that entity-level record into the
   Performance Signal used by the Knowledge Entity page.
========================================================= */

function getEntityPerformanceRecord(entity) {

    if (!entity) {
        return null;
    }

    try {

        const raw =
            localStorage.getItem(
                "bajee_jrf_ai_vertical_slice_performance_v2"
            );

        if (!raw) {
            return null;
        }

        const store =
            JSON.parse(raw);

        if (
            !store ||
            typeof store !== "object" ||
            Array.isArray(store)
        ) {
            return null;
        }

        const entityId =
            normalize(entity.id);

        const entityName =
            normalize(entity.name);

        const entityIdSlug =
            slugify(entity.id);

        const entityNameSlug =
            slugify(entity.name);

        const storageKey =
            Object.keys(store).find(key => {

                const normal =
                    normalize(key);

                const slug =
                    slugify(key);

                return (
                    normal === entityId ||
                    normal === entityName ||
                    slug === entityIdSlug ||
                    slug === entityNameSlug
                );

            });

        if (
            !storageKey ||
            !store[storageKey]
        ) {
            return null;
        }

        const record =
            store[storageKey];

        return {

            attempts:
                Number(
                    record.attempted ||
                    record.attempts ||
                    0
                ),

            correct:
                Number(
                    record.correct ||
                    0
                ),

            wrong:
                Number(
                    record.wrong ||
                    0
                )

        };

    } catch (error) {

        console.warn(
            "Unable to read entity performance store.",
            error
        );

        return null;
    }

}


function getPerformance(entity) {

    let attempts = 0;

    let correct = 0;

    let wrong = 0;


    /*
       =====================================================
       PRIMARY STEP 10.5 PERFORMANCE SOURCE
       =====================================================
    */

    const entityPerformance =
        getEntityPerformanceRecord(
            entity
        );


    if (entityPerformance) {

        attempts =
            Math.max(
                0,
                entityPerformance.attempts
            );

        correct =
            Math.max(
                0,
                entityPerformance.correct
            );

        wrong =
            Math.max(
                0,
                entityPerformance.wrong
            );

    } else {

        /*
           =================================================
           LEGACY PERFORMANCE COMPATIBILITY
           =================================================
        */

        const records =
            collectPerformanceRecords()
                .filter(
                    record =>
                        recordMatchesEntity(
                            record,
                            entity
                        )
                );


        records.forEach(
            record => {

                const recordAttempts =
                    Number(
                        record.attempts ||
                        record.totalAttempts ||
                        0
                    );


                const recordCorrect =
                    Number(
                        record.correct ||
                        record.correctAnswers ||
                        0
                    );


                const recordWrong =
                    Number(
                        record.wrong ||
                        record.incorrect ||
                        record.wrongAnswers ||
                        0
                    );


                if (
                    recordAttempts > 0
                ) {

                    attempts +=
                        recordAttempts;

                    correct +=
                        recordCorrect;

                    wrong +=
                        recordWrong;

                    return;
                }


                if (
                    record.result ===
                        "correct" ||

                    record.correct ===
                        true ||

                    record.isCorrect ===
                        true
                ) {

                    attempts += 1;

                    correct += 1;

                    return;
                }


                if (
                    record.result ===
                        "wrong" ||

                    record.correct ===
                        false ||

                    record.isCorrect ===
                        false
                ) {

                    attempts += 1;

                    wrong += 1;

                }

            }
        );

    }


    /*
       =====================================================
       REVISION RETEST HISTORY
       =====================================================
    */

    try {

        const history =
            JSON.parse(
                localStorage.getItem(
                    RETEST_HISTORY_KEY
                ) || "[]"
            );


        if (
            Array.isArray(history)
        ) {

            history.forEach(
                record => {

                    if (
                        !recordMatchesEntity(
                            record,
                            entity
                        )
                    ) {
                        return;
                    }


                    const result =
                        normalize(
                            record.result ||
                            record.status
                        );


                    if (
                        result ===
                        "correct"
                    ) {

                        attempts += 1;

                        correct += 1;

                    } else if (
                        result ===
                            "wrong" ||

                        result ===
                            "incorrect"
                    ) {

                        attempts += 1;

                        wrong += 1;

                    }

                }
            );

        }

    } catch (error) {

        console.warn(
            "Unable to read retest history.",
            error
        );

    }


    /*
       =====================================================
       ACCURACY
       =====================================================
    */

    const accuracy =
        attempts > 0
            ? Math.round(
                (
                    correct /
                    attempts
                ) * 100
            )
            : 0;


    return {

        attempts,

        correct,

        wrong,

        accuracy

    };

}


/* =========================================================
   REVISION SIGNAL
========================================================= */

function getRevisionSignal(entity) {

    const performance =
        getPerformance(entity);


    if (performance.attempts === 0) {

        return {

            priority: "Not Yet Assessed",

            className: "",

            message:
                "No recorded performance has been linked to this entity yet."

        };

    }


    if (
        performance.accuracy < 50 ||
        performance.wrong >= 2
    ) {

        return {

            priority: "High Priority",

            className: "signal-high",

            message:
                "This entity currently shows a stronger revision signal. Review the connected knowledge and retest it before moving on."

        };

    }


    if (
        performance.accuracy < 80 ||
        performance.wrong >= 1
    ) {

        return {

            priority: "Medium Priority",

            className: "signal-medium",

            message:
                "This entity is developing. Additional revision and targeted practice can help stabilise the current understanding."

        };

    }


    return {

        priority: "Low Priority",

        className: "signal-low",

        message:
            "Current performance is relatively strong. Maintain the connection with light revision and continued practice."

    };

}


/* =========================================================
   ADAPTIVE RECOMMENDATION
========================================================= */

function getAdaptiveRecommendation(entity) {

    const performance =
        getPerformance(entity);


    if (performance.attempts === 0) {

        return {

            title: "Build Initial Evidence",

            text:
                "Practice questions connected to this entity so BAJEE JRF AI can generate a meaningful performance signal."

        };

    }


    if (
        performance.accuracy < 50
    ) {

        return {

            title: "Revise First",

            text:
                "Review the entity and its connected concepts before attempting another intensive practice cycle."

        };

    }


    if (
        performance.accuracy < 80
    ) {

        return {

            title: "Practice More",

            text:
                "Continue targeted practice on this entity to strengthen recall and reduce repeated mistakes."

        };

    }


    return {

        title: "Maintain",

        text:
            "Performance is currently strong. Keep this entity active through spaced revision and mixed practice."

    };

}


/* =========================================================
   RELATIONSHIP HELPERS
========================================================= */

function getEntityRelationships(entity) {

    return graphData.relationships
        .filter(relation => {

            return (
                normalize(relation.source) ===
                    normalize(entity.id) ||

                normalize(relation.target) ===
                    normalize(entity.id) ||

                slugify(relation.source) ===
                    slugify(entity.id) ||

                slugify(relation.target) ===
                    slugify(entity.id)
            );

        })
        .map(relation => {

            const source =
                findEntity(
                    relation.source
                );


            const target =
                findEntity(
                    relation.target
                );


            const isSource =
                source &&
                normalize(source.id) ===
                    normalize(entity.id);


            return {

                relation,

                direction:
                    isSource
                        ? "→"
                        : "←",

                target:
                    isSource
                        ? target
                        : source

            };

        })
        .filter(
            item =>
                item.target
        );

}


/* =========================================================
   ENTITY ICON
========================================================= */

function getEntityIcon(entity) {

    if (entity && entity.icon) {

        return entity.icon;

    }


    const type =
        normalize(
            entity &&
            entity.type
        );


    const icons = {

        author: "👤",

        theorist: "🎓",

        work: "📖",

        movement: "📚",

        concept: "💡",

        critic: "⚖️",

        pyq: "📝",

        topic: "🔎"

    };


    return icons[type] || "🧠";

}


/* =========================================================
   ENTITY TYPE LABEL
========================================================= */

function getTypeLabel(entity) {

    if (!entity) {
        return "Knowledge Entity";
    }


    const type =
        normalize(entity.type);


    const labels = {

        author: "Author",

        theorist: "Theorist",

        work: "Work",

        movement: "Movement",

        concept: "Concept",

        critic: "Critic",

        pyq: "PYQ",

        topic: "Topic"

    };


    return (
        labels[type] ||
        entity.type ||
        "Knowledge Entity"
    );

}


/* =========================================================
   RENDER ENTITY PROFILE
========================================================= */

function renderEntityProfile(entity) {

    const container =
        byId("entityProfile");


    if (!container) {
        return;
    }


    if (!entity) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    🧠
                </div>

                <h3>
                    Knowledge entity not found
                </h3>

                <p>
                    Return to the Knowledge Graph and select
                    an available entity.
                </p>

            </div>

        `;

        return;

    }


    const performance =
        getPerformance(entity);


    container.innerHTML = `

        <div class="entity-profile">

            <div class="entity-profile-main">

                <div class="entity-icon">
                    ${escapeHTML(
                        getEntityIcon(entity)
                    )}
                </div>


                <div>

                    <div class="entity-type">
                        ${escapeHTML(
                            getTypeLabel(entity)
                        )}
                    </div>


                    <h2 class="entity-name">
                        ${escapeHTML(
                            entity.name
                        )}
                    </h2>


                    <p class="entity-summary">
                        ${escapeHTML(
                            entity.description
                        )}
                    </p>


                    <div class="entity-meta">

                        <span>
                            📚 ${escapeHTML(
                                entity.unit ||
                                "Unit not mapped"
                            )}
                        </span>


                        <span>
                            🔗 ${
                                getEntityRelationships(
                                    entity
                                ).length
                            } connections
                        </span>


                        <span>
                            📝 ${
                                entity.type === "pyq"
                                    ? "PYQ Entity"
                                    : "Knowledge Entity"
                            }
                        </span>

                    </div>

                </div>

            </div>


            <div class="performance-card">

                <div class="signal-label">
                    Performance Signal
                </div>


                <div class="signal-number">
                    ${performance.accuracy}%
                </div>


                <div class="signal-meta">
                    ${performance.attempts}
                    recorded attempt${
                        performance.attempts === 1
                            ? ""
                            : "s"
                    }
                </div>

            </div>

        </div>

    `;

}


/* =========================================================
   RENDER OVERVIEW
========================================================= */

function renderOverview(entity) {

    if (!entity) {
        return;
    }


    const relationships =
        getEntityRelationships(entity);


    const pyqConnections =
        relationships.filter(
            item =>
                item.target &&
                normalize(item.target.type) ===
                    "pyq"
        );


    if (byId("entityType")) {

        byId("entityType").textContent =
            getTypeLabel(entity);

    }


    if (byId("entityUnit")) {

        byId("entityUnit").textContent =
            entity.unit ||
            "Not mapped";

    }


    if (byId("entityConnections")) {

        byId("entityConnections").textContent =
            relationships.length;

    }


    if (byId("entityPYQ")) {

        byId("entityPYQ").textContent =
            pyqConnections.length;

    }

}


/* =========================================================
   RENDER DESCRIPTION
========================================================= */

function renderDescription(entity) {

    const element =
        byId("entityDescription");


    if (!element) {
        return;
    }


    element.textContent =
        entity.description ||
        "No description has been added to this knowledge entity yet.";

}


/* =========================================================
   RENDER TOPICS
========================================================= */

function renderTopics(entity) {

    const container =
        byId("entityTopics");


    if (!container) {
        return;
    }


    const topics =
        Array.isArray(entity.topics)
            ? entity.topics
            : [];


    if (topics.length === 0) {

        container.innerHTML = `

            <span class="text-secondary">
                No topic mapping has been added yet.
            </span>

        `;

        return;

    }


    container.innerHTML =
        topics
            .map(topic => `

                <span class="topic-tag">

                    ${escapeHTML(topic)}

                </span>

            `)
            .join("");

}


/* =========================================================
   RENDER RELATIONSHIPS
========================================================= */

function renderRelationships(entity) {

    const container =
        byId("entityRelationships");


    if (!container) {
        return;
    }


    const relationships =
        getEntityRelationships(entity);


    if (relationships.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    🔗
                </div>

                <h3>
                    No relationships recorded
                </h3>

                <p>
                    Additional knowledge connections will
                    appear as the graph develops.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        relationships
            .map(item => {

                const relation =
                    item.relation;


                const target =
                    item.target;


                return `

                    <div class="relationship-card">

                        <div class="relationship-type">

                            ${escapeHTML(
                                String(
                                    relation.type
                                )
                                .replace(
                                    /_/g,
                                    " "
                                )
                            )}

                            ${escapeHTML(
                                item.direction
                            )}

                        </div>


                        <div class="relationship-target">

                            ${escapeHTML(
                                target.name
                            )}

                            <small>
                                ${escapeHTML(
                                    getTypeLabel(
                                        target
                                    )
                                )}
                                •
                                ${escapeHTML(
                                    target.unit ||
                                    "Unit not mapped"
                                )}
                            </small>

                        </div>

                    </div>

                `;

            })
            .join("");

}


/* =========================================================
   RENDER PYQ CONNECTIONS
========================================================= */

function renderPYQConnections(entity) {

    const container =
        byId("entityPYQList");


    if (!container) {
        return;
    }


    const relationships =
        getEntityRelationships(entity);


    const pyqs =
        relationships.filter(
            item =>
                item.target &&
                normalize(item.target.type) ===
                    "pyq"
        );


    if (pyqs.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    📝
                </div>

                <h3>
                    No direct PYQ connections selected
                </h3>

                <p>
                    PYQ-linked knowledge will appear here
                    as the graph's PYQ layer expands.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        pyqs
            .map(item => {

                const pyq =
                    item.target;


                return `

                    <div class="pyq-card">

                        <span class="pyq-year">
                            ${escapeHTML(
                                pyq.unit ||
                                "UGC NET"
                            )}
                        </span>


                        <div class="pyq-question">
                            ${escapeHTML(
                                pyq.name
                            )}
                        </div>


                        <div class="pyq-meta">
                            Connected through:
                            ${escapeHTML(
                                item.relation.type
                                    .replace(
                                        /_/g,
                                        " "
                                    )
                            )}
                        </div>

                    </div>

                `;

            })
            .join("");

}


/* =========================================================
   RENDER PERFORMANCE
========================================================= */

function renderPerformance(entity) {

    const performance =
        getPerformance(entity);


    if (byId("performanceAccuracy")) {

        byId("performanceAccuracy")
            .textContent =
            performance.accuracy;

    }


    if (byId("performanceAttempts")) {

        byId("performanceAttempts")
            .textContent =
            performance.attempts;

    }


    if (byId("performanceCorrect")) {

        byId("performanceCorrect")
            .textContent =
            performance.correct;

    }


    if (byId("performanceWrong")) {

        byId("performanceWrong")
            .textContent =
            performance.wrong;

    }

}


/* =========================================================
   RENDER REVISION
========================================================= */

function renderRevision(entity) {

    const container =
        byId("revisionSignal");


    if (!container) {
        return;
    }


    const signal =
        getRevisionSignal(entity);


    container.className =
        `signal-box ${signal.className}`;


    container.innerHTML = `

        <strong>
            ${escapeHTML(
                signal.priority
            )}
        </strong>


        <div class="mt-1">
            ${escapeHTML(
                signal.message
            )}
        </div>

    `;

}


/* =========================================================
   RENDER ADAPTIVE RECOMMENDATION
========================================================= */

function renderAdaptiveRecommendation(entity) {

    const container =
        byId("adaptiveRecommendation");


    if (!container) {
        return;
    }


    const recommendation =
        getAdaptiveRecommendation(entity);


    container.innerHTML = `

        <div class="recommendation-title">

            🎯 ${escapeHTML(
                recommendation.title
            )}

        </div>


        <div class="recommendation-text">

            ${escapeHTML(
                recommendation.text
            )}

        </div>

    `;

}


/* =========================================================
   RENDER MASTER STORAGE SOURCES
   ---------------------------------------------------------
   STEP 10.6 → ENTITY SOURCE TRACE
   ---------------------------------------------------------
   These are source records explicitly connected to the entity
   from the user's Master Storage. No outside source is added.
========================================================= */

function renderMasterStorageSources(entity) {

    const existing =
        document.getElementById("masterStorageSources");

    const anchor =
        document.getElementById("jrfFocusText") ||
        document.querySelector("main");

    if (!anchor) {
        return;
    }

    if (existing) {
        existing.remove();
    }

    const sources =
        entity &&
        Array.isArray(entity.masterSources)
            ? entity.masterSources
            : [];

    const section =
        document.createElement("section");

    section.id = "masterStorageSources";
    section.className = "section-card mb-4";

    if (sources.length === 0) {
        section.innerHTML = `
            <h2>📚 Master Library Sources</h2>
            <p class="text-secondary">
                No direct Master Storage source record has been connected to this entity yet.
            </p>
        `;
    } else {
        section.innerHTML = `
            <h2>📚 Master Library Sources</h2>
            <p class="text-secondary">
                Direct source records from BAJEE JRF AI Master Storage connected to this entity.
            </p>

            <div class="row g-3">
                ${sources.map(source => `
                    <div class="col-lg-6">
                        <div class="border rounded-3 p-3 h-100 bg-white">
                            <div class="d-flex justify-content-between gap-2 align-items-start">
                                <strong>${escapeHTML(source.title)}</strong>
                                <span class="badge bg-success-subtle text-success">
                                    ${escapeHTML(source.evidenceState || "Direct Source")}
                                </span>
                            </div>

                            <div class="small text-secondary mt-2">
                                ${escapeHTML(source.type || "Master Storage source")}
                                • ${escapeHTML(source.storage || "Master Storage")}
                            </div>

                            <div class="small mt-3">
                                ${escapeHTML(source.matchReason || "Source connected to this knowledge entity.")}
                            </div>

                            <div class="mt-3">
                                <a
                                    class="btn btn-sm btn-outline-primary"
                                    href="resource-library.html"
                                >
                                    📚 Open Master Library
                                </a>
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
    }

    const focusSection = anchor.closest("section");

    if (focusSection && focusSection.parentNode) {
        focusSection.parentNode.insertBefore(
            section,
            focusSection
        );
    } else if (anchor.parentNode) {
        anchor.parentNode.insertBefore(
            section,
            anchor
        );
    }

}




/* =========================================================
   STUDY RESOURCE DATABASE — STEP 10.6
========================================================= */

async function loadStudyResourceDatabase() {

    try {
        const response = await fetch(
            "data/resources/resource-inventory.json?v=10.6.3",
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error("Study resource inventory could not be loaded.");
        }

        const data = await response.json();

        studyResourceDatabase =
            Array.isArray(data.resources)
                ? data.resources
                : Array.isArray(data.records)
                    ? data.records
                    : [];

    } catch (error) {
        console.warn("Study resource database unavailable:", error);
        studyResourceDatabase = [];
    }
}

function renderStudyResources(entity) {

    const existing =
        document.getElementById("entityStudyResources");

    if (existing) {
        existing.remove();
    }

    const anchor =
        document.getElementById("masterStorageSources") ||
        document.getElementById("jrfFocusText") ||
        document.querySelector("main");

    if (!anchor || !entity) {
        return;
    }

    const ids =
        Array.isArray(entity.studyResourceIds)
            ? entity.studyResourceIds.map(String)
            : [];

    const entityId = String(entity.id || "");

    const resources =
        studyResourceDatabase.filter(resource => {
            const linked = Array.isArray(resource.entity_ids)
                ? resource.entity_ids.map(String)
                : Array.isArray(resource.entityIds)
                    ? resource.entityIds.map(String)
                    : [];

            return (
                (ids.length > 0 && ids.includes(String(resource.id))) ||
                linked.includes(entityId)
            );
        });

    const section = document.createElement("section");
    section.id = "entityStudyResources";
    section.className = "section-card mb-4";

    section.innerHTML = `
        <h2>📚 Study Resources</h2>
        <p class="text-secondary">
            Study-resource records connected to this knowledge entity through the local JRF resource inventory.
        </p>

        ${resources.length === 0 ? `
            <div class="alert alert-light border mb-0">
                No study-resource record is currently connected to this entity.
            </div>
        ` : `
            <div class="row g-3">
                ${resources.map(resource => `
                    <div class="col-lg-6">
                        <div class="border rounded-3 p-3 h-100 bg-white">
                            <div class="d-flex justify-content-between gap-2 align-items-start">
                                <strong>${escapeHTML(resource.title || "Study Resource")}</strong>
                                <span class="badge bg-success-subtle text-success">
                                    ${escapeHTML(resource.evidenceState || (resource.available === false ? "Unavailable" : "Connected Resource"))}
                                </span>
                            </div>
                            <div class="small text-secondary mt-2">
                                ${escapeHTML(resource.type || "Resource")}
                                • ${escapeHTML(resource.source || "Local Resource Inventory")}
                            </div>
                            <div class="small mt-3">
                                ${escapeHTML(resource.description || "Connected study resource.")}
                            </div>
                            <div class="mt-3">
                                <a
                                    class="btn btn-sm btn-outline-primary"
                                    href="resource-library.html?id=${encodeURIComponent(entityId)}"
                                >
                                    📚 Open Study Library
                                </a>
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>
        `}
    `;

    if (anchor.id === "masterStorageSources") {
        anchor.parentNode.insertBefore(section, anchor.nextSibling);
    } else {
        const parent = anchor.closest("section");
        if (parent && parent.parentNode) {
            parent.parentNode.insertBefore(section, parent);
        } else if (anchor.parentNode) {
            anchor.parentNode.insertBefore(section, anchor);
        }
    }
}

/* =========================================================
   RENDER JRF FOCUS
========================================================= */

function renderJRFFocus(entity) {

    const element =
        byId("jrfFocusText");


    if (!element) {
        return;
    }


    const type =
        getTypeLabel(entity);


    const topics =
        Array.isArray(entity.topics)
            ? entity.topics
            : [];


    if (topics.length > 0) {

        element.textContent =
            `${entity.name} is mapped as a ${type.toLowerCase()} in ${entity.unit || "the current UGC NET preparation structure"}. Focus on its core definition, connected concepts and relationships, then reinforce the knowledge through PYQ and practice questions.`;

    } else {

        element.textContent =
            `${entity.name} is part of the BAJEE JRF AI knowledge graph. Study its definition, relationships and examination connections before moving into repeated practice.`;

    }

}


/* =========================================================
   UPDATE PAGE TITLE
========================================================= */

function updatePageTitle(entity) {

    if (!entity) {
        return;
    }


    document.title =
        `BAJEE JRF AI - ${entity.name}`;

}


/* =========================================================
   STATUS
========================================================= */

function updateStatus(entity) {

    const status =
        byId("entityStatus");


    const message =
        byId("entityStatusMessage");


    if (!status || !message) {
        return;
    }


    if (!entity) {

        status.textContent =
            "Not Found";

        status.className =
            "badge bg-danger";

        message.textContent =
            "The requested knowledge entity could not be found.";

        return;

    }


    status.textContent =
        "Ready";

    status.className =
        "badge bg-success";


    message.textContent =
        `Knowledge profile loaded for ${entity.name}.`;

}


/* =========================================================
   DATA STATUS
========================================================= */

function updateDataStatus() {

    const element =
        byId("entityDataStatus");


    if (!element) {
        return;
    }


    element.textContent =
        `${graphData.entities.length} knowledge entities and ${graphData.relationships.length} relationships available in the current graph model.`;

}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderEntity(entity) {

    selectedEntity =
        entity;


    updatePageTitle(entity);

    updateStatus(entity);

    updateDataStatus();

    renderEntityProfile(entity);

    renderOverview(entity);


    if (!entity) {
        return;
    }


    renderDescription(entity);

    renderTopics(entity);

    renderRelationships(entity);

    renderPYQConnections(entity);

    renderPerformance(entity);

    renderRevision(entity);

    renderAdaptiveRecommendation(entity);

    renderMasterStorageSources(entity);

    renderStudyResources(entity);

    renderJRFFocus(entity);

}


/* =========================================================
   INITIALISE
========================================================= */

async function initializeEntityPage() {

    try {

        graphData =
            loadGraph();


        selectedEntity =
            getRequestedEntity();


        // Load the local study-resource inventory before rendering its section.
        await loadStudyResourceDatabase();


        renderEntity(
            selectedEntity
        );


    } catch (error) {

        console.error(
            "Knowledge Entity initialization failed:",
            error
        );


        const status =
            byId("entityStatus");


        const message =
            byId("entityStatusMessage");


        if (status) {

            status.textContent =
                "Error";

            status.className =
                "badge bg-danger";

        }


        if (message) {

            message.textContent =
                "Unable to load the knowledge entity.";

        }

    }

}


/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeEntityPage
    );

} else {

    initializeEntityPage();

}
