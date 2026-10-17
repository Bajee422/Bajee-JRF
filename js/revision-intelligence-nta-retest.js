/* ============================================================
   BAJEE JRF AI
   PHASE 9.4 — NTA RETEST DATA RESOLUTION PATCH

   Purpose:
   Fix "Retest data unavailable" for NTA revision items when
   Revision Intelligence has performance data but the original
   question's options/correct answer were not attached.

   Strategy:
   1. Read NTA intelligence history.
   2. Read the question text shown in the revision queue.
   3. Resolve the full question from the local PYQ database.
   4. Match by question ID first, then by normalized question text.
   5. Preserve the original NTA questionId when saving the retest item.
   6. Never invent options or answers.
   7. Keep everything browser-local / zero-cost.
============================================================ */

(() => {

  "use strict";

  const NTA_HISTORY_KEY =
    "bajee_jrf_intelligence_history_v1";

  const RETEST_KEY =
    "bajee_revision_retest_item";

  /*
   * Try the canonical database first, then the current Paper I /
   * Paper II database filenames used by the project.
   */
  const PYQ_DATABASE_URLS = [
    "data/pyqs/pyq-database.json"
  ];

  /*
   * One source-resolution correction for the June 2026 Paper II
   * Question 3 record. The production database currently stores
   * this question with options but no correct answer. The supplied
   * chronology resolves the sequence as B, D, C, A (option C).
   * This is used only for Revision Retest; it does NOT mark the
   * question as officially NTA-validated or exam-eligible.
   */
  const RETEST_CORRECTIONS = {
    "ENG-PYQ-LIMITLESS-JUNE2026-003": {
      correct_answer: "C",
      answer_text: "B, D, C, A",
      explanation:
        "The chronological order supported by the supplied source chronology is B, D, C, A: The Shoemaker's Holiday, Old Fortunatus, The Honest Whore, and A Woman Killed with Kindness. This is a source-derived revision/retest resolution and is not claimed as an official NTA final-key confirmation."
    }
  };

  let questionIndex = null;
  let patchStarted = false;

  function safeText(value) {
    return String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeText(value) {
    return safeText(value)
      .toLowerCase()
      .replace(/[“”‘’]/g, "'")
      .replace(/[^\p{L}\p{N}\s']/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch (error) {
      console.warn(
        "NTA Retest Patch: unable to read",
        key,
        error
      );
      return fallback;
    }
  }

  function extractHistoryRows() {

    const history =
      readJson(
        NTA_HISTORY_KEY,
        []
      );

    const exams =
      Array.isArray(history)
        ? history
        : [];

    const rows = [];

    exams.forEach(exam => {

      if (!exam || typeof exam !== "object") {
        return;
      }

      const examRows =
        Array.isArray(exam.rows)
          ? exam.rows
          : [];

      examRows.forEach(row => {

        if (!row || typeof row !== "object") {
          return;
        }

        rows.push({
          questionId:
            safeText(
              row.questionId ||
              row.question_id ||
              row.id
            ),

          questionText:
            safeText(
              row.questionText ||
              row.question ||
              row.question_text
            ),

          paper:
            safeText(
              row.paper ||
              exam.paperLabel ||
              exam.paper
            ),

          unit:
            safeText(
              row.unitName ||
              row.unit
            ),

          selected:
            safeText(
              row.selected
            ),

          correctAnswer:
            safeText(
              row.correctAnswer ||
              row.correct_answer
            ),

          status:
            safeText(
              row.status
            )
        });

      });

    });

    return rows;
  }

  async function loadQuestionIndex() {

    if (questionIndex) {
      return questionIndex;
    }

    const byId = new Map();
    const byText = new Map();

    for (const url of PYQ_DATABASE_URLS) {

      try {

        const response =
          await fetch(
            url,
            {
              cache: "no-store"
            }
          );

        if (!response.ok) {
          continue;
        }

        const data =
          await response.json();

        const questions =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.questions)
              ? data.questions
              : [];

        questions.forEach(question => {

          if (
            !question ||
            typeof question !== "object"
          ) {
            return;
          }

          const id =
            safeText(
              question.id ||
              question.questionId ||
              question.question_id
            );

          const text =
            safeText(
              question.question ||
              question.questionText ||
              question.question_text
            );

          const normalized =
            normalizeText(text);

          /*
           * Do not replace an already indexed question with a
           * later duplicate. The first local database match
           * remains the source of truth.
           */
          if (id && !byId.has(id)) {
            byId.set(id, question);
          }

          if (
            normalized &&
            !byText.has(normalized)
          ) {
            byText.set(normalized, question);
          }

        });

      } catch (error) {

        console.warn(
          "NTA Retest Patch: database could not be loaded:",
          url,
          error
        );

      }

    }

    questionIndex = {
      byId,
      byText
    };

    console.log(
      "NTA Retest Patch: PYQ questions indexed:",
      byId.size
    );

    return questionIndex;
  }

  function hasCompleteQuestion(question) {

    if (
      !question ||
      typeof question !== "object"
    ) {
      return false;
    }

    const options =
      question.options;

    const hasOptions =
      options &&
      typeof options === "object" &&
      ["A", "B", "C", "D"].every(
        key =>
          safeText(options[key]).length > 0
      );

    const questionId =
      safeText(
        question.id ||
        question.questionId ||
        question.question_id
      );

    const correction =
      RETEST_CORRECTIONS[questionId];

    const correct =
      safeText(
        question.correct_answer ||
        question.correctAnswer ||
        correction?.correct_answer
      );

    return Boolean(
      hasOptions &&
      correct
    );
  }

  function findOriginalNtaRow(questionText) {

    const target =
      normalizeText(questionText);

    if (!target) {
      return null;
    }

    const rows =
      extractHistoryRows();

    return (
      rows.find(
        row =>
          normalizeText(
            row.questionText
          ) === target
      ) || null
    );
  }

  function buildRetestItem(
    databaseQuestion,
    displayedQuestion
  ) {

    const originalNta =
      findOriginalNtaRow(
        displayedQuestion
      );

    /*
     * Preserve the NTA question ID when possible.
     * This is important because the retest result must remain
     * connected to the same NTA performance record.
     */
    const id =
      safeText(
        originalNta?.questionId ||
        databaseQuestion.id ||
        databaseQuestion.questionId ||
        databaseQuestion.question_id ||
        displayedQuestion
      );

    const options =
      databaseQuestion.options || {
        A: databaseQuestion.A,
        B: databaseQuestion.B,
        C: databaseQuestion.C,
        D: databaseQuestion.D
      };

    const databaseId =
      safeText(
        databaseQuestion.id ||
        databaseQuestion.questionId ||
        databaseQuestion.question_id
      );

    const correction =
      RETEST_CORRECTIONS[databaseId] || {};

    return {

      id,

      questionData: {
        ...databaseQuestion,
        id,
        correct_answer:
          correction.correct_answer ||
          databaseQuestion.correct_answer,
        answer_text:
          correction.answer_text ||
          databaseQuestion.answer_text,
        explanation:
          correction.explanation ||
          databaseQuestion.explanation,
        source_type:
          "NTA Examination",
        retest_resolution:
          correction.correct_answer
            ? "source_chronology_review"
            : undefined
      },

      question:
        safeText(
          databaseQuestion.question ||
          databaseQuestion.questionText ||
          displayedQuestion
        ),

      options,

      correct_answer:
        safeText(
          correction.correct_answer ||
          databaseQuestion.correct_answer ||
          databaseQuestion.correctAnswer
        ),

      answer_text:
        safeText(
          correction.answer_text ||
          databaseQuestion.answer_text ||
          databaseQuestion.answerText
        ),

      explanation:
        safeText(
          correction.explanation ||
          databaseQuestion.explanation
        ),

      solution:
        databaseQuestion.solution || {},

      knowledge_entity:
        safeText(
          databaseQuestion.knowledge_entity ||
          (
            Array.isArray(
              databaseQuestion.knowledge_entities
            )
              ? databaseQuestion.knowledge_entities[0]
              : ""
          )
        ),

      concept:
        safeText(
          databaseQuestion.concept ||
          (
            Array.isArray(
              databaseQuestion.concepts
            )
              ? databaseQuestion.concepts.join(", ")
              : ""
          )
        ),

      unit:
        safeText(
          databaseQuestion.unit
        ),

      difficulty:
        safeText(
          databaseQuestion.difficulty ||
          "NTA"
        ),

      source_type:
        "NTA Examination",

      attempts: 0,
      correct_count: 0,
      wrong_count: 0,
      accuracy: 0,
      priority: "high"

    };
  }

  function getDisplayedQuestion(article) {

    const block =
      article.querySelector(
        ".small.text-secondary.mt-3"
      );

    if (!block) {
      return "";
    }

    const clone =
      block.cloneNode(true);

    const strong =
      clone.querySelector("strong");

    if (strong) {
      strong.remove();
    }

    return safeText(
      clone.textContent
    );
  }

  async function enableNtaRetestButtons() {

    const disabledButtons =
      Array.from(
        document.querySelectorAll(
          'button[disabled][title="Question data is not available for retest."]'
        )
      );

    if (!disabledButtons.length) {
      return;
    }

    const index =
      await loadQuestionIndex();

    if (
      !index ||
      (
        index.byId.size === 0 &&
        index.byText.size === 0
      )
    ) {
      console.warn(
        "NTA Retest Patch: no PYQ database questions were available."
      );
      return;
    }

    let enabledCount = 0;

    disabledButtons.forEach(button => {

      const article =
        button.closest(
          ".revision-item"
        );

      if (!article) {
        return;
      }

      const questionText =
        getDisplayedQuestion(
          article
        );

      if (!questionText) {
        return;
      }

      const originalNta =
        findOriginalNtaRow(
          questionText
        );

      let databaseQuestion = null;

      if (
        originalNta?.questionId &&
        index.byId.has(
          originalNta.questionId
        )
      ) {
        databaseQuestion =
          index.byId.get(
            originalNta.questionId
          );
      }

      if (!databaseQuestion) {
        databaseQuestion =
          index.byText.get(
            normalizeText(
              questionText
            )
          ) || null;
      }

      if (
        !hasCompleteQuestion(
          databaseQuestion
        )
      ) {
        return;
      }

      const replacement =
        document.createElement(
          "button"
        );

      replacement.type = "button";
      replacement.className =
        "btn btn-retry";

      replacement.textContent =
        "🔄 Retry Practice";

      replacement.title =
        "Retest this NTA question";

      replacement.addEventListener(
        "click",
        () => {

          const item =
            buildRetestItem(
              databaseQuestion,
              questionText
            );

          try {

            localStorage.setItem(
              RETEST_KEY,
              JSON.stringify(item)
            );

            console.log(
              "NTA Retest Patch: retest item prepared:",
              {
                id: item.id,
                question: item.question
              }
            );

            window.location.href =
              "revision-retest.html";

          } catch (error) {

            console.error(
              "NTA Retest Patch: unable to save retest item.",
              error
            );

            alert(
              "The NTA question could not be prepared for retesting."
            );

          }

        }
      );

      button.replaceWith(
        replacement
      );

      enabledCount += 1;

    });

    if (enabledCount > 0) {

      console.log(
        "NTA Retest Patch: enabled",
        enabledCount,
        "NTA retest question(s)."
      );

    }
  }

  function startPatch() {

    if (patchStarted) {
      return;
    }

    patchStarted = true;

    /*
     * The original Revision Intelligence script is async, so
     * give it time to render and also watch for later refreshes.
     */
    setTimeout(
      enableNtaRetestButtons,
      250
    );

    setTimeout(
      enableNtaRetestButtons,
      1000
    );

    setTimeout(
      enableNtaRetestButtons,
      2000
    );

    const observer =
      new MutationObserver(
        () => {
          enableNtaRetestButtons();
        }
      );

    const queue =
      document.getElementById(
        "revisionQueue"
      );

    if (queue) {
      observer.observe(
        queue,
        {
          childList: true,
          subtree: true
        }
      );
    }

    console.log(
      "BAJEE JRF AI — NTA Retest Data Resolution Patch ready."
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      startPatch
    );

  } else {

    startPatch();

  }

})();
