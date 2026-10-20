/* =========================================================
   BAJEE JRF AI
   KNOWLEDGE GRAPH — PYQ CONNECTIONS
   STEP 10.5
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


const PYQ_STORAGE_KEYS = [
    "bajee_pyq_bank",
    "bajee_pyqs",
    "pyqBank",
    "pyqs",
    "ugcNetPYQs",
    "bajee_ugc_net_pyqs"
];


const PERFORMANCE_STORAGE_KEYS = [
    "bajee_performance",
    "bajee_performance_data",
    "bajeePerformance",
    "performanceData",
    "jrfPerformance"
];


/* =========================================================
   FALLBACK KNOWLEDGE GRAPH
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
                "Deconstruction",
                "Différance",
                "Post-Structuralism"
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
                "Derrida's term describing the simultaneous deferral and differentiation through which meaning is produced.",
            unit: "Unit IX",
            topics: [
                "Derrida",
                "Deconstruction"
            ]
        },

        {
            id: "binary-opposition",
            name: "Binary Opposition",
            type: "concept",
            icon: "💡",
            description:
                "A structuralist pattern in which meaning is organised through paired oppositions.",
            unit: "Unit IX",
            topics: [
                "Structuralism",
                "Deconstruction"
            ]
        },

        {
            id: "logocentrism",
            name: "Logocentrism",
            type: "concept",
            icon: "💡",
            description:
                "Derrida's critique of the privileging of a stable centre or ultimate source of meaning.",
            unit: "Unit IX",
            topics: [
                "Derrida",
                "Deconstruction"
            ]
        },

        {
            id: "structuralism",
            name: "Structuralism",
            type: "movement",
            icon: "📚",
            description:
                "A movement concerned with underlying structures and systems governing language, culture and meaning.",
            unit: "Unit IX",
            topics: [
                "Saussure",
                "Binary Opposition"
            ]
        },

        {
            id: "post-structuralism",
            name: "Post-Structuralism",
            type: "movement",
            icon: "📚",
            description:
                "A broad critical movement associated with questioning stable structures and fixed meanings.",
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
                "Swiss linguist whose account of the linguistic sign became foundational to structuralist thought.",
            unit: "Unit IX",
            topics: [
                "Structuralism",
                "Signifier / Signified"
            ]
        },

        {
            id: "barthes",
            name: "Roland Barthes",
            type: "theorist",
            icon: "🎓",
            description:
                "French literary theorist associated with structuralism and post-structuralism.",
            unit: "Unit IX",
            topics: [
                "Death of the Author",
                "Structuralism"
            ]
        },

        {
            id: "foucault",
            name: "Michel Foucault",
            type: "theorist",
            icon: "🎓",
            description:
                "French philosopher and theorist whose work examined discourse, knowledge and power.",
            unit: "Unit IX",
            topics: [
                "Discourse",
                "Power",
                "Post-Structuralism"
            ]
        },

        {
            id: "la-differance",
            name: "La Différance",
            type: "work",
            icon: "📖",
            description:
                "Derrida's essay developing the concept of différance.",
            unit: "Unit IX",
            topics: [
                "Derrida",
                "Différance"
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
                "Authorship",
                "Reader"
            ]
        },

        {
            id: "signifier-signified",
            name: "Signifier / Signified",
            type: "concept",
            icon: "💡",
            description:
                "Saussurean terms describing two aspects of the linguistic sign.",
            unit: "Unit IX",
            topics: [
                "Saussure",
                "Structuralism"
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
                "Power"
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
                "Modernism"
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
                "Objective Correlative"
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
                "Modernist Poetry"
            ]
        },

        {
            id: "pyq-derrida",
            name: "PYQ: Derrida / Différance",
            type: "pyq",
            icon: "📝",
            description:
                "Previous-year-question connection associated with Derrida and différance.",
            unit: "Unit IX",
            topics: [
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
                "Previous-year-question connection associated with T. S. Eliot.",
            unit: "Unit VIII",
            topics: [
                "Eliot",
                "Modernism"
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


/* =========================================================
   FALLBACK PYQ DATA
========================================================= */

const FALLBACK_PYQS = [

    {
        id: "pyq-derrida-01",
        year: "2025",
        exam: "UGC NET English",
        unit: "Unit IX",
        topic: "Post-Structuralism",
        question:
            "Derrida is most closely associated with which critical concept?",
        options: [
            "Objective Correlative",
            "Deconstruction",
            "Practical Criticism",
            "Intentional Fallacy"
        ],
        answer: "Deconstruction",
        explanation:
            "Derrida is centrally associated with deconstruction and its examination of instability, difference and assumptions within systems of meaning.",
        entities: [
            "derrida",
            "deconstruction"
        ],
        concepts: [
            "deconstruction"
        ]
    },

    {
        id: "pyq-derrida-02",
        year: "2024",
        exam: "UGC NET English",
        unit: "Unit IX",
        topic: "Derrida",
        question:
            "The concept of différance is associated with which thinker?",
        options: [
            "Jacques Derrida",
            "T. S. Eliot",
            "Ferdinand de Saussure",
            "Michel Foucault"
        ],
        answer: "Jacques Derrida",
        explanation:
            "Différance is a key term developed by Derrida in his critique of stable and fully present meaning.",
        entities: [
            "derrida",
            "differance"
        ],
        concepts: [
            "differance"
        ]
    },

    {
        id: "pyq-derrida-03",
        year: "2023",
        exam: "UGC NET English",
        unit: "Unit IX",
        topic: "Deconstruction",
        question:
            "Which concept is particularly associated with Derrida's critique of stable centres of meaning?",
        options: [
            "Logocentrism",
            "Objective Correlative",
            "Defamiliarization",
            "Negative Capability"
        ],
        answer: "Logocentrism",
        explanation:
            "Derrida uses the idea of logocentrism in his critique of Western traditions that privilege presence, origin or a stable centre of meaning.",
        entities: [
            "derrida",
            "logocentrism",
            "deconstruction"
        ],
        concepts: [
            "logocentrism",
            "deconstruction"
        ]
    },

    {
        id: "pyq-eliot-01",
        year: "2024",
        exam: "UGC NET English",
        unit: "Unit VIII",
        topic: "Modernism",
        question:
            "Which critic is associated with the concept of the objective correlative?",
        options: [
            "T. S. Eliot",
            "Roland Barthes",
            "Jacques Derrida",
            "Michel Foucault"
        ],
        answer: "T. S. Eliot",
        explanation:
            "The objective correlative is a well-known critical concept associated with T. S. Eliot.",
        entities: [
            "t-s-eliot",
            "objective-correlative"
        ],
        concepts: [
            "objective-correlative"
        ]
    }

];


/* =========================================================
   APPLICATION STATE
========================================================= */

let graphData = {
    entities: [],
    relationships: []
};

let allPYQs = [];

let filteredPYQs = [];

let selectedEntity = null;

let selectedPYQ = null;


/* =========================================================
   HELPERS
========================================================= */

function byId(id) {
    return document.getElementById(id);
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


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


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

                    unit:
                        entity.unit ||
                        entity.unitName ||
                        "",

                    topics:
                        Array.isArray(entity.topics)
                            ? entity.topics
                            : []

                };

            })
            .filter(Boolean);


    relationships =
        relationships
            .map(relation => {

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


    return {
        entities,
        relationships
    };

}


/* =========================================================
   LOAD GRAPH
========================================================= */

function loadGraph() {

    const stored =
        readStorage(GRAPH_STORAGE_KEYS);


    if (stored) {

        const normalized =
            normalizeGraph(stored);


        if (
            normalized.entities.length > 0
        ) {

            return normalized;

        }

    }


    return {

        entities:
            FALLBACK_GRAPH.entities.map(
                entity => ({ ...entity })
            ),

        relationships:
            FALLBACK_GRAPH.relationships.map(
                relation => ({ ...relation })
            )

    };

}


/* =========================================================
   ENTITY LOOKUP
========================================================= */

function findEntity(value) {

    if (!value) {
        return null;
    }


    let decoded;

    try {

        decoded =
            decodeURIComponent(
                String(value)
            );

    } catch (error) {

        decoded =
            String(value);

    }


    const search =
        normalize(decoded);


    const searchSlug =
        slugify(decoded);


    return (

        graphData.entities.find(
            entity =>
                normalize(entity.id) === search
        ) ||

        graphData.entities.find(
            entity =>
                slugify(entity.id) === searchSlug
        ) ||

        graphData.entities.find(
            entity =>
                normalize(entity.name) === search
        ) ||

        graphData.entities.find(
            entity =>
                slugify(entity.name) === searchSlug
        )

    );

}


/* =========================================================
   REQUESTED ENTITY
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


    if (requested) {

        const entity =
            findEntity(requested);

        if (entity) {
            return entity;
        }

    }


    return (

        findEntity("derrida") ||

        graphData.entities[0] ||

        null

    );

}


/* =========================================================
   NORMALIZE PYQ RECORD
========================================================= */

function normalizePYQ(record, index) {

    if (!record) {
        return null;
    }


    const question =
        record.question ||
        record.questionText ||
        record.text ||
        record.prompt ||
        record.title ||
        `PYQ ${index + 1}`;


    let options =
        record.options ||
        record.choices ||
        [];


    if (!Array.isArray(options)) {

        if (
            typeof options === "object"
        ) {

            options =
                Object.values(options);

        } else {

            options = [];

        }

    }


    let entities =
        record.entities ||
        record.entityIds ||
        record.knowledgeEntities ||
        [];


    let concepts =
        record.concepts ||
        record.conceptIds ||
        [];


    if (!Array.isArray(entities)) {
        entities = [entities];
    }


    if (!Array.isArray(concepts)) {
        concepts = [concepts];
    }


    return {

        ...record,

        id:
            record.id ||
            record.questionId ||
            `pyq-${index + 1}`,

        year:
            String(
                record.year ||
                record.examYear ||
                record.date ||
                ""
            ),

        exam:
            record.exam ||
            record.examName ||
            "UGC NET English",

        unit:
            record.unit ||
            record.unitName ||
            "",

        topic:
            record.topic ||
            record.topicName ||
            record.subject ||
            "",

        question,

        options,

        answer:
            record.answer ||
            record.correctAnswer ||
            record.correctOption ||
            "",

        explanation:
            record.explanation ||
            record.solution ||
            record.rationale ||
            "",

        entities,

        concepts

    };

}


/* =========================================================
   LOAD PYQS
========================================================= */

function loadPYQs() {

    const stored =
        readStorage(PYQ_STORAGE_KEYS);


    if (stored) {

        let source = stored;


        if (
            stored.pyqs &&
            Array.isArray(stored.pyqs)
        ) {

            source = stored.pyqs;

        } else if (
            stored.questions &&
            Array.isArray(stored.questions)
        ) {

            source = stored.questions;

        } else if (
            stored.records &&
            Array.isArray(stored.records)
        ) {

            source = stored.records;

        }


        if (Array.isArray(source)) {

            const normalized =
                source
                    .map(normalizePYQ)
                    .filter(Boolean);


            if (normalized.length > 0) {

                return normalized;

            }

        }

    }


    return FALLBACK_PYQS.map(
        (pyq, index) =>
            normalizePYQ(
                pyq,
                index
            )
    );

}


/* =========================================================
   ENTITY ID MATCH
========================================================= */

function valuesMatchEntity(
    values,
    entity
) {

    if (!entity) {
        return false;
    }


    const entityId =
        normalize(entity.id);


    const entityName =
        normalize(entity.name);


    const entityIdSlug =
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

            slug === entityIdSlug ||

            slug === entityNameSlug

        );

    });

}


/* =========================================================
   GET PYQ ENTITY CONNECTIONS
========================================================= */

function getConnectedEntities(pyq) {

    const connected = [];


    const addEntity = value => {

        const entity =
            findEntity(value);


        if (
            entity &&
            !connected.some(
                item =>
                    normalize(item.id) ===
                    normalize(entity.id)
            )
        ) {

            connected.push(entity);

        }

    };


    (pyq.entities || [])
        .forEach(addEntity);


    (pyq.concepts || [])
        .forEach(addEntity);


    const pyqEntity =
        findEntity(pyq.id);


    if (pyqEntity) {

        graphData.relationships
            .forEach(relation => {

                if (
                    normalize(
                        relation.source
                    ) ===
                    normalize(
                        pyqEntity.id
                    )
                ) {

                    addEntity(
                        relation.target
                    );

                }


                if (
                    normalize(
                        relation.target
                    ) ===
                    normalize(
                        pyqEntity.id
                    )
                ) {

                    addEntity(
                        relation.source
                    );

                }

            });

    }


    return connected;

}


/* =========================================================
   GET ENTITY RELATIONSHIPS
========================================================= */

function getEntityRelationships(entity) {

    if (!entity) {
        return [];
    }


    return graphData.relationships
        .filter(relation => {

            return (

                normalize(
                    relation.source
                ) ===
                normalize(
                    entity.id
                ) ||

                normalize(
                    relation.target
                ) ===
                normalize(
                    entity.id
                ) ||

                slugify(
                    relation.source
                ) ===
                slugify(
                    entity.id
                ) ||

                slugify(
                    relation.target
                ) ===
                slugify(
                    entity.id
                )

            );

        });

}


/* =========================================================
   FIND CONNECTED PYQS
========================================================= */

function getPYQsForEntity(entity) {

    if (!entity) {
        return [];
    }


    const relationships =
        getEntityRelationships(entity);


    const relatedIds =
        relationships.map(
            relation => {

                if (
                    normalize(
                        relation.source
                    ) ===
                    normalize(
                        entity.id
                    )
                ) {

                    return relation.target;

                }

                return relation.source;

            }
        );


    return allPYQs.filter(pyq => {

        const values = [

            ...(pyq.entities || []),

            ...(pyq.concepts || []),

            pyq.author,

            pyq.theorist,

            pyq.concept,

            pyq.topic

        ];


        if (
            valuesMatchEntity(
                values,
                entity
            )
        ) {

            return true;

        }


        return values.some(value =>

            relatedIds.some(
                relatedId => {

                    return (

                        normalize(value) ===
                        normalize(relatedId) ||

                        slugify(value) ===
                        slugify(relatedId)

                    );

                }
            )

        );

    });

}


/* =========================================================
   SUMMARY
========================================================= */

function updateSummary(pyqs) {

    const years =
        new Set();


    const units =
        new Set();


    const entities =
        new Set();


    pyqs.forEach(pyq => {

        if (pyq.year) {
            years.add(
                String(pyq.year)
            );
        }


        if (pyq.unit) {
            units.add(
                String(pyq.unit)
            );
        }


        (pyq.entities || [])
            .forEach(entity => {

                entities.add(
                    slugify(entity)
                );

            });


        (pyq.concepts || [])
            .forEach(concept => {

                entities.add(
                    slugify(concept)
                );

            });

    });


    if (byId("totalPYQs")) {

        byId("totalPYQs")
            .textContent =
            pyqs.length;

    }


    if (byId("totalYears")) {

        byId("totalYears")
            .textContent =
            years.size;

    }


    if (byId("totalUnits")) {

        byId("totalUnits")
            .textContent =
            units.size;

    }


    if (byId("totalEntities")) {

        byId("totalEntities")
            .textContent =
            entities.size;

    }

}


/* =========================================================
   ENTITY HEADER
========================================================= */

function renderSelectedEntity() {

    const name =
        byId("selectedEntity");


    const meta =
        byId("selectedEntityMeta");


    if (!selectedEntity) {

        if (name) {
            name.textContent =
                "No entity selected";
        }

        if (meta) {
            meta.textContent =
                "Select an entity from the Knowledge Graph.";
        }

        return;

    }


    if (name) {

        name.textContent =
            selectedEntity.name;

    }


    if (meta) {

        meta.textContent =
            `${selectedEntity.type || "Entity"} • ${
                selectedEntity.unit ||
                "Unit not mapped"
            }`;

    }


    if (byId("mapEntity")) {

        byId("mapEntity")
            .textContent =
            selectedEntity.name;

    }


    if (byId("mapUnit")) {

        byId("mapUnit")
            .textContent =
            selectedEntity.unit ||
            "Unit";

    }

}


/* =========================================================
   FILTER OPTIONS
========================================================= */

function populateFilters(pyqs) {

    const years =
        [...new Set(
            pyqs
                .map(
                    pyq =>
                        pyq.year
                )
                .filter(Boolean)
        )]
        .sort(
            (a, b) =>
                Number(b) -
                Number(a)
        );


    const units =
        [...new Set(
            pyqs
                .map(
                    pyq =>
                        pyq.unit
                )
                .filter(Boolean)
        )]
        .sort();


    const topics =
        [...new Set(
            pyqs
                .map(
                    pyq =>
                        pyq.topic
                )
                .filter(Boolean)
        )]
        .sort();


    const yearSelect =
        byId("yearFilter");


    const unitSelect =
        byId("unitFilter");


    const topicSelect =
        byId("topicFilter");


    if (yearSelect) {

        yearSelect.innerHTML =
            `<option value="">
                All Years
            </option>` +
            years
                .map(
                    year =>
                        `<option value="${
                            escapeHTML(year)
                        }">${
                            escapeHTML(year)
                        }</option>`
                )
                .join("");

    }


    if (unitSelect) {

        unitSelect.innerHTML =
            `<option value="">
                All Units
            </option>` +
            units
                .map(
                    unit =>
                        `<option value="${
                            escapeHTML(unit)
                        }">${
                            escapeHTML(unit)
                        }</option>`
                )
                .join("");

    }


    if (topicSelect) {

        topicSelect.innerHTML =
            `<option value="">
                All Topics
            </option>` +
            topics
                .map(
                    topic =>
                        `<option value="${
                            escapeHTML(topic)
                        }">${
                            escapeHTML(topic)
                        }</option>`
                )
                .join("");

    }

}


/* =========================================================
   APPLY FILTERS
========================================================= */

function applyFilters() {

    const search =
        normalize(
            byId("pyqSearch")?.value
        );


    const year =
        normalize(
            byId("yearFilter")?.value
        );


    const unit =
        normalize(
            byId("unitFilter")?.value
        );


    const topic =
        normalize(
            byId("topicFilter")?.value
        );


    filteredPYQs =
        allPYQs.filter(pyq => {

            const searchable = [

                pyq.question,

                pyq.answer,

                pyq.explanation,

                pyq.exam,

                pyq.topic,

                pyq.unit,

                ...(pyq.entities || []),

                ...(pyq.concepts || [])

            ]
            .map(normalize)
            .join(" ");


            if (
                search &&
                !searchable.includes(search)
            ) {

                return false;

            }


            if (
                year &&
                normalize(pyq.year) !==
                year
            ) {

                return false;

            }


            if (
                unit &&
                normalize(pyq.unit) !==
                unit
            ) {

                return false;

            }


            if (
                topic &&
                normalize(pyq.topic) !==
                topic
            ) {

                return false;

            }


            return true;

        });


    renderPYQList();

}


/* =========================================================
   RENDER PYQ LIST
========================================================= */

function renderPYQList() {

    const container =
        byId("pyqList");


    if (!container) {
        return;
    }


    if (byId("pyqCountBadge")) {

        byId("pyqCountBadge")
            .textContent =
            `${filteredPYQs.length} PYQ${
                filteredPYQs.length === 1
                    ? ""
                    : "s"
            }`;

    }


    if (byId("pyqListDescription")) {

        byId("pyqListDescription")
            .textContent =
            `${filteredPYQs.length} connected question${
                filteredPYQs.length === 1
                    ? ""
                    : "s"
            } currently displayed.`;

    }


    if (
        filteredPYQs.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    📝
                </div>

                <h3>
                    No connected PYQs found
                </h3>

                <p>
                    Try clearing the filters or select
                    another knowledge entity.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        filteredPYQs
            .map(
                pyq =>
                    renderPYQCard(pyq)
            )
            .join("");

}


/* =========================================================
   RENDER PYQ CARD
========================================================= */

function renderPYQCard(pyq) {

    const selected =
        selectedPYQ &&
        String(selectedPYQ.id) ===
        String(pyq.id);


    return `

        <article
            class="pyq-card ${
                selected
                    ? "selected"
                    : ""
            }"
            data-pyq-id="${
                escapeHTML(pyq.id)
            }"
        >

            <div class="pyq-card-header">

                <div>

                    <div class="pyq-title">

                        ${escapeHTML(
                            pyq.question
                        )}

                    </div>


                    <div class="pyq-meta">

                        ${
                            pyq.year
                                ? `
                                    <span
                                      class="pyq-badge badge-year"
                                    >
                                      ${escapeHTML(
                                          pyq.year
                                      )}
                                    </span>
                                  `
                                : ""
                        }


                        ${
                            pyq.unit
                                ? `
                                    <span
                                      class="pyq-badge badge-unit"
                                    >
                                      ${escapeHTML(
                                          pyq.unit
                                      )}
                                    </span>
                                  `
                                : ""
                        }


                        ${
                            pyq.topic
                                ? `
                                    <span
                                      class="pyq-badge badge-topic"
                                    >
                                      ${escapeHTML(
                                          pyq.topic
                                      )}
                                    </span>
                                  `
                                : ""
                        }

                    </div>

                </div>


                <button
                    type="button"
                    class="btn btn-sm btn-outline-navy"
                    data-select-pyq="${
                        escapeHTML(pyq.id)
                    }"
                >
                    View
                </button>

            </div>


            ${
                pyq.options &&
                pyq.options.length > 0
                    ? `
                        <div class="pyq-options">

                            ${pyq.options
                                .map(
                                    option =>
                                        `
                                        <div class="pyq-option">
                                            ${escapeHTML(
                                                option
                                            )}
                                        </div>
                                        `
                                )
                                .join("")}

                        </div>
                      `
                    : ""
            }

        </article>

    `;

}


/* =========================================================
   SELECT PYQ
========================================================= */

function selectPYQ(id) {

    const found =
        allPYQs.find(
            pyq =>
                String(pyq.id) ===
                String(id)
        );


    if (!found) {
        return;
    }


    selectedPYQ =
        found;


    renderSelectedPYQ();

    renderKnowledgeConnections();

    renderConnectionMap();

    updateConnectionCounts();

    renderPYQList();

}


/* =========================================================
   RENDER SELECTED PYQ
========================================================= */

function renderSelectedPYQ() {

    const container =
        byId("selectedPYQ");


    if (!container) {
        return;
    }


    if (!selectedPYQ) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    📝
                </div>

                <h3>
                    No PYQ selected
                </h3>

                <p>
                    Select a connected PYQ above.
                </p>

            </div>

        `;

        return;

    }


    const answer =
        selectedPYQ.answer;


    container.innerHTML = `

        <div class="selected-pyq">

            <div class="pyq-meta mb-2">

                ${
                    selectedPYQ.year
                        ? `
                            <span
                              class="pyq-badge badge-year"
                            >
                              ${escapeHTML(
                                  selectedPYQ.year
                              )}
                            </span>
                          `
                        : ""
                }


                ${
                    selectedPYQ.unit
                        ? `
                            <span
                              class="pyq-badge badge-unit"
                            >
                              ${escapeHTML(
                                  selectedPYQ.unit
                              )}
                            </span>
                          `
                        : ""
                }


                ${
                    selectedPYQ.topic
                        ? `
                            <span
                              class="pyq-badge badge-topic"
                            >
                              ${escapeHTML(
                                  selectedPYQ.topic
                              )}
                            </span>
                          `
                        : ""
                }

            </div>


            <h3>
                ${escapeHTML(
                    selectedPYQ.question
                )}
            </h3>


            ${
                selectedPYQ.options &&
                selectedPYQ.options.length > 0
                    ? `
                        <div class="pyq-options">

                            ${selectedPYQ.options
                                .map(
                                    option => {

                                        const isCorrect =
                                            normalize(
                                                option
                                            ) ===
                                            normalize(
                                                answer
                                            );


                                        return `

                                            <div
                                              class="pyq-option ${
                                                  isCorrect
                                                      ? "correct"
                                                      : ""
                                              }"
                                            >

                                              ${escapeHTML(
                                                  option
                                              )}

                                              ${
                                                  isCorrect
                                                      ? " ✓"
                                                      : ""
                                              }

                                            </div>

                                        `;

                                    }
                                )
                                .join("")}

                        </div>
                      `
                    : ""
            }


            ${
                answer
                    ? `
                        <div class="pyq-solution">

                            <div class="pyq-solution-title">
                                Correct Answer
                            </div>

                            <p>
                                ${escapeHTML(
                                    answer
                                )}
                            </p>

                        </div>
                      `
                    : ""
            }


            ${
                selectedPYQ.explanation
                    ? `
                        <div class="info-box mt-3">

                            <strong>
                                📚 Explanation
                            </strong>

                            <div class="mt-1">
                                ${escapeHTML(
                                    selectedPYQ.explanation
                                )}
                            </div>

                        </div>
                      `
                    : ""
            }

        </div>

    `;


    if (
        byId("practiceSelectedPYQ")
    ) {

        byId("practiceSelectedPYQ")
            .disabled = false;

    }


    if (
        byId("viewEntity")
    ) {

        byId("viewEntity")
            .disabled = !selectedEntity;

    }


    if (
        byId("practiceConnection")
    ) {

        byId("practiceConnection")
            .innerHTML = `

                <strong>
                    🎯 PYQ selected
                </strong>

                <div class="mt-1">
                    This question is connected to
                    ${
                        selectedEntity
                            ? escapeHTML(
                                selectedEntity.name
                              )
                            : "the current knowledge graph"
                    }.
                    You can continue into practice
                    when the practice integration is enabled.
                </div>

            `;

    }

}


/* =========================================================
   KNOWLEDGE CONNECTIONS
========================================================= */

function renderKnowledgeConnections() {

    const container =
        byId("knowledgeConnections");


    if (!container) {
        return;
    }


    if (!selectedPYQ) {

        container.innerHTML = `

            <div class="empty-state w-100">

                <div class="empty-icon">
                    🔗
                </div>

                <h3>
                    Select a PYQ
                </h3>

                <p>
                    Connected knowledge will appear here.
                </p>

            </div>

        `;

        return;

    }


    const entities =
        getConnectedEntities(
            selectedPYQ
        );


    if (entities.length === 0) {

        container.innerHTML = `

            <div class="empty-state w-100">

                <div class="empty-icon">
                    🔗
                </div>

                <h3>
                    No mapped entities
                </h3>

                <p>
                    This PYQ does not yet have structured
                    knowledge-entity connections.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        entities
            .map(
                entity => `

                    <button
                      type="button"
                      class="connection-node"
                      data-entity-id="${
                          escapeHTML(
                              entity.id
                          )
                      }"
                      title="Open ${
                          escapeHTML(
                              entity.name
                          )
                      }"
                    >

                        <div class="node-type">

                            ${escapeHTML(
                                entity.type ||
                                "Entity"
                            )}

                        </div>


                        <div class="node-name">

                            ${escapeHTML(
                                entity.name
                            )}

                        </div>


                        <div class="small mt-1">
                            View Entity →
                        </div>

                    </button>

                `
            )
            .join("");

}


/* =========================================================
   CONNECTION MAP
========================================================= */

function renderConnectionMap() {

    if (
        byId("mapEntity")
    ) {

        byId("mapEntity")
            .textContent =
            selectedEntity
                ? selectedEntity.name
                : "Entity";

    }


    if (
        byId("mapUnit")
    ) {

        byId("mapUnit")
            .textContent =
            selectedPYQ?.unit ||
            selectedEntity?.unit ||
            "Unit";

    }


    if (
        byId("mapConcept")
    ) {

        const concept =
            selectedPYQ &&
            selectedPYQ.concepts &&
            selectedPYQ.concepts.length > 0
                ? selectedPYQ.concepts[0]
                : selectedEntity &&
                  selectedEntity.topics &&
                  selectedEntity.topics.length > 0
                    ? selectedEntity.topics[0]
                    : "Concept";


        const conceptEntity =
            findEntity(concept);


        byId("mapConcept")
            .textContent =
            conceptEntity
                ? conceptEntity.name
                : concept;

    }


    if (
        byId("mapPYQ")
    ) {

        byId("mapPYQ")
            .textContent =
            selectedPYQ
                ? selectedPYQ.id
                : "Previous Year Question";

    }

}


/* =========================================================
   CONNECTION COUNTS
========================================================= */

function updateConnectionCounts() {

    const counts = {

        author: 0,

        work: 0,

        concept: 0,

        unit: 0

    };


    if (selectedPYQ) {

        const entities =
            getConnectedEntities(
                selectedPYQ
            );


        entities.forEach(entity => {

            const type =
                normalize(entity.type);


            if (
                type === "author" ||
                type === "theorist"
            ) {

                counts.author++;

            } else if (
                type === "work"
            ) {

                counts.work++;

            } else if (
                type === "concept"
            ) {

                counts.concept++;

            }

        });


        if (
            selectedPYQ.unit
        ) {

            counts.unit = 1;

        }

    }


    const map = {

        authorConnections:
            counts.author,

        workConnections:
            counts.work,

        conceptConnections:
            counts.concept,

        unitConnections:
            counts.unit

    };


    Object.entries(map)
        .forEach(
            ([id, value]) => {

                const element =
                    byId(id);

                if (element) {
                    element.textContent =
                        value;
                }

            }
        );

}


/* =========================================================
   STATUS
========================================================= */

function updateStatus() {

    const status =
        byId("engineStatus");


    const message =
        byId("statusMessage");


    if (!status || !message) {
        return;
    }


    status.textContent =
        "Ready";


    status.className =
        "badge bg-success";


    message.textContent =
        `${allPYQs.length} PYQ connection record${
            allPYQs.length === 1
                ? ""
                : "s"
        } loaded.`;

}


/* =========================================================
   DATA SOURCE STATUS
========================================================= */

function updateDataSourceStatus() {

    const element =
        byId("dataSourceStatus");


    if (!element) {
        return;
    }


    element.textContent =
        `${graphData.entities.length} knowledge entities • ${graphData.relationships.length} graph relationships • ${allPYQs.length} PYQ connection records available.`;

}


/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearFilters() {

    if (
        byId("pyqSearch")
    ) {

        byId("pyqSearch")
            .value = "";

    }


    if (
        byId("yearFilter")
    ) {

        byId("yearFilter")
            .value = "";

    }


    if (
        byId("unitFilter")
    ) {

        byId("unitFilter")
            .value = "";

    }


    if (
        byId("topicFilter")
    ) {

        byId("topicFilter")
            .value = "";

    }


    applyFilters();

}


/* =========================================================
   VIEW ENTITY
========================================================= */

function viewCurrentEntity() {

    if (!selectedEntity) {
        return;
    }


    window.location.href =
        `knowledge-entity.html?id=${
            encodeURIComponent(
                selectedEntity.id
            )
        }`;

}


/* =========================================================
   PRACTICE SELECTED PYQ
========================================================= */

function practiceSelectedPYQ() {

    if (!selectedPYQ) {
        return;
    }


    try {

        localStorage.setItem(

            "bajee_selected_pyq",

            JSON.stringify(
                selectedPYQ
            )

        );

    } catch (error) {

        console.warn(
            "Unable to store selected PYQ.",
            error
        );

    }


    window.location.href =
        `ai-practice.html?source=pyq&pyq=${
            encodeURIComponent(
                selectedPYQ.id
            )
        }`;

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function bindEvents() {

    const refresh =
        byId("refreshPYQ");


    if (refresh) {

        refresh.addEventListener(
            "click",
            initializePYQPage
        );

    }


    const apply =
        byId("applyFilters");


    if (apply) {

        apply.addEventListener(
            "click",
            applyFilters
        );

    }


    const clear =
        byId("clearFilters");


    if (clear) {

        clear.addEventListener(
            "click",
            clearFilters
        );

    }


    const search =
        byId("pyqSearch");


    if (search) {

        search.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    applyFilters();

                }

            }
        );

    }


    const practice =
        byId("practiceSelectedPYQ");


    if (practice) {

        practice.addEventListener(
            "click",
            practiceSelectedPYQ
        );

    }


    const viewEntity =
        byId("viewEntity");


    if (viewEntity) {

        viewEntity.addEventListener(
            "click",
            viewCurrentEntity
        );

    }


    document.addEventListener(
        "click",
        event => {

            const pyqButton =
                event.target.closest(
                    "[data-select-pyq]"
                );


            if (pyqButton) {

                selectPYQ(
                    pyqButton.dataset.selectPyq
                );

                return;

            }


            const pyqCard =
                event.target.closest(
                    ".pyq-card"
                );


            if (
                pyqCard &&
                !event.target.closest("button")
            ) {

                selectPYQ(
                    pyqCard.dataset.pyqId
                );

                return;

            }


            const entityNode =
                event.target.closest(
                    "[data-entity-id]"
                );


            if (entityNode) {

                const entity =
                    findEntity(
                        entityNode.dataset.entityId
                    );


                if (entity) {

                    selectedEntity =
                        entity;


                    /*
                     * Persist the selected entity so
                     * the return path remains stable.
                     */

                    try {

                        localStorage.setItem(
                            "bajee_selected_knowledge_entity",
                            JSON.stringify({
                                id: entity.id,
                                name: entity.name
                            })
                        );

                    } catch (error) {

                        console.warn(
                            "Unable to store selected entity.",
                            error
                        );

                    }


                    /*
                     * Open the actual entity page.
                     */

                    window.location.href =
                        `knowledge-entity.html?id=${
                            encodeURIComponent(
                                entity.id
                            )
                        }`;

                }

            }

        }
    );

}


/* =========================================================
   INITIALISE
========================================================= */

function initializePYQPage() {

    try {

        graphData =
            loadGraph();


        allPYQs =
            loadPYQs();


        selectedEntity =
            getRequestedEntity();


        filteredPYQs =
            getPYQsForEntity(
                selectedEntity
            );


        selectedPYQ =
            null;


        renderSelectedEntity();

        populateFilters(
            filteredPYQs
        );

        updateSummary(
            filteredPYQs
        );

        renderPYQList();

        renderSelectedPYQ();

        renderKnowledgeConnections();

        renderConnectionMap();

        updateConnectionCounts();

        updateStatus();

        updateDataSourceStatus();

    } catch (error) {

        console.error(
            "PYQ Connection Engine failed:",
            error
        );


        const status =
            byId("engineStatus");


        const message =
            byId("statusMessage");


        if (status) {

            status.textContent =
                "Error";

            status.className =
                "badge bg-danger";

        }


        if (message) {

            message.textContent =
                "Unable to load PYQ connection data.";

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
        () => {

            bindEvents();

            initializePYQPage();

        }
    );

} else {

    bindEvents();

    initializePYQPage();

}