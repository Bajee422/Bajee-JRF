/* ============================================================
   BAJEE JRF AI
   STEP 10.6.4 — RESOURCE → CONCEPT MAPPING

   Step 10.6.1  → Resource Inventory
   Step 10.6.2  → Entity → Resource Mapping
   Step 10.6.3  → Resource Access / Viewer
   Step 10.6.4  → Resource → Concept Mapping

   IMPORTANT:
   - Keeps the existing Resource Viewer.
   - Does not modify PYQ data.
   - Does not modify Performance data.
   - Does not modify Revision Intelligence.
   - Does not modify AI Practice.
   - Zero-cost browser-side implementation.
============================================================ */

"use strict";


/* ============================================================
   CONFIGURATION
============================================================ */

const RESOURCE_INVENTORY_URL =
    "data/resources/resource-inventory.json";

const RESOURCE_SECTION_ID =
    "bajeeKnowledgeResources";

const RESOURCE_STATUS_ID =
    "bajeeResourceStatus";

const RESOURCE_GRID_ID =
    "bajeeResourceGrid";

const RESOURCE_VIEWER_ID =
    "bajeeResourceViewer";

const RESOURCE_CONCEPT_MAP_ID =
    "bajeeResourceConceptMap";

const RESOURCE_PYQ_MAP_ID =
    "bajeeResourcePYQMap";

const RESOURCE_REVISION_MAP_ID =
    "bajeeResourceRevisionMap";

const RESOURCE_ADAPTIVE_MAP_ID =
    "bajeeResourceAdaptiveMap";

const RESOURCE_REVISION_HISTORY_KEY =
    "bajee_revision_retest_history";

const RESOURCE_PERFORMANCE_KEYS = [
    "bajee_jrf_ai_vertical_slice_performance_v2",
    "bajee_jrf_ai_vertical_slice_performance_v1",
    "bajee_performance",
    "bajee_performance_data",
    "bajeePerformance",
    "performanceData",
    "jrfPerformance",
    "bajee_ai_practice_attempts"
];


/* ============================================================
   STATE
============================================================ */

let bajeeResourceInventory = [];

let bajeeCurrentEntity = null;

let bajeeRevisionSignals = [];


/* ============================================================
   CONCEPT DIRECTORY
============================================================ */

const BAJEE_CONCEPT_DIRECTORY = {

    deconstruction: {
        id: "deconstruction",
        name: "Deconstruction",
        type: "Concept",
        unit: "Unit IX",
        description:
            "A major concept connected with Jacques Derrida and post-structuralist thought."
    },

    differance: {
        id: "differance",
        name: "Différance",
        type: "Concept",
        unit: "Unit IX",
        description:
            "A concept associated with Derrida and the production and deferral of meaning."
    },

    logocentrism: {
        id: "logocentrism",
        name: "Logocentrism",
        type: "Concept",
        unit: "Unit IX",
        description:
            "A concept connected with Derrida's critique of stable centres of meaning."
    },

    "binary-opposition": {
        id: "binary-opposition",
        name: "Binary Opposition",
        type: "Concept",
        unit: "Unit IX",
        description:
            "A conceptual relationship relevant to structuralist and deconstructive analysis."
    },

    "post-structuralism": {
        id: "post-structuralism",
        name: "Post-Structuralism",
        type: "Movement",
        unit: "Unit IX",
        description:
            "A literary and critical movement connected with Derrida and related theorists."
    },

    structuralism: {
        id: "structuralism",
        name: "Structuralism",
        type: "Movement",
        unit: "Unit IX",
        description:
            "A critical movement concerned with structures, systems and relationships."
    }

};


/* ============================================================
   PYQ DIRECTORY — STEP 10.5 CONNECTION RECORDS
   These records are connection records used by the existing
   knowledge graph. They are not independently verified here.
============================================================ */

const BAJEE_RESOURCE_PYQ_DIRECTORY = [
    {
        id: "pyq-derrida-01",
        year: "2025",
        exam: "UGC NET English",
        unit: "Unit IX",
        topic: "Post-Structuralism",
        title: "PYQ Connection — Derrida / Deconstruction",
        question: "Derrida is most closely associated with which critical concept?",
        options: [
            "Objective Correlative",
            "Deconstruction",
            "Practical Criticism",
            "Intentional Fallacy"
        ],
        answer: "Deconstruction",
        explanation: "Derrida is centrally associated with deconstruction and its examination of instability, difference and assumptions within systems of meaning.",
        concepts: ["deconstruction"],
        entities: ["derrida", "deconstruction"]
    },
    {
        id: "pyq-derrida-02",
        year: "2024",
        exam: "UGC NET English",
        unit: "Unit IX",
        topic: "Derrida",
        title: "PYQ Connection — Derrida / Différance",
        question: "The concept of différance is associated with which thinker?",
        options: [
            "Jacques Derrida",
            "T. S. Eliot",
            "Ferdinand de Saussure",
            "Michel Foucault"
        ],
        answer: "Jacques Derrida",
        explanation: "Différance is a key term associated with Derrida in his critique of stable and fully present meaning.",
        concepts: ["differance"],
        entities: ["derrida", "differance"]
    },
    {
        id: "pyq-derrida-03",
        year: "2023",
        exam: "UGC NET English",
        unit: "Unit IX",
        topic: "Deconstruction",
        title: "PYQ Connection — Derrida / Logocentrism",
        question: "Which concept is particularly associated with Derrida's critique of stable centres of meaning?",
        options: [
            "Logocentrism",
            "Objective Correlative",
            "Defamiliarization",
            "Negative Capability"
        ],
        answer: "Logocentrism",
        explanation: "Derrida uses the idea of logocentrism in his critique of traditions that privilege presence, origin or a stable centre of meaning.",
        concepts: ["logocentrism", "deconstruction"],
        entities: ["derrida", "logocentrism", "deconstruction"]
    }
];


/* ============================================================
   BASIC HELPERS
============================================================ */

function resourceById(id) {

    return document.getElementById(id);

}


function resourceEscapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function resourceNormalize(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();

}


function resourceSlug(value) {

    return resourceNormalize(value)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

}


/* ============================================================
   CURRENT ENTITY
============================================================ */

function getCurrentResourceEntity() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return (
        params.get("id") ||
        params.get("entity") ||
        params.get("name") ||
        "derrida"
    );

}


/* ============================================================
   NORMALISE RESOURCE
============================================================ */

function normalizeResource(
    record,
    index
) {

    if (
        !record ||
        typeof record !== "object"
    ) {

        return null;

    }

    return {

        ...record,

        id:
            record.id ||
            `resource-${index + 1}`,

        title:
            record.title ||
            "Untitled Resource",

        type:
            record.type ||
            "Notes",

        author:
            record.author ||
            "",

        subject:
            record.subject ||
            "",

        unit:
            record.unit ||
            "",

        topic:
            record.topic ||
            "",

        entity_ids:
            Array.isArray(
                record.entity_ids
            )
                ? record.entity_ids
                : [],

        concept_ids:
            Array.isArray(
                record.concept_ids
            )
                ? record.concept_ids
                : [],

        description:
            record.description ||
            "",

        source:
            record.source ||
            "",

        url:
            record.url ||
            "",

        available:
            record.available !== false

    };

}


/* ============================================================
   LOAD RESOURCE INVENTORY
============================================================ */

async function loadResourceInventory() {

    try {

        const response =
            await fetch(
                RESOURCE_INVENTORY_URL,
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                `Resource inventory HTTP ${response.status}`
            );

        }

        const data =
            await response.json();

        const records =
            Array.isArray(data)
                ? data
                : (
                    Array.isArray(
                        data.resources
                    )
                        ? data.resources
                        : []
                );

        bajeeResourceInventory =
            records
                .map(normalizeResource)
                .filter(Boolean);

        console.log(
            "BAJEE JRF AI: Resource inventory loaded:",
            bajeeResourceInventory.length
        );

        return bajeeResourceInventory;

    }

    catch (error) {

        console.error(
            "BAJEE JRF AI: Resource inventory load failed.",
            error
        );

        bajeeResourceInventory = [];

        return [];

    }

}


/* ============================================================
   ENTITY MATCHING
============================================================ */

function resourceMatchesEntity(
    resource,
    entityId
) {

    if (
        !resource ||
        !entityId
    ) {

        return false;

    }

    const requested =
        resourceSlug(entityId);

    return resource.entity_ids.some(
        id =>
            resourceSlug(id) ===
            requested
    );

}


/* ============================================================
   ENTITY RESOURCES
============================================================ */

function getEntityResources(
    entityId
) {

    return bajeeResourceInventory.filter(
        resource =>
            resourceMatchesEntity(
                resource,
                entityId
            )
    );

}


/* ============================================================
   CONCEPT HELPERS
============================================================ */

function getConceptInfo(
    conceptId
) {

    const key =
        resourceSlug(
            conceptId
        );

    if (
        BAJEE_CONCEPT_DIRECTORY[key]
    ) {

        return BAJEE_CONCEPT_DIRECTORY[key];

    }

    return {

        id: conceptId,

        name:
            String(conceptId)
                .replace(/-/g, " ")
                .replace(
                    /\b\w/g,
                    letter =>
                        letter.toUpperCase()
                ),

        type: "Concept",

        unit: "",

        description:
            "Concept connected to this study resource."

    };

}


function getResourceConcepts(
    resource
) {

    if (
        !resource ||
        !Array.isArray(
            resource.concept_ids
        )
    ) {

        return [];

    }

    return resource.concept_ids.map(
        getConceptInfo
    );

}


function getResourcePYQs(resource) {

    if (!resource) return [];

    const explicitIds =
        Array.isArray(resource.pyq_ids)
            ? resource.pyq_ids
            : (Array.isArray(resource.pyqIds) ? resource.pyqIds : []);

    const concepts = new Set(
        getResourceConcepts(resource).map(
            concept => resourceSlug(concept.id)
        )
    );

    const entities = new Set(
        Array.isArray(resource.entity_ids)
            ? resource.entity_ids.map(entity => resourceSlug(entity))
            : []
    );

    const explicit = explicitIds.map(id =>
        BAJEE_RESOURCE_PYQ_DIRECTORY.find(
            pyq => String(pyq.id) === String(id)
        )
    ).filter(Boolean);

    const matched = BAJEE_RESOURCE_PYQ_DIRECTORY.filter(pyq => {
        if (explicitIds.some(id => String(id) === String(pyq.id))) {
            return false;
        }

        return (
            (pyq.concepts || []).some(
                concept => concepts.has(resourceSlug(concept))
            ) ||
            (pyq.entities || []).some(
                entity => entities.has(resourceSlug(entity))
            )
        );
    });

    return [...explicit, ...matched];
}


function practiceResourcePYQ(pyqId) {

    const pyq = BAJEE_RESOURCE_PYQ_DIRECTORY.find(
        item => String(item.id) === String(pyqId)
    );

    if (!pyq) return;

    try {
        localStorage.setItem(
            "bajee_selected_pyq",
            JSON.stringify(pyq)
        );
    } catch (error) {
        console.warn("Unable to store selected PYQ.", error);
    }

    window.location.href =
        "ai-practice.html?source=pyq&pyq=" +
        encodeURIComponent(pyq.id);
}


/* ============================================================
   ENTITY CONCEPT IDS
============================================================ */

function getEntityConceptIds(
    entityId
) {

    const entityConceptMap = {

        derrida: [
            "deconstruction",
            "differance",
            "logocentrism",
            "binary-opposition",
            "post-structuralism"
        ],

        deconstruction: [
            "deconstruction",
            "differance",
            "logocentrism",
            "binary-opposition"
        ],

        differance: [
            "differance",
            "deconstruction"
        ],

        logocentrism: [
            "logocentrism",
            "deconstruction"
        ],

        "binary-opposition": [
            "binary-opposition",
            "deconstruction"
        ],

        "post-structuralism": [
            "post-structuralism",
            "deconstruction",
            "differance",
            "logocentrism"
        ]

    };

    return (
        entityConceptMap[
            resourceSlug(entityId)
        ] ||
        []
    );

}


/* ============================================================
   STEP 10.6.6 — REVISION SIGNAL HELPERS
   ------------------------------------------------------------
   Uses existing browser-local performance/retest data.
   This layer does not create or modify Revision Intelligence.
============================================================ */

function revisionSafeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}


function revisionSafeArray(value) {
    return Array.isArray(value) ? value : [];
}


function revisionNormalize(value) {
    return String(value ?? "").trim().toLowerCase();
}


function revisionSlug(value) {
    return revisionNormalize(value)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}


function revisionReadJSON(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (error) {
        console.warn(
            "BAJEE JRF AI: Revision data read failed:",
            key,
            error
        );
        return null;
    }
}


function revisionExtractArray(data) {
    if (Array.isArray(data)) return data;

    if (!data || typeof data !== "object") {
        return [];
    }

    const candidates = [
        data.records,
        data.entities,
        data.items,
        data.performance,
        data.data,
        data.history,
        data.results
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate;
        }
    }

    /*
     * Some BAJEE performance stores use an object keyed by the
     * knowledge-entity name, for example:
     *
     * {
     *   "Jacques Derrida": {
     *      attempted: 2,
     *      correct: 2,
     *      wrong: 0
     *   }
     * }
     *
     * Convert that shape into records while preserving the key as
     * the entity/name field. This keeps Resource -> Revision Mapping
     * aligned with the same performance store used by Knowledge Entity.
     */
    const entries = Object.entries(data);

    if (entries.length) {
        const objectRecords = entries
            .filter(([, value]) =>
                value &&
                typeof value === "object" &&
                !Array.isArray(value)
            )
            .map(([name, value]) => ({
                ...value,
                name: value.name ||
                    value.entityName ||
                    value.knowledgeEntity ||
                    name
            }));

        if (objectRecords.length) {
            return objectRecords;
        }
    }

    return [];
}


/* ============================================================
   CANONICAL KNOWLEDGE-ENTITY ALIASES
   ------------------------------------------------------------
   Resource inventory IDs can be compact graph IDs such as
   "derrida", while performance records may store the full
   knowledge-entity name such as "Jacques Derrida".
   Resolve both forms before reading performance data.
============================================================ */

const RESOURCE_CANONICAL_ENTITY_DIRECTORY = {
    derrida: {
        id: "derrida",
        name: "Jacques Derrida",
        aliases: [
            "derrida",
            "jacques derrida",
            "jacques-derrida"
        ]
    },

    deconstruction: {
        id: "deconstruction",
        name: "Deconstruction",
        aliases: [
            "deconstruction"
        ]
    },

    differance: {
        id: "differance",
        name: "Différance",
        aliases: [
            "differance",
            "différance",
            "difference"
        ]
    },

    logocentrism: {
        id: "logocentrism",
        name: "Logocentrism",
        aliases: [
            "logocentrism"
        ]
    },

    "binary-opposition": {
        id: "binary-opposition",
        name: "Binary Opposition",
        aliases: [
            "binary-opposition",
            "binary opposition"
        ]
    },

    "post-structuralism": {
        id: "post-structuralism",
        name: "Post-Structuralism",
        aliases: [
            "post-structuralism",
            "post structuralism"
        ]
    },

    structuralism: {
        id: "structuralism",
        name: "Structuralism",
        aliases: [
            "structuralism"
        ]
    }
};


function getCanonicalResourceEntity(entityId) {
    const slug = revisionSlug(entityId);

    if (RESOURCE_CANONICAL_ENTITY_DIRECTORY[slug]) {
        return RESOURCE_CANONICAL_ENTITY_DIRECTORY[slug];
    }

    const entries = Object.values(
        RESOURCE_CANONICAL_ENTITY_DIRECTORY
    );

    return entries.find(entry =>
        entry.aliases.some(alias =>
            revisionSlug(alias) === slug
        )
    ) || {
        id: String(entityId || ""),
        name: String(entityId || ""),
        aliases: [String(entityId || "")]
    };
}


function getResourceEntityCandidates(entityId, entityName) {
    const values = new Set();

    [entityId, entityName].forEach(value => {
        if (value) {
            values.add(String(value));
        }
    });

    [entityId, entityName].forEach(value => {
        if (!value) return;

        const canonical =
            getCanonicalResourceEntity(value);

        values.add(canonical.id);
        values.add(canonical.name);

        canonical.aliases.forEach(alias => {
            values.add(alias);
        });
    });

    return [...values];
}


function revisionMatchesEntity(record, entityId, entityName) {
    if (!record || typeof record !== "object") {
        return false;
    }

    const targetIds = getResourceEntityCandidates(
        entityId,
        entityName
    ).map(revisionSlug).filter(Boolean);

    const candidates = [
        record.id,
        record.entityId,
        record.entity_id,
        record.entity,
        record.entityName,
        record.knowledge_entity,
        record.knowledgeEntity,
        record.knowledgeEntityId,
        record.knowledgeEntityName,
        record.name,
        record.author,
        record.theorist,
        record.concept,
        record.topic,
        record.questionData && record.questionData.entity,
        record.questionData && record.questionData.entityId,
        record.questionData && record.questionData.entityName,
        record.questionData && record.questionData.knowledgeEntity,
        record.questionData && record.questionData.knowledgeEntityId,
        record.questionData && record.questionData.knowledgeEntityName,
        record.questionData && record.questionData.concept
    ];

    return candidates.some(candidate => {
        if (
            candidate === null ||
            candidate === undefined ||
            candidate === ""
        ) {
            return false;
        }

        return targetIds.includes(
            revisionSlug(candidate)
        );
    });
}


function revisionReadPerformance(entityId, entityName) {
    let attempts = 0;
    let correct = 0;
    let wrong = 0;

    for (const key of RESOURCE_PERFORMANCE_KEYS) {
        const data = revisionReadJSON(key);
        const records = revisionExtractArray(data);

        if (!records.length) {
            continue;
        }

        let matched = false;

        records.forEach(record => {
            if (
                !revisionMatchesEntity(
                    record,
                    entityId,
                    entityName
                )
            ) {
                return;
            }

            matched = true;

            const recordAttempts =
                revisionSafeNumber(
                    record.attempted ??
                    record.attempts
                );

            const recordCorrect =
                revisionSafeNumber(
                    record.correct
                );

            const recordWrong =
                revisionSafeNumber(
                    record.wrong ??
                    record.incorrect
                );

            if (recordAttempts > 0) {
                attempts += recordAttempts;
                correct += recordCorrect;
                wrong += recordWrong;
                return;
            }

            const result =
                revisionNormalize(
                    record.result ??
                    record.status ??
                    record.outcome
                );

            if (
                result === "correct" ||
                record.isCorrect === true ||
                record.correct === true
            ) {
                attempts += 1;
                correct += 1;
            } else if (
                result === "wrong" ||
                result === "incorrect" ||
                record.isCorrect === false
            ) {
                attempts += 1;
                wrong += 1;
            }
        });

        /*
         * Use the first matching aggregate source so
         * fallback keys do not double-count the same record.
         */
        if (matched && attempts > 0) {
            break;
        }
    }

    /*
     * Revision Retest is an existing signal source.
     * It is read only; this step does not modify it.
     */
    const retestHistory =
        revisionReadJSON(
            RESOURCE_REVISION_HISTORY_KEY
        );

    revisionExtractArray(
        retestHistory
    ).forEach(record => {
        if (
            !revisionMatchesEntity(
                record,
                entityId,
                entityName
            )
        ) {
            return;
        }

        const result =
            revisionNormalize(
                record.result ??
                record.status ??
                record.outcome
            );

        if (result === "correct") {
            attempts += 1;
            correct += 1;
        } else if (
            result === "wrong" ||
            result === "incorrect"
        ) {
            attempts += 1;
            wrong += 1;
        }
    });

    const accuracy =
        attempts > 0
            ? Math.round(
                (correct / attempts) * 100
            )
            : 0;

    return {
        attempts,
        correct,
        wrong,
        accuracy
    };
}


function getRevisionSignalForEntity(
    entityId,
    entityName
) {
    const performance =
        revisionReadPerformance(
            entityId,
            entityName
        );

    if (performance.attempts === 0) {
        return {
            level: "none",
            label: "NOT YET ASSESSED",
            score: 0,
            className: "none",
            message:
                "No recorded revision performance is connected to this resource yet.",
            ...performance
        };
    }

    /*
     * These thresholds mirror the existing Revision
     * Intelligence rules.
     */
    if (
        performance.accuracy < 50 ||
        performance.wrong >= 2
    ) {
        return {
            level: "high",
            label: "HIGH PRIORITY",
            score: 3,
            className: "high",
            message:
                "Review this resource before another intensive practice cycle.",
            ...performance
        };
    }

    if (performance.accuracy === 50) {
        return {
            level: "medium",
            label: "MEDIUM PRIORITY",
            score: 2,
            className: "medium",
            message:
                "This resource is connected to knowledge that remains in active revision.",
            ...performance
        };
    }

    if (performance.accuracy < 75) {
        return {
            level: "low",
            label: "LOW PRIORITY",
            score: 1,
            className: "low",
            message:
                "Light revision can help strengthen this connection.",
            ...performance
        };
    }

    return {
        level: "stable",
        label: "STABLE",
        score: 0,
        className: "stable",
        message:
            "Current recorded performance is relatively stable for this connection.",
        ...performance
    };
}


function getResourceRevisionSignal(resource) {
    if (!resource) {
        return {
            level: "none",
            label: "NOT YET ASSESSED",
            score: 0,
            className: "none",
            message: "No resource is selected.",
            attempts: 0,
            correct: 0,
            wrong: 0,
            accuracy: 0
        };
    }

    /*
     * A resource can be connected to one or more graph entities.
     * Resolve the canonical entity name before reading the existing
     * performance store. This is the key Step 10.6.6 bridge.
     */
    const entityIds =
        revisionSafeArray(resource.entity_ids);

    const signals = entityIds.map(entityId => {
        const canonical =
            getCanonicalResourceEntity(entityId);

        return getRevisionSignalForEntity(
            canonical.id,
            canonical.name
        );
    });

    /*
     * If the resource has no explicit entity_ids, use the currently
     * opened knowledge entity as a safe fallback.
     */
    if (
        !signals.length &&
        bajeeCurrentEntity
    ) {
        const canonical =
            getCanonicalResourceEntity(
                bajeeCurrentEntity
            );

        signals.push(
            getRevisionSignalForEntity(
                canonical.id,
                canonical.name
            )
        );
    }

    if (!signals.length) {
        return {
            level: "none",
            label: "NOT YET ASSESSED",
            score: 0,
            className: "none",
            message:
                "No recorded revision performance is connected to this resource yet.",
            attempts: 0,
            correct: 0,
            wrong: 0,
            accuracy: 0
        };
    }

    /*
     * Prefer the strongest revision priority. If multiple connected
     * entities exist, combine equal-priority performance conservatively
     * by retaining the strongest signal.
     */
    signals.sort(
        (a, b) => b.score - a.score
    );

    return signals[0];
}


function buildRevisionSignalBadge(signal) {
    if (!signal) {
        return `
            <span class="bajee-resource-revision-badge none">
                🔄 Not yet assessed
            </span>
        `;
    }

    const icon =
        signal.level === "high"
            ? "🔴"
            : signal.level === "medium"
                ? "🟠"
                : signal.level === "low"
                    ? "🟡"
                    : signal.level === "stable"
                        ? "🟢"
                        : "⚪";

    return `
        <span
            class="bajee-resource-revision-badge ${resourceEscapeHTML(
                signal.className
            )}"
            title="${resourceEscapeHTML(
                signal.message || ""
            )}"
        >
            ${icon}
            ${resourceEscapeHTML(
                signal.label
            )}
        </span>
    `;
}


function buildRevisionSignalSummary(signal) {
    if (!signal) {
        return `
            <div class="bajee-resource-revision-summary none">
                🔄 Revision signal is not available.
            </div>
        `;
    }

    if (signal.attempts === 0) {
        return `
            <div class="bajee-resource-revision-summary none">
                <strong>🔄 Revision Signal</strong>
                <div class="small mt-1">
                    No recorded attempts are linked yet.
                </div>
            </div>
        `;
    }

    return `
        <div class="bajee-resource-revision-summary ${resourceEscapeHTML(
            signal.className
        )}">
            <div class="bajee-resource-revision-summary-title">
                🔄 Revision Signal
                <span>
                    ${resourceEscapeHTML(
                        signal.label
                    )}
                </span>
            </div>

            <div class="bajee-resource-revision-metrics">
                <span>
                    Attempts:
                    <strong>${signal.attempts}</strong>
                </span>

                <span>
                    Accuracy:
                    <strong>${signal.accuracy}%</strong>
                </span>

                <span>
                    Correct:
                    <strong>${signal.correct}</strong>
                </span>

                <span>
                    Wrong:
                    <strong>${signal.wrong}</strong>
                </span>
            </div>

            <div class="small mt-1">
                ${resourceEscapeHTML(
                    signal.message
                )}
            </div>
        </div>
    `;
}


function renderRevisionMap(resources) {
    const container =
        resourceById(
            RESOURCE_REVISION_MAP_ID
        );

    if (!container) {
        return;
    }

    const entries =
        (resources || []).map(
            resource => ({
                resource,
                revision:
                    getResourceRevisionSignal(
                        resource
                    )
            })
        );

    if (!entries.length) {
        container.innerHTML = `
            <div class="bajee-resource-revision-map-header">
                <div>
                    <h3 class="bajee-resource-revision-map-title">
                        🔄 Resource → Revision Mapping
                    </h3>

                    <p class="bajee-resource-revision-map-subtitle">
                        Revision signals will appear here after connected knowledge is attempted.
                    </p>
                </div>
            </div>
        `;
        return;
    }

    const activeEntries =
        entries.filter(
            item =>
                item.revision &&
                item.revision.attempts > 0
        );

    const highCount =
        entries.filter(
            item =>
                item.revision.level === "high"
        ).length;

    const mediumCount =
        entries.filter(
            item =>
                item.revision.level === "medium"
        ).length;

    const lowCount =
        entries.filter(
            item =>
                item.revision.level === "low"
        ).length;

    container.innerHTML = `
        <div class="bajee-resource-revision-map-header">
            <div>
                <h3 class="bajee-resource-revision-map-title">
                    🔄 Resource → Revision Mapping
                </h3>

                <p class="bajee-resource-revision-map-subtitle">
                    See how existing revision signals connect to these study resources.
                </p>
            </div>

            <span class="bajee-resource-revision-count-badge">
                ${activeEntries.length}
                active
            </span>
        </div>

        <div class="bajee-resource-revision-summary-row">
            <span>🔴 High: <strong>${highCount}</strong></span>
            <span>🟠 Medium: <strong>${mediumCount}</strong></span>
            <span>🟡 Low: <strong>${lowCount}</strong></span>
        </div>

        <div class="bajee-resource-revision-grid">
            ${entries.map(
                item => `
                    <article class="bajee-resource-revision-card">

                        <div class="bajee-resource-revision-card-title">
                            📚 ${resourceEscapeHTML(
                                item.resource.title
                            )}
                        </div>

                        <div class="bajee-resource-revision-card-signal">
                            ${buildRevisionSignalBadge(
                                item.revision
                            )}
                        </div>

                        ${
                            item.revision.attempts > 0
                                ? `
                                    <div class="bajee-resource-revision-card-meta">
                                        Attempts:
                                        ${item.revision.attempts}
                                        &nbsp;•&nbsp;
                                        Accuracy:
                                        ${item.revision.accuracy}%
                                    </div>
                                  `
                                : `
                                    <div class="bajee-resource-revision-card-meta">
                                        No revision attempts recorded yet.
                                    </div>
                                  `
                        }

                        <button
                            type="button"
                            class="bajee-resource-revision-open"
                            data-open-resource="${resourceEscapeHTML(
                                item.resource.id
                            )}"
                        >
                            View Resource →
                        </button>

                    </article>
                `
            ).join("")}
        </div>
    `;
}



/* ============================================================
   STEP 10.6.7 — RESOURCE → ADAPTIVE STUDY MAPPING
============================================================ */

function getResourceAdaptiveDirection(resource) {

    const revision =
        getResourceRevisionSignal(resource);

    if (!revision || revision.attempts === 0) {
        return {
            level: "new",
            label: "BUILD EVIDENCE",
            title: "Start with this resource",
            text:
                "Use this resource to build an initial knowledge and performance signal.",
            className: "new",
            icon: "🧭"
        };
    }

    if (revision.level === "high") {
        return {
            level: "high",
            label: "REVISE FIRST",
            title: "Prioritise revision",
            text:
                "Review this resource before another intensive practice cycle.",
            className: "high",
            icon: "🔴"
        };
    }

    if (revision.level === "medium") {
        return {
            level: "medium",
            label: "FOCUSED PRACTICE",
            title: "Use for targeted practice",
            text:
                "Combine this resource with focused practice to strengthen recall.",
            className: "medium",
            icon: "🟠"
        };
    }

    if (revision.level === "low") {
        return {
            level: "low",
            label: "LIGHT REVISION",
            title: "Maintain with light revision",
            text:
                "Keep this resource active through spaced revision and mixed practice.",
            className: "low",
            icon: "🟡"
        };
    }

    return {
        level: "stable",
        label: "MAINTAIN",
        title: "Maintain this resource",
        text:
            "Performance is currently strong. Keep this resource active through spaced revision and mixed practice.",
        className: "stable",
        icon: "🟢"
    };
}


function buildAdaptiveDirectionBadge(direction) {

    if (!direction) {
        return "";
    }

    return `
        <span class="bajee-resource-adaptive-badge ${resourceEscapeHTML(direction.className)}">
            ${direction.icon}
            ${resourceEscapeHTML(direction.label)}
        </span>
    `;
}


function buildAdaptiveDirectionSummary(direction) {

    if (!direction) {
        return "";
    }

    return `
        <div class="bajee-resource-adaptive-summary ${resourceEscapeHTML(direction.className)}">
            <div class="bajee-resource-adaptive-title">
                🎯 Adaptive Study Direction
                <span>${resourceEscapeHTML(direction.label)}</span>
            </div>

            <strong>
                ${resourceEscapeHTML(direction.title)}
            </strong>

            <div class="small mt-1">
                ${resourceEscapeHTML(direction.text)}
            </div>
        </div>
    `;
}


function renderAdaptiveMap(resources) {

    const container =
        resourceById(
            RESOURCE_ADAPTIVE_MAP_ID
        );

    if (!container) {
        return;
    }

    const entries =
        (resources || []).map(resource => ({
            resource,
            direction:
                getResourceAdaptiveDirection(resource)
        }));

    if (!entries.length) {
        container.innerHTML = `
            <div class="bajee-resource-adaptive-map-header">
                <div>
                    <h3 class="bajee-resource-adaptive-map-title">
                        🎯 Resource → Adaptive Study Mapping
                    </h3>
                    <p class="bajee-resource-adaptive-map-subtitle">
                        Adaptive study directions will appear here when resources are connected to preparation signals.
                    </p>
                </div>
            </div>
        `;
        return;
    }

    const counts = {
        high: entries.filter(item => item.direction.level === "high").length,
        medium: entries.filter(item => item.direction.level === "medium").length,
        low: entries.filter(item => item.direction.level === "low").length,
        stable: entries.filter(item => item.direction.level === "stable").length,
        new: entries.filter(item => item.direction.level === "new").length
    };

    container.innerHTML = `
        <div class="bajee-resource-adaptive-map-header">
            <div>
                <h3 class="bajee-resource-adaptive-map-title">
                    🎯 Resource → Adaptive Study Mapping
                </h3>
                <p class="bajee-resource-adaptive-map-subtitle">
                    Connect each study resource to the next study action suggested by its existing preparation signal.
                </p>
            </div>
            <span class="bajee-resource-adaptive-count-badge">
                ${entries.length} resources
            </span>
        </div>

        <div class="bajee-resource-adaptive-summary-row">
            <span>🔴 Revise: <strong>${counts.high}</strong></span>
            <span>🟠 Focus: <strong>${counts.medium}</strong></span>
            <span>🟡 Light: <strong>${counts.low}</strong></span>
            <span>🟢 Maintain: <strong>${counts.stable}</strong></span>
            <span>🧭 New: <strong>${counts.new}</strong></span>
        </div>

        <div class="bajee-resource-adaptive-grid">
            ${entries.map(item => `
                <article class="bajee-resource-adaptive-card">
                    <div class="bajee-resource-adaptive-card-title">
                        📚 ${resourceEscapeHTML(item.resource.title)}
                    </div>

                    <div class="bajee-resource-adaptive-card-badge">
                        ${buildAdaptiveDirectionBadge(item.direction)}
                    </div>

                    <strong class="bajee-resource-adaptive-card-action">
                        ${resourceEscapeHTML(item.direction.title)}
                    </strong>

                    <div class="small mt-1">
                        ${resourceEscapeHTML(item.direction.text)}
                    </div>

                    <button
                        type="button"
                        class="bajee-resource-adaptive-open"
                        data-open-resource="${resourceEscapeHTML(item.resource.id)}"
                    >
                        View Resource →
                    </button>
                </article>
            `).join("")}
        </div>
    `;
}


function injectAdaptiveStyles() {

    if (
        document.getElementById(
            "bajeeKnowledgeResourceAdaptiveStyles"
        )
    ) {
        return;
    }

    const style = document.createElement("style");
    style.id = "bajeeKnowledgeResourceAdaptiveStyles";

    style.textContent = `
        .bajee-resource-adaptive-map {
            margin-top: 18px;
        }

        .bajee-resource-adaptive-map-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 14px;
            margin-bottom: 12px;
        }

        .bajee-resource-adaptive-map-title {
            margin: 0;
            font-size: 1rem;
            font-weight: 800;
        }

        .bajee-resource-adaptive-map-subtitle {
            margin: 4px 0 0;
            color: #687587;
            font-size: 0.78rem;
        }

        .bajee-resource-adaptive-count-badge,
        .bajee-resource-adaptive-summary-row span {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 5px 9px;
            border-radius: 999px;
            background: #f4f7fa;
            border: 1px solid #dce4ec;
            font-size: 0.68rem;
            font-weight: 800;
        }

        .bajee-resource-adaptive-summary-row {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
            margin-bottom: 12px;
        }

        .bajee-resource-adaptive-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
        }

        .bajee-resource-adaptive-card {
            border: 1px solid #dfe6ef;
            border-radius: 11px;
            padding: 14px;
            background: #fff;
        }

        .bajee-resource-adaptive-card-title {
            font-weight: 800;
            font-size: 0.8rem;
            line-height: 1.35;
            margin-bottom: 8px;
        }

        .bajee-resource-adaptive-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            border-radius: 999px;
            font-size: 0.65rem;
            font-weight: 800;
        }

        .bajee-resource-adaptive-badge.high {
            background: #fde8e8;
            color: #a61b1b;
            border: 1px solid #efb5b5;
        }

        .bajee-resource-adaptive-badge.medium {
            background: #fff0df;
            color: #9a4f00;
            border: 1px solid #efc58f;
        }

        .bajee-resource-adaptive-badge.low {
            background: #fff8d9;
            color: #765d00;
            border: 1px solid #ead67a;
        }

        .bajee-resource-adaptive-badge.stable {
            background: #e7f6ed;
            color: #16723e;
            border: 1px solid #b7dfc5;
        }

        .bajee-resource-adaptive-badge.new {
            background: #edf3fb;
            color: #24527a;
            border: 1px solid #cbd9ea;
        }

        .bajee-resource-adaptive-card-action {
            display: block;
            margin-top: 9px;
            font-size: 0.78rem;
        }

        .bajee-resource-adaptive-open {
            margin-top: 11px;
            border: 1px solid #cfd8e3;
            background: #fff;
            color: #0d2b52;
            border-radius: 8px;
            padding: 6px 9px;
            font-size: 0.68rem;
            font-weight: 800;
            cursor: pointer;
        }

        @media (max-width: 1000px) {
            .bajee-resource-adaptive-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }

        @media (max-width: 576px) {
            .bajee-resource-adaptive-grid {
                grid-template-columns: 1fr;
            }
        }
    `;

    document.head.appendChild(style);
}


function injectRevisionStyles() {
    if (
        document.getElementById(
            "bajeeKnowledgeResourceRevisionStyles"
        )
    ) {
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "bajeeKnowledgeResourceRevisionStyles";

    style.textContent = `

        .bajee-resource-revision-inline {
            margin: 0 0 10px;
        }

        .bajee-resource-revision-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            border-radius: 999px;
            font-size: 0.66rem;
            font-weight: 800;
            white-space: nowrap;
        }

        .bajee-resource-revision-badge.high {
            background: #fde8e8;
            color: #a61b1b;
            border: 1px solid #efb5b5;
        }

        .bajee-resource-revision-badge.medium {
            background: #fff0df;
            color: #9a4f00;
            border: 1px solid #efc58f;
        }

        .bajee-resource-revision-badge.low {
            background: #fff8d9;
            color: #765d00;
            border: 1px solid #ead67a;
        }

        .bajee-resource-revision-badge.stable {
            background: #e7f6ed;
            color: #16723e;
            border: 1px solid #b7dfc5;
        }

        .bajee-resource-revision-badge.none {
            background: #f3f5f7;
            color: #687587;
            border: 1px solid #dce2e8;
        }

        .bajee-resource-revision-summary {
            margin: 0 0 20px;
            padding: 14px 16px;
            border-radius: 11px;
            border: 1px solid #dfe6ef;
            background: #fafbfd;
        }

        .bajee-resource-revision-summary.high {
            border-left: 4px solid #b42318;
        }

        .bajee-resource-revision-summary.medium {
            border-left: 4px solid #d97706;
        }

        .bajee-resource-revision-summary.low {
            border-left: 4px solid #b89a00;
        }

        .bajee-resource-revision-summary.stable {
            border-left: 4px solid #198754;
        }

        .bajee-resource-revision-summary.none {
            border-left: 4px solid #aab4c0;
        }

        .bajee-resource-revision-summary-title {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            flex-wrap: wrap;
            color: #0d2b52;
            font-size: 0.82rem;
            font-weight: 800;
        }

        .bajee-resource-revision-metrics {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
            margin-top: 8px;
        }

        .bajee-resource-revision-metrics span {
            padding: 4px 7px;
            border-radius: 7px;
            background: #ffffff;
            border: 1px solid #e1e7ef;
            color: #526174;
            font-size: 0.68rem;
        }

        .bajee-resource-revision-map {
            margin-top: 18px;
            padding: 20px;
            border: 1px solid #dfe6ef;
            border-radius: 14px;
            background: #ffffff;
        }

        .bajee-resource-revision-map-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 14px;
        }

        .bajee-resource-revision-map-title {
            margin: 0;
            color: #0d2b52;
            font-size: 1.05rem;
            font-weight: 800;
        }

        .bajee-resource-revision-map-subtitle {
            margin: 3px 0 0;
            color: #687587;
            font-size: 0.78rem;
        }

        .bajee-resource-revision-count-badge {
            padding: 6px 10px;
            border-radius: 20px;
            background: #fff5d9;
            color: #8a6200;
            font-size: 0.72rem;
            font-weight: 800;
        }

        .bajee-resource-revision-summary-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 12px;
        }

        .bajee-resource-revision-summary-row span {
            padding: 5px 8px;
            border-radius: 8px;
            background: #f7f9fc;
            border: 1px solid #e1e7ef;
            color: #526174;
            font-size: 0.68rem;
            font-weight: 700;
        }

        .bajee-resource-revision-grid {
            display: grid;
            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(240px, 1fr)
                );
            gap: 12px;
        }

        .bajee-resource-revision-card {
            padding: 14px;
            border: 1px solid #dfe6ef;
            border-radius: 11px;
            background: #fafbfd;
        }

        .bajee-resource-revision-card-title {
            margin-bottom: 8px;
            color: #0d2b52;
            font-size: 0.84rem;
            font-weight: 800;
        }

        .bajee-resource-revision-card-meta {
            margin-top: 7px;
            color: #687587;
            font-size: 0.68rem;
        }

        .bajee-resource-revision-open {
            margin-top: 9px;
            padding: 6px 9px;
            border: 1px solid #cfd8e3;
            border-radius: 7px;
            background: #ffffff;
            color: #0d2b52;
            font-size: 0.68rem;
            font-weight: 700;
            cursor: pointer;
        }

        .bajee-resource-revision-open:hover {
            background: #eef4fb;
        }

        .bajee-viewer-revision-section {
            margin-bottom: 20px;
        }

        @media (max-width: 576px) {
            .bajee-resource-revision-summary-title {
                flex-direction: column;
                align-items: flex-start;
            }
        }

    `;

    document.head.appendChild(style);
}


/* ============================================================
   RESOURCE TYPE ICON
============================================================ */

function getResourceTypeIcon(
    type
) {

    const icons = {

        book: "📕",
        pdf: "📄",
        ppt: "📊",
        mp3: "🎧",
        audio: "🎧",
        video: "🎥",
        youtube: "▶️",
        notes: "📝",
        note: "📝",
        document: "📄"

    };

    return (
        icons[
            resourceNormalize(type)
        ] ||
        "📚"
    );

}


/* ============================================================
   FIND RESOURCE
============================================================ */

function getResourceById(
    resourceId
) {

    return bajeeResourceInventory.find(
        resource =>
            String(resource.id) ===
            String(resourceId)
    ) || null;

}


/* ============================================================
   BUILD CONCEPT TAGS
============================================================ */

function buildConceptTags(
    resource
) {

    const concepts =
        getResourceConcepts(
            resource
        );

    if (!concepts.length) {

        return `
            <span class="bajee-resource-no-concept">
                No concept mapped
            </span>
        `;

    }

    return concepts
        .map(
            concept => `

                <button
                    type="button"
                    class="bajee-resource-concept-tag"
                    data-concept-id="${resourceEscapeHTML(
                        concept.id
                    )}"
                    title="${resourceEscapeHTML(
                        concept.description
                    )}"
                >
                    🔗 ${resourceEscapeHTML(
                        concept.name
                    )}
                </button>

            `
        )
        .join("");

}


/* ============================================================
   BUILD RESOURCE CARD
============================================================ */

function buildResourceCard(
    resource
) {

    const icon =
        getResourceTypeIcon(
            resource.type
        );

    return `

        <article
            class="bajee-resource-card"
            data-resource-id="${resourceEscapeHTML(
                resource.id
            )}"
        >

            <div class="bajee-resource-icon">
                ${icon}
            </div>

            <div class="bajee-resource-content">

                <div class="bajee-resource-topline">

                    <span class="bajee-resource-type">
                        ${resourceEscapeHTML(
                            resource.type
                        )}
                    </span>

                    ${
                        resource.available

                            ? `
                                <span class="bajee-resource-available">
                                    Available
                                </span>
                              `

                            : `
                                <span class="bajee-resource-unavailable">
                                    Coming Soon
                                </span>
                              `
                    }

                </div>

                <h3 class="bajee-resource-title">
                    ${resourceEscapeHTML(
                        resource.title
                    )}
                </h3>

                ${
                    resource.description

                        ? `
                            <p class="bajee-resource-description">
                                ${resourceEscapeHTML(
                                    resource.description
                                )}
                            </p>
                          `

                        : ""
                }

                <div class="bajee-resource-meta">

                    ${
                        resource.unit
                            ? `
                                <span>
                                    📚 ${resourceEscapeHTML(
                                        resource.unit
                                    )}
                                </span>
                              `
                            : ""
                    }

                    ${
                        resource.topic
                            ? `
                                <span>
                                    🔎 ${resourceEscapeHTML(
                                        resource.topic
                                    )}
                                </span>
                              `
                            : ""
                    }

                </div>

                <div class="bajee-resource-concept-block">

                    <div class="bajee-resource-concept-heading">
                        🔗 Connected Concepts
                    </div>

                    <div class="bajee-resource-concept-tags">

                        ${buildConceptTags(
                            resource
                        )}

                    </div>

                </div>

                <div class="bajee-resource-pyq-block">

                    <div class="bajee-resource-pyq-heading">
                        📝 Connected PYQs
                    </div>

                    <div class="bajee-resource-pyq-tags">
                        ${
                            getResourcePYQs(resource).length
                                ? `<span class="bajee-resource-pyq-count">
                                    📝 ${getResourcePYQs(resource).length}
                                    PYQ${
                                        getResourcePYQs(resource).length === 1
                                            ? ""
                                            : "s"
                                    }
                                   </span>`
                                : `<span class="bajee-resource-no-pyq">
                                    No PYQ mapped
                                   </span>`
                        }
                    </div>

                </div>

                <div class="bajee-resource-revision-inline">
                    ${buildRevisionSignalBadge(
                        getResourceRevisionSignal(resource)
                    )}
                </div>

                <div class="bajee-resource-footer">

                    <span class="bajee-resource-source">
                        ${resourceEscapeHTML(
                            resource.source ||
                            "BAJEE JRF AI"
                        )}
                    </span>

                    <button
                        type="button"
                        class="bajee-resource-action"
                        data-open-resource="${resourceEscapeHTML(
                            resource.id
                        )}"
                    >
                        View Resource →
                    </button>

                </div>

            </div>

        </article>

    `;

}


/* ============================================================
   INJECT STYLES
============================================================ */

function injectResourceStyles() {

    if (
        document.getElementById(
            "bajeeKnowledgeResourceStyles"
        )
    ) {

        return;

    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "bajeeKnowledgeResourceStyles";

    style.textContent = `

        #${RESOURCE_SECTION_ID} {
            margin-top: 24px;
        }

        .bajee-resource-status {
            padding: 12px 16px;
            border-radius: 10px;
            border: 1px solid #d9e1eb;
            background: #f8fafc;
            margin-bottom: 18px;
            font-size: 0.88rem;
        }

        .bajee-resource-status.ready {
            border-left: 4px solid #198754;
        }

        .bajee-resource-status.empty {
            border-left: 4px solid #d9b34c;
        }

        .bajee-resource-grid {
            display: grid;
            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(280px, 1fr)
                );
            gap: 16px;
        }

        .bajee-resource-card {
            display: flex;
            gap: 14px;
            background: #ffffff;
            border: 1px solid #dfe6ef;
            border-radius: 14px;
            padding: 18px;
            min-height: 220px;
            box-shadow:
                0 4px 14px
                rgba(
                    13,
                    43,
                    82,
                    0.05
                );
        }

        .bajee-resource-icon {
            width: 46px;
            height: 46px;
            min-width: 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            background: #f7efd6;
            border: 1px solid #e3c36a;
            font-size: 1.35rem;
        }

        .bajee-resource-content {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
        }

        .bajee-resource-topline {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 8px;
        }

        .bajee-resource-type {
            display: inline-block;
            padding: 4px 9px;
            border-radius: 20px;
            background: #eef4fb;
            border: 1px solid #d5e1ef;
            color: #0d2b52;
            font-size: 0.72rem;
            font-weight: 700;
            text-transform: uppercase;
        }

        .bajee-resource-available,
        .bajee-resource-unavailable {
            font-size: 0.72rem;
            font-weight: 700;
        }

        .bajee-resource-available {
            color: #198754;
        }

        .bajee-resource-unavailable {
            color: #9a6a00;
        }

        .bajee-resource-title {
            margin: 0 0 8px;
            color: #0d2b52;
            font-size: 1rem;
            font-weight: 700;
        }

        .bajee-resource-description {
            margin: 0 0 10px;
            color: #687587;
            font-size: 0.84rem;
            line-height: 1.55;
        }

        .bajee-resource-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 10px;
        }

        .bajee-resource-meta span {
            padding: 4px 7px;
            border-radius: 8px;
            background: #f7f9fc;
            border: 1px solid #e1e7ef;
            color: #526174;
            font-size: 0.72rem;
        }

        .bajee-resource-concept-block {
            margin-top: 2px;
            margin-bottom: 12px;
        }

        .bajee-resource-concept-heading {
            margin-bottom: 6px;
            color: #0d2b52;
            font-size: 0.72rem;
            font-weight: 800;
        }

        .bajee-resource-concept-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }

        .bajee-resource-concept-tag {
            padding: 5px 7px;
            border: 1px solid #d5e1ef;
            border-radius: 8px;
            background: #f4f8fd;
            color: #365271;
            font-size: 0.68rem;
            cursor: pointer;
        }

        .bajee-resource-concept-tag:hover {
            background: #e9f1fa;
        }

        .bajee-resource-no-concept {
            color: #7a8696;
            font-size: 0.7rem;
        }

        .bajee-resource-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-top: auto;
        }

        .bajee-resource-source {
            color: #7a8696;
            font-size: 0.72rem;
        }

        .bajee-resource-action {
            padding: 7px 11px;
            border-radius: 8px;
            border: 0;
            background: #0d2b52;
            color: #ffffff;
            font-size: 0.75rem;
            font-weight: 700;
            cursor: pointer;
        }

        .bajee-resource-empty {
            padding: 28px 20px;
            border: 1px dashed #d7dee8;
            border-radius: 12px;
            text-align: center;
            background: #fafbfd;
            color: #687587;
            grid-column: 1 / -1;
        }

        /* =====================================================
           CONCEPT MAP
        ===================================================== */

        .bajee-resource-concept-map {
            margin-top: 24px;
            padding: 20px;
            border: 1px solid #dfe6ef;
            border-radius: 14px;
            background: #ffffff;
        }

        .bajee-resource-concept-map-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 14px;
        }

        .bajee-resource-concept-map-title {
            margin: 0;
            color: #0d2b52;
            font-size: 1.05rem;
            font-weight: 800;
        }

        .bajee-resource-concept-map-subtitle {
            margin: 3px 0 0;
            color: #687587;
            font-size: 0.78rem;
        }

        .bajee-resource-concept-count {
            padding: 6px 10px;
            border-radius: 20px;
            background: #fff5d9;
            color: #8a6200;
            font-size: 0.72rem;
            font-weight: 800;
        }

        .bajee-concept-map-grid {
            display: grid;
            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(220px, 1fr)
                );
            gap: 12px;
        }

        .bajee-concept-map-card {
            padding: 14px;
            border: 1px solid #dfe6ef;
            border-radius: 11px;
            background: #fafbfd;
        }

        .bajee-concept-map-card-title {
            margin-bottom: 5px;
            color: #0d2b52;
            font-size: 0.86rem;
            font-weight: 800;
        }

        .bajee-concept-map-card-type {
            display: inline-block;
            margin-bottom: 7px;
            padding: 3px 7px;
            border-radius: 15px;
            background: #eef4fb;
            color: #365271;
            font-size: 0.65rem;
            font-weight: 700;
        }

        .bajee-concept-map-card-description {
            margin-bottom: 9px;
            color: #687587;
            font-size: 0.73rem;
            line-height: 1.5;
        }

        .bajee-concept-map-resource-count {
            color: #198754;
            font-size: 0.7rem;
            font-weight: 800;
        }

        .bajee-concept-map-resources {
            margin-top: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .bajee-concept-resource-link {
            padding: 5px 7px;
            border-radius: 6px;
            background: #ffffff;
            border: 1px solid #e1e7ef;
            color: #365271;
            font-size: 0.68rem;
            cursor: pointer;
            text-align: left;
        }

        .bajee-concept-resource-link:hover {
            background: #eef4fb;
        }

        .bajee-resource-pyq-block {
            margin: 2px 0 12px;
        }

        .bajee-resource-pyq-heading {
            margin-bottom: 6px;
            color: #0d2b52;
            font-size: 0.72rem;
            font-weight: 800;
        }

        .bajee-resource-pyq-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }

        .bajee-resource-pyq-count {
            display: inline-block;
            padding: 5px 8px;
            border-radius: 8px;
            background: #fff8e6;
            border: 1px solid #e3c36a;
            color: #765500;
            font-size: 0.68rem;
            font-weight: 800;
        }

        .bajee-resource-no-pyq {
            color: #7a8696;
            font-size: 0.7rem;
        }

        .bajee-resource-pyq-map {
            margin-top: 18px;
            padding: 20px;
            border: 1px solid #dfe6ef;
            border-radius: 14px;
            background: #ffffff;
        }

        .bajee-resource-pyq-map-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 14px;
        }

        .bajee-resource-pyq-map-title {
            margin: 0;
            color: #0d2b52;
            font-size: 1.05rem;
            font-weight: 800;
        }

        .bajee-resource-pyq-map-subtitle {
            margin: 3px 0 0;
            color: #687587;
            font-size: 0.78rem;
        }

        .bajee-resource-pyq-count-badge {
            padding: 6px 10px;
            border-radius: 20px;
            background: #fff5d9;
            color: #8a6200;
            font-size: 0.72rem;
            font-weight: 800;
        }

        .bajee-resource-pyq-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 12px;
        }

        .bajee-resource-pyq-card {
            padding: 14px;
            border: 1px solid #dfe6ef;
            border-radius: 11px;
            background: #fafbfd;
        }

        .bajee-resource-pyq-card-title {
            margin-bottom: 7px;
            color: #0d2b52;
            font-size: 0.86rem;
            font-weight: 800;
        }

        .bajee-resource-pyq-card-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-bottom: 8px;
        }

        .bajee-resource-pyq-card-meta span {
            padding: 3px 7px;
            border-radius: 8px;
            background: #eef4fb;
            border: 1px solid #d5e1ef;
            color: #365271;
            font-size: 0.65rem;
            font-weight: 700;
        }

        .bajee-resource-pyq-question {
            margin-bottom: 10px;
            color: #526174;
            font-size: 0.73rem;
            line-height: 1.5;
        }

        .bajee-resource-pyq-actions {
            display: flex;
            gap: 7px;
            flex-wrap: wrap;
        }

        .bajee-resource-pyq-action {
            padding: 6px 9px;
            border-radius: 7px;
            border: 1px solid #cfd8e3;
            background: #ffffff;
            color: #0d2b52;
            font-size: 0.68rem;
            font-weight: 700;
            cursor: pointer;
        }

        .bajee-resource-pyq-action.primary {
            border-color: #0d2b52;
            background: #0d2b52;
            color: #ffffff;
        }

        .bajee-viewer-pyq-section {
            margin-bottom: 20px;
        }

        .bajee-viewer-pyq-card {
            padding: 12px;
            margin-bottom: 7px;
            border-left: 3px solid #e3b92f;
            border-radius: 7px;
            background: #fafbfd;
        }

        .bajee-viewer-pyq-title {
            color: #0d2b52;
            font-size: 0.8rem;
            font-weight: 800;
        }

        .bajee-viewer-pyq-meta {
            margin-top: 4px;
            color: #7a8696;
            font-size: 0.68rem;
        }

        .bajee-viewer-pyq-question {
            margin-top: 5px;
            color: #687587;
            font-size: 0.7rem;
            line-height: 1.45;
        }

        .bajee-viewer-pyq-practice {
            margin-top: 7px;
            padding: 5px 8px;
            border: 1px solid #d5e1ef;
            border-radius: 7px;
            background: #ffffff;
            color: #0d2b52;
            font-size: 0.68rem;
            font-weight: 700;
            cursor: pointer;
        }

        /* =====================================================
           VIEWER
        ===================================================== */

        .bajee-resource-viewer-backdrop {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background:
                rgba(
                    5,
                    20,
                    42,
                    0.72
                );
        }

        .bajee-resource-viewer {
            width: min(
                760px,
                100%
            );
            max-height: 90vh;
            overflow-y: auto;
            background: #ffffff;
            border-radius: 18px;
            border: 1px solid #dfe6ef;
            box-shadow:
                0 20px 60px
                rgba(
                    0,
                    0,
                    0,
                    0.25
                );
        }

        .bajee-resource-viewer-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            padding: 22px 24px;
            background:
                linear-gradient(
                    135deg,
                    #0b2850,
                    #214b7c
                );
            color: #ffffff;
        }

        .bajee-resource-viewer-kicker {
            margin-bottom: 5px;
            color: #e8c95c;
            font-size: 0.7rem;
            font-weight: 800;
            text-transform: uppercase;
        }

        .bajee-resource-viewer-title {
            margin: 0;
            color: #ffffff;
            font-size: 1.3rem;
            font-weight: 800;
        }

        .bajee-resource-viewer-close {
            width: 36px;
            height: 36px;
            border: 1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.35
                );
            border-radius: 9px;
            background:
                rgba(
                    255,
                    255,
                    255,
                    0.1
                );
            color: #ffffff;
            font-size: 1.2rem;
            cursor: pointer;
        }

        .bajee-resource-viewer-body {
            padding: 24px;
        }

        .bajee-resource-viewer-status {
            display: inline-block;
            padding: 5px 10px;
            margin-bottom: 16px;
            border-radius: 20px;
            font-size: 0.72rem;
            font-weight: 800;
        }

        .bajee-resource-viewer-status.available {
            background: #e7f6ed;
            color: #16723e;
        }

        .bajee-resource-viewer-status.coming {
            background: #fff5d9;
            color: #8a6200;
        }

        .bajee-resource-viewer-description {
            margin-bottom: 20px;
            padding: 16px;
            border-left: 4px solid #e3b92f;
            border-radius: 8px;
            background: #f7f9fc;
            color: #526174;
            line-height: 1.65;
        }

        .bajee-resource-viewer-details {
            display: grid;
            grid-template-columns:
                repeat(
                    2,
                    minmax(0, 1fr)
                );
            gap: 10px;
            margin-bottom: 20px;
        }

        .bajee-resource-viewer-detail {
            padding: 12px;
            border: 1px solid #e1e7ef;
            border-radius: 9px;
            background: #fafbfd;
        }

        .bajee-resource-viewer-detail-label {
            display: block;
            margin-bottom: 4px;
            color: #7a8696;
            font-size: 0.68rem;
            font-weight: 700;
            text-transform: uppercase;
        }

        .bajee-resource-viewer-detail-value {
            color: #0d2b52;
            font-size: 0.84rem;
            font-weight: 700;
        }

        .bajee-resource-viewer-connections-title {
            margin-bottom: 8px;
            color: #0d2b52;
            font-size: 0.86rem;
            font-weight: 800;
        }

        .bajee-resource-viewer-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 20px;
        }

        .bajee-resource-viewer-tag {
            padding: 5px 8px;
            border-radius: 8px;
            background: #eef4fb;
            border: 1px solid #d5e1ef;
            color: #365271;
            font-size: 0.72rem;
        }

        .bajee-viewer-concept-section {
            margin-bottom: 20px;
        }

        .bajee-viewer-concept-card {
            padding: 12px;
            margin-bottom: 7px;
            border-left: 3px solid #e3b92f;
            border-radius: 7px;
            background: #fafbfd;
        }

        .bajee-viewer-concept-name {
            color: #0d2b52;
            font-size: 0.8rem;
            font-weight: 800;
        }

        .bajee-viewer-concept-description {
            margin-top: 4px;
            color: #687587;
            font-size: 0.7rem;
            line-height: 1.45;
        }

        .bajee-resource-viewer-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            flex-wrap: wrap;
        }

        .bajee-resource-viewer-primary,
        .bajee-resource-viewer-secondary {
            padding: 9px 14px;
            border-radius: 9px;
            font-size: 0.78rem;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
        }

        .bajee-resource-viewer-primary {
            border: 0;
            background: #0d2b52;
            color: #ffffff;
        }

        .bajee-resource-viewer-primary.disabled {
            background: #e9edf2;
            color: #687587;
            cursor: default;
        }

        .bajee-resource-viewer-secondary {
            border: 1px solid #cfd8e3;
            background: #ffffff;
            color: #0d2b52;
        }

        @media (max-width: 576px) {

            .bajee-resource-card {
                padding: 14px;
            }

            .bajee-resource-footer {
                align-items: flex-start;
                flex-direction: column;
            }

            .bajee-resource-viewer-details {
                grid-template-columns: 1fr;
            }

            .bajee-resource-viewer-header,
            .bajee-resource-viewer-body {
                padding: 18px;
            }

        }

    `;

    document.head.appendChild(
        style
    );

}


/* ============================================================
   INSERTION POINT
============================================================ */

function findResourceInsertionPoint() {

    const candidates = [

        "entityPYQList",
        "entityRelationships",
        "entityTopics",
        "adaptiveRecommendation"

    ];

    for (
        const id of candidates
    ) {

        const element =
            resourceById(id);

        if (element) {

            const section =
                element.closest(
                    "section"
                );

            if (section) {

                return section;

            }

        }

    }

    return null;

}


/* ============================================================
   CREATE RESOURCE SECTION
============================================================ */

function createResourceSection() {

    const section =
        document.createElement(
            "section"
        );

    section.id =
        RESOURCE_SECTION_ID;

    section.className =
        "section-card mb-4";

    section.innerHTML = `

        <h2>
            📚 Study Resources
        </h2>

        <p class="text-secondary">
            Study materials connected to this Knowledge Entity.
        </p>

        <div
            id="${RESOURCE_STATUS_ID}"
            class="bajee-resource-status"
        >
            Loading study resources...
        </div>

        <div
            id="${RESOURCE_GRID_ID}"
            class="bajee-resource-grid"
        ></div>

        <div
            id="${RESOURCE_CONCEPT_MAP_ID}"
            class="bajee-resource-concept-map"
        ></div>

        <div
            id="${RESOURCE_PYQ_MAP_ID}"
            class="bajee-resource-pyq-map"
        ></div>

        <div
            id="${RESOURCE_REVISION_MAP_ID}"
            class="bajee-resource-revision-map"
        ></div>

        <div
            id="${RESOURCE_ADAPTIVE_MAP_ID}"
            class="bajee-resource-adaptive-map"
        ></div>

    `;

    return section;

}


/* ============================================================
   INSERT SECTION
============================================================ */

function insertResourceSection() {

    const existing =
        resourceById(
            RESOURCE_SECTION_ID
        );

    if (existing) {

        return existing;

    }

    const section =
        createResourceSection();

    const insertionPoint =
        findResourceInsertionPoint();

    if (insertionPoint) {

        insertionPoint.insertAdjacentElement(
            "afterend",
            section
        );

    } else {

        const main =
            document.querySelector(
                "main"
            );

        if (main) {

            main.appendChild(
                section
            );

        } else {

            document.body.appendChild(
                section
            );

        }

    }

    return section;

}


/* ============================================================
   STATUS
============================================================ */

function updateResourceStatus(
    message,
    state = ""
) {

    const status =
        resourceById(
            RESOURCE_STATUS_ID
        );

    if (!status) {

        return;

    }

    status.textContent =
        message;

    status.className =
        `bajee-resource-status ${state}`;

}


/* ============================================================
   BUILD CONCEPT MAP
============================================================ */

function renderConceptMap(
    resources,
    entityId
) {

    const container =
        resourceById(
            RESOURCE_CONCEPT_MAP_ID
        );

    if (!container) {

        return;

    }

    const conceptIds =
        getEntityConceptIds(
            entityId
        );

    const conceptMap =
        new Map();

    resources.forEach(
        resource => {

            const concepts =
                getResourceConcepts(
                    resource
                );

            concepts.forEach(
                concept => {

                    const key =
                        resourceSlug(
                            concept.id
                        );

                    if (
                        !conceptMap.has(key)
                    ) {

                        conceptMap.set(
                            key,
                            {
                                concept,
                                resources: []
                            }
                        );

                    }

                    conceptMap
                        .get(key)
                        .resources
                        .push(resource);

                }
            );

        }
    );

    const orderedConcepts = [];

    conceptIds.forEach(
        id => {

            const key =
                resourceSlug(id);

            if (
                conceptMap.has(key)
            ) {

                orderedConcepts.push(
                    conceptMap.get(key)
                );

            }

        }
    );

    conceptMap.forEach(
        value => {

            const exists =
                orderedConcepts.some(
                    item =>
                        resourceSlug(
                            item.concept.id
                        ) ===
                        resourceSlug(
                            value.concept.id
                        )
                );

            if (!exists) {

                orderedConcepts.push(
                    value
                );

            }

        }
    );

    if (!orderedConcepts.length) {

        container.innerHTML = `

            <div class="bajee-resource-concept-map-header">

                <div>

                    <h3 class="bajee-resource-concept-map-title">
                        🔗 Resource → Concept Mapping
                    </h3>

                    <p class="bajee-resource-concept-map-subtitle">
                        No concept mappings are available yet.
                    </p>

                </div>

            </div>

        `;

        return;

    }

    container.innerHTML = `

        <div class="bajee-resource-concept-map-header">

            <div>

                <h3 class="bajee-resource-concept-map-title">
                    🔗 Resource → Concept Mapping
                </h3>

                <p class="bajee-resource-concept-map-subtitle">
                    See which study resources support each connected concept.
                </p>

            </div>

            <span class="bajee-resource-concept-count">
                ${orderedConcepts.length}
                Concepts
            </span>

        </div>

        <div class="bajee-concept-map-grid">

            ${orderedConcepts
                .map(
                    item => `

                        <div
                            class="bajee-concept-map-card"
                            data-concept-map-card="${resourceEscapeHTML(
                                item.concept.id
                            )}"
                        >

                            <div class="bajee-concept-map-card-title">
                                ${resourceEscapeHTML(
                                    item.concept.name
                                )}
                            </div>

                            <span class="bajee-concept-map-card-type">
                                ${resourceEscapeHTML(
                                    item.concept.type
                                )}
                            </span>

                            <div class="bajee-concept-map-card-description">
                                ${resourceEscapeHTML(
                                    item.concept.description
                                )}
                            </div>

                            <div class="bajee-concept-map-resource-count">
                                📚 ${item.resources.length}
                                resource${
                                    item.resources.length === 1
                                        ? ""
                                        : "s"
                                }
                            </div>

                            <div class="bajee-concept-map-resources">

                                ${item.resources
                                    .map(
                                        resource => `

                                            <button
                                                type="button"
                                                class="bajee-concept-resource-link"
                                                data-open-resource="${
                                                    resourceEscapeHTML(
                                                        resource.id
                                                    )
                                                }"
                                            >
                                                📄 ${
                                                    resourceEscapeHTML(
                                                        resource.title
                                                    )
                                                }
                                            </button>

                                        `
                                    )
                                    .join("")}

                            </div>

                        </div>

                    `
                )
                .join("")}

        </div>

    `;

    attachResourceEvents();

}


/* ============================================================
   OPEN RESOURCE VIEWER
============================================================ */

function openResourceViewer(
    resourceId
) {

    const resource =
        getResourceById(
            resourceId
        );

    if (!resource) {

        return;

    }

    closeResourceViewer();

    const concepts =
        getResourceConcepts(
            resource
        );

    const pyqs =
        getResourcePYQs(
            resource
        );

    const backdrop =
        document.createElement(
            "div"
        );

    backdrop.id =
        RESOURCE_VIEWER_ID;

    backdrop.className =
        "bajee-resource-viewer-backdrop";

    backdrop.innerHTML = `

        <div
            class="bajee-resource-viewer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bajeeResourceViewerTitle"
        >

            <div class="bajee-resource-viewer-header">

                <div>

                    <div class="bajee-resource-viewer-kicker">
                        ${resourceEscapeHTML(
                            resource.type
                        )}
                    </div>

                    <h2
                        id="bajeeResourceViewerTitle"
                        class="bajee-resource-viewer-title"
                    >
                        ${resourceEscapeHTML(
                            resource.title
                        )}
                    </h2>

                </div>

                <button
                    type="button"
                    class="bajee-resource-viewer-close"
                    id="bajeeResourceViewerClose"
                    aria-label="Close resource viewer"
                >
                    ×
                </button>

            </div>

            <div class="bajee-resource-viewer-body">

                <span
                    class="bajee-resource-viewer-status ${
                        resource.available
                            ? "available"
                            : "coming"
                    }"
                >
                    ${
                        resource.available
                            ? "Available"
                            : "Coming Soon"
                    }
                </span>

                <div class="bajee-resource-viewer-description">

                    ${
                        resource.description
                            ? resourceEscapeHTML(
                                resource.description
                            )
                            : "No description has been added to this resource yet."
                    }

                </div>

                <div class="bajee-resource-viewer-details">

                    ${buildViewerDetail(
                        "Resource Type",
                        resource.type
                    )}

                    ${buildViewerDetail(
                        "Subject",
                        resource.subject
                    )}

                    ${buildViewerDetail(
                        "UGC NET Unit",
                        resource.unit
                    )}

                    ${buildViewerDetail(
                        "Topic",
                        resource.topic
                    )}

                    ${buildViewerDetail(
                        "Author",
                        resource.author ||
                        "Not specified"
                    )}

                    ${buildViewerDetail(
                        "Source",
                        resource.source ||
                        "BAJEE JRF AI"
                    )}

                </div>

                <div>

                    <div class="bajee-resource-viewer-connections-title">
                        🔗 Connected Entity
                    </div>

                    <div class="bajee-resource-viewer-tags">

                        ${
                            resource.entity_ids
                                .map(
                                    id =>
                                        `
                                            <span class="bajee-resource-viewer-tag">
                                                Entity: ${resourceEscapeHTML(
                                                    id
                                                )}
                                            </span>
                                        `
                                )
                                .join("")
                        }

                    </div>

                </div>

                <div class="bajee-viewer-concept-section">

                    <div class="bajee-resource-viewer-connections-title">
                        🧠 Connected Concepts
                    </div>

                    ${
                        concepts.length

                            ? concepts
                                .map(
                                    concept => `

                                        <div class="bajee-viewer-concept-card">

                                            <div class="bajee-viewer-concept-name">
                                                ${resourceEscapeHTML(
                                                    concept.name
                                                )}
                                            </div>

                                            <div class="bajee-viewer-concept-description">
                                                ${resourceEscapeHTML(
                                                    concept.description
                                                )}
                                            </div>

                                        </div>

                                    `
                                )
                                .join("")

                            : `
                                <div class="bajee-resource-viewer-tag">
                                    No concepts mapped.
                                </div>
                              `
                    }

                </div>

                <div class="bajee-viewer-pyq-section">

                    <div class="bajee-resource-viewer-connections-title">
                        📝 Connected PYQs
                    </div>

                    ${
                        pyqs.length
                            ? pyqs.map(
                                pyq => `
                                    <div class="bajee-viewer-pyq-card">

                                        <div class="bajee-viewer-pyq-title">
                                            ${resourceEscapeHTML(pyq.title)}
                                        </div>

                                        <div class="bajee-viewer-pyq-meta">
                                            ${resourceEscapeHTML(pyq.year)}
                                            •
                                            ${resourceEscapeHTML(pyq.unit)}
                                            •
                                            ${resourceEscapeHTML(pyq.topic)}
                                        </div>

                                        <div class="bajee-viewer-pyq-question">
                                            ${resourceEscapeHTML(pyq.question)}
                                        </div>

                                        <button
                                            type="button"
                                            class="bajee-viewer-pyq-practice"
                                            data-practice-pyq="${resourceEscapeHTML(pyq.id)}"
                                        >
                                            Practice this PYQ →
                                        </button>

                                    </div>
                                `
                            ).join("")
                            : `
                                <div class="bajee-resource-viewer-tag">
                                    No PYQs mapped to this resource.
                                </div>
                              `
                    }

                </div>


                <div class="bajee-viewer-revision-section">

                    <div class="bajee-resource-viewer-connections-title">
                        🔄 Revision Signal
                    </div>

                    ${buildRevisionSignalSummary(
                        getResourceRevisionSignal(resource)
                    )}

                </div>


                <div class="bajee-resource-viewer-actions">

                    <button
                        type="button"
                        class="bajee-resource-viewer-secondary"
                        id="bajeeResourceViewerCancel"
                    >
                        Close
                    </button>

                    ${
                        resource.available &&
                        resource.url

                            ? `
                                <a
                                    class="bajee-resource-viewer-primary"
                                    href="${resourceEscapeHTML(
                                        resource.url
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Open Resource ↗
                                </a>
                              `

                            : `
                                <span
                                    class="bajee-resource-viewer-primary disabled"
                                >
                                    Resource Not Linked
                                </span>
                              `
                    }

                </div>

            </div>

        </div>

    `;

    document.body.appendChild(
        backdrop
    );

    const closeButton =
        resourceById(
            "bajeeResourceViewerClose"
        );

    const cancelButton =
        resourceById(
            "bajeeResourceViewerCancel"
        );

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeResourceViewer
        );

    }

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeResourceViewer
        );

    }

    backdrop.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                backdrop
            ) {

                closeResourceViewer();

            }

        }
    );

    document.addEventListener(
        "keydown",
        resourceViewerEscapeHandler
    );

}


/* ============================================================
   VIEWER DETAIL
============================================================ */

function buildViewerDetail(
    label,
    value
) {

    return `

        <div class="bajee-resource-viewer-detail">

            <span class="bajee-resource-viewer-detail-label">
                ${resourceEscapeHTML(
                    label
                )}
            </span>

            <span class="bajee-resource-viewer-detail-value">
                ${resourceEscapeHTML(
                    value || "Not specified"
                )}
            </span>

        </div>

    `;

}


/* ============================================================
   CLOSE VIEWER
============================================================ */

function closeResourceViewer() {

    const viewer =
        resourceById(
            RESOURCE_VIEWER_ID
        );

    if (viewer) {

        viewer.remove();

    }

    document.removeEventListener(
        "keydown",
        resourceViewerEscapeHandler
    );

}


/* ============================================================
   ESCAPE KEY
============================================================ */

function resourceViewerEscapeHandler(
    event
) {

    if (
        event.key === "Escape"
    ) {

        closeResourceViewer();

    }

}


/* ============================================================
   RESOURCE EVENTS
============================================================ */

function attachResourceEvents() {

    document
        .querySelectorAll(
            "[data-open-resource]"
        )
        .forEach(
            button => {

                if (
                    button.dataset
                        .resourceEventAttached ===
                    "true"
                ) {

                    return;

                }

                button.dataset
                    .resourceEventAttached =
                    "true";

                button.addEventListener(
                    "click",
                    () => {

                        openResourceViewer(
                            button.getAttribute(
                                "data-open-resource"
                            )
                        );

                    }
                );

            }
        );

}


/* ============================================================
   RESOURCE → PYQ MAP
============================================================ */

function renderPYQMap(resources, entityId) {

    const container =
        resourceById(RESOURCE_PYQ_MAP_ID);

    if (!container) return;

    const map = new Map();

    (resources || []).forEach(resource => {
        getResourcePYQs(resource).forEach(pyq => {

            if (!map.has(pyq.id)) {
                map.set(pyq.id, {
                    pyq,
                    resources: []
                });
            }

            const item = map.get(pyq.id);

            if (!item.resources.some(
                r => String(r.id) === String(resource.id)
            )) {
                item.resources.push(resource);
            }
        });
    });

    const entries = [...map.values()];

    if (!entries.length) {
        container.innerHTML = `
            <div class="bajee-resource-pyq-map-header">
                <div>
                    <h3 class="bajee-resource-pyq-map-title">
                        📝 Resource → PYQ Mapping
                    </h3>
                    <p class="bajee-resource-pyq-map-subtitle">
                        No connected PYQ records are available yet.
                    </p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="bajee-resource-pyq-map-header">
            <div>
                <h3 class="bajee-resource-pyq-map-title">
                    📝 Resource → PYQ Mapping
                </h3>
                <p class="bajee-resource-pyq-map-subtitle">
                    See which connected PYQ records can be practised from these study resources.
                </p>
            </div>

            <span class="bajee-resource-pyq-count-badge">
                ${entries.length}
                PYQ${entries.length === 1 ? "" : "s"}
            </span>
        </div>

        <div class="bajee-resource-pyq-grid">
            ${entries.map(item => `
                <article class="bajee-resource-pyq-card">

                    <div class="bajee-resource-pyq-card-title">
                        ${resourceEscapeHTML(item.pyq.title)}
                    </div>

                    <div class="bajee-resource-pyq-card-meta">
                        <span>📅 ${resourceEscapeHTML(item.pyq.year)}</span>
                        <span>📚 ${resourceEscapeHTML(item.pyq.unit)}</span>
                        <span>🔎 ${resourceEscapeHTML(item.pyq.topic)}</span>
                    </div>

                    <div class="bajee-resource-pyq-question">
                        ${resourceEscapeHTML(item.pyq.question)}
                    </div>

                    <div class="small text-secondary mb-2">
                        Connected resources: ${item.resources.length}
                    </div>

                    <div class="bajee-resource-pyq-actions">

                        <button
                            type="button"
                            class="bajee-resource-pyq-action primary"
                            data-practice-pyq="${resourceEscapeHTML(item.pyq.id)}"
                        >
                            Practice PYQ →
                        </button>

                        <button
                            type="button"
                            class="bajee-resource-pyq-action"
                            data-view-pyq="${resourceEscapeHTML(item.pyq.id)}"
                        >
                            View PYQ
                        </button>

                    </div>

                </article>
            `).join("")}
        </div>
    `;

    console.log(
        "BAJEE JRF AI: Resource → PYQ mapping:",
        {
            entity: entityId,
            pyqs: entries.length
        }
    );
}


/* ============================================================
   RENDER RESOURCES
============================================================ */

function renderEntityResources(
    entityId
) {

    const grid =
        resourceById(
            RESOURCE_GRID_ID
        );

    if (!grid) {

        return;

    }

    const resources =
        getEntityResources(
            entityId
        );

    if (!resources.length) {

        grid.innerHTML = `

            <div class="bajee-resource-empty">

                <div style="font-size:2rem;">
                    📚
                </div>

                <strong>
                    No study resources mapped yet
                </strong>

                <div class="small mt-2">
                    Resources can be connected to this
                    entity through the Step 10.6 resource inventory.
                </div>

            </div>

        `;

        renderConceptMap(
            [],
            entityId
        );

        renderPYQMap(
            [],
            entityId
        );

        renderRevisionMap(
            []
        );

        renderAdaptiveMap(
            []
        );

        updateResourceStatus(
            `0 direct resources mapped to ${entityId}.`,
            "empty"
        );

        return;

    }

    grid.innerHTML =
        resources
            .map(
                buildResourceCard
            )
            .join("");

    attachResourceEvents();

    renderConceptMap(
        resources,
        entityId
    );

    renderPYQMap(
        resources,
        entityId
    );

    renderRevisionMap(
        resources
    );

    renderAdaptiveMap(
        resources
    );

    updateResourceStatus(
        `${resources.length} study resource${
            resources.length === 1
                ? ""
                : "s"
        } connected to this entity.`,
        "ready"
    );

    console.log(
        "BAJEE JRF AI: Resource → Concept mapping:",
        {
            entity:
                entityId,

            resources:
                resources.length,

            concepts:
                [
                    ...new Set(
                        resources.flatMap(
                            resource =>
                                resource.concept_ids
                        )
                    )
                ]
        }
    );

}


/* ============================================================
   PYQ ACTION DELEGATION
============================================================ */

document.addEventListener(
    "click",
    event => {

        const practiceButton =
            event.target.closest(
                "[data-practice-pyq]"
            );

        if (practiceButton) {
            event.preventDefault();

            practiceResourcePYQ(
                practiceButton.getAttribute(
                    "data-practice-pyq"
                )
            );

            return;
        }

        const viewButton =
            event.target.closest(
                "[data-view-pyq]"
            );

        if (viewButton) {
            event.preventDefault();

            window.location.href =
                "knowledge-pyq.html?id=" +
                encodeURIComponent(
                    bajeeCurrentEntity ||
                    "derrida"
                ) +
                "&pyq=" +
                encodeURIComponent(
                    viewButton.getAttribute(
                        "data-view-pyq"
                    )
                );
        }

    }
);


/* ============================================================
   MAIN INITIALISATION
============================================================ */

async function initializeKnowledgeResources() {

    try {

        injectResourceStyles();

        injectRevisionStyles();

        injectAdaptiveStyles();

        bajeeCurrentEntity =
            getCurrentResourceEntity();

        insertResourceSection();

        updateResourceStatus(
            "Loading study resources..."
        );

        await loadResourceInventory();

        renderEntityResources(
            bajeeCurrentEntity
        );

        console.log(
            "BAJEE JRF AI: Step 10.6.7 ready — resource adaptive study mapping active.",
            {
                entity:
                    bajeeCurrentEntity,

                resources:
                    bajeeResourceInventory.length
            }
        );

    }

    catch (error) {

        console.error(
            "BAJEE JRF AI: Step 10.6.7 failed.",
            error
        );

        updateResourceStatus(
            "Study-resource intelligence could not be loaded.",
            "empty"
        );

    }

}


/* ============================================================
   START
============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeKnowledgeResources
    );

} else {

    initializeKnowledgeResources();

}