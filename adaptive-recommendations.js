/* =========================================================
   BAJEE JRF AI
   STEP 9.6 — ADAPTIVE RECOMMENDATIONS
========================================================= */

(() => {

  "use strict";


  /* =======================================================
     STORAGE
  ======================================================= */

  const STORAGE_KEYS = {

    performance: [
      "bajee_performance",
      "bajee_performance_data",
      "bajeePerformance",
      "performanceData",
      "jrfPerformance"
    ],

    attempts: [
      "bajee_attempts",
      "bajee_question_attempts",
      "questionAttempts",
      "attempts"
    ],

    aiPracticeBank: [
      "bajee_ai_practice_bank",
      "aiPracticeBank",
      "bajeeAIPracticeBank"
    ],

    retestHistory: [
      "bajee_revision_retest_history"
    ],

    ntaIntelligence: [
      "bajee_jrf_intelligence_history_v1"
    ]

  };


  /* =======================================================
     STATE
  ======================================================= */

  let recommendationQueue = [];

  let performanceRecords = [];

  let recommendationSignals = [];


  /* =======================================================
     DOM
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
     HELPERS
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


  function escapeHtml(value) {

    return text(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


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
     STORAGE HELPERS
  ======================================================= */

  function readStorage(key) {

    try {

      const raw =
        localStorage.getItem(key);

      if (!raw) {

        return null;

      }

      return JSON.parse(raw);

    } catch (error) {

      console.warn(
        "Adaptive Recommendations: storage read failed:",
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

        return value;

      }

    }

    return null;

  }


  /* =======================================================
     NORMALIZE QUESTION / PERFORMANCE
  ======================================================= */

  function normalizeRecord(
    record,
    index = 0
  ) {

    if (
      !record ||
      typeof record !== "object"
    ) {

      return null;

    }


    const question =
      text(
        record.question ??
        record.question_text ??
        record.text
      );


    const entity =
      text(
        record.knowledge_entity ??
        record.entity ??
        record.knowledgeEntity
      );


    const concept =
      text(
        record.concept ??
        record.topic
      );


    const unit =
      text(
        record.unit ??
        record.paper_unit ??
        record.unit_name
      );


    const attempts =
      Math.max(
        0,
        number(
          record.attempts ??
          record.attempt_count ??
          record.total_attempts ??
          record.stats?.attempts
        )
      );


    const correct =
      Math.max(
        0,
        number(
          record.correct_count ??
          record.correctCount ??
          record.correct ??
          record.stats?.correct
        )
      );


    const wrong =
      Math.max(
        0,
        number(
          record.wrong_count ??
          record.wrongCount ??
          record.wrong ??
          record.stats?.wrong
        )
      );


    const inferredCorrect =
      record.isCorrect === true ||
      String(record.status || "").toLowerCase() === "correct";

    const inferredWrong =
      String(record.status || "").toLowerCase() === "wrong";

    const normalizedCorrect =
      correct > 0
        ? correct
        : (
            inferredCorrect
              ? 1
              : 0
          );

    const normalizedWrong =
      wrong > 0
        ? wrong
        : (
            inferredWrong
              ? 1
              : 0
          );

    const normalizedAttempts =
      attempts > 0
        ? attempts
        : (
            record.isCorrect !== undefined ||
            record.status
              ? 1
              : 0
          );

    const accuracy =
      normalizedAttempts > 0
        ? Math.round(
            (normalizedCorrect / normalizedAttempts) * 100
          )
        : number(
            record.accuracy
          );


    const id =
      text(
        record.id ??
        record.question_id ??
        record.questionId,
        `adaptive-${index + 1}`
      );


    if (
      !question &&
      !entity &&
      !concept
    ) {

      return null;

    }


    return {

      ...record,

      id,

      question,

      knowledge_entity:
        entity,

      concept,

      unit,

      attempts:
        normalizedAttempts,

      correct_count:
        normalizedCorrect,

      wrong_count:
        normalizedWrong,

      accuracy

    };

  }


  /* =======================================================
     LOAD COLLECTION
  ======================================================= */

  function loadCollection(keys) {

    const data =
      readFirstAvailable(
        keys
      );


    if (!data) {

      return [];

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
          data.attempts
        )
      ) {

        values =
          data.attempts;

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


    return normalizeArray(
      values
    );

  }


  /* =======================================================
     LOAD NTA INTELLIGENCE DATA
  ======================================================= */

  function loadNtaIntelligenceData() {

    const data =
      readFirstAvailable(
        STORAGE_KEYS.ntaIntelligence
      );

    if (!data) {

      return [];

    }

    let examRecords = [];

    if (Array.isArray(data)) {

      examRecords = data;

    } else if (
      data &&
      typeof data === "object"
    ) {

      if (Array.isArray(data.records)) {

        examRecords = data.records;

      } else {

        examRecords = Object.values(data);

      }

    }

    const questionRecords = [];

    examRecords.forEach(
      (examRecord, examIndex) => {

        if (
          !examRecord ||
          typeof examRecord !== "object"
        ) {

          return;

        }

        const questions =
          normalizeArray(
            examRecord.questions
          );

        questions.forEach(
          (questionRecord, questionIndex) => {

            if (
              !questionRecord ||
              typeof questionRecord !== "object"
            ) {

              return;

            }

            const status =
              text(
                questionRecord.status
              ).toLowerCase();

            const selected =
              questionRecord.selected ??
              questionRecord.selectedAnswer ??
              "";

            const correctAnswer =
              questionRecord.correctAnswer ??
              questionRecord.correct_answer ??
              "";

            let derivedStatus =
              status;

            if (!derivedStatus) {

              if (
                selected === "" ||
                selected === null ||
                selected === undefined
              ) {

                derivedStatus = "unanswered";

              } else if (
                String(selected) ===
                String(correctAnswer)
              ) {

                derivedStatus = "correct";

              } else {

                derivedStatus = "wrong";

              }

            }

            const entities =
              normalizeArray(
                questionRecord.knowledgeEntityIds
              )
                .map(
                  item => text(item)
                )
                .filter(Boolean);

            const concepts =
              normalizeArray(
                questionRecord.conceptIds
              )
                .map(
                  item => text(item)
                )
                .filter(Boolean);

            questionRecords.push({

              ...questionRecord,

              id:
                text(
                  questionRecord.questionId ??
                  questionRecord.id,
                  `nta-${examIndex + 1}-${questionIndex + 1}`
                ),

              question:
                text(
                  questionRecord.question ??
                  questionRecord.questionText ??
                  questionRecord.text
                ),

              knowledge_entity:
                entities.join(", "),

              concept:
                concepts.join(", "),

              unit:
                text(
                  questionRecord.unitName ??
                  questionRecord.unit
                ),

              paper:
                text(
                  questionRecord.paper ??
                  examRecord.paperLabel ??
                  examRecord.paper
                ),

              source:
                questionRecord.source ??
                examRecord.source,

              status:
                derivedStatus,

              attempts:
                1,

              correct_count:
                derivedStatus === "correct"
                  ? 1
                  : 0,

              wrong_count:
                derivedStatus === "wrong"
                  ? 1
                  : 0

            });

          }
        );

      }
    );

    return questionRecords;

  }


  /* =======================================================
     LOAD PERFORMANCE DATA
  ======================================================= */

  function loadPerformanceData() {

    const performance =
      loadCollection(
        STORAGE_KEYS.performance
      );


    const attempts =
      loadCollection(
        STORAGE_KEYS.attempts
      );


    const retests =
      loadCollection(
        STORAGE_KEYS.retestHistory
      );

    const ntaIntelligence =
      loadNtaIntelligenceData();


    const bank =
      loadCollection(
        STORAGE_KEYS.aiPracticeBank
      );


    const allRecords = [];


    [
      ...performance.map(
        record => ({
          ...record,
          _adaptiveSource: "performance"
        })
      ),
      ...attempts.map(
        record => ({
          ...record,
          _adaptiveSource: "attempts"
        })
      ),
      ...retests.map(
        record => ({
          ...record,
          _adaptiveSource: "retest"
        })
      ),
      ...ntaIntelligence.map(
        record => ({
          ...record,
          _adaptiveSource: "nta"
        })
      ),
      ...bank.map(
        record => ({
          ...record,
          _adaptiveSource: "ai-practice"
        })
      )
    ]
      .forEach(
        (record, index) => {

          const normalized =
            normalizeRecord(
              record,
              index
            );


          if (normalized) {

            allRecords.push(
              normalized
            );

          }

        }
      );


    return mergeRecords(
      allRecords
    );

  }


  /* =======================================================
     MERGE SAME QUESTION
  ======================================================= */

  function mergeRecords(
    records
  ) {

    const map =
      new Map();


    records.forEach(
      record => {

        const key =
          [
            record.id,
            record.question,
            record.knowledge_entity,
            record.concept,
            record.unit,
            record._adaptiveSource || ""
          ]
            .filter(Boolean)
            .join("|");


        if (!map.has(key)) {

          map.set(
            key,
            {
              ...record
            }
          );

          return;

        }


        const existing =
          map.get(key);


        existing.attempts =
          Math.max(
            number(
              existing.attempts
            ),
            number(
              record.attempts
            )
          );


        existing.correct_count =
          Math.max(
            number(
              existing.correct_count
            ),
            number(
              record.correct_count
            )
          );


        existing.wrong_count =
          Math.max(
            number(
              existing.wrong_count
            ),
            number(
              record.wrong_count
            )
          );


        if (
          record.question &&
          !existing.question
        ) {

          existing.question =
            record.question;

        }


        if (
          record.options &&
          !existing.options
        ) {

          existing.options =
            record.options;

        }


        if (
          record.correct_answer &&
          !existing.correct_answer
        ) {

          existing.correct_answer =
            record.correct_answer;

        }


        if (
          record.explanation &&
          !existing.explanation
        ) {

          existing.explanation =
            record.explanation;

        }


        map.set(
          key,
          existing
        );

      }
    );


    return Array.from(
      map.values()
    )
      .map(record => {

        const attempts =
          number(
            record.attempts
          );


        const correct =
          number(
            record.correct_count
          );


        return {

          ...record,

          accuracy:
            attempts > 0
              ? Math.round(
                  (correct / attempts) * 100
                )
              : number(
                  record.accuracy
                )

        };

      });

  }


  /* =======================================================
     AGGREGATE BY KNOWLEDGE AREA
  ======================================================= */

  function buildKnowledgeSignals(
    records
  ) {

    const map =
      new Map();


    records
      .filter(
        record =>
          number(
            record.attempts
          ) > 0
      )
      .forEach(
        record => {

          const entity =
            record.knowledge_entity ||
            "General";


          const concept =
            record.concept ||
            "General";


          const unit =
            record.unit ||
            "Unit not specified";


          const key =
            [
              entity,
              concept,
              unit
            ].join("|");


          if (!map.has(key)) {

            map.set(
              key,
              {

                key,

                knowledge_entity:
                  entity,

                concept,

                unit,

                attempts: 0,

                correct: 0,

                wrong: 0,

                questions: []

              }
            );

          }


          const signal =
            map.get(key);


          signal.attempts +=
            number(
              record.attempts
            );


          signal.correct +=
            number(
              record.correct_count
            );


          signal.wrong +=
            number(
              record.wrong_count
            );


          signal.questions.push(
            record
          );

        }
      );


    return Array.from(
      map.values()
    )
      .map(signal => {

        signal.accuracy =
          signal.attempts > 0
            ? Math.round(
                (
                  signal.correct /
                  signal.attempts
                ) * 100
              )
            : 0;


        signal.score =
          calculateSignalScore(
            signal
          );


        signal.type =
          determineRecommendationType(
            signal
          );


        return signal;

      });

  }


  /* =======================================================
     SIGNAL SCORE
  ======================================================= */

  function calculateSignalScore(
    signal
  ) {

    const accuracy =
      number(
        signal.accuracy
      );


    const wrong =
      number(
        signal.wrong
      );


    const attempts =
      number(
        signal.attempts
      );


    let score =
      100 - accuracy;


    score +=
      wrong * 15;


    if (
      attempts >= 3
    ) {

      score += 5;

    }


    if (
      attempts >= 5
    ) {

      score += 5;

    }


    return score;

  }


  /* =======================================================
     DETERMINE RECOMMENDATION TYPE
  ======================================================= */

  function determineRecommendationType(
    signal
  ) {

    const accuracy =
      number(
        signal.accuracy
      );


    const wrong =
      number(
        signal.wrong
      );


    if (
      accuracy < 50 ||
      wrong >= 2
    ) {

      return "urgent";

    }


    if (
      accuracy < 80 ||
      wrong >= 1
    ) {

      return "practice";

    }


    return "maintain";

  }


  /* =======================================================
     RECOMMENDATION TITLE
  ======================================================= */

  function getRecommendationTitle(
    signal
  ) {

    if (
      signal.type ===
      "urgent"
    ) {

      return "Revise First";

    }


    if (
      signal.type ===
      "practice"
    ) {

      return "Practice More";

    }


    return "Maintain";

  }


  /* =======================================================
     RECOMMENDATION DESCRIPTION
  ======================================================= */

  function getRecommendationDescription(
    signal
  ) {

    const entity =
      signal.knowledge_entity;


    const concept =
      signal.concept;


    const accuracy =
      signal.accuracy;


    const wrong =
      signal.wrong;


    if (
      signal.type ===
      "urgent"
    ) {

      return `
        Your recorded performance in
        <strong>${escapeHtml(entity)}</strong>
        /
        <strong>${escapeHtml(concept)}</strong>
        is currently at
        <strong>${accuracy}% accuracy</strong>.
        You have recorded
        <strong>${wrong} wrong</strong>
        response(s), so revision should come before
        moving heavily into new material.
      `;

    }


    if (
      signal.type ===
      "practice"
    ) {

      return `
        Your performance in
        <strong>${escapeHtml(entity)}</strong>
        /
        <strong>${escapeHtml(concept)}</strong>
        is developing at
        <strong>${accuracy}% accuracy</strong>.
        Additional targeted practice can help
        stabilise this area.
      `;

    }


    return `
      Your current performance in
      <strong>${escapeHtml(entity)}</strong>
      /
      <strong>${escapeHtml(concept)}</strong>
      is
      <strong>${accuracy}% accuracy</strong>.
      Keep this area in the maintenance cycle
      while giving more study time to weaker areas.
    `;

  }


  /* =======================================================
     BUILD RECOMMENDATION QUEUE
  ======================================================= */

  function buildRecommendationQueue(
    signals
  ) {

    return signals
      .slice()
      .sort(
        (a, b) =>
          b.score -
          a.score
      )
      .map(
        signal => ({

          ...signal,

          title:
            getRecommendationTitle(
              signal
            ),

          description:
            getRecommendationDescription(
              signal
            )

        })
      );

  }


  /* =======================================================
     PRIMARY RECOMMENDATION
  ======================================================= */

  function updatePrimaryRecommendation(
    queue
  ) {

    const title =
      $("primaryTitle");


    const description =
      $("primaryDescription");


    const meta =
      $("primaryMeta");


    if (!queue.length) {

      if (title) {

        title.textContent =
          "Start building your performance profile";

      }


      if (description) {

        description.textContent =
          "Complete some AI Practice questions so BAJEE JRF AI can generate recommendations from your actual performance.";

      }


      if (meta) {

        meta.textContent =
          "No scored performance signals available yet.";

      }


      return;

    }


    const primary =
      queue[0];


    if (title) {

      title.textContent =
        `${primary.title}: ${primary.knowledge_entity}`;

    }


    if (description) {

      description.textContent =
        primary.type === "urgent"
          ? `Focus your next study session on ${primary.concept}. Revise the concept and then retest it.`
          : primary.type === "practice"
            ? `Complete targeted practice on ${primary.concept} before moving on.`
            : `Keep ${primary.concept} in your maintenance cycle while directing more time toward weaker areas.`;

    }


    if (meta) {

      meta.textContent =
        `${primary.concept} • ${primary.unit} • ${primary.accuracy}% accuracy • ${primary.attempts} attempts`;

    }

  }


  /* =======================================================
     UPDATE SUMMARY
  ======================================================= */

  function updateSummary(
    queue
  ) {

    const urgent =
      queue.filter(
        item =>
          item.type === "urgent"
      ).length;


    const practice =
      queue.filter(
        item =>
          item.type === "practice"
      ).length;


    const maintain =
      queue.filter(
        item =>
          item.type === "maintain"
      ).length;


    setText(
      "totalSignals",
      queue.length
    );


    setText(
      "urgentRecommendations",
      urgent
    );


    setText(
      "practiceRecommendations",
      practice
    );


    setText(
      "maintenanceRecommendations",
      maintain
    );


    recommendationSignals =
      queue;

  }


  /* =======================================================
     STUDY BALANCE
  ======================================================= */

  function updateStudyBalance(
    queue
  ) {

    if (!queue.length) {

      setBalance(
        "revision",
        0
      );

      setBalance(
        "practice",
        0
      );

      setBalance(
        "maintenance",
        0
      );

      return;

    }


    const urgent =
      queue.filter(
        item =>
          item.type === "urgent"
      ).length;


    const practice =
      queue.filter(
        item =>
          item.type === "practice"
      ).length;


    const maintain =
      queue.filter(
        item =>
          item.type === "maintain"
      ).length;


    const total =
      urgent +
      practice +
      maintain;


    const revisionPercent =
      Math.round(
        (urgent / total) * 100
      );


    const practicePercent =
      Math.round(
        (practice / total) * 100
      );


    const maintenancePercent =
      100 -
      revisionPercent -
      practicePercent;


    setBalance(
      "revision",
      revisionPercent
    );


    setBalance(
      "practice",
      practicePercent
    );


    setBalance(
      "maintenance",
      maintenancePercent
    );

  }


  function setBalance(
    type,
    value
  ) {

    setText(
      `${type}Balance`,
      `${value}%`
    );


    const progress =
      $(
        `${type}Progress`
      );


    if (progress) {

      progress.style.width =
        `${value}%`;

      progress.setAttribute(
        "aria-valuenow",
        String(value)
      );

    }

  }


  /* =======================================================
     BADGE
  ======================================================= */

  function recommendationBadge(
    type
  ) {

    if (
      type === "urgent"
    ) {

      return `
        <span class="recommendation-badge badge-urgent">
          🔴 REVISE FIRST
        </span>
      `;

    }


    if (
      type === "practice"
    ) {

      return `
        <span class="recommendation-badge badge-practice">
          🟠 PRACTICE MORE
        </span>
      `;

    }


    return `
      <span class="recommendation-badge badge-maintain">
        🟢 MAINTAIN
      </span>
    `;

  }


  /* =======================================================
     RENDER ITEM
  ======================================================= */

  function renderRecommendationItem(
    signal
  ) {

    const selectedRecord =
      signal.questions &&
      signal.questions.length
        ? signal.questions[0]
        : null;


    const questionId =
      selectedRecord?.id ||
      selectedRecord?.questionId ||
      "";


    /*
     * A performance/retest record may contain only the questionId
     * and statistics. Resolve the full question from the unified
     * performance repository before deciding whether to show the
     * Practice button.
     */
    const question =
      findQuestion(questionId) ||
      selectedRecord;


    const encodedId =
      encodeURIComponent(
        questionId
      );


    return `

      <article
        class="
          recommendation-item
          ${escapeHtml(signal.type)}
        "
      >

        <div class="recommendation-item-header">

          <div>

            <div class="recommendation-title">

              ${escapeHtml(
                signal.knowledge_entity
              )}

            </div>


            <div class="recommendation-meta-line">

              ${escapeHtml(
                signal.concept
              )}

              •

              ${escapeHtml(
                signal.unit
              )}

            </div>

          </div>


          ${recommendationBadge(
            signal.type
          )}

        </div>


        <div
          class="recommendation-description"
        >

          ${signal.description}

        </div>


        <div class="recommendation-stats">

          <div class="recommendation-stat">

            Attempts:
            <strong>
              ${signal.attempts}
            </strong>

          </div>


          <div class="recommendation-stat">

            Correct:
            <strong>
              ${signal.correct}
            </strong>

          </div>


          <div class="recommendation-stat">

            Wrong:
            <strong>
              ${signal.wrong}
            </strong>

          </div>


          <div class="recommendation-stat">

            Accuracy:
            <strong>
              ${signal.accuracy}%
            </strong>

          </div>

        </div>


        <div class="recommendation-actions">

          ${
            question
              ? `
                <button
                  type="button"
                  class="btn btn-recommendation"
                  data-action="retry"
                  data-id="${encodedId}"
                >
                  🔄 ${signal.type === "maintain"
                    ? "Practice Again"
                    : "Practice Now"}
                </button>
              `
              : ""
          }


          <button
            type="button"
            class="btn btn-review"
            data-action="revision"
            data-entity="${encodeURIComponent(
              signal.knowledge_entity
            )}"
            data-concept="${encodeURIComponent(
              signal.concept
            )}"
          >
            🧠 Review Revision
          </button>


          <button
            type="button"
            class="btn btn-review"
            data-action="knowledge"
            data-entity="${encodeURIComponent(
              signal.knowledge_entity
            )}"
            data-concept="${encodeURIComponent(
              signal.concept
            )}"
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
      $("recommendationQueue");


    if (!container) {

      return;

    }


    if (!queue.length) {

      container.innerHTML = `

        <div class="empty-state">

          <div class="empty-state-icon">
            📊
          </div>


          <h3>
            Not enough performance data yet
          </h3>


          <p>
            Complete more AI Practice or Revision
            Retest questions. BAJEE JRF AI will
            generate adaptive recommendations as
            meaningful performance signals accumulate.
          </p>

        </div>

      `;

      return;

    }


    container.innerHTML =
      queue
        .map(
          renderRecommendationItem
        )
        .join("");

  }


  /* =======================================================
     FIND QUESTION
  ======================================================= */

  function findQuestion(
    id
  ) {

    const decodedId =
      decodeURIComponent(
        id || ""
      );


    const matchesId =
      (item) => {

        if (!item || typeof item !== "object") {

          return false;

        }

        const candidates = [
          item.id,
          item.questionId,
          item.question_id
        ]
          .filter(Boolean)
          .map(value =>
            String(value).trim().toLowerCase()
          );

        return candidates.includes(
          String(decodedId).trim().toLowerCase()
        );

      };


    /* First search the recommendation's own records. */
    for (
      const signal of recommendationQueue
    ) {

      const question =
        signal.questions?.find(
          item =>
            matchesId(item) &&
            Boolean(
              item.question ||
              item.question_text ||
              item.text
            )
        );


      if (question) {

        return question;

      }

    }


    /*
     * Then search the complete unified performance repository.
     * This is important because retest history records may contain
     * only questionId/answer statistics while the AI Practice Bank
     * contains the actual question and options.
     */
    const repositoryMatch =
      performanceRecords.find(
        item =>
          matchesId(item) &&
          Boolean(
            item.question ||
            item.question_text ||
            item.text
          )
      );


    if (repositoryMatch) {

      return repositoryMatch;

    }


    /*
     * Last fallback: return a matching record even if its question
     * text is absent. The caller will report the missing source
     * question instead of silently failing.
     */
    for (
      const signal of recommendationQueue
    ) {

      const fallback =
        signal.questions?.find(
          item => matchesId(item)
        );

      if (fallback) {

        return fallback;

      }

    }


    return null;

  }


  /* =======================================================
     PREPARE RETEST
  ======================================================= */

  function prepareRetest(
    question
  ) {

    if (
      !question
    ) {

      return false;

    }


    const questionText =
      question.question ||
      question.question_text ||
      question.text ||
      question.questionData?.question ||
      "";


    if (!questionText) {

      console.warn(
        "Adaptive Recommendations: selected recommendation has no question text.",
        question
      );

      return false;

    }


    const retestItem = {

      ...question,

      question: questionText,

      options:
        question.options ||
        question.questionData?.options ||
        {
          A: question.A,
          B: question.B,
          C: question.C,
          D: question.D
        },

      correct_answer:
        question.correct_answer ||
        question.correctAnswer ||
        question.questionData?.correct_answer ||
        question.questionData?.correctAnswer ||
        "",

      answer_text:
        question.answer_text ||
        question.answerText ||
        question.questionData?.answer_text ||
        question.questionData?.answerText ||
        "",

      explanation:
        question.explanation ||
        question.questionData?.explanation ||
        "",

      solution:
        question.solution ||
        question.questionData?.solution ||
        {},

      questionData: {

        ...question,

        question: questionText

      }

    };


    try {

      localStorage.setItem(
        "bajee_revision_retest_item",
        JSON.stringify(
          retestItem
        )
      );


      return true;

    } catch (error) {

      console.error(
        "Unable to prepare adaptive retest:",
        error
      );


      return false;

    }

  }


  /* =======================================================
     RETRY ACTION
  ======================================================= */

  function retryQuestion(
    id
  ) {

    const question =
      findQuestion(id);


    if (!question) {

      alert(
        "The recommended question could not be found."
      );

      return;

    }


    if (
      !prepareRetest(
        question
      )
    ) {

      alert(
        "The recommended practice question could not be prepared."
      );

      return;

    }


    window.location.href =
      "revision-retest.html";

  }


  /* =======================================================
     REVISION ACTION
  ======================================================= */

  function openRevision(
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


      localStorage.setItem(
        "bajee_revision_target",
        JSON.stringify({

          knowledge_entity:
            decodedEntity,

          concept:
            decodedConcept

        })
      );


    } catch (error) {

      console.warn(
        "Unable to save revision target:",
        error
      );

    }


    window.location.href =
      "revision-intelligence.html";

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
        "Unable to save knowledge target:",
        error
      );

    }


    window.location.href =
      "knowledge-structure.html";

  }


  /* =======================================================
     ACTION HANDLER
  ======================================================= */

  function handleAction(
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

      retryQuestion(
        button.dataset.id
      );

      return;

    }


    if (
      action === "revision"
    ) {

      openRevision(
        button.dataset.entity,
        button.dataset.concept
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
     ENGINE STATUS
  ======================================================= */

  function updateEngineStatus() {

    const badge =
      $("engineStatus");


    const status =
      $("statusMessage");


    const storageStatus =
      $("storageStatus");


    if (badge) {

      badge.className =
        "badge bg-success";

      badge.textContent =
        "Ready";

    }


    if (status) {

      status.textContent =
        `Generated ${recommendationQueue.length} adaptive recommendation signal(s) from your recorded performance, NTA intelligence, practice, and retest data.`;

    }


    if (storageStatus) {

      storageStatus.textContent =
        `${performanceRecords.length} performance item(s) analysed.`;

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
        "Analysing your preparation data...";

    }

  }


  /* =======================================================
     BUILD ENGINE
  ======================================================= */

  function refreshRecommendations() {

    showLoading();


    performanceRecords =
      loadPerformanceData();


    const signals =
      buildKnowledgeSignals(
        performanceRecords
      );


    recommendationQueue =
      buildRecommendationQueue(
        signals
      );


    updateSummary(
      recommendationQueue
    );


    updatePrimaryRecommendation(
      recommendationQueue
    );


    updateStudyBalance(
      recommendationQueue
    );


    renderQueue(
      recommendationQueue
    );


    updateEngineStatus();


    console.log(
      "BAJEE JRF AI — Step 9.6 Adaptive Recommendations ready."
    );


    console.log(
      "Performance records:",
      performanceRecords.length
    );


    console.log(
      "Recommendation signals:",
      recommendationQueue
    );

  }


  /* =======================================================
     EVENTS
  ======================================================= */

  function attachEvents() {

    const refresh =
      $("refreshRecommendations");


    if (refresh) {

      refresh.addEventListener(
        "click",
        refreshRecommendations
      );

    }


    const queue =
      $("recommendationQueue");


    if (queue) {

      queue.addEventListener(
        "click",
        handleAction
      );

    }

  }


  /* =======================================================
     INITIALIZE
  ======================================================= */

  function initialize() {

    attachEvents();

    refreshRecommendations();

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