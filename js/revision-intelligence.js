/* =========================================================
   BAJEE JRF AI
   STEP 9.4 — REVISION INTELLIGENCE
   STEP 9.5 — RETEST CONNECTION
========================================================= */

(() => {

  "use strict";


  /* =======================================================
     CONFIGURATION
  ======================================================= */

  const STORAGE_KEYS = {

    aiPracticeBank: [
      "bajee_ai_practice_bank",
      "aiPracticeBank",
      "bajeeAIPracticeBank"
    ],

    performance: [
  "bajee_performance",
  "bajee_performance_data",
  "bajeePerformance",
  "performanceData",
  "jrfPerformance",
  "bajee_revision_retest_history"
],

    attempts: [
      "bajee_attempts",
      "bajee_question_attempts",
      "questionAttempts",
      "attempts"
    ],

    ntaIntelligence: [
      "bajee_jrf_intelligence_history_v1"
    ]

  };


  const PYQ_DATABASE_URL =
    "../data/pyqs/pyq-database.json";


  const PRIORITY = {
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low"
  };


  const RETEST_STORAGE_KEY =
    "bajee_revision_retest_item";


  /* =======================================================
     STATE
  ======================================================= */

  let revisionQueue = [];

  let sourceQuestions = [];


  /* =======================================================
     DOM HELPERS
  ======================================================= */

  function $(id) {

    return document.getElementById(id);

  }


  function setText(id, value) {

    const element = $(id);

    if (element) {

      element.textContent = value;

    }

  }


  /* =======================================================
     SAFE LOCAL STORAGE
  ======================================================= */

  function readStorage(key) {

    try {

      const value =
        localStorage.getItem(key);

      if (!value) {

        return null;

      }

      return JSON.parse(value);

    } catch (error) {

      console.warn(
        "BAJEE JRF AI: Unable to read storage:",
        key,
        error
      );

      return null;

    }

  }


  function readFirstAvailable(keys) {

    for (const key of keys) {

      const value =
        readStorage(key);

      if (value !== null) {

        return {
          key,
          value
        };

      }

    }

    return null;

  }


  /* =======================================================
     NORMALIZE ARRAY
  ======================================================= */

  function normalizeArray(value) {

    if (Array.isArray(value)) {

      return value;

    }


    if (
      value &&
      typeof value === "object"
    ) {

      return Object.values(value);

    }


    return [];

  }


  /* =======================================================
     NUMBER HELPER
  ======================================================= */

  function number(
    value,
    fallback = 0
  ) {

    const parsed =
      Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : fallback;

  }


  /* =======================================================
     TEXT HELPER
  ======================================================= */

  function text(
    value,
    fallback = ""
  ) {

    if (
      value === null ||
      value === undefined
    ) {

      return fallback;

    }


    return String(value).trim();

  }


  /* =======================================================
     ESCAPE HTML
  ======================================================= */

  function escapeHtml(value) {

    return text(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  /* =======================================================
     NORMALIZE QUESTION
  ======================================================= */

  function normalizeQuestion(
    question,
    index = 0
  ) {

    if (
      !question ||
      typeof question !== "object"
    ) {

      return null;

    }


    const attempts =
      Math.max(
        0,
        number(
          question.attempts ??
          question.attempt_count ??
          question.total_attempts ??
          question.stats?.attempts,
          0
        )
      );


    const correct =
      Math.max(
        0,
        number(
          question.correct_count ??
          question.correct ??
          question.stats?.correct,
          0
        )
      );


    const wrong =
      Math.max(
        0,
        number(
          question.wrong_count ??
          question.wrong ??
          question.stats?.wrong,
          0
        )
      );


    const accuracy =
      attempts > 0
        ? Math.round(
            (correct / attempts) * 100
          )
        : 0;


    const questionText =
      text(
        question.question ??
        question.question_text ??
        question.text
      );


    if (!questionText) {

      return null;

    }


    const entity =
      text(
        question.knowledge_entity ??
        question.entity ??
        question.knowledgeEntity
      );


    const concept =
      text(
        question.concept ??
        question.topic
      );


    const unit =
      text(
        question.unit ??
        question.paper_unit ??
        question.unit_name
      );


    const difficulty =
      text(
        question.difficulty,
        "Medium"
      );


    const sourceType =
      text(
        question.source_type,
        "AI Practice"
      );


    const id =
      text(
        question.id ??
        question.question_id ??
        question.questionId,
        `revision-${index + 1}`
      );


    return {

      ...question,

      id,

      question:
        questionText,

      knowledge_entity:
        entity,

      concept,

      unit,

      difficulty,

      source_type:
        sourceType,

      attempts,

      correct_count:
        correct,

      wrong_count:
        wrong,

      accuracy

    };

  }


  /* =======================================================
     LOAD AI PRACTICE BANK
  ======================================================= */

  function loadAIPracticeBank() {

    const result =
      readFirstAvailable(
        STORAGE_KEYS.aiPracticeBank
      );


    if (!result) {

      return [];

    }


    let bank =
      result.value;


    if (
      bank &&
      typeof bank === "object" &&
      !Array.isArray(bank)
    ) {

      if (
        Array.isArray(
          bank.questions
        )
      ) {

        bank =
          bank.questions;

      } else if (
        Array.isArray(
          bank.items
        )
      ) {

        bank =
          bank.items;

      } else {

        bank =
          Object.values(bank);

      }

    }


    bank =
      normalizeArray(bank);


    return bank

      .map(
        (question, index) =>
          normalizeQuestion(
            question,
            index
          )
      )

      .filter(Boolean);

  }


  /* =======================================================
     LOAD OTHER PERFORMANCE DATA
  ======================================================= */

  function loadPerformanceRecords() {

    const records = [];


    for (
      const key of STORAGE_KEYS.performance
    ) {

      const data =
        readStorage(key);


      if (!data) {

        continue;

      }


      let values =
        data;


      if (
        data &&
        typeof data === "object" &&
        !Array.isArray(data)
      ) {

        if (
          Array.isArray(
            data.records
          )
        ) {

          values =
            data.records;

        } else if (
          Array.isArray(
            data.questions
          )
        ) {

          values =
            data.questions;

        } else if (
          Array.isArray(
            data.items
          )
        ) {

          values =
            data.items;

        } else {

          values =
            Object.values(data);

        }

      }


      values =
        normalizeArray(values);


      values.forEach(
        (record, index) => {

          const normalized =
            normalizeQuestion(
              record,
              index
            );


          if (normalized) {

            records.push(
              normalized
            );

          }

        }
      );

    }


    return records;

  }


  /* =======================================================
     LOAD ATTEMPTS
  ======================================================= */

  function loadAttemptRecords() {

    const records = [];


    for (
      const key of STORAGE_KEYS.attempts
    ) {

      const data =
        readStorage(key);


      if (!data) {

        continue;

      }


      let values =
        data;


      if (
        data &&
        typeof data === "object" &&
        !Array.isArray(data)
      ) {

        if (
          Array.isArray(
            data.records
          )
        ) {

          values =
            data.records;

        } else if (
          Array.isArray(
            data.attempts
          )
        ) {

          values =
            data.attempts;

        } else {

          values =
            Object.values(data);

        }

      }


      values =
        normalizeArray(values);


      values.forEach(
        (record, index) => {

          const normalized =
            normalizeQuestion(
              record,
              index
            );


          if (normalized) {

            records.push(
              normalized
            );

          }

        }
      );

    }


    return records;

  }


  /* =======================================================
     LOAD NTA INTELLIGENCE HISTORY
     PHASE 9.4 BRIDGE
  ======================================================= */

  async function loadPyqQuestionMap() {

    try {

      const response =
        await fetch(
          PYQ_DATABASE_URL,
          {
            cache: "no-store"
          }
        );

      if (!response.ok) {

        throw new Error(
          `PYQ database request failed: ${response.status}`
        );

      }

      const data =
        await response.json();

      const questions =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.questions)
            ? data.questions
            : [];

      const map =
        new Map();

      questions.forEach(
        question => {

          if (
            question &&
            question.id
          ) {

            map.set(
              String(question.id),
              question
            );

          }

        }
      );

      return map;

    } catch (error) {

      console.warn(
        "BAJEE JRF AI: PYQ database could not be loaded for NTA revision enrichment.",
        error
      );

      return new Map();

    }

  }


  async function loadNtaPerformanceRecords() {

    const result =
      readFirstAvailable(
        STORAGE_KEYS.ntaIntelligence
      );

    if (!result) {

      return [];

    }

    const history =
      normalizeArray(
        result.value
      );

    const questionMap =
      await loadPyqQuestionMap();

    const aggregate =
      new Map();

    history.forEach(
      examRecord => {

        if (
          !examRecord ||
          typeof examRecord !== "object"
        ) {

          return;

        }

        const rows =
          Array.isArray(examRecord.rows)
            ? examRecord.rows
            : [];

        rows.forEach(
          row => {

            if (
              !row ||
              typeof row !== "object"
            ) {

              return;

            }

            const questionId =
              text(
                row.questionId ||
                row.question_id ||
                row.id
              );

            if (!questionId) {

              return;

            }

            const key =
              `nta:${questionId}`;

            if (!aggregate.has(key)) {

              aggregate.set(
                key,
                {
                  id:
                    questionId,

                  question:
                    text(
                      row.questionText ||
                      row.question ||
                      ""
                    ),

                  paper:
                    text(
                      row.paper ||
                      examRecord.paperLabel ||
                      examRecord.paper ||
                      ""
                    ),

                  unit:
                    text(
                      row.unitName ||
                      row.unit ||
                      ""
                    ),

                  knowledge_entity_ids:
                    Array.isArray(
                      row.knowledgeEntityIds
                    )
                      ? row.knowledgeEntityIds
                      : [],

                  concept_ids:
                    Array.isArray(
                      row.conceptIds
                    )
                      ? row.conceptIds
                      : [],

                  attempts:
                    0,

                  correct_count:
                    0,

                  wrong_count:
                    0,

                  unanswered_count:
                    0,

                  source_type:
                    "NTA Examination",

                  difficulty:
                    "NTA",

                  options:
                    null,

                  correct_answer:
                    "",

                  answer_text:
                    "",

                  explanation:
                    "",

                  solution:
                    {},

                  _sourceExamCount:
                    0
                }
              );

            }

            const record =
              aggregate.get(key);

            const status =
              text(
                row.status
              ).toLowerCase();

            const selected =
              text(
                row.selected
              );

            record.attempts += 1;

            if (status === "correct") {

              record.correct_count += 1;

            } else if (
              status === "wrong"
            ) {

              record.wrong_count += 1;

            } else {

              record.unanswered_count += 1;

            }

            const question =
              questionMap.get(
                questionId
              );

            if (question) {

              if (
                !record.question &&
                question.question
              ) {

                record.question =
                  question.question;

              }

              record.options =
                question.options ||
                record.options;

              record.correct_answer =
                question.correct_answer ||
                record.correct_answer;

              record.answer_text =
                question.answer_text ||
                record.answer_text;

              record.explanation =
                question.explanation ||
                record.explanation;

              record.solution =
                question.solution ||
                record.solution;

              if (!record.unit) {

                record.unit =
                  text(
                    question.unit
                  );

              }

            }

            if (
              !record.paper &&
              examRecord.paperLabel
            ) {

              record.paper =
                examRecord.paperLabel;

            }

            if (
              selected &&
              !record.lastSelected
            ) {

              record.lastSelected =
                selected;

            }

            record._sourceExamCount += 1;}
        );

      }
    );

    return Array.from(
      aggregate.values()
    )
      .map(
        record => {

          const attempts =
            number(
              record.attempts
            );

          const correct =
            number(
              record.correct_count
            );

          return normalizeQuestion(
            {
              ...record,

              id:
                record.id,

              knowledge_entity:
                record.unit ||
                record.paper ||
                "NTA Question",

              concept:
                record.concept_ids.length
                  ? record.concept_ids.join(", ")
                  : record.paper ||
                    "NTA Performance",

              unit:
                record.unit ||
                "Unit not classified",

              attempts,

              correct_count:
                correct,

              wrong_count:
                number(
                  record.wrong_count
                ),

              accuracy:
                attempts > 0
                  ? Math.round(
                      (
                        correct /
                        attempts
                      ) * 100
                    )
                  : 0,

              nta_unanswered_count:
                number(
                  record.unanswered_count
                ),

              nta_exam_count:
                number(
                  record._sourceExamCount
                ),

              source_type:
                "NTA Examination",

              options:
                record.options,

              correct_answer:
                record.correct_answer,

              answer_text:
                record.answer_text,

              explanation:
                record.explanation,

              solution:
                record.solution
            },
            0
          );

        }
      )
      .filter(Boolean);

  }


  /* =======================================================
     MERGE PERFORMANCE
  ======================================================= */

  function mergePerformanceData(
    bank,
    performance,
    attempts
  ) {

    const map =
      new Map();


    function mergeRecord(record) {

      if (!record) {

        return;

      }


      const identity =
        record.id ||
        [
          record.knowledge_entity,
          record.concept,
          record.unit,
          record.question
        ]
          .filter(Boolean)
          .join("|");


      if (!identity) {

        return;

      }


      if (!map.has(identity)) {

        map.set(
          identity,
          {
            ...record
          }
        );

        return;

      }


      const existing =
        map.get(identity);


      existing.attempts =
        Math.max(
          number(existing.attempts),
          number(record.attempts)
        );


      existing.correct_count =
        Math.max(
          number(existing.correct_count),
          number(record.correct_count)
        );


      existing.wrong_count =
        Math.max(
          number(existing.wrong_count),
          number(record.wrong_count)
        );


      /*
       * Accuracy must always be derived from the final merged
       * attempt counters. Never copy a stale accuracy value from
       * one storage source over a newer merged performance record.
       */
      existing.accuracy =
        existing.attempts > 0
          ? Math.round(
              (number(existing.correct_count) /
                number(existing.attempts)) * 100
            )
          : 0;


      map.set(
        identity,
        existing
      );

    }


    bank.forEach(
      mergeRecord
    );


    performance.forEach(
      mergeRecord
    );


    attempts.forEach(
      mergeRecord
    );


    return Array.from(
      map.values()
    ).map(record => {

      const attempts =
        number(record.attempts);

      const correct =
        number(record.correct_count);

      return {
        ...record,
        accuracy:
          attempts > 0
            ? Math.round(
                (correct / attempts) * 100
              )
            : 0
      };

    });

  }


  /* =======================================================
     PRIORITY CALCULATION
  ======================================================= */

  function calculatePriority(record) {

    const attempts =
      number(
        record.attempts
      );


    const correct =
      number(
        record.correct_count
      );


    const wrong =
      number(
        record.wrong_count
      );


    const accuracy =
      attempts > 0
        ? Math.round(
            (correct / attempts) * 100
          )
        : 0;


    if (
      attempts > 0 &&
      (
        accuracy < 50 ||
        wrong >= 2
      )
    ) {

      return PRIORITY.HIGH;

    }


    if (
      attempts > 0 &&
      (
        accuracy < 80 ||
        wrong >= 1
      )
    ) {

      return PRIORITY.MEDIUM;

    }


    if (
      attempts > 0
    ) {

      return PRIORITY.LOW;

    }


    return null;

  }


  /* =======================================================
     PRIORITY SCORE
  ======================================================= */

  function calculatePriorityScore(
    record
  ) {

    const attempts =
      number(
        record.attempts
      );


    const wrong =
      number(
        record.wrong_count
      );


    const accuracy =
      number(
        record.accuracy
      );


    let score =
      0;


    score +=
      Math.max(
        0,
        100 - accuracy
      );


    score +=
      wrong * 20;


    if (
      attempts >= 2
    ) {

      score += 10;

    }


    if (
      attempts >= 3
    ) {

      score += 10;

    }


    return score;

  }


  /* =======================================================
     BUILD REVISION QUEUE
  ======================================================= */

  async function buildRevisionQueue() {

    const bank =
      loadAIPracticeBank();


    const performance =
      loadPerformanceRecords();


    const attempts =
      loadAttemptRecords();


    const ntaPerformance =
      await loadNtaPerformanceRecords();


    sourceQuestions =
      mergePerformanceData(
        bank,
        performance,
        attempts
      );


    /*
     * NTA examination performance is kept as a
     * separate source inside the same Revision Intelligence
     * queue. It does not overwrite the existing AI Practice,
     * performance or attempt records.
     */

    sourceQuestions =
      mergePerformanceData(
        sourceQuestions,
        ntaPerformance,
        []
      );


    const queue =
      sourceQuestions

        .map(record => {

          const priority =
            calculatePriority(
              record
            );


          if (!priority) {

            return null;

          }


          return {

            ...record,

            priority,

            priorityScore:
              calculatePriorityScore(
                record
              )

          };

        })

        .filter(Boolean);


    queue.sort(
      (a, b) =>
        b.priorityScore -
        a.priorityScore
    );


    revisionQueue =
      queue;


    return queue;

  }


  /* =======================================================
     UPDATE SUMMARY
  ======================================================= */

  function updateSummary(
    queue
  ) {

    const attempted =
      sourceQuestions.filter(
        item =>
          number(
            item.attempts
          ) > 0
      ).length;


    const high =
      queue.filter(
        item =>
          item.priority ===
          PRIORITY.HIGH
      ).length;


    const medium =
      queue.filter(
        item =>
          item.priority ===
          PRIORITY.MEDIUM
      ).length;


    setText(
      "totalAttempted",
      attempted
    );


    setText(
      "highPriority",
      high
    );


    setText(
      "mediumPriority",
      medium
    );


    setText(
      "revisionCount",
      queue.length
    );

  }


  /* =======================================================
     PRIORITY LABEL
  ======================================================= */

  function priorityLabel(
    priority
  ) {

    if (
      priority ===
      PRIORITY.HIGH
    ) {

      return "HIGH PRIORITY";

    }


    if (
      priority ===
      PRIORITY.MEDIUM
    ) {

      return "MEDIUM PRIORITY";

    }


    return "LOW PRIORITY";

  }


  /* =======================================================
     RENDER REVISION ITEM
  ======================================================= */

  function renderRevisionItem(
    record
  ) {

    const priority =
      record.priority;


    const entity =
      record.knowledge_entity ||
      "Knowledge area";


    const concept =
      record.concept ||
      "General concept";


    const unit =
      record.unit ||
      "Unit not specified";


    const attempts =
      number(
        record.attempts
      );


    const correct =
      number(
        record.correct_count
      );


    const wrong =
      number(
        record.wrong_count
      );


    const accuracy =
      number(
        record.accuracy
      );


    const unanswered =
      number(
        record.nta_unanswered_count
      );


    const question =
      record.question ||
      "";


    const id =
      encodeURIComponent(
        record.id || ""
      );


    const isNta =
      record.source_type ===
      "NTA Examination";


    const hasRetestData =
      Boolean(
        record.options &&
        typeof record.options === "object" &&
        Object.keys(record.options).length >= 4 &&
        record.correct_answer
      );


    const retryButton =
      hasRetestData
        ? `
          <button
            type="button"
            class="btn btn-retry"
            data-action="retry"
            data-id="${id}"
          >
            🔄 Retry Practice
          </button>
        `
        : `
          <button
            type="button"
            class="btn btn-secondary"
            disabled
            title="Question data is not available for retest."
          >
            🔄 Retest data unavailable
          </button>
        `;


    return `

      <article
        class="revision-item ${escapeHtml(priority)}"
      >

        <div class="revision-item-header">

          <div>

            <div class="revision-title">

              ${escapeHtml(entity)}

            </div>

            <div class="revision-meta">

              ${escapeHtml(concept)}
              •
              ${escapeHtml(unit)}
              •
              ${escapeHtml(
                record.difficulty ||
                "Medium"
              )}

            </div>

          </div>


          <span
            class="
              priority-badge
              priority-${escapeHtml(priority)}
            "
          >

            ${priorityLabel(priority)}

          </span>

        </div>


        ${
          question
            ? `
              <div class="small text-secondary mt-3">

                <strong>
                  Question:
                </strong>

                ${escapeHtml(question)}

              </div>
            `
            : ""
        }


        <div class="revision-stats">

          <div class="revision-stat">

            Attempts:
            <strong>
              ${attempts}
            </strong>

          </div>


          <div class="revision-stat">

            Correct:
            <strong>
              ${correct}
            </strong>

          </div>


          <div class="revision-stat">

            Wrong:
            <strong>
              ${wrong}
            </strong>

          </div>


          <div class="revision-stat">

            Accuracy:
            <strong>
              ${accuracy}%
            </strong>

          </div>

          ${
            unanswered > 0
              ? `
                <div class="revision-stat">
                  Unanswered:
                  <strong>
                    ${unanswered}
                  </strong>
                </div>
              `
              : ""
          }

          ${
            isNta
              ? `
                <div class="revision-stat">
                  Source:
                  <strong>
                    NTA
                  </strong>
                </div>
              `
              : ""
          }

        </div>


        <div class="revision-actions">

          ${retryButton}


          <button
            type="button"
            class="btn btn-knowledge"
            data-action="knowledge"
            data-entity="${encodeURIComponent(entity)}"
            data-concept="${encodeURIComponent(concept)}"
          >
            📚 Review Knowledge
          </button>

        </div>

      </article>

    `;

  }


  /* =======================================================
     RENDER QUEUE
  ======================================================= */

  function renderQueue(
    queue
  ) {

    const container =
      $("revisionQueue");


    if (!container) {

      return;

    }


    if (!queue.length) {

      container.innerHTML = `

        <div class="empty-state">

          <div class="empty-state-icon">
            🎉
          </div>

          <h3>
            No priority revision items
          </h3>

          <p>
            There is not enough recorded weakness data
            to create a revision queue yet.
            Continue practising and the queue will
            update automatically.
          </p>

        </div>

      `;

      return;

    }


    container.innerHTML =
      queue
        .map(
          renderRevisionItem
        )
        .join("");

  }


  /* =======================================================
     ENGINE STATUS
  ======================================================= */

  function updateEngineStatus() {

    const badge =
      $("engineStatus");


    const status =
      $("statusMessage");


    if (badge) {

      badge.className =
        "badge bg-success";

      badge.textContent =
        "Ready";

    }


    if (status) {

      const ntaCount =
        sourceQuestions.filter(
          item =>
            item.source_type ===
            "NTA Examination"
        ).length;


      status.textContent =
        `Revision queue built from ${sourceQuestions.length} recorded performance item(s)` +
        (
          ntaCount > 0
            ? `, including ${ntaCount} NTA question performance record(s).`
            : "."
        );

    }


    const storageStatus =
      $("storageStatus");


    if (storageStatus) {

      const ntaCount =
        sourceQuestions.filter(
          item =>
            item.source_type ===
            "NTA Examination"
        ).length;


      storageStatus.textContent =
        `${sourceQuestions.length} performance item(s) detected from browser storage.` +
        (
          ntaCount > 0
            ? ` NTA: ${ntaCount}.`
            : ""
        );

    }

  }


  /* =======================================================
     LOADING STATUS
  ======================================================= */

  function showLoading() {

    const badge =
      $("engineStatus");


    const status =
      $("statusMessage");


    if (badge) {

      badge.className =
        "badge bg-warning text-dark";

      badge.textContent =
        "Loading";

    }


    if (status) {

      status.textContent =
        "Reading your recorded performance...";

    }

  }


  /* =======================================================
     REFRESH ENGINE
  ======================================================= */

  async function refreshRevisionEngine() {

    showLoading();


    const queue =
      await buildRevisionQueue();


    updateSummary(
      queue
    );


    renderQueue(
      queue
    );updateEngineStatus();

  }


  /* =======================================================
     STEP 9.5
     PREPARE RETEST ITEM
  ======================================================= */

  function prepareRetestItem(
    record
  ) {

    if (
      !record ||
      !record.question
    ) {

      return false;

    }


    /*
     * Keep the complete question object.
     *
     * The retest page needs:
     * question
     * options
     * correct_answer
     * answer_text
     * explanation
     * solution
     * knowledge mapping
     * previous performance
     */

    const retestItem = {

      id:
        record.id,

      questionData: {

        ...record

      },

      id:
        record.id,

      question:
        record.question,

      options:
        record.options || {

          A: record.A,
          B: record.B,
          C: record.C,
          D: record.D

        },

      correct_answer:
        record.correct_answer ||
        record.correctAnswer,

      answer_text:
        record.answer_text ||
        record.answerText ||
        "",

      explanation:
        record.explanation ||
        "",

      solution:
        record.solution ||
        {},

      knowledge_entity:
        record.knowledge_entity ||
        "",

      concept:
        record.concept ||
        "",

      unit:
        record.unit ||
        "",

      difficulty:
        record.difficulty ||
        "Medium",

      source_type:
        record.source_type ||
        "AI Practice",

      attempts:
        number(
          record.attempts
        ),

      correct_count:
        number(
          record.correct_count
        ),

      wrong_count:
        number(
          record.wrong_count
        ),

      accuracy:
        number(
          record.accuracy
        ),

      priority:
        record.priority ||
        PRIORITY.LOW

    };


    try {

      localStorage.setItem(
        RETEST_STORAGE_KEY,
        JSON.stringify(
          retestItem
        )
      );


      return true;

    } catch (error) {

      console.error(
        "Unable to save retest item:",
        error
      );


      return false;

    }

  }


  /* =======================================================
     STEP 9.5
     OPEN RETEST PAGE
  ======================================================= */

  function retryPractice(
    id
  ) {

    const decodedId =
      decodeURIComponent(
        id || ""
      );


    const record =
      revisionQueue.find(
        item =>
          String(item.id) ===
          String(decodedId)
      );


    if (!record) {

      alert(
        "The selected revision question could not be found."
      );

      return;

    }


    const saved =
      prepareRetestItem(
        record
      );


    if (!saved) {

      alert(
        "The revision question could not be prepared for retesting."
      );

      return;

    }


    /*
     * Step 9.5 destination.
     */

    window.location.href =
      "revision-retest.html";

  }


  /* =======================================================
     KNOWLEDGE ACTION
  ======================================================= */

  function openKnowledge(
    entity,
    concept
  ) {

    const decodedEntity =
      decodeURIComponent(
        entity || ""
      );


    const decodedConcept =
      decodeURIComponent(
        concept || ""
      );


    try {

      localStorage.setItem(
        "bajee_revision_knowledge_target",
        JSON.stringify({

          knowledge_entity:
            decodedEntity,

          concept:
            decodedConcept

        })
      );

    } catch (error) {

      console.warn(
        "Unable to store knowledge target.",
        error
      );

    }


    window.location.href =
      "knowledge-structure.html";

  }


  /* =======================================================
     ACTION HANDLER
  ======================================================= */

  function handleQueueAction(
    event
  ) {

    const button =
      event.target.closest(
        "[data-action]"
      );


    if (!button) {

      return;

    }


    const action =
      button.dataset.action;


    if (
      action === "retry"
    ) {

      retryPractice(
        button.dataset.id
      );

      return;

    }


    if (
      action === "knowledge"
    ) {

      openKnowledge(
        button.dataset.entity,
        button.dataset.concept
      );

    }

  }


  /* =======================================================
     EVENT LISTENERS
  ======================================================= */

  function attachEvents() {

    const refreshButton =
      $("refreshRevision");


    if (refreshButton) {

      refreshButton.addEventListener(
        "click",
        refreshRevisionEngine
      );

    }


    const queue =
      $("revisionQueue");


    if (queue) {

      queue.addEventListener(
        "click",
        handleQueueAction
      );

    }

  }


  /* =======================================================
     INITIALIZE
  ======================================================= */

  async function initialize() {

    attachEvents();

    await refreshRevisionEngine();


    console.log(
      "BAJEE JRF AI — Step 9.4 Revision Intelligence ready."
    );


    console.log(
      "Revision source records:",
      sourceQuestions.length
    );


    console.log(
      "Revision queue:",
      revisionQueue.length
    );

  }


  /* =======================================================
     START
  ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );

  } else {

    initialize();

  }


})();