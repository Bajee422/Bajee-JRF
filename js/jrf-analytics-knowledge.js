/* ============================================================
   BAJEE JRF AI
   STEP 10.7 — KNOWLEDGE GRAPH ANALYTICS INTEGRATION

   Integrates:
   1. Official / PYQ test performance
   2. AI Practice attempts
   3. Connected PYQ practice attempts
   4. Revision Retest attempts
   5. Knowledge Entity analytics
   6. Concept analytics
   7. Study-resource signals

   IMPORTANT:
   - PYQs are never modified.
   - Test Engine is never modified.
   - Adaptive Engine is never modified.
   - AI Practice Bank remains separate.
   - All analytics remain browser-local.
   - ZERO COST.
============================================================ */

"use strict";


/* ============================================================
   STORAGE KEYS
============================================================ */

const JRF_ANALYTICS_TEST_HISTORY_KEY =
    "bajee_jrf_ai_test_history_v1";

const JRF_ANALYTICS_VERTICAL_PERFORMANCE_KEY =
    "bajee_jrf_ai_vertical_slice_performance_v2";

const JRF_ANALYTICS_AI_BANK_KEY =
    "bajee_ai_practice_bank";

const JRF_ANALYTICS_AI_ATTEMPTS_KEY =
    "bajee_ai_practice_attempts";

const JRF_ANALYTICS_PYQ_SELECTION_KEY =
    "bajee_selected_pyq";

const JRF_ANALYTICS_REVISION_RETEST_KEY =
    "bajee_revision_retest_history";

const JRF_ANALYTICS_REVISION_ITEM_KEY =
    "bajee_revision_retest_item";

const JRF_ANALYTICS_RESOURCE_KEYS = [
    "bajee_jrf_resource_inventory",
    "bajee_jrf_resource_inventory_v1",
    "bajee_resource_inventory",
    "bajee_study_resources",
    "bajee_knowledge_resources"
];


/* ============================================================
   GLOBAL STATE
============================================================ */

let analyticsPYQs = [];

let analyticsMappings = [];

let analyticsKnowledge = [];

let analyticsTestHistory = [];

let analyticsAIPractice = [];

let analyticsAIPracticeAttempts = [];

let analyticsRevisionRetests = [];

let analyticsResources = [];


/* ============================================================
   BASIC UTILITIES
============================================================ */

function analyticsSafeArray(value) {

    return Array.isArray(value)
        ? value
        : [];

}


function analyticsSafeNumber(value) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : 0;

}


function analyticsEscapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function analyticsAccuracy(
    correct,
    attempted
) {

    if (
        attempted <= 0
    ) {

        return 0;

    }

    return Math.round(
        (
            correct /
            attempted
        ) * 100
    );

}


function analyticsNormaliseText(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();

}


function analyticsTextMatches(
    value,
    search
) {

    if (!search) {

        return false;

    }

    return analyticsNormaliseText(
        value
    ).includes(
        analyticsNormaliseText(search)
    );

}


/* ============================================================
   GENERIC LOCAL STORAGE JSON
============================================================ */

function readAnalyticsStorage(
    key
) {

    try {

        const raw =
            localStorage.getItem(
                key
            );


        if (!raw) {

            return null;

        }


        return JSON.parse(raw);

    }

    catch (error) {

        console.warn(
            "BAJEE JRF AI: Unable to read localStorage key:",
            key,
            error
        );

        return null;

    }

}


/* ============================================================
   EXTRACT ARRAY FROM FLEXIBLE STORAGE
============================================================ */

function extractAnalyticsArray(
    data,
    candidateKeys = []
) {

    if (
        Array.isArray(data)
    ) {

        return data;

    }


    if (
        !data ||
        typeof data !== "object"
    ) {

        return [];

    }


    for (
        const key of candidateKeys
    ) {

        if (
            Array.isArray(
                data[key]
            )
        ) {

            return data[key];

        }

    }


    return [];

}


/* ============================================================
   LOAD JSON DATABASES
============================================================ */

async function loadAnalyticsDatabases() {

    try {

        const responses =
            await Promise.all([

                fetch(
                    "../data/pyqs/pyq-database.json"
                ),

                fetch(
                    "../data/pyqs/pyq-knowledge-map.json"
                ),

                fetch(
                    "../data/knowledge/knowledge-entities.json"
                )

            ]);


        if (
            !responses[0].ok ||
            !responses[1].ok ||
            !responses[2].ok
        ) {

            throw new Error(
                "One or more analytics databases could not be loaded."
            );

        }


        const pyqData =
            await responses[0].json();


        const mappingData =
            await responses[1].json();


        const knowledgeData =
            await responses[2].json();


        analyticsPYQs =
            Array.isArray(
                pyqData.questions
            )
                ? pyqData.questions
                : Array.isArray(pyqData)
                    ? pyqData
                    : [];


        analyticsMappings =
            Array.isArray(
                mappingData.mappings
            )
                ? mappingData.mappings
                : Array.isArray(mappingData)
                    ? mappingData
                    : [];


        analyticsKnowledge =
            Array.isArray(
                knowledgeData.entities
            )
                ? knowledgeData.entities
                : Array.isArray(knowledgeData)
                    ? knowledgeData
                    : [];


        console.log(
            "BAJEE JRF AI: Analytics databases loaded.",
            {
                pyqs:
                    analyticsPYQs.length,

                mappings:
                    analyticsMappings.length,

                knowledge:
                    analyticsKnowledge.length
            }
        );


        return true;

    }

    catch (error) {

        console.error(
            "BAJEE JRF AI: Analytics database loading error:",
            error
        );

        return false;

    }

}


/* ============================================================
   LOAD TEST HISTORY
============================================================ */

function loadAnalyticsTestHistory() {

    analyticsTestHistory = [];


    try {

        const raw =
            localStorage.getItem(
                JRF_ANALYTICS_TEST_HISTORY_KEY
            );


        if (!raw) {

            return;

        }


        const parsed =
            JSON.parse(raw);


        if (
            Array.isArray(parsed)
        ) {

            analyticsTestHistory =
                parsed;

        }

        else if (
            Array.isArray(
                parsed.tests
            )
        ) {

            analyticsTestHistory =
                parsed.tests;

        }

        else if (
            Array.isArray(
                parsed.history
            )
        ) {

            analyticsTestHistory =
                parsed.history;

        }


        console.log(
            "BAJEE JRF AI: Test history loaded:",
            analyticsTestHistory.length
        );

    }

    catch (error) {

        console.error(
            "BAJEE JRF AI: Test history read error:",
            error
        );

    }

}


/* ============================================================
   LOAD VERTICAL SLICE PERFORMANCE
============================================================ */

function loadVerticalPerformance() {

    try {

        const raw =
            localStorage.getItem(
                JRF_ANALYTICS_VERTICAL_PERFORMANCE_KEY
            );


        if (!raw) {

            return null;

        }


        return JSON.parse(raw);

    }

    catch (error) {

        console.warn(
            "BAJEE JRF AI: Vertical performance could not be read.",
            error
        );

        return null;

    }

}


/* ============================================================
   LOAD AI PRACTICE BANK
============================================================ */

function loadAIPracticeBank() {

    analyticsAIPractice = [];


    try {

        const raw =
            localStorage.getItem(
                JRF_ANALYTICS_AI_BANK_KEY
            );


        if (!raw) {

            return;

        }


        const parsed =
            JSON.parse(raw);


        analyticsAIPractice =
            extractAnalyticsArray(
                parsed,
                [
                    "questions",
                    "items",
                    "bank"
                ]
            );


        console.log(
            "BAJEE JRF AI: AI Practice Bank loaded:",
            analyticsAIPractice.length
        );

    }

    catch (error) {

        console.warn(
            "BAJEE JRF AI: AI Practice Bank read error.",
            error
        );

    }

}


/* ============================================================
   LOAD AI PRACTICE ATTEMPTS
============================================================ */

function loadAIPracticeAttempts() {

    analyticsAIPracticeAttempts = [];


    try {

        const raw =
            localStorage.getItem(
                JRF_ANALYTICS_AI_ATTEMPTS_KEY
            );


        if (!raw) {

            return;

        }


        const parsed =
            JSON.parse(raw);


        analyticsAIPracticeAttempts =
            extractAnalyticsArray(
                parsed,
                [
                    "attempts",
                    "history",
                    "records",
                    "results"
                ]
            );


        console.log(
            "BAJEE JRF AI: AI Practice attempts loaded:",
            analyticsAIPracticeAttempts.length
        );

    }

    catch (error) {

        console.warn(
            "BAJEE JRF AI: AI Practice attempts read error.",
            error
        );

    }

}


/* ============================================================
   LOAD REVISION RETEST HISTORY
============================================================ */

function loadRevisionRetests() {

    analyticsRevisionRetests = [];


    try {

        const raw =
            localStorage.getItem(
                JRF_ANALYTICS_REVISION_RETEST_KEY
            );


        if (!raw) {

            return;

        }


        const parsed =
            JSON.parse(raw);


        analyticsRevisionRetests =
            extractAnalyticsArray(
                parsed,
                [
                    "attempts",
                    "history",
                    "records",
                    "results",
                    "retests"
                ]
            );


        console.log(
            "BAJEE JRF AI: Revision retest history loaded:",
            analyticsRevisionRetests.length
        );

    }

    catch (error) {

        console.warn(
            "BAJEE JRF AI: Revision retest history read error.",
            error
        );

    }

}


/* ============================================================
   LOAD RESOURCE INVENTORY
============================================================ */

function loadAnalyticsResources() {

    analyticsResources = [];


    /*
     * First try known resource-inventory keys.
     */

    for (
        const key of JRF_ANALYTICS_RESOURCE_KEYS
    ) {

        const parsed =
            readAnalyticsStorage(
                key
            );


        if (!parsed) {

            continue;

        }


        const resources =
            extractAnalyticsArray(
                parsed,
                [
                    "resources",
                    "items",
                    "inventory",
                    "records"
                ]
            );


        if (
            resources.length
        ) {

            analyticsResources =
                resources;

            break;

        }

    }


    /*
     * Also inspect localStorage for a resource-like
     * inventory key. This keeps Step 10.7 tolerant
     * of the exact Step 10.6 storage name.
     */

    if (
        analyticsResources.length === 0
    ) {

        try {

            for (
                let index = 0;
                index < localStorage.length;
                index++
            ) {

                const key =
                    localStorage.key(
                        index
                    );


                if (!key) {

                    continue;

                }


                const lowerKey =
                    key.toLowerCase();


                if (
                    !lowerKey.includes(
                        "resource"
                    ) &&
                    !lowerKey.includes(
                        "inventory"
                    )
                ) {

                    continue;

                }


                const parsed =
                    readAnalyticsStorage(
                        key
                    );


                const resources =
                    extractAnalyticsArray(
                        parsed,
                        [
                            "resources",
                            "items",
                            "inventory",
                            "records"
                        ]
                    );


                if (
                    resources.length
                ) {

                    analyticsResources =
                        resources;

                    break;

                }

            }

        }

        catch (error) {

            console.warn(
                "BAJEE JRF AI: Resource inventory scan failed.",
                error
            );

        }

    }


    console.log(
        "BAJEE JRF AI: Study resources loaded:",
        analyticsResources.length
    );

}


/* ============================================================
   FIND PYQ MAPPING
============================================================ */

function findAnalyticsMapping(
    questionId
) {

    return analyticsMappings.find(
        mapping => {

            return String(
                mapping.pyq_id
            ) === String(
                questionId
            );

        }
    ) || null;

}


/* ============================================================
   FIND KNOWLEDGE ENTITY
============================================================ */

function findKnowledgeEntity(
    name
) {

    const target =
        analyticsNormaliseText(
            name
        );


    if (!target) {

        return null;

    }


    return analyticsKnowledge.find(
        entity => {

            return (
                analyticsNormaliseText(
                    entity.id
                ) === target ||

                analyticsNormaliseText(
                    entity.name
                ) === target ||

                analyticsNormaliseText(
                    entity.title
                ) === target
            );

        }
    ) || null;

}


/* ============================================================
   ENTITY RECORD
============================================================ */

function createEntityRecord(
    name
) {

    return {

        name,

        attempted: 0,

        correct: 0,

        wrong: 0,

        unanswered: 0,

        accuracy: 0,

        pyqAttempts: 0,

        aiAttempts: 0,

        revisionAttempts: 0,

        resourceCount: 0,

        units: new Set(),

        concepts: new Set(),

        questionIds: new Set(),

        sources: new Set()

    };

}


/* ============================================================
   CONCEPT RECORD
============================================================ */

function createConceptRecord(
    name
) {

    return {

        name,

        attempted: 0,

        correct: 0,

        wrong: 0,

        unanswered: 0,

        accuracy: 0,

        pyqAttempts: 0,

        aiAttempts: 0,

        revisionAttempts: 0,

        units: new Set(),

        entities: new Set(),

        questionIds: new Set(),

        sources: new Set()

    };

}


/* ============================================================
   ADD RESULT
============================================================ */

function addPerformanceResult(
    record,
    result,
    mapping,
    source = "PYQ"
) {

    if (!record) {

        return;

    }


    record.attempted++;


    if (
        result.is_correct === true ||
        result.correct === true
    ) {

        record.correct++;

    }

    else if (
        result.answered === true ||
        result.answer ||
        result.selected_answer ||
        result.selectedAnswer ||
        result.user_answer ||
        result.userAnswer
    ) {

        record.wrong++;

    }

    else {

        record.unanswered++;

    }


    if (
        source
    ) {

        record.sources.add(
            source
        );

    }


    if (
        source === "PYQ"
    ) {

        record.pyqAttempts++;

    }

    else if (
        source === "AI Practice"
    ) {

        record.aiAttempts++;

    }

    else if (
        source === "Revision Retest"
    ) {

        record.revisionAttempts++;

    }


    if (mapping) {

        analyticsSafeArray(
            mapping.units
        ).forEach(
            unit =>
                record.units.add(
                    String(unit)
                )
        );


        analyticsSafeArray(
            mapping.concepts
        ).forEach(
            concept =>
                record.concepts.add(
                    String(concept)
                )
        );

    }

}


/* ============================================================
   ADD FLEXIBLE ATTEMPT
============================================================ */

function classifyAttemptCorrectness(
    attempt
) {

    if (!attempt) {

        return "unanswered";

    }


    if (
        attempt.is_correct === true ||
        attempt.correct === true ||
        attempt.isCorrect === true
    ) {

        return "correct";

    }


    if (
        attempt.is_correct === false ||
        attempt.correct === false ||
        attempt.isCorrect === false
    ) {

        return "wrong";

    }


    const answered =
        attempt.answered === true ||
        attempt.answer ||
        attempt.selected_answer ||
        attempt.selectedAnswer ||
        attempt.user_answer ||
        attempt.userAnswer;


    return answered
        ? "wrong"
        : "unanswered";

}


function addAttemptResult(
    record,
    attempt,
    source
) {

    if (!record) {

        return;

    }


    /*
     * Defensive normalisation.
     *
     * Some browser-local performance records may have been created
     * by an older analytics version or may collide with JavaScript
     * object prototype names such as "constructor" / "toString".
     * Always restore the Set fields before using .add().
     */

    if (!(record.sources instanceof Set)) {

        record.sources = new Set();

    }

    if (!(record.units instanceof Set)) {

        record.units = new Set();

    }

    if (!(record.concepts instanceof Set)) {

        record.concepts = new Set();

    }

    if (!(record.questionIds instanceof Set)) {

        record.questionIds = new Set();

    }

    record.attempted =
        analyticsSafeNumber(
            record.attempted
        );

    record.correct =
        analyticsSafeNumber(
            record.correct
        );

    record.wrong =
        analyticsSafeNumber(
            record.wrong
        );

    record.unanswered =
        analyticsSafeNumber(
            record.unanswered
        );

    record.pyqAttempts =
        analyticsSafeNumber(
            record.pyqAttempts
        );

    record.aiAttempts =
        analyticsSafeNumber(
            record.aiAttempts
        );

    record.revisionAttempts =
        analyticsSafeNumber(
            record.revisionAttempts
        );

    attempt = attempt || {};


    const result =
        classifyAttemptCorrectness(
            attempt
        );


    record.attempted++;


    if (
        result === "correct"
    ) {

        record.correct++;

    }

    else if (
        result === "wrong"
    ) {

        record.wrong++;

    }

    else {

        record.unanswered++;

    }


    record.sources.add(
        source
    );


    if (
        source === "AI Practice"
    ) {

        record.aiAttempts++;

    }

    else if (
        source === "PYQ"
    ) {

        record.pyqAttempts++;

    }

    else if (
        source === "Revision Retest"
    ) {

        record.revisionAttempts++;

    }


    const unit =
        attempt.unit ||
        attempt.unit_name ||
        attempt.unitName;


    if (unit) {

        record.units.add(
            String(unit)
        );

    }


    const concept =
        attempt.concept ||
        attempt.topic ||
        attempt.concept_name ||
        attempt.conceptName;


    if (concept) {

        record.concepts.add(
            String(concept)
        );

    }


    const questionId =
        attempt.question_id ||
        attempt.questionId ||
        attempt.pyq_id ||
        attempt.pyqId ||
        attempt.id;


    if (questionId) {

        record.questionIds.add(
            String(questionId)
        );

    }

}


/* ============================================================
   EXTRACT ENTITY NAMES FROM ATTEMPT
============================================================ */

function extractAttemptEntities(
    attempt
) {

    const values = [];


    const candidates = [

        attempt?.knowledge_entity,

        attempt?.knowledgeEntity,

        attempt?.entity,

        attempt?.entity_name,

        attempt?.entityName,

        attempt?.knowledge,

        attempt?.knowledge_id,

        attempt?.knowledgeId

    ];


    candidates.forEach(
        value => {

            if (
                Array.isArray(value)
            ) {

                value.forEach(
                    item => {

                        if (
                            item !== null &&
                            item !== undefined &&
                            String(item).trim()
                        ) {

                            values.push(
                                String(item).trim()
                            );

                        }

                    }
                );

            }

            else if (
                value !== null &&
                value !== undefined &&
                String(value).trim()
            ) {

                values.push(
                    String(value).trim()
                );

            }

        }
    );


    return [
        ...new Set(
            values
        )
    ];

}


/* ============================================================
   EXTRACT CONCEPT NAMES FROM ATTEMPT
============================================================ */

function extractAttemptConcepts(
    attempt
) {

    const values = [];


    const candidates = [

        attempt?.concept,

        attempt?.concept_name,

        attempt?.conceptName,

        attempt?.topic,

        attempt?.topics

    ];


    candidates.forEach(
        value => {

            if (
                Array.isArray(value)
            ) {

                value.forEach(
                    item => {

                        if (
                            item !== null &&
                            item !== undefined &&
                            String(item).trim()
                        ) {

                            values.push(
                                String(item).trim()
                            );

                        }

                    }
                );

            }

            else if (
                value !== null &&
                value !== undefined &&
                String(value).trim()
            ) {

                values.push(
                    String(value).trim()
                );

            }

        }
    );


    return [
        ...new Set(
            values
        )
    ];

}


/* ============================================================
   STEP 10.7 — AI PRACTICE SOURCE SYNCHRONISATION
============================================================ */

/*
 * AI Practice can exist in two browser-local representations:
 *
 * 1. bajee_ai_practice_attempts
 *    Detailed answer-level attempt records.
 *
 * 2. bajee_ai_practice_bank
 *    Per-question cumulative counters.
 *
 * The detailed attempt record is authoritative for a question
 * whenever one or more detailed records can be matched to it.
 * The bank counters are used only when no detailed records exist
 * for that question.
 *
 * This prevents the same AI Practice work from being counted twice
 * while still preserving detailed attempts that have no bank record.
 */

function getAIPracticeQuestionKeys(
    item
) {

    if (!item) {

        return [];

    }


    const keys = [];


    const idCandidates = [

        item.id,

        item.question_id,

        item.questionId,

        item.pyq_id,

        item.pyqId

    ];


    idCandidates.forEach(
        value => {

            const normalised =
                analyticsNormaliseText(
                    value
                );

            if (
                normalised
            ) {

                keys.push(
                    `id:${normalised}`
                );

            }

        }
    );


    const textCandidates = [

        item.question,

        item.question_text,

        item.questionText,

        item.text

    ];


    textCandidates.forEach(
        value => {

            const normalised =
                analyticsNormaliseText(
                    value
                );

            if (
                normalised
            ) {

                keys.push(
                    `text:${normalised}`
                );

            }

        }
    );


    return [
        ...new Set(
            keys
        )
    ];

}


function getDetailedAIPracticeAttemptsForQuestion(
    question
) {

    const questionKeys =
        new Set(
            getAIPracticeQuestionKeys(
                question
            )
        );


    if (
        questionKeys.size === 0
    ) {

        return [];

    }


    return analyticsAIPracticeAttempts.filter(
        attempt => {

            const attemptKeys =
                getAIPracticeQuestionKeys(
                    attempt
                );


            return attemptKeys.some(
                key =>
                    questionKeys.has(
                        key
                    )
            );

        }
    );

}


function buildUnifiedAIPracticeTotals() {

    let attempts = 0;

    let correct = 0;

    let wrong = 0;

    let unanswered = 0;


    /*
     * Every detailed attempt is counted exactly once.
     * This also preserves detailed records that have no
     * corresponding bank question.
     */

    analyticsAIPracticeAttempts.forEach(
        attempt => {

            attempts++;


            const result =
                classifyAttemptCorrectness(
                    attempt
                );


            if (
                result === "correct"
            ) {

                correct++;

            }

            else if (
                result === "wrong"
            ) {

                wrong++;

            }

            else {

                unanswered++;

            }

        }
    );


    /*
     * Add bank aggregates only for questions that have
     * no matching detailed attempt.
     */

    analyticsAIPractice.forEach(
        question => {

            const bankAttempts =
                analyticsSafeNumber(
                    question.attempts
                );


            if (
                bankAttempts <= 0
            ) {

                return;

            }


            const detailedAttempts =
                getDetailedAIPracticeAttemptsForQuestion(
                    question
                );


            if (
                detailedAttempts.length > 0
            ) {

                return;

            }


            const bankCorrect =
                analyticsSafeNumber(
                    question.correct_count ??
                    question.correctCount
                );


            const bankWrong =
                analyticsSafeNumber(
                    question.wrong_count ??
                    question.wrongCount
                );


            attempts +=
                bankAttempts;

            correct +=
                bankCorrect;

            wrong +=
                bankWrong;

            unanswered +=
                Math.max(
                    0,
                    bankAttempts -
                    bankCorrect -
                    bankWrong
                );

        }
    );


    return {

        attempts,

        correct,

        wrong,

        unanswered,

        accuracy:
            analyticsAccuracy(
                correct,
                attempts
            )

    };

}


/* ============================================================
   BUILD ENTITY ANALYTICS
============================================================ */

function buildKnowledgeEntityAnalytics() {

    /* Null-prototype map prevents entity names such as
       "constructor" or "toString" from colliding with Object.prototype. */
    const records = Object.create(null);


    /*
     * --------------------------------------------------------
     * 1. OFFICIAL / PYQ TEST HISTORY
     * --------------------------------------------------------
     */

    analyticsTestHistory.forEach(
        test => {

            const results =
                analyticsSafeArray(
                    test.question_results
                );


            results.forEach(
                result => {

                    const mapping =
                        findAnalyticsMapping(
                            result.question_id
                        );


                    if (!mapping) {

                        return;

                    }


                    const entities =
                        analyticsSafeArray(
                            mapping.knowledge_entities
                        );


                    entities.forEach(
                        entityName => {

                            const name =
                                String(
                                    entityName
                                ).trim();


                            if (!name) {

                                return;

                            }


                            if (!records[name]) {

                                records[name] =
                                    createEntityRecord(
                                        name
                                    );

                            }


                            const record =
                                records[name];


                            record.questionIds.add(
                                String(
                                    result.question_id
                                )
                            );


                            addPerformanceResult(
                                record,
                                result,
                                mapping,
                                "PYQ"
                            );

                        }
                    );

                }
            );

        }
    );


    /*
     * --------------------------------------------------------
     * 2. VERTICAL SLICE PERFORMANCE
     * --------------------------------------------------------
     */

    const verticalData =
        loadVerticalPerformance();


    if (
        verticalData
    ) {

        const entities =
            extractVerticalEntities(
                verticalData
            );


        entities.forEach(
            entity => {

                const name =
                    String(
                        entity.name || ""
                    ).trim();


                if (!name) {

                    return;

                }


                if (!records[name]) {

                    records[name] =
                        createEntityRecord(
                            name
                        );

                }


                const record =
                    records[name];


                const attempted =
                    analyticsSafeNumber(
                        entity.attempted ??
                        entity.attempts ??
                        entity.totalAttempts
                    );


                const correct =
                    analyticsSafeNumber(
                        entity.correct ??
                        entity.correctAnswers
                    );


                const wrong =
                    analyticsSafeNumber(
                        entity.wrong ??
                        entity.wrongAnswers
                    );


                if (
                    record.attempted === 0 &&
                    attempted > 0
                ) {

                    record.attempted =
                        attempted;

                    record.correct =
                        correct;

                    record.wrong =
                        wrong;

                    record.unanswered =
                        Math.max(
                            0,
                            attempted -
                            correct -
                            wrong
                        );

                }


                analyticsSafeArray(
                    entity.concepts
                ).forEach(
                    concept =>
                        record.concepts.add(
                            String(concept)
                        )
                );


                if (
                    entity.unit
                ) {

                    record.units.add(
                        String(entity.unit)
                    );

                }

            }
        );

    }


    /*
     * --------------------------------------------------------
     * 3. AI PRACTICE ATTEMPTS
     * --------------------------------------------------------
     */

    analyticsAIPracticeAttempts.forEach(
        attempt => {

            const entities =
                extractAttemptEntities(
                    attempt
                );


            if (
                entities.length === 0
            ) {

                return;

            }


            entities.forEach(
                entityName => {

                    if (!records[entityName]) {

                        records[entityName] =
                            createEntityRecord(
                                entityName
                            );

                    }


                    const record =
                        records[entityName];


                    addAttemptResult(
                        record,
                        attempt,
                        "AI Practice"
                    );

                }
            );

        }
    );


    /*
     * --------------------------------------------------------
     * 4. AI PRACTICE BANK ATTEMPT DATA
     * --------------------------------------------------------
     *
     * This is only used when a question itself contains
     * aggregate attempt information.
     */

    analyticsAIPractice.forEach(
        question => {

            const attempts =
                analyticsSafeNumber(
                    question.attempts
                );


            if (
                attempts <= 0
            ) {

                return;

            }


            const entityName =
                String(
                    question.knowledge_entity ||
                    question.knowledgeEntity ||
                    question.entity ||
                    ""
                ).trim();


            if (
                !entityName
            ) {

                return;

            }


            if (!records[entityName]) {

                records[entityName] =
                    createEntityRecord(
                        entityName
                    );

            }


            const record =
                records[entityName];


            const correct =
                analyticsSafeNumber(
                    question.correct_count ??
                    question.correctCount
                );


            const wrong =
                analyticsSafeNumber(
                    question.wrong_count ??
                    question.wrongCount
                );


            /*
             * Do not double-count when detailed attempts
             * already exist for the same AI question.
             */

            const detailedAttempts =
                getDetailedAIPracticeAttemptsForQuestion(
                    question
                );


            const hasDetailedAttempt =
                detailedAttempts.length > 0;


            if (
                hasDetailedAttempt
            ) {

                return;

            }


            record.attempted +=
                attempts;

            record.correct +=
                correct;

            record.wrong +=
                wrong;

            record.unanswered +=
                Math.max(
                    0,
                    attempts -
                    correct -
                    wrong
                );

            record.aiAttempts +=
                attempts;

            record.sources.add(
                "AI Practice"
            );


            if (
                question.unit
            ) {

                record.units.add(
                    String(
                        question.unit
                    )
                );

            }


            if (
                question.concept
            ) {

                record.concepts.add(
                    String(
                        question.concept
                    )
                );

            }

        }
    );


    /*
     * --------------------------------------------------------
     * 5. REVISION RETEST ATTEMPTS
     * --------------------------------------------------------
     */

    analyticsRevisionRetests.forEach(
        attempt => {

            const entities =
                extractAttemptEntities(
                    attempt
                );


            let resolvedEntities =
                entities;


            /*
             * Revision records may keep the original
             * question inside questionData.
             */

            if (
                resolvedEntities.length === 0 &&
                attempt.questionData
            ) {

                resolvedEntities =
                    extractAttemptEntities(
                        attempt.questionData
                    );

            }


            if (
                resolvedEntities.length === 0
            ) {

                return;

            }


            resolvedEntities.forEach(
                entityName => {

                    if (!records[entityName]) {

                        records[entityName] =
                            createEntityRecord(
                                entityName
                            );

                    }


                    const record =
                        records[entityName];


                    addAttemptResult(
                        record,
                        attempt,
                        "Revision Retest"
                    );

                }
            );

        }
    );


    /*
     * --------------------------------------------------------
     * 6. RESOURCE SIGNAL
     * --------------------------------------------------------
     */

    Object.values(
        records
    ).forEach(
        record => {

            record.resourceCount =
                getResourceCountForEntity(
                    record.name,
                    record
                );

        }
    );


    /*
     * --------------------------------------------------------
     * 7. FINAL NORMALISATION
     * --------------------------------------------------------
     */

    return Object.values(
        records
    )
        .map(
            record => {

                record.accuracy =
                    analyticsAccuracy(
                        record.correct,
                        record.attempted
                    );


                return {

                    name:
                        record.name,

                    attempted:
                        record.attempted,

                    correct:
                        record.correct,

                    wrong:
                        record.wrong,

                    unanswered:
                        record.unanswered,

                    accuracy:
                        record.accuracy,

                    pyqAttempts:
                        record.pyqAttempts,

                    aiAttempts:
                        record.aiAttempts,

                    revisionAttempts:
                        record.revisionAttempts,

                    resourceCount:
                        record.resourceCount,

                    units:
                        [...record.units],

                    concepts:
                        [...record.concepts],

                    questionIds:
                        [...record.questionIds],

                    sources:
                        [...record.sources]

                };

            }
        )
        .sort(
            (
                a,
                b
            ) => {

                if (
                    a.accuracy !==
                    b.accuracy
                ) {

                    return (
                        a.accuracy -
                        b.accuracy
                    );

                }


                return (
                    b.attempted -
                    a.attempted
                );

            }
        );

}


/* ============================================================
   BUILD CONCEPT ANALYTICS
============================================================ */

function buildConceptAnalytics() {

    /* Null-prototype map prevents concept names from colliding
       with Object.prototype properties. */
    const records = Object.create(null);


    /*
     * --------------------------------------------------------
     * OFFICIAL / PYQ TEST HISTORY
     * --------------------------------------------------------
     */

    analyticsTestHistory.forEach(
        test => {

            const results =
                analyticsSafeArray(
                    test.question_results
                );


            results.forEach(
                result => {

                    const mapping =
                        findAnalyticsMapping(
                            result.question_id
                        );


                    if (!mapping) {

                        return;

                    }


                    const concepts =
                        analyticsSafeArray(
                            mapping.concepts
                        );


                    concepts.forEach(
                        conceptName => {

                            const name =
                                String(
                                    conceptName
                                ).trim();


                            if (!name) {

                                return;

                            }


                            if (!records[name]) {

                                records[name] =
                                    createConceptRecord(
                                        name
                                    );

                            }


                            const record =
                                records[name];


                            record.questionIds.add(
                                String(
                                    result.question_id
                                )
                            );


                            addPerformanceResult(
                                record,
                                result,
                                mapping,
                                "PYQ"
                            );


                            analyticsSafeArray(
                                mapping.knowledge_entities
                            ).forEach(
                                entity =>
                                    record.entities.add(
                                        String(entity)
                                    )
                            );

                        }
                    );

                }
            );

        }
    );


    /*
     * --------------------------------------------------------
     * AI PRACTICE ATTEMPTS
     * --------------------------------------------------------
     */

    analyticsAIPracticeAttempts.forEach(
        attempt => {

            const concepts =
                extractAttemptConcepts(
                    attempt
                );


            if (
                concepts.length === 0
            ) {

                return;

            }


            concepts.forEach(
                conceptName => {

                    if (!records[conceptName]) {

                        records[conceptName] =
                            createConceptRecord(
                                conceptName
                            );

                    }


                    const record =
                        records[conceptName];


                    addAttemptResult(
                        record,
                        attempt,
                        "AI Practice"
                    );


                    extractAttemptEntities(
                        attempt
                    ).forEach(
                        entity =>
                            record.entities.add(
                                entity
                            )
                    );

                }
            );

        }
    );


    /*
     * --------------------------------------------------------
     * AI PRACTICE BANK
     * --------------------------------------------------------
     */

    analyticsAIPractice.forEach(
        question => {

            const concept =
                String(
                    question.concept ||
                    ""
                ).trim();


            if (!concept) {

                return;

            }


            const attempts =
                analyticsSafeNumber(
                    question.attempts
                );


            const correct =
                analyticsSafeNumber(
                    question.correct_count ??
                    question.correctCount
                );


            const wrong =
                analyticsSafeNumber(
                    question.wrong_count ??
                    question.wrongCount
                );


            if (
                attempts <= 0
            ) {

                return;

            }


            if (!records[concept]) {

                records[concept] =
                    createConceptRecord(
                        concept
                    );

            }


            const record =
                records[concept];


            const detailedAttempts =
                getDetailedAIPracticeAttemptsForQuestion(
                    question
                );


            const hasDetailedAttempt =
                detailedAttempts.length > 0;


            if (
                !hasDetailedAttempt
            ) {

                record.attempted +=
                    attempts;

                record.correct +=
                    correct;

                record.wrong +=
                    wrong;

                record.unanswered +=
                    Math.max(
                        0,
                        attempts -
                        correct -
                        wrong
                    );

                record.aiAttempts +=
                    attempts;

                record.sources.add(
                    "AI Practice"
                );

            }


            if (
                question.unit
            ) {

                record.units.add(
                    String(
                        question.unit
                    )
                );

            }


            if (
                question.knowledge_entity
            ) {

                record.entities.add(
                    String(
                        question.knowledge_entity
                    )
                );

            }

        }
    );


    /*
     * --------------------------------------------------------
     * REVISION RETEST
     * --------------------------------------------------------
     */

    analyticsRevisionRetests.forEach(
        attempt => {

            let concepts =
                extractAttemptConcepts(
                    attempt
                );


            if (
                concepts.length === 0 &&
                attempt.questionData
            ) {

                concepts =
                    extractAttemptConcepts(
                        attempt.questionData
                    );

            }


            concepts.forEach(
                conceptName => {

                    if (!records[conceptName]) {

                        records[conceptName] =
                            createConceptRecord(
                                conceptName
                            );

                    }


                    const record =
                        records[conceptName];


                    addAttemptResult(
                        record,
                        attempt,
                        "Revision Retest"
                    );


                    const entities =
                        extractAttemptEntities(
                            attempt
                        );


                    entities.forEach(
                        entity =>
                            record.entities.add(
                                entity
                            )
                    );

                }
            );

        }
    );


    /*
     * --------------------------------------------------------
     * FINAL NORMALISATION
     * --------------------------------------------------------
     */

    return Object.values(
        records
    )
        .map(
            record => {

                record.accuracy =
                    analyticsAccuracy(
                        record.correct,
                        record.attempted
                    );


                return {

                    name:
                        record.name,

                    attempted:
                        record.attempted,

                    correct:
                        record.correct,

                    wrong:
                        record.wrong,

                    unanswered:
                        record.unanswered,

                    accuracy:
                        record.accuracy,

                    pyqAttempts:
                        record.pyqAttempts,

                    aiAttempts:
                        record.aiAttempts,

                    revisionAttempts:
                        record.revisionAttempts,

                    units:
                        [...record.units],

                    entities:
                        [...record.entities],

                    questionIds:
                        [...record.questionIds],

                    sources:
                        [...record.sources]

                };

            }
        )
        .sort(
            (
                a,
                b
            ) => {

                if (
                    a.accuracy !==
                    b.accuracy
                ) {

                    return (
                        a.accuracy -
                        b.accuracy
                    );

                }


                return (
                    b.attempted -
                    a.attempted
                );

            }
        );

}


/* ============================================================
   VERTICAL ENTITY EXTRACTION
============================================================ */

function extractVerticalEntities(
    data
) {

    if (!data) {

        return [];

    }


    if (
        Array.isArray(
            data.entities
        )
    ) {

        return data.entities;

    }


    if (
        data.entities &&
        typeof data.entities === "object"
    ) {

        return Object.entries(
            data.entities
        ).map(
            (
                [
                    name,
                    value
                ]
            ) => ({

                name,

                ...(value || {})

            })
        );

    }


    if (
        Array.isArray(
            data.knowledgeEntities
        )
    ) {

        return data.knowledgeEntities;

    }


    if (
        data.performance &&
        typeof data.performance === "object"
    ) {

        return Object.entries(
            data.performance
        ).map(
            (
                [
                    name,
                    value
                ]
            ) => ({

                name,

                ...(value || {})

            })
        );

    }


    return [];

}


/* ============================================================
   RESOURCE MATCHING
============================================================ */

function resourceMatchesEntity(
    resource,
    entityName,
    entityRecord
) {

    if (
        !resource ||
        !entityName
    ) {

        return false;

    }


    const fields = [

        resource.entity,

        resource.entityName,

        resource.knowledge_entity,

        resource.knowledgeEntity,

        resource.knowledge,

        resource.topic,

        resource.topics,

        resource.title,

        resource.name,

        resource.description,

        resource.subject,

        resource.unit,

        resource.concept,

        resource.concepts

    ];


    const target =
        analyticsNormaliseText(
            entityName
        );


    for (
        const field of fields
    ) {

        if (
            Array.isArray(field)
        ) {

            if (
                field.some(
                    item =>
                        analyticsNormaliseText(
                            item
                        ) === target ||
                        analyticsNormaliseText(
                            item
                        ).includes(target) ||
                        target.includes(
                            analyticsNormaliseText(
                                item
                            )
                        )
                )
            ) {

                return true;

            }

        }

        else if (
            analyticsNormaliseText(
                field
            ) === target ||
            analyticsNormaliseText(
                field
            ).includes(target) ||
            target.includes(
                analyticsNormaliseText(
                    field
                )
            )
        ) {

            return true;

        }

    }


    /*
     * Also match known concepts and units associated
     * with the entity.
     */

    const entity =
        findKnowledgeEntity(
            entityName
        );


    if (
        entity
    ) {

        const relatedValues = [

            entity.name,

            entity.id,

            entity.title,

            entity.description,

            entity.unit,

            entity.unit_name,

            entity.concept,

            entity.concepts,

            entity.topics

        ];


        for (
            const relatedValue of relatedValues
        ) {

            if (
                Array.isArray(
                    relatedValue
                )
            ) {

                for (
                    const value of relatedValue
                ) {

                    if (
                        analyticsResourceFieldMatches(
                            resource,
                            value
                        )
                    ) {

                        return true;

                    }

                }

            }

            else if (
                analyticsResourceFieldMatches(
                    resource,
                    relatedValue
                )
            ) {

                return true;

            }

        }

    }


    if (
        entityRecord
    ) {

        for (
            const concept of entityRecord.concepts
        ) {

            if (
                analyticsResourceFieldMatches(
                    resource,
                    concept
                )
            ) {

                return true;

            }

        }


        for (
            const unit of entityRecord.units
        ) {

            if (
                analyticsResourceFieldMatches(
                    resource,
                    unit
                )
            ) {

                return true;

            }

        }

    }


    return false;

}


function analyticsResourceFieldMatches(
    resource,
    value
) {

    const target =
        analyticsNormaliseText(
            value
        );


    if (!target) {

        return false;

    }


    const fields = [

        resource.entity,

        resource.entityName,

        resource.knowledge_entity,

        resource.knowledgeEntity,

        resource.topic,

        resource.topics,

        resource.title,

        resource.name,

        resource.description,

        resource.subject,

        resource.unit,

        resource.concept,

        resource.concepts

    ];


    return fields.some(
        field => {

            if (
                Array.isArray(field)
            ) {

                return field.some(
                    item =>
                        analyticsNormaliseText(
                            item
                        ).includes(
                            target
                        ) ||
                        target.includes(
                            analyticsNormaliseText(
                                item
                            )
                        )
                );

            }


            return (
                analyticsNormaliseText(
                    field
                ).includes(
                    target
                ) ||
                target.includes(
                    analyticsNormaliseText(
                        field
                    )
                )
            );

        }
    );

}


/* ============================================================
   RESOURCE COUNT
============================================================ */

function getResourceCountForEntity(
    entityName,
    entityRecord
) {

    if (
        analyticsResources.length === 0
    ) {

        return 0;

    }


    return analyticsResources.filter(
        resource =>
            resourceMatchesEntity(
                resource,
                entityName,
                entityRecord
            )
    ).length;

}


/* ============================================================
   STRENGTH
============================================================ */

function getAnalyticsStrength(
    accuracy,
    attempted
) {

    if (
        attempted === 0
    ) {

        return {

            label:
                "Not Attempted",

            className:
                "neutral"

        };

    }


    if (
        accuracy >= 80
    ) {

        return {

            label:
                "Strong",

            className:
                "good"

        };

    }


    if (
        accuracy >= 60
    ) {

        return {

            label:
                "Moderate",

            className:
                "neutral"

        };

    }


    return {

        label:
            "Needs Revision",

        className:
            "weak"

    };

}


/* ============================================================
   RENDER ENTITY ANALYTICS
============================================================ */

function renderKnowledgeEntityAnalytics(
    records
) {

    const container =
        document.getElementById(
            "knowledgeEntityAnalytics"
        );


    if (!container) {

        console.warn(
            "BAJEE JRF AI: #knowledgeEntityAnalytics not found."
        );

        return;

    }


    if (
        records.length === 0
    ) {

        container.innerHTML = `

            <div class="alert alert-light border">

                No knowledge-entity performance data
                has been recorded yet.

            </div>

        `;

        return;

    }


    container.innerHTML =
        records
            .map(
                record => {

                    const strength =
                        getAnalyticsStrength(
                            record.accuracy,
                            record.attempted
                        );


                    const units =
                        record.units
                            .map(
                                unit =>
                                    `<span class="tag unit">
                                        ${analyticsEscapeHTML(unit)}
                                     </span>`
                            )
                            .join("");


                    const concepts =
                        record.concepts
                            .slice(0, 6)
                            .map(
                                concept =>
                                    `<span class="tag concept">
                                        ${analyticsEscapeHTML(concept)}
                                     </span>`
                            )
                            .join("");


                    const sources =
                        record.sources
                            .map(
                                source =>
                                    `<span class="tag source-tag">
                                        ${analyticsEscapeHTML(source)}
                                     </span>`
                            )
                            .join("");


                    return `

                        <div class="col-md-6 col-xl-4">

                            <div
                                class="
                                    performance-card
                                    ${strength.className}
                                "
                            >

                                <div
                                    class="
                                        d-flex
                                        justify-content-between
                                        align-items-start
                                        gap-2
                                    "
                                >

                                    <div>

                                        <div
                                            class="fw-bold"
                                        >
                                            ${analyticsEscapeHTML(
                                                record.name
                                            )}
                                        </div>

                                        <div
                                            class="small text-secondary"
                                        >
                                            Knowledge Entity
                                        </div>

                                    </div>

                                    <span
                                        class="
                                            badge
                                            ${
                                                strength.className ===
                                                "good"
                                                    ? "bg-success"
                                                    : strength.className ===
                                                      "weak"
                                                        ? "bg-danger"
                                                        : "bg-warning text-dark"
                                            }
                                        "
                                    >
                                        ${strength.label}
                                    </span>

                                </div>


                                <div class="row text-center mt-4">

                                    <div class="col-4">

                                        <div
                                            class="performance-number"
                                        >
                                            ${record.accuracy}%
                                        </div>

                                        <div
                                            class="small text-secondary"
                                        >
                                            Accuracy
                                        </div>

                                    </div>


                                    <div class="col-4">

                                        <div
                                            class="fw-bold"
                                        >
                                            ${record.attempted}
                                        </div>

                                        <div
                                            class="small text-secondary"
                                        >
                                            Attempts
                                        </div>

                                    </div>


                                    <div class="col-4">

                                        <div
                                            class="
                                                fw-bold
                                                text-danger
                                            "
                                        >
                                            ${record.wrong}
                                        </div>

                                        <div
                                            class="small text-secondary"
                                        >
                                            Wrong
                                        </div>

                                    </div>

                                </div>


                                <div
                                    class="progress mt-3"
                                    role="progressbar"
                                    aria-valuenow="${record.accuracy}"
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                >

                                    <div
                                        class="
                                            progress-bar
                                            ${
                                                strength.className ===
                                                "good"
                                                    ? "bg-success"
                                                    : strength.className ===
                                                      "weak"
                                                        ? "bg-danger"
                                                        : "bg-warning"
                                            }
                                        "
                                        style="
                                            width:${record.accuracy}%
                                        "
                                    ></div>

                                </div>


                                <div class="row mt-3 g-2 text-center">

                                    <div class="col-4">

                                        <div class="small fw-bold">
                                            ${record.pyqAttempts}
                                        </div>

                                        <div class="small text-secondary">
                                            PYQ
                                        </div>

                                    </div>


                                    <div class="col-4">

                                        <div class="small fw-bold">
                                            ${record.aiAttempts}
                                        </div>

                                        <div class="small text-secondary">
                                            AI
                                        </div>

                                    </div>


                                    <div class="col-4">

                                        <div class="small fw-bold">
                                            ${record.revisionAttempts}
                                        </div>

                                        <div class="small text-secondary">
                                            Retest
                                        </div>

                                    </div>

                                </div>


                                ${
                                    record.resourceCount > 0
                                        ? `
                                            <div
                                                class="
                                                    small
                                                    mt-3
                                                    text-success
                                                    fw-semibold
                                                "
                                            >
                                                📚
                                                ${record.resourceCount}
                                                connected resource(s)
                                            </div>
                                          `
                                        : ""
                                }


                                ${
                                    units
                                        ? `
                                            <div class="mt-3">

                                                <div
                                                    class="
                                                        small
                                                        fw-semibold
                                                        mb-1
                                                    "
                                                >
                                                    Units
                                                </div>

                                                ${units}

                                            </div>
                                          `
                                        : ""
                                }


                                ${
                                    concepts
                                        ? `
                                            <div class="mt-2">

                                                <div
                                                    class="
                                                        small
                                                        fw-semibold
                                                        mb-1
                                                    "
                                                >
                                                    Concepts
                                                </div>

                                                ${concepts}

                                            </div>
                                          `
                                        : ""
                                }


                                ${
                                    sources
                                        ? `
                                            <div class="mt-2">

                                                <div
                                                    class="
                                                        small
                                                        fw-semibold
                                                        mb-1
                                                    "
                                                >
                                                    Signals
                                                </div>

                                                ${sources}

                                            </div>
                                          `
                                        : ""
                                }

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


/* ============================================================
   RENDER CONCEPT ANALYTICS
============================================================ */

function renderConceptAnalytics(
    records
) {

    const container =
        document.getElementById(
            "conceptAnalytics"
        );


    if (!container) {

        console.warn(
            "BAJEE JRF AI: #conceptAnalytics not found."
        );

        return;

    }


    if (
        records.length === 0
    ) {

        container.innerHTML = `

            <div class="alert alert-light border">

                No concept-level performance data
                has been recorded yet.

            </div>

        `;

        return;

    }


    container.innerHTML =
        records
            .map(
                record => {

                    const strength =
                        getAnalyticsStrength(
                            record.accuracy,
                            record.attempted
                        );


                    const entities =
                        record.entities
                            .slice(0, 5)
                            .map(
                                entity =>
                                    `<span class="tag entity-tag">
                                        ${analyticsEscapeHTML(entity)}
                                     </span>`
                            )
                            .join("");


                    const units =
                        record.units
                            .map(
                                unit =>
                                    `<span class="tag unit">
                                        ${analyticsEscapeHTML(unit)}
                                     </span>`
                            )
                            .join("");


                    const sources =
                        record.sources
                            .map(
                                source =>
                                    `<span class="tag source-tag">
                                        ${analyticsEscapeHTML(source)}
                                     </span>`
                            )
                            .join("");


                    return `

                        <div class="col-md-6 col-xl-4">

                            <div
                                class="
                                    performance-card
                                    ${strength.className}
                                "
                            >

                                <div
                                    class="
                                        d-flex
                                        justify-content-between
                                        align-items-start
                                        gap-2
                                    "
                                >

                                    <div>

                                        <div
                                            class="fw-bold"
                                        >
                                            ${analyticsEscapeHTML(
                                                record.name
                                            )}
                                        </div>

                                        <div
                                            class="small text-secondary"
                                        >
                                            Concept
                                        </div>

                                    </div>

                                    <span
                                        class="
                                            badge
                                            ${
                                                strength.className ===
                                                "good"
                                                    ? "bg-success"
                                                    : strength.className ===
                                                      "weak"
                                                        ? "bg-danger"
                                                        : "bg-warning text-dark"
                                            }
                                        "
                                    >
                                        ${strength.label}
                                    </span>

                                </div>


                                <div class="row text-center mt-4">

                                    <div class="col-4">

                                        <div
                                            class="performance-number"
                                        >
                                            ${record.accuracy}%
                                        </div>

                                        <div
                                            class="small text-secondary"
                                        >
                                            Accuracy
                                        </div>

                                    </div>


                                    <div class="col-4">

                                        <div
                                            class="fw-bold"
                                        >
                                            ${record.attempted}
                                        </div>

                                        <div
                                            class="small text-secondary"
                                        >
                                            Attempts
                                        </div>

                                    </div>


                                    <div class="col-4">

                                        <div
                                            class="
                                                fw-bold
                                                text-danger
                                            "
                                        >
                                            ${record.wrong}
                                        </div>

                                        <div
                                            class="small text-secondary"
                                        >
                                            Wrong
                                        </div>

                                    </div>

                                </div>


                                <div
                                    class="progress mt-3"
                                    role="progressbar"
                                    aria-valuenow="${record.accuracy}"
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                >

                                    <div
                                        class="
                                            progress-bar
                                            ${
                                                strength.className ===
                                                "good"
                                                    ? "bg-success"
                                                    : strength.className ===
                                                      "weak"
                                                        ? "bg-danger"
                                                        : "bg-warning"
                                            }
                                        "
                                        style="
                                            width:${record.accuracy}%
                                        "
                                    ></div>

                                </div>


                                <div class="row mt-3 g-2 text-center">

                                    <div class="col-4">

                                        <div class="small fw-bold">
                                            ${record.pyqAttempts}
                                        </div>

                                        <div class="small text-secondary">
                                            PYQ
                                        </div>

                                    </div>


                                    <div class="col-4">

                                        <div class="small fw-bold">
                                            ${record.aiAttempts}
                                        </div>

                                        <div class="small text-secondary">
                                            AI
                                        </div>

                                    </div>


                                    <div class="col-4">

                                        <div class="small fw-bold">
                                            ${record.revisionAttempts}
                                        </div>

                                        <div class="small text-secondary">
                                            Retest
                                        </div>

                                    </div>

                                </div>


                                ${
                                    entities
                                        ? `
                                            <div class="mt-3">

                                                <div
                                                    class="
                                                        small
                                                        fw-semibold
                                                        mb-1
                                                    "
                                                >
                                                    Knowledge Entities
                                                </div>

                                                ${entities}

                                            </div>
                                          `
                                        : ""
                                }


                                ${
                                    units
                                        ? `
                                            <div class="mt-2">

                                                <div
                                                    class="
                                                        small
                                                        fw-semibold
                                                        mb-1
                                                    "
                                                >
                                                    Units
                                                </div>

                                                ${units}

                                            </div>
                                          `
                                        : ""
                                }


                                ${
                                    sources
                                        ? `
                                            <div class="mt-2">

                                                <div
                                                    class="
                                                        small
                                                        fw-semibold
                                                        mb-1
                                                    "
                                                >
                                                    Signals
                                                </div>

                                                ${sources}

                                            </div>
                                          `
                                        : ""
                                }

                            </div>

                        </div>

                    `;

                }
            )
            .join("");

}


/* ============================================================
   UPDATE SUMMARY COUNTERS
============================================================ */

function updateKnowledgeAnalyticsSummary(
    entityRecords,
    conceptRecords
) {

    const entityCount =
        document.getElementById(
            "knowledgeEntityCount"
        );


    const conceptCount =
        document.getElementById(
            "conceptCount"
        );


    const weakEntityCount =
        document.getElementById(
            "weakEntityCount"
        );


    const weakConceptCount =
        document.getElementById(
            "weakConceptCount"
        );


    if (entityCount) {

        entityCount.textContent =
            entityRecords.length;

    }


    if (conceptCount) {

        conceptCount.textContent =
            conceptRecords.length;

    }


    if (weakEntityCount) {

        weakEntityCount.textContent =
            entityRecords.filter(
                record =>
                    record.attempted > 0 &&
                    record.accuracy < 60
            ).length;

    }


    if (weakConceptCount) {

        weakConceptCount.textContent =
            conceptRecords.filter(
                record =>
                    record.attempted > 0 &&
                    record.accuracy < 60
            ).length;

    }

}


/* ============================================================
   STEP 10.7 — ANALYTICS SOURCE SUMMARY
============================================================ */

function updateStep107SourceSummary(
    entityRecords,
    conceptRecords
) {

    const totalPYQ =
        analyticsTestHistory.reduce(
            (
                total,
                test
            ) =>
                total +
                analyticsSafeArray(
                    test.question_results
                ).length,
            0
        );


    const unifiedAITotals =
        buildUnifiedAIPracticeTotals();


    const totalAI =
        unifiedAITotals.attempts;


    const totalRevision =
        analyticsRevisionRetests.length;


    const resourceCount =
        analyticsResources.length;


    const selectors = {

        pyq:
            [
                "analyticsPYQAttempts",
                "pyqAnalyticsCount"
            ],

        ai:
            [
                "analyticsAIPracticeAttempts",
                "aiAnalyticsCount"
            ],

        revision:
            [
                "analyticsRevisionRetests",
                "revisionAnalyticsCount"
            ],

        resources:
            [
                "analyticsConnectedResources",
                "resourceAnalyticsCount"
            ]

    };


    function updateFirst(
        ids,
        value
    ) {

        for (
            const id of ids
        ) {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.textContent =
                    value;

                return;

            }

        }

    }


    updateFirst(
        selectors.pyq,
        totalPYQ
    );


    updateFirst(
        selectors.ai,
        totalAI
    );


    updateFirst(
        selectors.revision,
        totalRevision
    );


    updateFirst(
        selectors.resources,
        resourceCount
    );


    const status =
        document.getElementById(
            "knowledgeAnalyticsStatus"
        );


    if (status) {

        const totalSignals =
            totalPYQ +
            totalAI +
            totalRevision;


        if (
            totalSignals > 0
        ) {

            status.textContent =
                "Learning signals connected.";

            status.className =
                "badge bg-success";

        }

        else {

            status.textContent =
                "Waiting for learning attempts.";

            status.className =
                "badge bg-warning text-dark";

        }

    }


    /*
     * Optional detailed status element.
     */

    const sourceStatus =
        document.getElementById(
            "analyticsSourceStatus"
        );


    if (sourceStatus) {

        sourceStatus.innerHTML = `

            ✓ PYQ Attempts:
            <strong>${totalPYQ}</strong>

            &nbsp;•&nbsp;

            ✓ AI Practice:
            <strong>${totalAI}</strong>

            &nbsp;•&nbsp;

            ✓ Revision Retests:
            <strong>${totalRevision}</strong>

            &nbsp;•&nbsp;

            ✓ Connected Resources:
            <strong>${resourceCount}</strong>

            &nbsp;•&nbsp;

            ✓ Knowledge Entities:
            <strong>${entityRecords.length}</strong>

            &nbsp;•&nbsp;

            ✓ Concepts:
            <strong>${conceptRecords.length}</strong>

        `;

    }

}


/* ============================================================
   STEP 10.7 — ENTITY SIGNAL HELPERS
============================================================ */

function getEntityAnalyticsByName(
    records,
    entityName
) {

    const target =
        analyticsNormaliseText(
            entityName
        );


    return records.find(
        record =>
            analyticsNormaliseText(
                record.name
            ) === target
    ) || null;

}


/* ============================================================
   STEP 10.7 — SELECTED ENTITY CONNECTION
============================================================ */

function getRequestedAnalyticsEntity() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const requested =
        params.get(
            "id"
        ) ||
        params.get(
            "entity"
        ) ||
        params.get(
            "name"
        );


    if (
        requested
    ) {

        return decodeURIComponent(
            requested
        );

    }


    const stored =
        readAnalyticsStorage(
            "bajee_selected_knowledge_entity"
        );


    if (
        typeof stored === "string"
    ) {

        return stored;

    }


    if (
        stored &&
        typeof stored === "object"
    ) {

        return (
            stored.id ||
            stored.name ||
            stored.entity ||
            ""
        );

    }


    return "";

}


/* ============================================================
   STEP 10.7 — RENDER SELECTED ENTITY SIGNAL
============================================================ */

function renderSelectedEntityAnalytics(
    records
) {

    const requested =
        getRequestedAnalyticsEntity();


    if (
        !requested
    ) {

        return;

    }


    const record =
        getEntityAnalyticsByName(
            records,
            requested
        );


    if (!record) {

        return;

    }


    const elements = {

        name:
            document.getElementById(
                "analyticsEntityName"
            ),

        accuracy:
            document.getElementById(
                "analyticsEntityAccuracy"
            ),

        attempts:
            document.getElementById(
                "analyticsEntityAttempts"
            ),

        correct:
            document.getElementById(
                "analyticsEntityCorrect"
            ),

        wrong:
            document.getElementById(
                "analyticsEntityWrong"
            ),

        pyq:
            document.getElementById(
                "analyticsEntityPYQAttempts"
            ),

        ai:
            document.getElementById(
                "analyticsEntityAIAttempts"
            ),

        revision:
            document.getElementById(
                "analyticsEntityRevisionAttempts"
            ),

        resources:
            document.getElementById(
                "analyticsEntityResources"
            )

    };


    if (
        elements.name
    ) {

        elements.name.textContent =
            record.name;

    }


    if (
        elements.accuracy
    ) {

        elements.accuracy.textContent =
            `${record.accuracy}%`;

    }


    if (
        elements.attempts
    ) {

        elements.attempts.textContent =
            record.attempted;

    }


    if (
        elements.correct
    ) {

        elements.correct.textContent =
            record.correct;

    }


    if (
        elements.wrong
    ) {

        elements.wrong.textContent =
            record.wrong;

    }


    if (
        elements.pyq
    ) {

        elements.pyq.textContent =
            record.pyqAttempts;

    }


    if (
        elements.ai
    ) {

        elements.ai.textContent =
            record.aiAttempts;

    }


    if (
        elements.revision
    ) {

        elements.revision.textContent =
            record.revisionAttempts;

    }


    if (
        elements.resources
    ) {

        elements.resources.textContent =
            record.resourceCount;

    }


    const signal =
        document.getElementById(
            "analyticsEntitySignal"
        );


    if (
        signal
    ) {

        const strength =
            getAnalyticsStrength(
                record.accuracy,
                record.attempted
            );


        if (
            record.attempted === 0
        ) {

            signal.textContent =
                "No entity-level attempts recorded yet.";

        }

        else {

            signal.textContent =
                `${strength.label} — ${record.accuracy}% accuracy across ${record.attempted} attempt(s).`;

        }

    }

}


/* ============================================================
   STEP 10.7 — KNOWLEDGE LOOP STATUS
============================================================ */

function renderKnowledgeLoopStatus(
    entityRecords
) {

    const container =
        document.getElementById(
            "knowledgeLoopStatus"
        );


    if (!container) {

        return;

    }


    const requested =
        getRequestedAnalyticsEntity();


    const record =
        getEntityAnalyticsByName(
            entityRecords,
            requested
        );


    if (!record) {

        container.innerHTML = `

            <div class="alert alert-light border">

                Knowledge entity is connected.
                Practice the connected PYQs or AI questions
                to create entity-level performance evidence.

            </div>

        `;

        return;

    }


    container.innerHTML = `

        <div class="small">

            <strong>
                Knowledge Entity
            </strong>

            <div class="mt-2">

                📝 PYQs
                →
                🤖 Practice
                →
                📊 Performance
                →
                🔁 Revision Retest
                →
                📚 Study Resources
                →
                🧠 Knowledge Entity

            </div>


            <div class="mt-2">

                <strong>
                    ${analyticsEscapeHTML(record.name)}
                </strong>

                currently has

                <strong>
                    ${record.attempted}
                </strong>

                attempt(s),

                <strong>
                    ${record.accuracy}%
                </strong>

                accuracy,

                <strong>
                    ${record.resourceCount}
                </strong>

                connected resource(s).

            </div>

        </div>

    `;

}


/* ============================================================
   STEP 10.7 — GLOBAL ANALYTICS SNAPSHOT
============================================================ */

function buildAnalyticsSnapshot(
    entityRecords,
    conceptRecords
) {

    const totalAttempts =
        entityRecords.reduce(
            (
                total,
                record
            ) =>
                total +
                record.attempted,
            0
        );


    const totalCorrect =
        entityRecords.reduce(
            (
                total,
                record
            ) =>
                total +
                record.correct,
            0
        );


    const totalWrong =
        entityRecords.reduce(
            (
                total,
                record
            ) =>
                total +
                record.wrong,
            0
        );


    const totalResources =
        analyticsResources.length;


    return {

        timestamp:
            new Date().toISOString(),

        entities:
            entityRecords.length,

        concepts:
            conceptRecords.length,

        totalAttempts,

        totalCorrect,

        totalWrong,

        accuracy:
            analyticsAccuracy(
                totalCorrect,
                totalAttempts
            ),

        pyqAttempts:
            analyticsTestHistory.reduce(
                (
                    total,
                    test
                ) =>
                    total +
                    analyticsSafeArray(
                        test.question_results
                    ).length,
                0
            ),

        aiPracticeAttempts:
            buildUnifiedAIPracticeTotals().attempts,

        revisionRetests:
            analyticsRevisionRetests.length,

        connectedResources:
            totalResources

    };

}


/* ============================================================
   STEP 10.7 — OPTIONAL SNAPSHOT OUTPUT
============================================================ */

function exposeAnalyticsSnapshot(
    snapshot
) {

    /*
     * Do not create another persistent analytics database.
     *
     * Step 10.7 reads the existing browser data sources
     * and exposes the current snapshot for other pages.
     */

    window.BAJEE_JRF_ANALYTICS =
        snapshot;


    const element =
        document.getElementById(
            "analyticsSnapshot"
        );


    if (
        element
    ) {

        element.textContent =
            JSON.stringify(
                snapshot,
                null,
                2
            );

    }

}


/* ============================================================
   STEP 10.7 — TOP UNIFIED PERFORMANCE RENDERER

   The Entity / Concept / Step 10.7 source panels are driven by
   the analytics engine above. The top summary cards are part of
   the page shell, so they must be explicitly synchronized with
   the same snapshot.
============================================================ */

function updateTopUnifiedPerformance(
    snapshot
) {

    if (!snapshot) {

        return;

    }


    const totalAttempts =
        analyticsSafeNumber(
            snapshot.totalAttempts
        );


    const totalCorrect =
        analyticsSafeNumber(
            snapshot.totalCorrect
        );


    const totalWrong =
        analyticsSafeNumber(
            snapshot.totalWrong
        );


    const accuracy =
        analyticsSafeNumber(
            snapshot.accuracy
        );


    const savedAIQuestions =
        analyticsAIPractice.length;


    const completedTests =
        analyticsTestHistory.length;


    const setText =
        function (
            id,
            value
        ) {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.textContent =
                    String(value);

            }

        };


    setText(
        "totalAttempts",
        totalAttempts
    );


    setText(
        "totalCorrect",
        totalCorrect
    );


    setText(
        "totalWrong",
        totalWrong
    );


    setText(
        "overallAccuracy",
        `${accuracy}%`
    );


    setText(
        "unifiedAccuracy",
        `${accuracy}%`
    );


    const accuracyBar =
        document.getElementById(
            "unifiedAccuracyBar"
        );


    if (accuracyBar) {

        accuracyBar.style.width =
            `${Math.max(0, Math.min(100, accuracy))}%`;

        accuracyBar.setAttribute(
            "aria-valuenow",
            String(accuracy)
        );

    }


    setText(
        "savedAIQuestions",
        savedAIQuestions
    );


    setText(
        "completedTests",
        completedTests
    );


    const status =
        document.getElementById(
            "analyticsStatus"
        );


    if (status) {

        status.textContent =
            "Analytics engine connected — all recorded sources synchronized.";

        status.classList.remove(
            "alert-danger"
        );

    }


    const insight =
        document.getElementById(
            "currentJRFInsight"
        );


    if (insight) {

        if (totalAttempts > 0) {

            insight.textContent =
                `Current recorded performance: ${totalAttempts} attempt${totalAttempts === 1 ? "" : "s"}, ` +
                `${totalCorrect} correct, ${totalWrong} wrong and ${accuracy}% accuracy. ` +
                `AI Practice: ${analyticsSafeNumber(snapshot.aiPracticeAttempts)}; ` +
                `Revision Retests: ${analyticsSafeNumber(snapshot.revisionRetests)}.`;

        }

        else {

            insight.textContent =
                "No recorded performance attempts are currently available.";

        }

    }


    console.log(
        "BAJEE JRF AI: Top unified performance synchronized.",
        {
            totalAttempts,
            totalCorrect,
            totalWrong,
            accuracy,
            savedAIQuestions,
            completedTests
        }
    );

}


/* ============================================================
   MAIN STEP 10.7 FUNCTION
============================================================ */

async function loadStep107Analytics() {

    console.log(
        "=============================================="
    );

    console.log(
        "BAJEE JRF AI — STEP 10.7"
    );

    console.log(
        "KNOWLEDGE GRAPH ANALYTICS INTEGRATION"
    );

    console.log(
        "=============================================="
    );


    const databasesLoaded =
        await loadAnalyticsDatabases();


    if (!databasesLoaded) {

        return null;

    }


    /*
     * Load every existing browser-local signal.
     */

    loadAnalyticsTestHistory();

    loadVerticalPerformance();

    loadAIPracticeBank();

    loadAIPracticeAttempts();

    loadRevisionRetests();

    loadAnalyticsResources();


    /*
     * Build integrated analytics.
     */

    const entityRecords =
        buildKnowledgeEntityAnalytics();


    const conceptRecords =
        buildConceptAnalytics();


    /*
     * Existing Step 9.3 output.
     */

    updateKnowledgeAnalyticsSummary(
        entityRecords,
        conceptRecords
    );


    renderKnowledgeEntityAnalytics(
        entityRecords
    );


    renderConceptAnalytics(
        conceptRecords
    );


    /*
     * New Step 10.7 integration.
     */

    updateStep107SourceSummary(
        entityRecords,
        conceptRecords
    );


    renderSelectedEntityAnalytics(
        entityRecords
    );


    renderKnowledgeLoopStatus(
        entityRecords
    );


    const snapshot =
        buildAnalyticsSnapshot(
            entityRecords,
            conceptRecords
        );


    exposeAnalyticsSnapshot(
        snapshot
    );


    updateTopUnifiedPerformance(
        snapshot
    );


    console.log(
        "BAJEE JRF AI: Step 10.7 analytics ready.",
        {
            entities:
                entityRecords,

            concepts:
                conceptRecords,

            snapshot
        }
    );


    return {

        entities:
            entityRecords,

        concepts:
            conceptRecords,

        snapshot

    };

}


/* ============================================================
   BACKWARD COMPATIBILITY
============================================================ */

async function loadStep93Analytics() {

    return loadStep107Analytics();

}


/* ============================================================
   REFRESH
============================================================ */

function setupStep107Refresh() {

    const button =
        document.getElementById(
            "refreshKnowledgeAnalytics"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        function () {

            button.disabled =
                true;


            loadStep107Analytics()
                .finally(
                    function () {

                        button.disabled =
                            false;

                    }
                );

        }
    );

}


/* ============================================================
   START
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupStep107Refresh();

        loadStep107Analytics();

    }
);