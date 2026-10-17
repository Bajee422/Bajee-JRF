"use strict";

/*
=========================================================
 BAJEE JRF AI
 STEP 10.3
 INTERACTIVE KNOWLEDGE GRAPH
=========================================================

 Step 10.1  → Foundation
 Step 10.2  → Entity & Relationship Model
 Step 10.3  → Interactive Graph

 No external graph library is required.

=========================================================
*/


/* =========================================================
   GRAPH DATA
========================================================= */

const KNOWLEDGE_GRAPH = {

    entities: [

        {
            id: "derrida",
            name: "Jacques Derrida",
            type: "theorist",
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
            id: "saussure",
            name: "Ferdinand de Saussure",
            type: "theorist",
            description:
                "Linguist whose structuralist theory of language influenced later literary and cultural theory.",
            unit: "Unit IX",
            topics: [
                "Structuralism",
                "Sign",
                "Signifier",
                "Signified",
                "Binary Opposition"
            ]
        },

        {
            id: "barthes",
            name: "Roland Barthes",
            type: "theorist",
            description:
                "French literary theorist associated with structuralism and post-structuralism.",
            unit: "Unit IX",
            topics: [
                "Structuralism",
                "Post-Structuralism",
                "Death of the Author",
                "Semiotics"
            ]
        },

        {
            id: "foucault",
            name: "Michel Foucault",
            type: "theorist",
            description:
                "French thinker associated with discourse, power, knowledge and post-structuralist theory.",
            unit: "Unit IX",
            topics: [
                "Discourse",
                "Power",
                "Knowledge",
                "Post-Structuralism"
            ]
        },

        {
            id: "eliot",
            name: "T. S. Eliot",
            type: "author",
            description:
                "Modernist poet, critic and dramatist associated with major works of twentieth-century literature.",
            unit: "Unit VIII",
            topics: [
                "Modernism",
                "Poetry",
                "Literary Criticism",
                "Objective Correlative"
            ]
        },

        {
            id: "waste-land",
            name: "The Waste Land",
            type: "work",
            description:
                "Major modernist poem by T. S. Eliot.",
            unit: "Unit VIII",
            topics: [
                "Modernism",
                "Poetry",
                "Fragmentation",
                "Myth"
            ]
        },

        {
            id: "death-author",
            name: "The Death of the Author",
            type: "work",
            description:
                "Important essay associated with Roland Barthes and post-structuralist literary theory.",
            unit: "Unit IX",
            topics: [
                "Authorship",
                "Structuralism",
                "Post-Structuralism"
            ]
        },

        {
            id: "différance-essay",
            name: "La Différance",
            type: "work",
            description:
                "Derrida's essay introducing and developing the concept of différance.",
            unit: "Unit IX",
            topics: [
                "Deconstruction",
                "Différance",
                "Post-Structuralism"
            ]
        },

        {
            id: "structuralism",
            name: "Structuralism",
            type: "movement",
            description:
                "A theoretical approach emphasizing systems, structures and relations.",
            unit: "Unit IX",
            topics: [
                "Sign",
                "Structure",
                "Binary Opposition",
                "Semiotics"
            ]
        },

        {
            id: "post-structuralism",
            name: "Post-Structuralism",
            type: "movement",
            description:
                "A theoretical field that questions stable structures, fixed meanings and absolute systems of interpretation.",
            unit: "Unit IX",
            topics: [
                "Deconstruction",
                "Différance",
                "Discourse",
                "Instability of Meaning"
            ]
        },

        {
            id: "modernism",
            name: "Modernism",
            type: "movement",
            description:
                "A major literary and cultural movement associated with experimentation, fragmentation and new forms.",
            unit: "Unit VIII",
            topics: [
                "Fragmentation",
                "Experimentation",
                "Modernist Poetry"
            ]
        },

        {
            id: "deconstruction",
            name: "Deconstruction",
            type: "concept",
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
            description:
                "Derridean term referring to the simultaneous deferral and differentiation involved in the production of meaning.",
            unit: "Unit IX",
            topics: [
                "Derrida",
                "Deconstruction",
                "Meaning",
                "Difference"
            ]
        },

        {
            id: "binary-opposition",
            name: "Binary Opposition",
            type: "concept",
            description:
                "A structuralist concept involving paired oppositions through which meaning is organized.",
            unit: "Unit IX",
            topics: [
                "Structuralism",
                "Saussure",
                "Deconstruction"
            ]
        },

        {
            id: "signifier-signified",
            name: "Signifier and Signified",
            type: "concept",
            description:
                "A key Saussurean distinction in structuralist linguistics and semiotics.",
            unit: "Unit IX",
            topics: [
                "Saussure",
                "Structuralism",
                "Semiotics"
            ]
        },

        {
            id: "death-author-concept",
            name: "Death of the Author",
            type: "concept",
            description:
                "A critical concept associated with Roland Barthes that challenges the authority of authorial intention in interpretation.",
            unit: "Unit IX",
            topics: [
                "Barthes",
                "Authorship",
                "Post-Structuralism"
            ]
        },

        {
            id: "discourse",
            name: "Discourse",
            type: "concept",
            description:
                "A key concept in Foucault's account of knowledge, language, institutions and power.",
            unit: "Unit IX",
            topics: [
                "Foucault",
                "Power",
                "Knowledge"
            ]
        },

        {
            id: "objective-correlative",
            name: "Objective Correlative",
            type: "concept",
            description:
                "A critical term associated with T. S. Eliot concerning the expression of emotion through an appropriate set of objects, situations or events.",
            unit: "Unit VIII",
            topics: [
                "T. S. Eliot",
                "Literary Criticism",
                "Modernism"
            ]
        },

        {
            id: "pyq-derrida-differance",
            name: "PYQ — Derrida / Différance",
            type: "pyq",
            description:
                "PYQ-linked knowledge node for Derrida and the concept of différance.",
            unit: "Unit IX",
            topics: [
                "Derrida",
                "Différance",
                "Deconstruction"
            ]
        },

        {
            id: "pyq-structuralism",
            name: "PYQ — Structuralism",
            type: "pyq",
            description:
                "PYQ-linked knowledge node for structuralist theory.",
            unit: "Unit IX",
            topics: [
                "Structuralism",
                "Saussure",
                "Signifier",
                "Signified"
            ]
        },

        {
            id: "pyq-eliot",
            name: "PYQ — T. S. Eliot",
            type: "pyq",
            description:
                "PYQ-linked knowledge node for T. S. Eliot and modernist literary criticism.",
            unit: "Unit VIII",
            topics: [
                "Eliot",
                "Modernism",
                "Objective Correlative"
            ]
        }

    ],


    /* =====================================================
       RELATIONSHIPS
    ===================================================== */

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
            target: "différance-essay",
            type: "wrote"
        },

        {
            source: "derrida",
            target: "post-structuralism",
            type: "associated_with"
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
            source: "differance",
            target: "structuralism",
            type: "responds_to"
        },

        {
            source: "saussure",
            target: "structuralism",
            type: "associated_with"
        },

        {
            source: "saussure",
            target: "signifier-signified",
            type: "developed"
        },

        {
            source: "structuralism",
            target: "binary-opposition",
            type: "uses"
        },

        {
            source: "structuralism",
            target: "signifier-signified",
            type: "includes"
        },

        {
            source: "barthes",
            target: "structuralism",
            type: "associated_with"
        },

        {
            source: "barthes",
            target: "post-structuralism",
            type: "associated_with"
        },

        {
            source: "barthes",
            target: "death-author",
            type: "wrote"
        },

        {
            source: "barthes",
            target: "death-author-concept",
            type: "associated_with"
        },

        {
            source: "foucault",
            target: "post-structuralism",
            type: "associated_with"
        },

        {
            source: "foucault",
            target: "discourse",
            type: "developed"
        },

        {
            source: "eliot",
            target: "waste-land",
            type: "wrote"
        },

        {
            source: "eliot",
            target: "modernism",
            type: "associated_with"
        },

        {
            source: "eliot",
            target: "objective-correlative",
            type: "associated_with"
        },

        {
            source: "modernism",
            target: "waste-land",
            type: "includes"
        },

        {
            source: "objective-correlative",
            target: "eliot",
            type: "associated_with"
        },

        {
            source: "pyq-derrida-differance",
            target: "derrida",
            type: "tests"
        },

        {
            source: "pyq-derrida-differance",
            target: "differance",
            type: "tests"
        },

        {
            source: "pyq-structuralism",
            target: "structuralism",
            type: "tests"
        },

        {
            source: "pyq-structuralism",
            target: "saussure",
            type: "tests"
        },

        {
            source: "pyq-eliot",
            target: "eliot",
            type: "tests"
        },

        {
            source: "pyq-eliot",
            target: "objective-correlative",
            type: "tests"
        }

    ]

};


/* =========================================================
   TYPE LABELS
========================================================= */

const GRAPH_TYPE_LABELS = {

    author: "Author",

    theorist: "Theorist",

    work: "Work",

    movement: "Movement",

    concept: "Concept",

    critic: "Critic",

    pyq: "PYQ",

    topic: "Topic"

};


/* =========================================================
   GRAPH COLOURS
========================================================= */

const GRAPH_NODE_COLORS = {

    author: "#0d6efd",

    theorist: "#6f42c1",

    work: "#198754",

    movement: "#d9a400",

    concept: "#dc3545",

    critic: "#795548",

    pyq: "#0dcaf0",

    topic: "#6c757d"

};


/* =========================================================
   STORAGE
========================================================= */

function readJSONStorage(key) {

    try {

        const raw =
            localStorage.getItem(key);

        if (!raw) {

            return null;

        }

        return JSON.parse(raw);

    }

    catch (error) {

        console.warn(
            "Unable to read localStorage:",
            key,
            error
        );

        return null;

    }

}


/* =========================================================
   ENTITY LOOKUP
========================================================= */

function getEntityById(id) {

    return KNOWLEDGE_GRAPH.entities.find(
        entity =>
            String(entity.id) ===
            String(id)
    );

}


function getRelationshipsForEntity(id) {

    return KNOWLEDGE_GRAPH.relationships.filter(
        relationship =>
            relationship.source === id ||
            relationship.target === id
    );

}


/* =========================================================
   PERFORMANCE LOOKUP
========================================================= */

function getPerformanceForEntity(entity) {

    const performanceKeys = [

        "bajee_performance",

        "bajee_performance_data",

        "bajeePerformance",

        "performanceData",

        "jrfPerformance"

    ];


    let records = [];


    performanceKeys.forEach(
        key => {

            const data =
                readJSONStorage(key);


            if (Array.isArray(data)) {

                records =
                    records.concat(data);

            }

            else if (
                data &&
                Array.isArray(data.records)
            ) {

                records =
                    records.concat(
                        data.records
                    );

            }

        }
    );


    const aiBank =
        readJSONStorage(
            "bajee_ai_practice_bank"
        );


    if (Array.isArray(aiBank)) {

        aiBank.forEach(
            item => {

                const itemEntity =
                    String(
                        item.knowledgeEntity ||
                        item.entity ||
                        item.author ||
                        ""
                    )
                    .trim()
                    .toLowerCase();


                if (
                    itemEntity ===
                        entity.name
                            .trim()
                            .toLowerCase()
                    ||
                    itemEntity ===
                        entity.id
                            .trim()
                            .toLowerCase()
                ) {

                    records.push(item);

                }

            }
        );

    }


    let attempts = 0;

    let correct = 0;

    let wrong = 0;


    records.forEach(
        record => {

            const entityName =
                String(
                    record.knowledgeEntity ||
                    record.entity ||
                    record.author ||
                    record.entityName ||
                    ""
                )
                .trim()
                .toLowerCase();


            const entityId =
                String(
                    record.entityId ||
                    ""
                )
                .trim()
                .toLowerCase();


            const targetName =
                entity.name
                    .trim()
                    .toLowerCase();


            const targetId =
                entity.id
                    .trim()
                    .toLowerCase();


            if (
                entityName !== targetName &&
                entityId !== targetId
            ) {

                return;

            }


            const recordAttempts =
                Number(
                    record.attempts ||
                    record.totalAttempts ||
                    0
                );


            const recordCorrect =
                Number(
                    record.correct ||
                    record.correctCount ||
                    record.correctAnswers ||
                    record.correct_count ||
                    0
                );


            const recordWrong =
                Number(
                    record.wrong ||
                    record.wrongCount ||
                    record.wrongAnswers ||
                    record.wrong_count ||
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

            }

        }
    );


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
   SUMMARY
========================================================= */

function updateGraphSummary() {

    const entityCount =
        document.getElementById(
            "entityCount"
        );


    const relationshipCount =
        document.getElementById(
            "relationshipCount"
        );


    const conceptCount =
        document.getElementById(
            "conceptCount"
        );


    const pyqConnectionCount =
        document.getElementById(
            "pyqConnectionCount"
        );


    const entities =
        KNOWLEDGE_GRAPH.entities;


    const relationships =
        KNOWLEDGE_GRAPH.relationships;


    const concepts =
        entities.filter(
            entity =>
                entity.type === "concept"
        );


    const pyqConnections =
        relationships.filter(
            relationship =>
                relationship.type === "tests"
        );


    if (entityCount) {

        entityCount.textContent =
            entities.length;

    }


    if (relationshipCount) {

        relationshipCount.textContent =
            relationships.length;

    }


    if (conceptCount) {

        conceptCount.textContent =
            concepts.length;

    }


    if (pyqConnectionCount) {

        pyqConnectionCount.textContent =
            pyqConnections.length;

    }

}


/* =========================================================
   STATUS
========================================================= */

function updateGraphStatus() {

    const status =
        document.getElementById(
            "graphStatus"
        );


    const message =
        document.getElementById(
            "graphStatusMessage"
        );


    const dataStatus =
        document.getElementById(
            "graphDataStatus"
        );


    if (status) {

        status.textContent =
            "Ready";

        status.className =
            "badge bg-success";

    }


    if (message) {

        message.textContent =
            `Knowledge graph loaded with ${KNOWLEDGE_GRAPH.entities.length} entities and ${KNOWLEDGE_GRAPH.relationships.length} relationships.`;

    }


    if (dataStatus) {

        dataStatus.textContent =
            `Interactive knowledge model loaded: ${KNOWLEDGE_GRAPH.entities.length} entities, ${KNOWLEDGE_GRAPH.relationships.length} relationships and ${KNOWLEDGE_GRAPH.entities.filter(entity => entity.type === "concept").length} concepts.`;

    }

}


/* =========================================================
   ENTITY LABEL
========================================================= */

function getEntityTypeLabel(type) {

    return (
        GRAPH_TYPE_LABELS[type] ||
        type ||
        "Entity"
    );

}


/* =========================================================
   ENTITY ICON
========================================================= */

function getEntityIcon(type) {

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


    return (
        icons[type] ||
        "🧠"
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   SELECTED ENTITY
========================================================= */

function renderSelectedEntity(entity) {

    const container =
        document.getElementById(
            "selectedEntity"
        );


    if (!container) {

        return;

    }


    if (!entity) {

        container.dataset.entityId =
            "";

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    🧠
                </div>

                <h3>
                    No entity selected
                </h3>

                <p>
                    Select a knowledge entity from
                    the graph or search results to
                    view its details.
                </p>

            </div>

        `;

        return;

    }


    container.dataset.entityId =
        entity.id;


    const relationships =
        getRelationshipsForEntity(
            entity.id
        );


    const performance =
        getPerformanceForEntity(
            entity
        );


    const relatedEntities =
        relationships.map(
            relationship => {

                const relatedId =
                    relationship.source === entity.id
                        ? relationship.target
                        : relationship.source;


                const related =
                    getEntityById(
                        relatedId
                    );


                if (!related) {

                    return null;

                }


                return {

                    relationship,

                    entity: related

                };

            }
        )
        .filter(Boolean);


    const topics =
        Array.isArray(entity.topics)
            ? entity.topics
            : [];


    container.innerHTML = `

        <div class="row g-4">

            <div class="col-lg-8">

                <div class="d-flex align-items-start gap-3">

                    <div class="entity-icon">

                        ${getEntityIcon(
                            entity.type
                        )}

                    </div>


                    <div>

                        <div class="small text-secondary">

                            ${escapeHTML(
                                getEntityTypeLabel(
                                    entity.type
                                )
                            )}

                        </div>


                        <h3
                            style="
                                color:#08224d;
                                font-weight:800;
                                margin:3px 0 6px;
                            "
                        >

                            ${escapeHTML(
                                entity.name
                            )}

                        </h3>


                        <p class="mb-2">

                            ${escapeHTML(
                                entity.description ||
                                "Knowledge entity."
                            )}

                        </p>


                        <span class="badge bg-light text-dark">

                            ${escapeHTML(
                                entity.unit ||
                                "Unit not mapped"
                            )}

                        </span>

                    </div>

                </div>


                ${
                    topics.length
                        ? `

                            <div class="mt-3">

                                <strong
                                    style="color:#08224d;"
                                >
                                    Topics
                                </strong>

                                <div class="mt-2">

                                    ${topics
                                        .map(
                                            topic =>
                                                `<span class="badge bg-light text-dark me-1 mb-1">
                                                    ${escapeHTML(topic)}
                                                </span>`
                                        )
                                        .join("")
                                    }

                                </div>

                            </div>

                        `
                        : ""
                }

            </div>


            <div class="col-lg-4">

                <div
                    style="
                        background:#ffffff;
                        border:1px solid #dfe3ea;
                        border-radius:10px;
                        padding:14px;
                    "
                >

                    <strong
                        style="color:#08224d;"
                    >
                        Performance Signal
                    </strong>


                    <div
                        class="mt-2"
                        style="
                            font-size:24px;
                            font-weight:800;
                            color:#08224d;
                        "
                    >

                        ${performance.accuracy}%

                    </div>


                    <div class="small text-secondary">

                        ${performance.attempts}
                        recorded attempts

                    </div>


                    <div class="small text-success mt-1">

                        ${performance.correct}
                        correct

                    </div>


                    <div class="small text-danger">

                        ${performance.wrong}
                        wrong

                    </div>

                </div>

            </div>

        </div>


        <hr>


        <div>

            <strong
                style="color:#08224d;"
            >
                🔗 Connected Knowledge
            </strong>


            <div class="mt-3">

                ${
                    relatedEntities.length
                        ? relatedEntities
                            .map(
                                item => `

                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-secondary me-2 mb-2 related-entity-button"
                                        data-entity-id="${escapeHTML(
                                            item.entity.id
                                        )}"
                                    >

                                        ${escapeHTML(
                                            item.entity.name
                                        )}

                                        <span class="ms-1">

                                            ·
                                            ${escapeHTML(
                                                item.relationship.type
                                            )}

                                        </span>

                                    </button>

                                `
                            )
                            .join("")
                        : `

                            <div class="small text-secondary">

                                No connected entities recorded.

                            </div>

                        `
                }

            </div>

        </div>

    `;


    bindRelatedEntityButtons();

}


/* =========================================================
   SEARCH
========================================================= */

function searchKnowledge() {

    const input =
        document.getElementById(
            "knowledgeSearch"
        );


    const results =
        document.getElementById(
            "searchResults"
        );


    if (!input || !results) {

        return;

    }


    const query =
        input.value
            .trim()
            .toLowerCase();


    if (!query) {

        results.innerHTML = `

            <div class="text-secondary small">

                Enter an author, work, concept,
                movement, theorist or PYQ.

            </div>

        `;

        return;

    }


    const matches =
        KNOWLEDGE_GRAPH.entities.filter(
            entity => {

                const searchableText = [

                    entity.name,

                    entity.type,

                    entity.description,

                    entity.unit,

                    ...(entity.topics || [])

                ]
                .join(" ")
                .toLowerCase();


                return searchableText.includes(
                    query
                );

            }
        );


    if (!matches.length) {

        results.innerHTML = `

            <div class="alert alert-light border mb-0">

                No knowledge entities found for:

                <strong>
                    ${escapeHTML(query)}
                </strong>

            </div>

        `;

        return;

    }


    results.innerHTML =
        matches
            .map(
                entity => `

                    <button
                        type="button"
                        class="search-result-card w-100 text-start"
                        data-search-entity-id="${escapeHTML(
                            entity.id
                        )}"
                    >

                        <strong>

                            ${escapeHTML(
                                entity.name
                            )}

                        </strong>


                        <small>

                            ${escapeHTML(
                                getEntityTypeLabel(
                                    entity.type
                                )
                            )}

                            •

                            ${escapeHTML(
                                entity.unit ||
                                "Unit not mapped"
                            )}

                        </small>


                        <small>

                            ${escapeHTML(
                                entity.description
                            )}

                        </small>

                    </button>

                `
            )
            .join("");


    bindSearchResults();

}


/* =========================================================
   SEARCH EVENTS
========================================================= */

function bindSearchResults() {

    const buttons =
        document.querySelectorAll(
            "[data-search-entity-id]"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    const id =
                        this.dataset
                            .searchEntityId;


                    const entity =
                        getEntityById(
                            id
                        );


                    renderSelectedEntity(
                        entity
                    );


                    highlightGraphEntity(
                        id
                    );


                    const selected =
                        document.getElementById(
                            "selectedEntity"
                        );


                    if (selected) {

                        selected.scrollIntoView({

                            behavior: "smooth",

                            block: "start"

                        });

                    }

                }
            );

        }
    );

}


/* =========================================================
   RELATED ENTITY EVENTS
========================================================= */

function bindRelatedEntityButtons() {

    const buttons =
        document.querySelectorAll(
            ".related-entity-button"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                function () {

                    const id =
                        this.dataset
                            .entityId;


                    const entity =
                        getEntityById(
                            id
                        );


                    renderSelectedEntity(
                        entity
                    );


                    highlightGraphEntity(
                        id
                    );

                }
            );

        }
    );

}


/* =========================================================
   SVG ESCAPE
========================================================= */

function escapeSVG(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&apos;"
        );

}


/* =========================================================
   GRAPH NODE POSITIONS
========================================================= */

function buildGraphPositions() {

    const positions = {};


    /*
     * Deliberately use a stable layout.
     * This avoids requiring a graph library.
     */

    const centerX = 500;

    const centerY = 210;


    positions["deconstruction"] = {

        x: centerX,

        y: centerY

    };


    const connectedToDeconstruction = [

        "derrida",

        "differance",

        "binary-opposition",

        "post-structuralism"

    ];


    const radiusOne = 105;


    connectedToDeconstruction.forEach(
        (id, index) => {

            const angle =
                (
                    index /
                    connectedToDeconstruction.length
                ) *
                Math.PI *
                2;


            positions[id] = {

                x:
                    centerX +
                    Math.cos(angle) *
                    radiusOne,

                y:
                    centerY +
                    Math.sin(angle) *
                    radiusOne

            };

        }
    );


    const remaining =
        KNOWLEDGE_GRAPH.entities.filter(
            entity =>
                !positions[entity.id]
        );


    const outerRadius =
        175;


    remaining.forEach(
        (entity, index) => {

            const angle =
                (
                    index /
                    remaining.length
                ) *
                Math.PI *
                2;


            positions[entity.id] = {

                x:
                    centerX +
                    Math.cos(angle) *
                    outerRadius,

                y:
                    centerY +
                    Math.sin(angle) *
                    outerRadius

            };

        }
    );


    return positions;

}


/* =========================================================
   SHORT LABEL
========================================================= */

function getShortGraphLabel(name) {

    const replacements = {

        "Jacques Derrida":
            "Derrida",

        "Ferdinand de Saussure":
            "Saussure",

        "Roland Barthes":
            "Barthes",

        "Michel Foucault":
            "Foucault",

        "The Waste Land":
            "The Waste Land",

        "The Death of the Author":
            "Death of Author",

        "Signifier and Signified":
            "Signifier / Signified",

        "Objective Correlative":
            "Objective Correlative",

        "PYQ — Derrida / Différance":
            "PYQ: Derrida",

        "PYQ — Structuralism":
            "PYQ: Structuralism",

        "PYQ — T. S. Eliot":
            "PYQ: Eliot"

    };


    return (
        replacements[name] ||
        name
    );

}


/* =========================================================
   RENDER INTERACTIVE GRAPH
========================================================= */

function renderInteractiveGraph() {

    const container =
        document.querySelector(
            ".graph-placeholder"
        );


    if (!container) {

        return;

    }


    const positions =
        buildGraphPositions();


    const width = 1000;

    const height = 420;


    let svg = `

        <svg
            id="knowledgeGraphSvg"
            viewBox="0 0 ${width} ${height}"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="BAJEE JRF AI interactive knowledge graph"
            style="min-height:360px;"
        >

            <defs>

                <filter
                    id="graphShadow"
                    x="-30%"
                    y="-30%"
                    width="160%"
                    height="160%"
                >

                    <feDropShadow
                        dx="0"
                        dy="2"
                        stdDeviation="2"
                        flood-opacity=".18"
                    />

                </filter>

            </defs>


            <rect
                x="0"
                y="0"
                width="${width}"
                height="${height}"
                fill="#f8f9fb"
                rx="12"
            />

    `;


    /*
     * Relationship lines
     */

    KNOWLEDGE_GRAPH.relationships.forEach(
        relationship => {

            const source =
                positions[
                    relationship.source
                ];


            const target =
                positions[
                    relationship.target
                ];


            if (!source || !target) {

                return;

            }


            svg += `

                <line
                    class="graph-link"
                    data-source="${escapeSVG(
                        relationship.source
                    )}"
                    data-target="${escapeSVG(
                        relationship.target
                    )}"
                    x1="${source.x}"
                    y1="${source.y}"
                    x2="${target.x}"
                    y2="${target.y}"
                    stroke="#b8c0cc"
                    stroke-width="1.3"
                    opacity=".65"
                />

            `;

        }
    );


    /*
     * Relationship labels.
     */

    KNOWLEDGE_GRAPH.relationships.forEach(
        relationship => {

            const source =
                positions[
                    relationship.source
                ];


            const target =
                positions[
                    relationship.target
                ];


            if (!source || !target) {

                return;

            }


            /*
             * Labels are only displayed for
             * the most important central links.
             */

            if (
                relationship.source !==
                    "deconstruction"
                &&
                relationship.target !==
                    "deconstruction"
                &&
                relationship.source !==
                    "derrida"
            ) {

                return;

            }


            const x =
                (
                    source.x +
                    target.x
                ) / 2;


            const y =
                (
                    source.y +
                    target.y
                ) / 2;


            svg += `

                <text
                    x="${x}"
                    y="${y - 5}"
                    text-anchor="middle"
                    font-size="8"
                    fill="#6c757d"
                    pointer-events="none"
                >

                    ${escapeSVG(
                        relationship.type
                    )}

                </text>

            `;

        }
    );


    /*
     * Entity nodes.
     */

    KNOWLEDGE_GRAPH.entities.forEach(
        entity => {

            const position =
                positions[
                    entity.id
                ];


            if (!position) {

                return;

            }


            const color =
                GRAPH_NODE_COLORS[
                    entity.type
                ] ||
                "#08224d";


            const isCentral =
                entity.id ===
                "deconstruction";


            const radius =
                isCentral
                    ? 28
                    : 20;


            const label =
                getShortGraphLabel(
                    entity.name
                );


            svg += `

                <g
                    class="graph-node"
                    data-graph-entity-id="${escapeSVG(
                        entity.id
                    )}"
                    transform="
                        translate(
                            ${position.x}
                            ${position.y}
                        )
                    "
                    style="cursor:pointer;"
                >

                    <circle
                        r="${radius + 5}"
                        fill="#ffffff"
                        opacity=".95"
                    />


                    <circle
                        class="graph-node-circle"
                        r="${radius}"
                        fill="${color}"
                        stroke="#ffffff"
                        stroke-width="3"
                        filter="url(#graphShadow)"
                    />


                    <text
                        y="3"
                        text-anchor="middle"
                        fill="#ffffff"
                        font-size="${isCentral ? 13 : 10}"
                        font-weight="800"
                        pointer-events="none"
                    >

                        ${
                            isCentral
                                ? "DG"
                                : escapeSVG(
                                    entity.name
                                        .charAt(0)
                                        .toUpperCase()
                                )
                        }

                    </text>


                    <text
                        y="${radius + 15}"
                        text-anchor="middle"
                        fill="#08224d"
                        font-size="${isCentral ? 11 : 9}"
                        font-weight="700"
                        pointer-events="none"
                    >

                        ${escapeSVG(
                            label
                        )}

                    </text>

                </g>

            `;

        }
    );


    /*
     * Legend.
     */

    const legendTypes = [

        "theorist",

        "author",

        "movement",

        "concept",

        "work",

        "pyq"

    ];


    let legendX = 25;


    legendTypes.forEach(
        type => {

            const color =
                GRAPH_NODE_COLORS[type];


            svg += `

                <circle
                    cx="${legendX}"
                    cy="392"
                    r="5"
                    fill="${color}"
                />


                <text
                    x="${legendX + 9}"
                    y="396"
                    font-size="9"
                    fill="#495057"
                >

                    ${escapeSVG(
                        getEntityTypeLabel(
                            type
                        )
                    )}

                </text>

            `;


            legendX +=
                type === "theorist"
                    ? 85
                    : 72;

        }
    );


    svg += `

        </svg>

    `;


    container.innerHTML =
        svg;


    bindGraphNodes();

}


/* =========================================================
   GRAPH NODE EVENTS
========================================================= */

function bindGraphNodes() {

    const nodes =
        document.querySelectorAll(
            ".graph-node"
        );


    nodes.forEach(
        node => {

            node.addEventListener(
                "click",
                function () {

                    const id =
                        this.dataset
                            .graphEntityId;


                    const entity =
                        getEntityById(
                            id
                        );


                    renderSelectedEntity(
                        entity
                    );


                    highlightGraphEntity(
                        id
                    );


                    const selected =
                        document.getElementById(
                            "selectedEntity"
                        );


                    if (selected) {

                        selected.scrollIntoView({

                            behavior: "smooth",

                            block: "center"

                        });

                    }

                }
            );


            node.addEventListener(
                "mouseenter",
                function () {

                    const id =
                        this.dataset
                            .graphEntityId;


                    highlightGraphEntity(
                        id,
                        false
                    );

                }
            );


            node.addEventListener(
                "mouseleave",
                function () {

                    clearGraphHighlight();

                }
            );

        }
    );

}


/* =========================================================
   HIGHLIGHT GRAPH ENTITY
========================================================= */

function highlightGraphEntity(
    entityId,
    persistent = true
) {

    const nodes =
        document.querySelectorAll(
            ".graph-node"
        );


    const links =
        document.querySelectorAll(
            ".graph-link"
        );


    const connected =
        new Set([
            entityId
        ]);


    KNOWLEDGE_GRAPH.relationships.forEach(
        relationship => {

            if (
                relationship.source ===
                entityId
            ) {

                connected.add(
                    relationship.target
                );

            }


            if (
                relationship.target ===
                entityId
            ) {

                connected.add(
                    relationship.source
                );

            }

        }
    );


    nodes.forEach(
        node => {

            const id =
                node.dataset
                    .graphEntityId;


            const circle =
                node.querySelector(
                    ".graph-node-circle"
                );


            if (!circle) {

                return;

            }


            if (
                connected.has(id)
            ) {

                node.style.opacity =
                    "1";

                circle.setAttribute(
                    "stroke",
                    id === entityId
                        ? "#d9b236"
                        : "#ffffff"
                );

                circle.setAttribute(
                    "stroke-width",
                    id === entityId
                        ? "5"
                        : "3"
                );

            }

            else {

                node.style.opacity =
                    "0.22";

            }

        }
    );


    links.forEach(
        link => {

            const source =
                link.dataset.source;


            const target =
                link.dataset.target;


            if (
                source === entityId ||
                target === entityId
            ) {

                link.setAttribute(
                    "stroke",
                    "#d9b236"
                );

                link.setAttribute(
                    "stroke-width",
                    "3"
                );

                link.setAttribute(
                    "opacity",
                    "1"
                );

            }

            else {

                link.setAttribute(
                    "stroke",
                    "#b8c0cc"
                );

                link.setAttribute(
                    "stroke-width",
                    "1.3"
                );

                link.setAttribute(
                    "opacity",
                    ".25"
                );

            }

        }
    );


    if (!persistent) {

        return;

    }

}


/* =========================================================
   CLEAR HIGHLIGHT
========================================================= */

function clearGraphHighlight() {

    const nodes =
        document.querySelectorAll(
            ".graph-node"
        );


    const links =
        document.querySelectorAll(
            ".graph-link"
        );


    nodes.forEach(
        node => {

            node.style.opacity =
                "1";


            const circle =
                node.querySelector(
                    ".graph-node-circle"
                );


            if (circle) {

                circle.setAttribute(
                    "stroke",
                    "#ffffff"
                );

                circle.setAttribute(
                    "stroke-width",
                    "3"
                );

            }

        }
    );


    links.forEach(
        link => {

            link.setAttribute(
                "stroke",
                "#b8c0cc"
            );

            link.setAttribute(
                "stroke-width",
                "1.3"
            );

            link.setAttribute(
                "opacity",
                ".65"
            );

        }
    );

}


/* =========================================================
   REFRESH
========================================================= */

function refreshKnowledgeGraph() {

    updateGraphSummary();

    updateGraphStatus();

    renderInteractiveGraph();


    const input =
        document.getElementById(
            "knowledgeSearch"
        );


    if (
        input &&
        input.value.trim()
    ) {

        searchKnowledge();

    }


    const selected =
        document.getElementById(
            "selectedEntity"
        );


    if (
        selected &&
        selected.dataset.entityId
    ) {

        const entity =
            getEntityById(
                selected.dataset.entityId
            );


        renderSelectedEntity(
            entity
        );


        highlightGraphEntity(
            entity.id
        );

    }

}


/* =========================================================
   INITIALISE
========================================================= */

function initialiseKnowledgeGraph() {

    updateGraphSummary();

    updateGraphStatus();

    renderInteractiveGraph();


    const searchButton =
        document.getElementById(
            "searchKnowledge"
        );


    const searchInput =
        document.getElementById(
            "knowledgeSearch"
        );


    const refreshButton =
        document.getElementById(
            "refreshGraph"
        );


    if (searchButton) {

        searchButton.addEventListener(
            "click",
            searchKnowledge
        );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    searchKnowledge();

                }

            }
        );

    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            refreshKnowledgeGraph
        );

    }


    renderSelectedEntity(
        null
    );

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initialiseKnowledgeGraph
);


/* =========================================================
   GLOBAL ACCESS
========================================================= */

window.BAJEE_KNOWLEDGE_GRAPH =
    KNOWLEDGE_GRAPH;


window.BAJEE_KNOWLEDGE_GRAPH_API = {

    getEntityById,

    getRelationshipsForEntity,

    searchKnowledge,

    refreshKnowledgeGraph,

    renderSelectedEntity,

    renderInteractiveGraph,

    highlightGraphEntity

};
