/* ============================================================
   BAJEE JRF AI
   STEP 5.0 — REVISION ENGINE

   Uses the SAME TEST HISTORY and QUESTION-LEVEL
   PERFORMANCE DATA used by Diagnosis.

   ZERO COST
   No API
   No Firebase
   No backend
   Uses browser localStorage
   ============================================================ */

"use strict";


/* ============================================================
   STORAGE
============================================================ */

const TEST_HISTORY_KEY =
  "bajee_jrf_ai_test_history_v1";


/* ============================================================
   REVISION RULES
============================================================ */

const REVISION_THRESHOLD = 50;


/* ============================================================
   DATABASES
============================================================ */

let pyqDatabase = [];
let mappings = [];
let knowledgeDatabase = [];
let testHistory = [];


/* ============================================================
   BASIC UTILITIES
============================================================ */

function safeNumber(value) {

  const n = Number(value);

  return Number.isFinite(n) ? n : 0;

}


function safeArray(value) {

  return Array.isArray(value) ? value : [];

}


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* ============================================================
   LOAD DATABASES
============================================================ */

async function loadDatabases() {

  try {

    const responses =
      await Promise.all([

        fetch("../data/pyqs/pyq-database.json"),

        fetch("../data/pyqs/pyq-knowledge-map.json"),

        fetch("../data/knowledge/knowledge-entities.json")

      ]);


    if (
      !responses[0].ok ||
      !responses[1].ok ||
      !responses[2].ok
    ) {

      throw new Error(
        "Could not load revision databases."
      );

    }


    const pyqData =
      await responses[0].json();


    const mappingData =
      await responses[1].json();


    const knowledgeData =
      await responses[2].json();


    /* --------------------------------------------------------
       PYQ DATABASE
    -------------------------------------------------------- */

    if (
      Array.isArray(
        pyqData.questions
      )
    ) {

      pyqDatabase =
        pyqData.questions;

    }

    else if (
      Array.isArray(
        pyqData
      )
    ) {

      pyqDatabase =
        pyqData;

    }


    /* --------------------------------------------------------
       MAPPINGS
    -------------------------------------------------------- */

    if (
      Array.isArray(
        mappingData.mappings
      )
    ) {

      mappings =
        mappingData.mappings;

    }

    else if (
      Array.isArray(
        mappingData
      )
    ) {

      mappings =
        mappingData;

    }


    /* --------------------------------------------------------
       KNOWLEDGE DATABASE
    -------------------------------------------------------- */

    if (
      Array.isArray(
        knowledgeData.entities
      )
    ) {

      knowledgeDatabase =
        knowledgeData.entities;

    }

    else if (
      Array.isArray(
        knowledgeData
      )
    ) {

      knowledgeDatabase =
        knowledgeData;

    }


    /* --------------------------------------------------------
       LOAD TEST HISTORY
    -------------------------------------------------------- */

    loadTestHistory();


    /* --------------------------------------------------------
       BUILD REVISION DATA
    -------------------------------------------------------- */

    const records =
      buildKnowledgeStats();


    const queue =
      buildRevisionQueue(
        records
      );


    updateStatistics(
      records,
      queue
    );


    renderRevisionQueue(
      queue
    );


    console.log(
      "BAJEE JRF AI: Step 5.0 loaded successfully."
    );


    console.log(
      "PYQs:",
      pyqDatabase.length
    );


    console.log(
      "Mappings:",
      mappings.length
    );


    console.log(
      "Knowledge entities:",
      knowledgeDatabase.length
    );


    console.log(
      "Tests:",
      testHistory.length
    );


    console.log(
      "Knowledge performance:",
      records
    );


    console.log(
      "Revision queue:",
      queue
    );

  }

  catch (error) {

    console.error(
      "BAJEE JRF AI: Revision loading error:",
      error
    );


    const container =
      document.getElementById(
        "revisionQueue"
      );


    if (container) {

      container.innerHTML = `

        <div class="alert alert-danger">

          <strong>
            Revision Engine Error
          </strong>

          <div class="small mt-2">

            ${escapeHTML(
              error.message
            )}

          </div>

        </div>

      `;

    }

  }

}


/* ============================================================
   LOAD TEST HISTORY
============================================================ */

function loadTestHistory() {

  testHistory = [];


  try {

    const stored =
      localStorage.getItem(
        TEST_HISTORY_KEY
      );


    if (!stored) {

      console.warn(
        "BAJEE JRF AI: No test history found."
      );

      return;

    }


    const parsed =
      JSON.parse(
        stored
      );


    if (
      Array.isArray(
        parsed
      )
    ) {

      testHistory =
        parsed;

    }


    console.log(
      "BAJEE JRF AI: Test history loaded:",
      testHistory
    );

  }

  catch (error) {

    console.error(
      "BAJEE JRF AI: Could not read test history:",
      error
    );

  }

}


/* ============================================================
   FIND PYQ MAPPING
============================================================ */

function findMapping(
  questionId
) {

  return mappings.find(
    mapping =>
      String(
        mapping.pyq_id
      ) ===
      String(
        questionId
      )
  ) || null;

}


/* ============================================================
   BUILD KNOWLEDGE PERFORMANCE

   IMPORTANT:

   This follows the SAME LOGIC used by Diagnosis.

   Every question_result is connected to its
   knowledge_entities through pyq-knowledge-map.json.

   Performance is aggregated across ALL completed tests.
============================================================ */

function buildKnowledgeStats() {

  const stats = {};


  /* ----------------------------------------------------------
     LOOP THROUGH ALL TESTS
  ---------------------------------------------------------- */

  testHistory.forEach(
    test => {

      /*
         Old test records may not contain
         question_results.

         They cannot be used for knowledge-level
         diagnosis.
      */

      if (
        !Array.isArray(
          test.question_results
        )
      ) {

        return;

      }


      /* ------------------------------------------------------
         LOOP THROUGH QUESTION RESULTS
      ------------------------------------------------------ */

      test.question_results.forEach(
        result => {

          const mapping =
            findMapping(
              result.question_id
            );


          if (!mapping) {

            console.warn(
              "BAJEE JRF AI: No mapping found for question:",
              result.question_id
            );

            return;

          }


          const entities =
            Array.isArray(
              mapping.knowledge_entities
            )

              ? mapping.knowledge_entities

              : [];


          /* --------------------------------------------------
             EACH KNOWLEDGE ENTITY
          -------------------------------------------------- */

          entities.forEach(
            entityName => {

              if (
                !stats[entityName]
              ) {

                stats[entityName] = {

                  name:
                    entityName,

                  attempted:
                    0,

                  correct:
                    0,

                  wrong:
                    0,

                  unanswered:
                    0,

                  units:
                    new Set(),

                  concepts:
                    new Set(),

                  questionIds:
                    new Set(),

                  lastAttempt:
                    ""

                };

              }


              const item =
                stats[entityName];


              /* ----------------------------------------------
                 QUESTION
              ---------------------------------------------- */

              item.questionIds.add(
                String(
                  result.question_id
                )
              );


              /*
                 Every question connected to the
                 entity counts as an attempt.
              */

              item.attempted++;


              /* ----------------------------------------------
                 ANSWER RESULT
              ---------------------------------------------- */

              if (
                result.is_correct === true
              ) {

                item.correct++;

              }

              else if (
                result.answered === true
              ) {

                item.wrong++;

              }

              else {

                item.unanswered++;

              }


              /* ----------------------------------------------
                 UNIT
              ---------------------------------------------- */

              if (
                Array.isArray(
                  mapping.units
                )
              ) {

                mapping.units.forEach(
                  unit => {

                    item.units.add(
                      String(unit)
                    );

                  }
                );

              }


              /* ----------------------------------------------
                 CONCEPT
              ---------------------------------------------- */

              if (
                Array.isArray(
                  mapping.concepts
                )
              ) {

                mapping.concepts.forEach(
                  concept => {

                    item.concepts.add(
                      String(concept)
                    );

                  }
                );

              }


              /* ----------------------------------------------
                 LAST ATTEMPT
              ---------------------------------------------- */

              if (
                test.date
              ) {

                item.lastAttempt =
                  test.date;

              }

            }
          );

        }
      );

    }
  );


  /* ----------------------------------------------------------
     CONVERT SETS → ARRAYS
  ---------------------------------------------------------- */

  return Object.values(
    stats
  )
    .map(
      item => {

        const accuracy =
          item.attempted > 0

            ? Math.round(
                (
                  item.correct /
                  item.attempted
                ) * 100
              )

            : 0;


        return {

          name:
            item.name,

          attempted:
            item.attempted,

          correct:
            item.correct,

          wrong:
            item.wrong,

          unanswered:
            item.unanswered,

          accuracy,

          units:
            [...item.units],

          concepts:
            [...item.concepts],

          questionIds:
            [...item.questionIds],

          lastAttempt:
            item.lastAttempt

        };

      }
    )
    .filter(
      item =>
        item.attempted > 0
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
   PRIORITY
============================================================ */

function getPriority(
  record
) {

  if (
    record.attempted === 0
  ) {

    return {

      level:
        "none",

      label:
        "NOT ATTEMPTED",

      score:
        0

    };

  }


  /*
     HIGH PRIORITY

     Below 50%
     OR
     2 or more wrong answers
  */

  if (
    record.accuracy < 50 ||
    record.wrong >= 2
  ) {

    return {

      level:
        "high",

      label:
        "HIGH PRIORITY",

      score:
        3

    };

  }


  /*
     EXACTLY 50%

     Keep in revision.
  */

  if (
    record.accuracy === 50
  ) {

    return {

      level:
        "medium",

      label:
        "MEDIUM PRIORITY",

      score:
        2

    };

  }


  /*
     51–74%
  */

  if (
    record.accuracy < 75
  ) {

    return {

      level:
        "low",

      label:
        "LOW PRIORITY",

      score:
        1

    };

  }


  /*
     75%+
  */

  return {

    level:
      "stable",

    label:
      "STABLE",

    score:
      0

  };

}


/* ============================================================
   BUILD REVISION QUEUE
============================================================ */

function buildRevisionQueue(
  records
) {

  return records

    .filter(
      record => {

        /*
           Revision is required when:

           Accuracy <= 50%

           OR

           2+ wrong answers.
        */

        return (

          record.attempted > 0 &&

          (

            record.accuracy <=
              REVISION_THRESHOLD

            ||

            record.wrong >= 2

          )

        );

      }
    )

    .map(
      record => ({

        ...record,

        priority:
          getPriority(
            record
          )

      })
    )

    .sort(
      (
        a,
        b
      ) => {

        /*
           1. Priority
        */

        if (
          a.priority.score !==
          b.priority.score
        ) {

          return (
            b.priority.score -
            a.priority.score
          );

        }


        /*
           2. Lower accuracy first
        */

        if (
          a.accuracy !==
          b.accuracy
        ) {

          return (
            a.accuracy -
            b.accuracy
          );

        }


        /*
           3. More wrong answers first
        */

        if (
          a.wrong !==
          b.wrong
        ) {

          return (
            b.wrong -
            a.wrong
          );

        }


        /*
           4. More attempts first
        */

        return (
          b.attempted -
          a.attempted
        );

      }
    );

}


/* ============================================================
   STATISTICS
============================================================ */

function updateStatistics(
  records,
  queue
) {

  const revisionCount =
    document.getElementById(
      "revisionCount"
    );


  const highPriority =
    document.getElementById(
      "highPriority"
    );


  const attemptedEntities =
    document.getElementById(
      "attemptedEntities"
    );


  const readyToRevise =
    document.getElementById(
      "readyToRevise"
    );


  const revisionBadge =
    document.getElementById(
      "revisionBadge"
    );


  if (
    revisionCount
  ) {

    revisionCount.textContent =
      queue.length;

  }


  if (
    highPriority
  ) {

    highPriority.textContent =
      queue.filter(
        item =>
          item.priority.level ===
          "high"
      ).length;

  }


  if (
    attemptedEntities
  ) {

    attemptedEntities.textContent =
      records.filter(
        item =>
          item.attempted > 0
      ).length;

  }


  if (
    readyToRevise
  ) {

    readyToRevise.textContent =
      queue.length;

  }


  if (
    revisionBadge
  ) {

    revisionBadge.textContent =
      `${queue.length} ${
        queue.length === 1
          ? "item"
          : "items"
      }`;


    if (
      queue.length > 0
    ) {

      revisionBadge.className =
        "badge rounded-pill bg-danger";

    }

    else {

      revisionBadge.className =
        "badge rounded-pill bg-success";

    }

  }

}


/* ============================================================
   EMPTY STATE
============================================================ */

function renderEmptyState() {

  const container =
    document.getElementById(
      "revisionQueue"
    );


  if (
    !container
  ) {

    return;

  }


  container.innerHTML = `

    <div class="empty-state">

      <div class="empty-icon">
        🎉
      </div>

      <h5 class="mb-2">
        No weak knowledge detected.
      </h5>

      <p class="small mb-0">
        Your current recorded performance does not
        require automatic revision yet.
      </p>

    </div>

  `;

}


/* ============================================================
   FIND CONNECTED PYQ
============================================================ */

function getConnectedPYQ(
  item
) {

  if (
    !item ||
    !Array.isArray(
      item.questionIds
    )
  ) {

    return null;

  }


  /*
     Prefer the latest question.
  */

  const questionId =
    item.questionIds[
      item.questionIds.length - 1
    ];


  return pyqDatabase.find(
    question => {

      const id =
        question.id ||
        question.pyq_id ||
        question.question_id;


      return (
        String(id) ===
        String(questionId)
      );

    }
  ) || null;

}


/* ============================================================
   RENDER REVISION QUEUE
============================================================ */

function renderRevisionQueue(
  queue
) {

  const container =
    document.getElementById(
      "revisionQueue"
    );


  if (
    !container
  ) {

    console.error(
      "BAJEE JRF AI: #revisionQueue not found."
    );

    return;

  }


  if (
    queue.length === 0
  ) {

    renderEmptyState();

    return;

  }


  container.innerHTML =
    queue
      .map(
        (
          item,
          index
        ) => {

          const priorityClass =
            item.priority.level;


          const priorityBadgeClass =
            item.priority.level === "high"

              ? "priority-high"

              : item.priority.level === "medium"

                ? "priority-medium"

                : "priority-low";


          /* --------------------------------------------------
             CONCEPTS
          -------------------------------------------------- */

          const conceptsHTML =
            item.concepts.length

              ? item.concepts
                  .map(
                    concept => `

                      <span class="concept-badge">

                        ${escapeHTML(
                          concept
                        )}

                      </span>

                    `
                  )
                  .join("")

              : "";


          /* --------------------------------------------------
             UNITS
          -------------------------------------------------- */

          const unitHTML =
            item.units.length

              ? item.units
                  .map(
                    unit => `

                      <span class="unit-badge">

                        ${escapeHTML(
                          unit
                        )}

                      </span>

                    `
                  )
                  .join("")

              : "";


          /* --------------------------------------------------
             CONNECTED PYQ
          -------------------------------------------------- */

          const connectedPYQ =
            getConnectedPYQ(
              item
            );


          const pyqHTML =
            connectedPYQ

              ? `

                <div class="mt-3">

                  <div class="small fw-semibold mb-1">

                    🔗 Connected PYQ

                  </div>

                  <div class="small text-secondary">

                    ${escapeHTML(
                      connectedPYQ.question ||
                      connectedPYQ.text ||
                      connectedPYQ.question_text ||
                      "Connected PYQ available"
                    )}

                  </div>

                </div>

              `

              : "";


          /* --------------------------------------------------
             CARD
          -------------------------------------------------- */

          return `

            <div
              class="revision-card ${priorityClass}"
              data-revision-index="${index}"
            >

              <!-- HEADER -->

              <div
                class="
                  d-flex
                  justify-content-between
                  align-items-start
                  flex-wrap
                  gap-2
                "
              >

                <div>

                  <div class="entity-name">

                    ${escapeHTML(
                      item.name
                    )}

                  </div>

                  <div class="entity-subtitle">

                    Knowledge Entity

                  </div>

                </div>


                <span
                  class="
                    priority-badge
                    ${priorityBadgeClass}
                  "
                >

                  ${escapeHTML(
                    item.priority.label
                  )}

                </span>

              </div>


              <!-- METRICS -->

              <div class="row text-center mt-4">

                <div class="col-4">

                  <div class="metric-number">

                    ${item.accuracy}%

                  </div>

                  <div class="metric-label">

                    Accuracy

                  </div>

                </div>


                <div class="col-4">

                  <div class="metric-number">

                    ${item.attempted}

                  </div>

                  <div class="metric-label">

                    Attempted

                  </div>

                </div>


                <div class="col-4">

                  <div class="metric-number text-danger">

                    ${item.wrong}

                  </div>

                  <div class="metric-label">

                    Wrong

                  </div>

                </div>

              </div>


              <hr>


              <!-- WHY REVISE -->

              <div class="mb-3">

                <div class="fw-semibold mb-1">

                  Why revise?

                </div>

                <div class="small text-secondary">

                  Your aggregated accuracy for

                  <strong>
                    ${escapeHTML(
                      item.name
                    )}
                  </strong>

                  is currently

                  <strong>
                    ${item.accuracy}%
                  </strong>.

                  Review the core concept,
                  then retry the connected PYQ.

                </div>

              </div>


              <!-- UNITS -->

              ${
                unitHTML

                  ? `

                    <div class="mb-2">

                      ${unitHTML}

                    </div>

                  `

                  : ""
              }


              <!-- CONCEPTS -->

              ${
                conceptsHTML

                  ? `

                    <div class="mb-3">

                      <div class="small fw-semibold mb-1">

                        Concepts

                      </div>

                      ${conceptsHTML}

                    </div>

                  `

                  : ""
              }


              <!-- CONNECTED PYQ -->

              ${pyqHTML}


              <!-- ACTIONS -->

              <div
                class="
                  d-flex
                  gap-2
                  flex-wrap
                  mt-3
                "
              >

                <button
                  type="button"
                  class="
                    btn
                    btn-sm
                    btn-navy
                    revision-retry-btn
                  "
                  data-entity="${escapeHTML(
                    item.name
                  )}"
                >

                  🔄 Retry PYQ

                </button>


                <button
                  type="button"
                  class="
                    btn
                    btn-sm
                    btn-outline-secondary
                    revision-knowledge-btn
                  "
                  data-entity="${escapeHTML(
                    item.name
                  )}"
                >

                  📚 View Knowledge

                </button>

              </div>

            </div>

          `;

        }
      )
      .join("");


  attachActions();

}


/* ============================================================
   ACTION BUTTONS
============================================================ */

function attachActions() {


  /* ----------------------------------------------------------
     RETRY PYQ
  ---------------------------------------------------------- */

  document
    .querySelectorAll(
      ".revision-retry-btn"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          function () {

            const entity =
              this.dataset.entity || "";


            console.log(
              "BAJEE JRF AI: Retrying:",
              entity
            );


            const url =
              "vertical-slice.html?revision=" +
              encodeURIComponent(
                entity
              );


            window.location.href =
              url;

          }
        );

      }
    );


  /* ----------------------------------------------------------
     VIEW KNOWLEDGE
  ---------------------------------------------------------- */

  document
    .querySelectorAll(
      ".revision-knowledge-btn"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          function () {

            const entity =
              this.dataset.entity || "";


            console.log(
              "BAJEE JRF AI: Opening knowledge:",
              entity
            );


            const url =
              "knowledge-structure.html?entity=" +
              encodeURIComponent(
                entity
              );


            window.location.href =
              url;

          }
        );

      }
    );

}


/* ============================================================
   REFRESH
============================================================ */

function refreshRevisionPage() {

  console.log(
    "BAJEE JRF AI: Refreshing revision queue..."
  );


  loadTestHistory();


  const records =
    buildKnowledgeStats();


  const queue =
    buildRevisionQueue(
      records
    );


  updateStatistics(
    records,
    queue
  );


  renderRevisionQueue(
    queue
  );

}


/* ============================================================
   REFRESH BUTTON
============================================================ */

function setupRefreshButton() {

  const button =
    document.getElementById(
      "refreshRevision"
    );


  if (
    !button
  ) {

    console.warn(
      "BAJEE JRF AI: Refresh button not found."
    );

    return;

  }


  button.addEventListener(
    "click",
    function () {

      refreshRevisionPage();

    }
  );

}


/* ============================================================
   START
============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    console.log(
      "=========================================="
    );

    console.log(
      "BAJEE JRF AI"
    );

    console.log(
      "STEP 5.0 — REVISION ENGINE"
    );

    console.log(
      "=========================================="
    );


    setupRefreshButton();


    loadDatabases();

  }
);
