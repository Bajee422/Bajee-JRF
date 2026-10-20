/*
============================================================
BAJEE JRF AI
PHASE 9.3 — NTA ANALYTICS BRIDGE FIX v2

Purpose:
- Connect Phase 9.1 NTA Intelligence History to the existing
  Step 9.3 analytics page.
- Preserve the existing analytics engine.
- Read:
    bajee_jrf_intelligence_history_v1
- Use the Phase 9.1 `rows` schema.
- Do not invent Knowledge Entities or Concepts.
- Zero cost — browser localStorage only.

Install:
frontend/js/jrf-analytics-9.3-bridge-fix.js

Load AFTER:
<script src="js/jrf-analytics-knowledge.js"></script>

Then:
<script src="js/jrf-analytics-9.3-bridge-fix.js"></script>
============================================================
*/

"use strict";

(function () {

    const INTELLIGENCE_HISTORY_KEY =
        "bajee_jrf_intelligence_history_v1";

    const LEGACY_HISTORY_KEY =
        "bajee_jrf_ai_test_history_v1";


    function readArray(key) {

        try {

            const raw =
                localStorage.getItem(key);

            if (!raw) {
                return [];
            }

            const parsed =
                JSON.parse(raw);

            if (Array.isArray(parsed)) {
                return parsed;
            }

            if (
                parsed &&
                Array.isArray(parsed.tests)
            ) {
                return parsed.tests;
            }

            if (
                parsed &&
                Array.isArray(parsed.history)
            ) {
                return parsed.history;
            }

            return [];

        } catch (error) {

            console.warn(
                "BAJEE JRF AI 9.3 bridge: failed to read",
                key,
                error
            );

            return [];

        }

    }


    function safeArray(value) {

        return Array.isArray(value)
            ? value
            : [];

    }


    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent =
                String(value);
        }

    }


    function setStatus(
        id,
        text,
        connected
    ) {

        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        element.textContent =
            text;

        element.className =
            connected
                ? "connected"
                : "no-data";

    }


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /*
     * Phase 9.1 rows use:
     *
     * status:
     * correct
     * wrong
     * unanswered
     */

    function rowStatus(row) {

        return String(
            row?.status || ""
        )
            .trim()
            .toLowerCase();

    }


    function isCorrect(row) {

        const status =
            rowStatus(row);

        return (
            status === "correct" ||
            row?.is_correct === true ||
            row?.correct === true
        );

    }


    function isWrong(row) {

        const status =
            rowStatus(row);

        if (status === "wrong") {
            return true;
        }

        if (isCorrect(row)) {
            return false;
        }

        return Boolean(
            row?.answered === true ||
            row?.selected ||
            row?.selected_answer ||
            row?.selectedAnswer ||
            row?.user_answer ||
            row?.userAnswer
        );

    }


    function isUnanswered(row) {

        const status =
            rowStatus(row);

        if (status === "unanswered") {
            return true;
        }

        if (isCorrect(row)) {
            return false;
        }

        if (isWrong(row)) {
            return false;
        }

        return true;

    }


    function getPaper(
        row,
        test
    ) {

        return String(
            row?.paper ||
            test?.paper ||
            test?.paperLabel ||
            "Unknown Paper"
        ).trim();

    }


    function getUnit(row) {

        return String(
            row?.unitName ||
            row?.unit ||
            row?.unit_id ||
            "Unclassified"
        ).trim();

    }


    function getRows(test) {

        /*
         * Phase 9.1:
         *
         * record.rows =
         * question-level result rows
         */

        if (
            Array.isArray(
                test?.rows
            )
        ) {

            return test.rows;

        }


        /*
         * Backward compatibility.
         */

        if (
            Array.isArray(
                test?.question_results
            )
        ) {

            return test.question_results;

        }


        return [];

    }


    function calculateNtaPerformance(
        history
    ) {

        const performance = {

            testCount: 0,

            questionCount: 0,

            correct: 0,

            wrong: 0,

            unanswered: 0,

            papers: {},

            units: {},

            mappedQuestions: 0,

            unmappedQuestions: 0

        };


        history.forEach(
            function (test) {

                const rows =
                    getRows(test);


                if (
                    rows.length === 0
                ) {

                    return;

                }


                performance.testCount++;


                rows.forEach(
                    function (row) {

                        performance.questionCount++;


                        if (
                            isCorrect(row)
                        ) {

                            performance.correct++;

                        } else if (
                            isWrong(row)
                        ) {

                            performance.wrong++;

                        } else {

                            performance.unanswered++;

                        }


                        const paper =
                            getPaper(
                                row,
                                test
                            );


                        if (
                            !performance.papers[
                                paper
                            ]
                        ) {

                            performance.papers[
                                paper
                            ] = {

                                questions: 0,

                                correct: 0,

                                wrong: 0,

                                unanswered: 0

                            };

                        }


                        const paperRecord =
                            performance.papers[
                                paper
                            ];


                        paperRecord.questions++;


                        if (
                            isCorrect(row)
                        ) {

                            paperRecord.correct++;

                        } else if (
                            isWrong(row)
                        ) {

                            paperRecord.wrong++;

                        } else {

                            paperRecord.unanswered++;

                        }


                        const unit =
                            getUnit(row);


                        const unitKey =
                            paper +
                            "||" +
                            unit;


                        if (
                            !performance.units[
                                unitKey
                            ]
                        ) {

                            performance.units[
                                unitKey
                            ] = {

                                paper,

                                unit,

                                questions: 0,

                                correct: 0,

                                wrong: 0,

                                unanswered: 0

                            };

                        }


                        const unitRecord =
                            performance.units[
                                unitKey
                            ];


                        unitRecord.questions++;


                        if (
                            isCorrect(row)
                        ) {

                            unitRecord.correct++;

                        } else if (
                            isWrong(row)
                        ) {

                            unitRecord.wrong++;

                        } else {

                            unitRecord.unanswered++;

                        }


                        const entityIds =
                            safeArray(
                                row.knowledgeEntityIds ||
                                row.knowledge_entity_ids
                            );


                        const conceptIds =
                            safeArray(
                                row.conceptIds ||
                                row.concept_ids
                            );


                        if (
                            entityIds.length > 0 ||
                            conceptIds.length > 0
                        ) {

                            performance.mappedQuestions++;

                        } else {

                            performance.unmappedQuestions++;

                        }

                    }
                );

            }
        );


        performance.accuracy =
            performance.questionCount > 0
                ? Math.round(
                    (
                        performance.correct /
                        performance.questionCount
                    ) * 100
                )
                : 0;


        return performance;

    }


    function renderUnitPerformance(
        performance
    ) {

        const container =
            document.getElementById(
                "unitPerformance"
            );


        if (!container) {
            return;
        }


        const units =
            Object.values(
                performance.units
            );


        if (
            units.length === 0
        ) {

            container.innerHTML = `
                <div class="text-secondary small">
                    No completed NTA question-level performance has been recorded yet.
                </div>
            `;

            return;

        }


        units.sort(
            function (a, b) {

                if (
                    a.paper !== b.paper
                ) {

                    return a.paper.localeCompare(
                        b.paper
                    );

                }

                return a.unit.localeCompare(
                    b.unit
                );

            }
        );


        container.innerHTML =
            units.map(
                function (record) {

                    const attempted =
                        record.correct +
                        record.wrong;


                    const accuracy =
                        attempted > 0
                            ? Math.round(
                                (
                                    record.correct /
                                    attempted
                                ) * 100
                            )
                            : 0;


                    const state =
                        attempted === 0
                            ? "neutral"
                            : accuracy < 60
                                ? "weak"
                                : "good";


                    return `
                        <div class="performance-card ${state} mb-3">

                            <div class="d-flex justify-content-between align-items-start">

                                <div>

                                    <div class="fw-bold">
                                        ${escapeHTML(record.paper)}
                                    </div>

                                    <div class="text-secondary small">
                                        ${escapeHTML(record.unit)}
                                    </div>

                                </div>

                                <div class="performance-number">
                                    ${accuracy}%
                                </div>

                            </div>


                            <div class="small mt-2">

                                Questions:
                                <strong>${record.questions}</strong>

                                &nbsp; • &nbsp;

                                Correct:
                                <strong>${record.correct}</strong>

                                &nbsp; • &nbsp;

                                Wrong:
                                <strong>${record.wrong}</strong>

                                &nbsp; • &nbsp;

                                Unanswered:
                                <strong>${record.unanswered}</strong>

                            </div>

                        </div>
                    `;

                }
            ).join("");

    }


    function renderMappingStatus(
        performance
    ) {

        const container =
            document.getElementById(
                "unitPerformance"
            );


        if (!container) {
            return;
        }


        if (
            performance.unmappedQuestions > 0
        ) {

            container.insertAdjacentHTML(
                "afterbegin",
                `
                <div class="analytics-info mb-3">

                    <strong>
                        NTA mapping status:
                    </strong>

                    ${performance.unmappedQuestions}
                    recorded question(s) are currently awaiting
                    Knowledge Entity / Concept mapping.

                    Their Paper and Unit performance is still included
                    above. No entity or concept has been invented.

                </div>
                `
            );

        }

    }


    function renderInsight(
        performance
    ) {

        const element =
            document.getElementById(
                "currentJRFInsight"
            );


        if (!element) {
            return;
        }


        if (
            performance.questionCount === 0
        ) {

            return;

        }


        const unansweredRate =
            Math.round(
                (
                    performance.unanswered /
                    performance.questionCount
                ) * 100
            );


        let message = `
            The recorded NTA examination contains
            <strong>${performance.questionCount}</strong>
            question record(s), with
            <strong>${performance.correct}</strong>
            correct,
            <strong>${performance.wrong}</strong>
            wrong and
            <strong>${performance.unanswered}</strong>
            unanswered.

            Overall recorded question accuracy is
            <strong>${performance.accuracy}%</strong>.
        `;


        if (
            unansweredRate > 0
        ) {

            message += `
                The current unanswered rate is
                <strong>${unansweredRate}%</strong>.
            `;

        }


        if (
            performance.unmappedQuestions > 0
        ) {

            message += `
                Knowledge Entity and Concept analytics remain
                incomplete for
                <strong>${performance.unmappedQuestions}</strong>
                question(s) until those questions are mapped.
            `;

        }


        element.innerHTML =
            message;

    }


    function applyBridge() {

        /*
         * IMPORTANT:
         *
         * Phase 9.1 uses this key.
         */

        const intelligenceHistory =
            readArray(
                INTELLIGENCE_HISTORY_KEY
            );


        /*
         * Legacy history is only used when
         * Phase 9.1 has no records.
         *
         * This prevents double counting.
         */

        const history =
            intelligenceHistory.length > 0
                ? intelligenceHistory
                : readArray(
                    LEGACY_HISTORY_KEY
                );


        const performance =
            calculateNtaPerformance(
                history
            );


        /*
         * Dashboard totals.
         */

        setText(
            "totalAttempts",
            performance.questionCount
        );


        setText(
            "totalCorrect",
            performance.correct
        );


        setText(
            "totalWrong",
            performance.wrong
        );


        setText(
            "overallAccuracy",
            performance.accuracy + "%"
        );


        /*
         * Unified performance.
         */

        setText(
            "unifiedAccuracy",
            performance.accuracy + "%"
        );


        const accuracyBar =
            document.getElementById(
                "unifiedAccuracyBar"
            );


        if (accuracyBar) {

            accuracyBar.style.width =
                performance.accuracy + "%";

        }


        setText(
            "completedTests",
            performance.testCount
        );


        /*
         * Test Engine source card.
         */

        setText(
            "testAttempts",
            performance.testCount
        );


        setStatus(
            "testStatus",
            performance.testCount > 0
                ? "Connected"
                : "No tests",
            performance.testCount > 0
        );


        /*
         * Unit performance.
         */

        renderUnitPerformance(
            performance
        );


        renderMappingStatus(
            performance
        );


        renderInsight(
            performance
        );


        /*
         * Read-only diagnostic object.
         */

        window.BAJEE_JRF_NTA_ANALYTICS_93 =
            performance;


        console.log(
            "BAJEE JRF AI 9.3 bridge applied.",
            {
                historyKey:
                    intelligenceHistory.length > 0
                        ? INTELLIGENCE_HISTORY_KEY
                        : LEGACY_HISTORY_KEY,

                tests:
                    performance.testCount,

                questions:
                    performance.questionCount,

                correct:
                    performance.correct,

                wrong:
                    performance.wrong,

                unanswered:
                    performance.unanswered,

                accuracy:
                    performance.accuracy,

                mappedQuestions:
                    performance.mappedQuestions,

                unmappedQuestions:
                    performance.unmappedQuestions

            }
        );

    }


    function runBridge() {

        /*
         * Give the existing Step 9.3 engine time
         * to finish loading and rendering.
         */

        setTimeout(
            applyBridge,
            300
        );

    }


    /*
     * Normal page load.
     */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            runBridge,
            {
                once: true
            }
        );

    } else {

        runBridge();

    }


    /*
     * Existing Refresh Analytics button.
     */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

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

                    setTimeout(
                        applyBridge,
                        350
                    );

                }
            );

        },
        {
            once: true
        }
    );


})();