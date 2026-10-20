/* =========================================================
   BAJEE JRF AI
   STEP 9.7 — JRF READINESS DASHBOARD
========================================================= */

(() => {

  "use strict";


  /* =======================================================
     CANONICAL ANALYTICS SOURCES
  ======================================================= */

  /*
   * Step 9.7 previously read several legacy performance keys
   * at the same time. That caused the readiness dashboard to
   * count the AI Practice Bank differently from Step 10.7.
   *
   * The readiness dashboard now follows the same source policy
   * as the integrated analytics layer:
   *
   *   PYQ / Test History
   *   AI Practice (detailed attempts OR bank aggregate)
   *   Revision Retest History
   *
   * Legacy performance/attempt keys are deliberately not used
   * for the primary readiness calculation because they can
   * represent the same activity a second time.
   */

  const STORAGE_KEYS = {

    testHistory:
      "bajee_jrf_ai_test_history_v1",

    verticalPerformance:
      "bajee_jrf_ai_vertical_slice_performance_v2",

    aiPracticeBank:
      "bajee_ai_practice_bank",

    aiPracticeAttempts:
      "bajee_ai_practice_attempts",

    retestHistory:
      "bajee_revision_retest_history"

  };


  /* =======================================================
     STATE
  ======================================================= */

  let records = [];

  let knowledgeSignals = [];

  let unitSignals = [];

  let readinessData = null;


  /* =======================================================
     DOM HELPERS
  ======================================================= */

  function $(id) {

    return document.getElementById(id);

  }


  function setText(id, value) {

    const element =
      $(id);

    if (element) {

      element.textContent =
        value;

    }

  }


  /* =======================================================
     BASIC HELPERS
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


  function clamp(
    value,
    min,
    max
  ) {

    return Math.min(
      max,
      Math.max(
        min,
        value
      )
    );

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


  function normalizeKey(value) {

    return text(value)
      .toLowerCase();

  }


  /* =======================================================
     STORAGE
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
        "JRF Readiness: unable to read storage:",
        key,
        error
      );

      return null;

    }

  }


  function extractCollection(
    data,
    keys = []
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
      const key of keys
    ) {

      if (
        Array.isArray(
          data[key]
        )
      ) {

        return data[key];

      }

    }


    return Object.values(data);

  }


  function loadCollection(
    key,
    keys = []
  ) {

    return extractCollection(
      readStorage(key),
      keys
    );

  }


  /* =======================================================
     QUESTION / ATTEMPT HELPERS
  ======================================================= */

  function getQuestionKey(
    item
  ) {

    if (
      !item ||
      typeof item !== "object"
    ) {

      return "";

    }


    const id =
      item.question_id ??
      item.questionId ??
      item.pyq_id ??
      item.pyqId ??
      item.id;


    if (
      id !== null &&
      id !== undefined &&
      text(id)
    ) {

      return `id:${normalizeKey(id)}`;

    }


    const question =
      item.question ??
      item.question_text ??
      item.questionText ??
      item.text;


    if (text(question)) {

      return `q:${normalizeKey(question)}`;

    }


    return "";

  }


  function getEntity(
    item
  ) {

    return text(
      item?.knowledge_entity ??
      item?.knowledgeEntity ??
      item?.entity ??
      item?.entity_name ??
      item?.entityName ??
      item?.knowledge
    );

  }


  function getConcept(
    item
  ) {

    return text(
      item?.concept ??
      item?.concept_name ??
      item?.conceptName ??
      item?.topic
    );

  }


  function getUnit(
    item
  ) {

    return text(
      item?.unit ??
      item?.paper_unit ??
      item?.unit_name ??
      item?.unitName
    );

  }


  function getQuestionText(
    item
  ) {

    return text(
      item?.question ??
      item?.question_text ??
      item?.questionText ??
      item?.text
    );

  }


  function classifyAttempt(
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


  function countAttemptResults(
    attempts
  ) {

    const result = {

      attempts: 0,

      correct: 0,

      wrong: 0

    };


    normalizeArray(
      attempts
    ).forEach(
      attempt => {

        result.attempts++;


        const status =
          classifyAttempt(
            attempt
          );


        if (
          status === "correct"
        ) {

          result.correct++;

        }

        else if (
          status === "wrong"
        ) {

          result.wrong++;

        }

      }
    );


    return result;

  }


  function createNormalizedRecord(
    item,
    stats,
    index
  ) {

    const question =
      getQuestionText(
        item
      );

    const entity =
      getEntity(
        item
      );

    const concept =
      getConcept(
        item
      );

    const unit =
      getUnit(
        item
      );


    const attempts =
      Math.max(
        0,
        number(
          stats?.attempts
        )
      );


    const correct =
      Math.max(
        0,
        number(
          stats?.correct
        )
      );


    const wrong =
      Math.max(
        0,
        number(
          stats?.wrong
        )
      );


    if (
      attempts <= 0 &&
      !question &&
      !entity &&
      !concept
    ) {

      return null;

    }


    const id =
      text(
        item?.question_id ??
        item?.questionId ??
        item?.pyq_id ??
        item?.pyqId ??
        item?.id,
        `readiness-${index + 1}`
      );


    return {

      ...item,

      id,

      question,

      knowledge_entity:
        entity,

      concept,

      unit,

      attempts,

      correct_count:
        correct,

      wrong_count:
        wrong,

      accuracy:
        attempts > 0
          ? Math.round(
              (
                correct /
                attempts
              ) * 100
            )
          : 0

    };

  }


  /* =======================================================
     AI PRACTICE — UNIFIED SOURCE
  ======================================================= */

  function buildUnifiedAIPracticeRecords() {

    const bank =
      loadCollection(
        STORAGE_KEYS.aiPracticeBank,
        [
          "questions",
          "items",
          "bank"
        ]
      );


    const detailedAttempts =
      loadCollection(
        STORAGE_KEYS.aiPracticeAttempts,
        [
          "attempts",
          "history",
          "records",
          "results"
        ]
      );


    const detailedByKey =
      new Map();


    detailedAttempts.forEach(
      attempt => {

        const key =
          getQuestionKey(
            attempt
          );


        if (!key) {

          return;

        }


        if (
          !detailedByKey.has(key)
        ) {

          detailedByKey.set(
            key,
            []
          );

        }


        detailedByKey
          .get(key)
          .push(
            attempt
          );

      }
    );


    const records = [];

    const consumedKeys =
      new Set();


    /*
     * Canonical rule:
     *
     * If detailed attempts exist for a bank question,
     * use those detailed attempts.
     *
     * Otherwise use the cumulative bank statistics.
     *
     * Never count both.
     */

    bank.forEach(
      (question, index) => {

        const key =
          getQuestionKey(
            question
          );


        const detailed =
          key
            ? (
                detailedByKey.get(
                  key
                ) || []
              )
            : [];


        let stats;


        if (
          detailed.length > 0
        ) {

          stats =
            countAttemptResults(
              detailed
            );

          consumedKeys.add(
            key
          );

        }

        else {

          stats = {

            attempts:
              Math.max(
                0,
                number(
                  question.attempts ??
                  question.attempt_count ??
                  question.total_attempts ??
                  question.stats?.attempts
                )
              ),

            correct:
              Math.max(
                0,
                number(
                  question.correct_count ??
                  question.correct ??
                  question.stats?.correct
                )
              ),

            wrong:
              Math.max(
                0,
                number(
                  question.wrong_count ??
                  question.wrong ??
                  question.stats?.wrong
                )
              )

          };

        }


        if (
          stats.attempts <= 0
        ) {

          return;

        }


        const normalized =
          createNormalizedRecord(
            question,
            stats,
            index
          );


        if (normalized) {

          normalized.source =
            "AI Practice";

          records.push(
            normalized
          );

        }

      }
    );


    /*
     * Detailed attempts without a corresponding bank question
     * are still real practice evidence and must not disappear.
     */

    detailedAttempts.forEach(
      (attempt, index) => {

        const key =
          getQuestionKey(
            attempt
          );


        if (
          key &&
          consumedKeys.has(key)
        ) {

          return;

        }


        const normalized =
          createNormalizedRecord(
            attempt,
            {
              attempts: 1,
              correct:
                classifyAttempt(
                  attempt
                ) === "correct"
                  ? 1
                  : 0,
              wrong:
                classifyAttempt(
                  attempt
                ) === "wrong"
                  ? 1
                  : 0
            },
            bank.length + index
          );


        if (normalized) {

          normalized.source =
            "AI Practice";

          records.push(
            normalized
          );

        }

      }
    );


    return records;

  }


  /* =======================================================
     REVISION RETEST — ONE HISTORY RECORD = ONE RETEST
  ======================================================= */

  function buildRevisionRetestRecords() {

    const history =
      loadCollection(
        STORAGE_KEYS.retestHistory,
        [
          "attempts",
          "history",
          "records",
          "results",
          "retests"
        ]
      );


    return history
      .map(
        (item, index) => {

          const status =
            classifyAttempt(
              item
            );


          const normalized =
            createNormalizedRecord(
              item,
              {
                attempts: 1,
                correct:
                  status === "correct"
                    ? 1
                    : 0,
                wrong:
                  status === "wrong"
                    ? 1
                    : 0
              },
              index
            );


          if (normalized) {

            normalized.source =
              "Revision Retest";

          }


          return normalized;

        }
      )
      .filter(
        Boolean
      );

  }


  /* =======================================================
     PYQ / TEST HISTORY
  ======================================================= */

  function buildTestHistoryRecords() {

    const tests =
      loadCollection(
        STORAGE_KEYS.testHistory,
        [
          "tests",
          "history",
          "records",
          "results"
        ]
      );


    const records = [];


    tests.forEach(
      test => {

        const results =
          Array.isArray(
            test?.question_results
          )
            ? test.question_results
            : Array.isArray(
                test?.results
              )
              ? test.results
              : [];


        results.forEach(
          (result, index) => {

            const normalized =
              createNormalizedRecord(
                result,
                {
                  attempts: 1,
                  correct:
                    classifyAttempt(
                      result
                    ) === "correct"
                      ? 1
                      : 0,
                  wrong:
                    classifyAttempt(
                      result
                    ) === "wrong"
                      ? 1
                      : 0
                },
                index
              );


            if (normalized) {

              normalized.source =
                "PYQ";

              records.push(
                normalized
              );

            }

          }
        );

      }
    );


    return records;

  }


  /* =======================================================
     VERTICAL SLICE PERFORMANCE
  ======================================================= */

  function buildVerticalRecords() {

    const data =
      readStorage(
        STORAGE_KEYS.verticalPerformance
      );


    if (!data) {

      return [];

    }


    let values = [];


    if (
      Array.isArray(data)
    ) {

      values =
        data;

    }

    else if (
      Array.isArray(
        data.entities
      )
    ) {

      values =
        data.entities;

    }

    else if (
      Array.isArray(
        data.records
      )
    ) {

      values =
        data.records;

    }

    else if (
      Array.isArray(
        data.results
      )
    ) {

      values =
        data.results;

    }


    return values
      .map(
        (item, index) => {

          const attempts =
            Math.max(
              0,
              number(
                item?.attempted ??
                item?.attempts ??
                item?.totalAttempts
              )
            );


          const correct =
            Math.max(
              0,
              number(
                item?.correct ??
                item?.correctAnswers ??
                item?.correct_count
              )
            );


          const wrong =
            Math.max(
              0,
              number(
                item?.wrong ??
                item?.wrongAnswers ??
                item?.wrong_count
              )
            );


          const normalized =
            createNormalizedRecord(
              item,
              {
                attempts,
                correct,
                wrong
              },
              index
            );


          if (normalized) {

            normalized.source =
              "Vertical Slice";

          }


          return normalized;

        }
      )
      .filter(
        Boolean
      );

  }


  /* =======================================================
     LOAD ALL CANONICAL PERFORMANCE DATA
  ======================================================= */

  function loadAllRecords() {

    const testRecords =
      buildTestHistoryRecords();


    const verticalRecords =
      buildVerticalRecords();


    const aiRecords =
      buildUnifiedAIPracticeRecords();


    const revisionRecords =
      buildRevisionRetestRecords();


    /*
     * These sources represent different layers.
     *
     * Test History:
     *   scored PYQ / mock performance
     *
     * Vertical Slice:
     *   only contributes when it is not already represented
     *   by the other question-level sources
     *
     * AI Practice:
     *   detailed attempts OR bank aggregate
     *
     * Revision Retest:
     *   each history item is one retest event
     */

    const combined = [
      ...testRecords,
      ...aiRecords,
      ...revisionRecords
    ];


    /*
     * Vertical performance is an aggregate source. Include it
     * only for entities that have no question-level evidence.
     * This prevents the old aggregate from duplicating AI data.
     */

    const questionLevelEntities =
      new Set(
        combined
          .map(
            record =>
              normalizeKey(
                record.knowledge_entity
              )
          )
          .filter(Boolean)
      );


    verticalRecords.forEach(
      record => {

        const entityKey =
          normalizeKey(
            record.knowledge_entity
          );


        if (
          entityKey &&
          questionLevelEntities.has(
            entityKey
          )
        ) {

          return;

        }


        combined.push(
          record
        );

      }
    );


    return mergeRecords(
      combined
    );

  }


  /* =======================================================
     MERGE RECORDS WITHOUT DOUBLE-COUNTING SOURCES
  ======================================================= */

  function mergeRecords(
    source
  ) {

    const map =
      new Map();


    source.forEach(
      record => {

        /*
         * A question-level record is uniquely identified by its
         * question id. When no id exists, use its source-specific
         * question text/entity/concept combination.
         */

        const key =
          [
            normalizeKey(
              record.source || "unknown"
            ),
            normalizeKey(
              record.id
            ),
            normalizeKey(
              record.question
            ),
            normalizeKey(
              record.knowledge_entity
            ),
            normalizeKey(
              record.concept
            )
          ]
            .filter(Boolean)
            .join("|");


        if (
          !key
        ) {

          return;

        }


        if (
          !map.has(key)
        ) {

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


        /*
         * Keep the larger aggregate when two source records refer
         * to the same stored question.
         */

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
          record.unit &&
          !existing.unit
        ) {

          existing.unit =
            record.unit;

        }


        if (
          record.concept &&
          !existing.concept
        ) {

          existing.concept =
            record.concept;

        }


        if (
          record.knowledge_entity &&
          !existing.knowledge_entity
        ) {

          existing.knowledge_entity =
            record.knowledge_entity;

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
      .map(
        record => {

          const attempts =
            number(
              record.attempts
            );


          const correct =
            Math.min(
              attempts,
              Math.max(
                0,
                number(
                  record.correct_count
                )
              )
            );


          const wrong =
            Math.min(
              Math.max(
                0,
                attempts - correct
              ),
              Math.max(
                0,
                number(
                  record.wrong_count
                )
              )
            );


          return {

            ...record,

            correct_count:
              correct,

            wrong_count:
              wrong,

            accuracy:
              attempts > 0
                ? Math.round(
                    (
                      correct /
                      attempts
                    ) * 100
                  )
                : 0

          };

        }
      );

  }


  /* =======================================================
     KNOWLEDGE ANALYTICS
  ======================================================= */

  function buildKnowledgeSignals(
    source
  ) {

    const map =
      new Map();


    source
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


          if (
            !map.has(key)
          ) {

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

                wrong: 0

              }
            );

          }


          const item =
            map.get(key);


          item.attempts +=
            number(
              record.attempts
            );


          item.correct +=
            number(
              record.correct_count
            );


          item.wrong +=
            number(
              record.wrong_count
            );

        }
      );


    return Array.from(
      map.values()
    )
      .map(
        item => {

          item.accuracy =
            item.attempts > 0
              ? Math.round(
                  (
                    item.correct /
                    item.attempts
                  ) * 100
                )
              : 0;


          item.type =
            classifyKnowledge(
              item
            );


          item.priorityScore =
            calculatePriorityScore(
              item
            );


          return item;

        }
      );

  }


  /* =======================================================
     CLASSIFICATION
  ======================================================= */

  function classifyKnowledge(
    item
  ) {

    if (
      item.accuracy < 50 ||
      item.wrong >= 2
    ) {

      return "priority";

    }


    if (
      item.accuracy < 80 ||
      item.wrong >= 1
    ) {

      return "practice";

    }


    return "strong";

  }


  function calculatePriorityScore(
    item
  ) {

    let score =
      100 -
      number(
        item.accuracy
      );


    score +=
      number(
        item.wrong
      ) * 15;


    if (
      item.attempts >= 3
    ) {

      score += 5;

    }


    return score;

  }


  /* =======================================================
     UNIT ANALYTICS
  ======================================================= */

  function buildUnitSignals(
    source
  ) {

    const map =
      new Map();


    source
      .filter(
        record =>
          number(
            record.attempts
          ) > 0
      )
      .forEach(
        record => {

          const unit =
            record.unit ||
            "Unit not specified";


          if (
            !map.has(unit)
          ) {

            map.set(
              unit,
              {

                unit,

                attempts: 0,

                correct: 0,

                wrong: 0,

                concepts: 0

              }
            );

          }


          const item =
            map.get(unit);


          item.attempts +=
            number(
              record.attempts
            );


          item.correct +=
            number(
              record.correct_count
            );


          item.wrong +=
            number(
              record.wrong_count
            );

        }
      );


    return Array.from(
      map.values()
    )
      .map(
        item => {

          item.accuracy =
            item.attempts > 0
              ? Math.round(
                  (
                    item.correct /
                    item.attempts
                  ) * 100
                )
              : 0;


          return item;

        }
      )
      .sort(
        (a, b) =>
          a.unit.localeCompare(
            b.unit,
            undefined,
            {
              numeric: true
            }
          )
      );

  }


  /* =======================================================
     OVERALL PERFORMANCE
  ======================================================= */

  function calculateOverallPerformance(
    source
  ) {

    let attempts =
      0;


    let correct =
      0;


    let wrong =
      0;


    source.forEach(
      record => {

        attempts +=
          number(
            record.attempts
          );


        correct +=
          number(
            record.correct_count
          );


        wrong +=
          number(
            record.wrong_count
          );

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


  /* =======================================================
     READINESS SIGNAL
  ======================================================= */

  function calculateReadiness(
    overall,
    concepts,
    units
  ) {

    /*
     * This is a preparation signal, not a prediction
     * of examination outcome.
     */

    if (
      overall.attempts <= 0
    ) {

      return {

        score: 0,

        label:
          "Insufficient Data",

        description:
          "Complete more scored practice so the dashboard can build a meaningful preparation profile."

      };

    }


    const accuracyComponent =
      clamp(
        overall.accuracy,
        0,
        100
      );


    /*
     * Consistency rewards repeated practice,
     * but deliberately caps the contribution.
     */

    const consistencyComponent =
      clamp(
        overall.attempts * 4,
        0,
        20
      );


    /*
     * Coverage reflects the number of tracked
     * knowledge areas and units, with a modest cap.
     */

    const coverageComponent =
      clamp(
        (
          concepts.length * 4
        ) +
        (
          units.length * 3
        ),
        0,
        20
      );


    const priorityCount =
      concepts.filter(
        item =>
          item.type === "priority"
      ).length;


    const practiceCount =
      concepts.filter(
        item =>
          item.type === "practice"
      ).length;


    const weaknessPenalty =
      Math.min(
        20,
        (
          priorityCount * 5
        ) +
        (
          practiceCount * 2
        )
      );


    const rawScore =
      (
        accuracyComponent * 0.60
      ) +
      consistencyComponent +
      coverageComponent -
      weaknessPenalty;


    const score =
      Math.round(
        clamp(
          rawScore,
          0,
          100
        )
      );


    let label =
      "Building";


    let description =
      "";


    if (
      score >= 80
    ) {

      label =
        "Strong Preparation Signal";


      description =
        "Your recorded preparation data currently shows a stronger overall performance signal. Continue targeted revision and maintain practice.";

    } else if (
      score >= 65
    ) {

      label =
        "Developing Strongly";


      description =
        "Your preparation profile is developing well, while some concepts still require targeted practice or revision.";

    } else if (
      score >= 50
    ) {

      label =
        "Developing";


      description =
        "Your preparation profile is developing. Use the priority and adaptive recommendation areas to strengthen weaker concepts.";

    } else {

      label =
        "Foundation Building";


      description =
        "Your recorded data indicates that more focused practice and revision are needed before the preparation profile becomes stronger.";

    }


    return {

      score,

      label,

      description

    };

  }


  /* =======================================================
     UPDATE READINESS OVERVIEW
  ======================================================= */

  function updateReadinessOverview(
    overall,
    concepts,
    readiness
  ) {

    setText(
      "readinessScore",
      `${readiness.score}%`
    );


    setText(
      "readinessLabel",
      readiness.label
    );


    setText(
      "readinessDescription",
      readiness.description
    );


    setText(
      "overallAccuracy",
      `${overall.accuracy}%`
    );


    setText(
      "totalAttempts",
      overall.attempts
    );


    setText(
      "activeConcepts",
      concepts.length
    );


    const priorityCount =
      concepts.filter(
        item =>
          item.type === "priority" ||
          item.type === "practice"
      ).length;


    setText(
      "priorityAreas",
      priorityCount
    );

  }


  /* =======================================================
     UPDATE COMPONENTS
  ======================================================= */

  function updateComponentSignals(
    overall,
    concepts
  ) {

    const priority =
      concepts.filter(
        item =>
          item.type === "priority"
      ).length;


    const practice =
      concepts.filter(
        item =>
          item.type === "practice"
      ).length;


    const strong =
      concepts.filter(
        item =>
          item.type === "strong"
      ).length;


    setText(
      "performanceSignal",
      `${overall.accuracy}% accuracy`
    );


    setText(
      "conceptSignal",
      `${concepts.length} tracked area(s)`
    );


    setText(
      "revisionSignal",
      `${priority} priority • ${practice} practice`
    );


    setText(
      "adaptationSignal",
      `${strong} strong • ${practice} practice`
    );

  }


  /* =======================================================
     AREA BADGE
  ======================================================= */

  function getAreaClass(
    type
  ) {

    if (
      type === "priority"
    ) {

      return "priority";

    }


    if (
      type === "practice"
    ) {

      return "practice";

    }


    return "strong";

  }


  /* =======================================================
     RENDER PRIORITY AREAS
  ======================================================= */

  function renderPriorityAreas(
    concepts
  ) {

    const container =
      $("priorityAreasList");


    if (!container) {

      return;

    }


    const items =
      concepts
        .filter(
          item =>
            item.type === "priority" ||
            item.type === "practice"
        )
        .sort(
          (a, b) =>
            b.priorityScore -
            a.priorityScore
        );


    if (!items.length) {

      container.innerHTML = `

        <div class="empty-state">

          <div class="empty-state-icon">
            🎉
          </div>


          <h3>
            No current priority areas
          </h3>


          <p>
            No knowledge area is currently producing
            a strong revision or practice signal.
          </p>

        </div>

      `;

      return;

    }


    container.innerHTML =
      items
        .map(
          item => `

            <div
              class="
                area-item
                ${getAreaClass(item.type)}
              "
            >

              <div class="area-main">

                <div class="area-title">

                  ${escapeHtml(
                    item.knowledge_entity
                  )}

                </div>


                <div class="area-meta">

                  ${escapeHtml(
                    item.concept
                  )}

                  •

                  ${escapeHtml(
                    item.unit
                  )}

                </div>

              </div>


              <div class="area-stats">

                <div class="area-stat">

                  Accuracy:
                  <strong>
                    ${item.accuracy}%
                  </strong>

                </div>


                <div class="area-stat">

                  Attempts:
                  <strong>
                    ${item.attempts}
                  </strong>

                </div>


                <div class="area-stat">

                  Wrong:
                  <strong>
                    ${item.wrong}
                  </strong>

                </div>

              </div>

            </div>

          `
        )
        .join("");

  }


  /* =======================================================
     RENDER STRONG AREAS
  ======================================================= */

  function renderStrongAreas(
    concepts
  ) {

    const container =
      $("strongAreasList");


    if (!container) {

      return;

    }


    const items =
      concepts
        .filter(
          item =>
            item.type === "strong"
        )
        .sort(
          (a, b) =>
            b.accuracy -
            a.accuracy
        );


    if (!items.length) {

      container.innerHTML = `

        <div class="empty-state">

          <div class="empty-state-icon">
            📈
          </div>


          <h3>
            Strong areas are still developing
          </h3>


          <p>
            Continue practising. Stronger
            performance areas will appear here
            as enough data accumulates.
          </p>

        </div>

      `;

      return;

    }


    container.innerHTML =
      items
        .map(
          item => `

            <div class="area-item strong">

              <div class="area-main">

                <div class="area-title">

                  ${escapeHtml(
                    item.knowledge_entity
                  )}

                </div>


                <div class="area-meta">

                  ${escapeHtml(
                    item.concept
                  )}

                  •

                  ${escapeHtml(
                    item.unit
                  )}

                </div>

              </div>


              <div class="area-stats">

                <div class="area-stat">

                  Accuracy:
                  <strong>
                    ${item.accuracy}%
                  </strong>

                </div>


                <div class="area-stat">

                  Attempts:
                  <strong>
                    ${item.attempts}
                  </strong>

                </div>


                <div class="area-stat">

                  Correct:
                  <strong>
                    ${item.correct}
                  </strong>

                </div>

              </div>

            </div>

          `
        )
        .join("");

  }


  /* =======================================================
     RENDER UNIT PERFORMANCE
  ======================================================= */

  function renderUnitPerformance(
    units
  ) {

    const container =
      $("unitPerformance");


    if (!container) {

      return;

    }


    if (!units.length) {

      container.innerHTML = `

        <div class="empty-state">

          <div class="empty-state-icon">
            📚
          </div>


          <h3>
            Unit data not available yet
          </h3>


          <p>
            Unit-wise performance will appear once
            your recorded questions contain unit information.
          </p>

        </div>

      `;

      return;

    }


    container.innerHTML =
      units
        .map(
          item => `

            <div class="unit-row">

              <div class="unit-header">

                <span class="unit-name">

                  ${escapeHtml(
                    item.unit
                  )}

                </span>


                <span class="unit-score">

                  ${item.accuracy}%
                  •
                  ${item.attempts}
                  attempts

                </span>

              </div>


              <div class="unit-progress">

                <div
                  class="unit-progress-bar"
                  style="
                    width: ${clamp(
                      item.accuracy,
                      0,
                      100
                    )}%
                  "
                ></div>

              </div>

            </div>

          `
        )
        .join("");

  }


  /* =======================================================
     NEXT ACTION
  ======================================================= */

  function updateNextAction(
    concepts
  ) {

    const title =
      $("nextActionTitle");


    const description =
      $("nextActionDescription");


    if (
      !concepts.length
    ) {

      if (title) {

        title.textContent =
          "Start building your preparation profile";

      }


      if (description) {

        description.textContent =
          "Complete AI Practice questions so BAJEE JRF AI can identify your strengths, weaknesses and next study actions.";

      }


      return;

    }


    const priority =
      concepts
        .filter(
          item =>
            item.type === "priority"
        )
        .sort(
          (a, b) =>
            b.priorityScore -
            a.priorityScore
        )[0];


    const practice =
      concepts
        .filter(
          item =>
            item.type === "practice"
        )
        .sort(
          (a, b) =>
            a.accuracy -
            b.accuracy
        )[0];


    const strong =
      concepts
        .filter(
          item =>
            item.type === "strong"
        )
        .sort(
          (a, b) =>
            b.accuracy -
            a.accuracy
        )[0];


    if (priority) {

      if (title) {

        title.textContent =
          `Revise First: ${priority.knowledge_entity}`;

      }


      if (description) {

        description.textContent =
          `Focus on ${priority.concept} in ${priority.unit}, then use the Revision Retest loop to reassess your understanding.`;

      }


      return;

    }


    if (practice) {

      if (title) {

        title.textContent =
          `Practice More: ${practice.knowledge_entity}`;

      }


      if (description) {

        description.textContent =
          `Continue targeted practice on ${practice.concept} before moving heavily into new material.`;

      }


      return;

    }


    if (strong) {

      if (title) {

        title.textContent =
          `Maintain: ${strong.knowledge_entity}`;

      }


      if (description) {

        description.textContent =
          `${strong.concept} is currently showing stronger performance. Maintain it with periodic practice while focusing more time on weaker areas.`;

      }


      return;

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

      const overall =
        calculateOverallPerformance(
          records
        );

      status.textContent =
        `JRF preparation profile built from ${overall.attempts} recorded attempt(s).`;

    }


    if (storageStatus) {

      const overall =
        calculateOverallPerformance(
          records
        );

      storageStatus.textContent =
        `${overall.attempts} performance attempt(s), ${knowledgeSignals.length} knowledge area(s), and ${unitSignals.length} unit signal(s) analysed.`;

    }

  }


  /* =======================================================
     LOADING
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
        "Analysing your preparation profile...";

    }

  }


  /* =======================================================
     REFRESH DASHBOARD
  ======================================================= */

  function refreshDashboard() {

    showLoading();


    records =
      loadAllRecords();


    knowledgeSignals =
      buildKnowledgeSignals(
        records
      );


    unitSignals =
      buildUnitSignals(
        records
      );


    const overall =
      calculateOverallPerformance(
        records
      );


    readinessData =
      calculateReadiness(
        overall,
        knowledgeSignals,
        unitSignals
      );


    updateReadinessOverview(
      overall,
      knowledgeSignals,
      readinessData
    );


    updateComponentSignals(
      overall,
      knowledgeSignals
    );


    renderPriorityAreas(
      knowledgeSignals
    );


    renderStrongAreas(
      knowledgeSignals
    );


    renderUnitPerformance(
      unitSignals
    );


    updateNextAction(
      knowledgeSignals
    );


    updateEngineStatus();


    console.log(
      "BAJEE JRF AI — Step 9.7 JRF Readiness Dashboard ready."
    );


    console.log(
      "Overall performance:",
      overall
    );


    console.log(
      "Knowledge signals:",
      knowledgeSignals
    );


    console.log(
      "Unit signals:",
      unitSignals
    );


    console.log(
      "Readiness signal:",
      readinessData
    );

  }


  /* =======================================================
     EVENTS
  ======================================================= */

  function attachEvents() {

    const refresh =
      $("refreshReadiness");


    if (refresh) {

      refresh.addEventListener(
        "click",
        refreshDashboard
      );

    }

  }


  /* =======================================================
     INITIALIZE
  ======================================================= */

  function initialize() {

    attachEvents();

    refreshDashboard();

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