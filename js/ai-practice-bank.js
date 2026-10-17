/* =========================================================
   BAJEE JRF AI
   AI PRACTICE BANK
   STEP 8.6
   PERFORMANCE TRACKING
   ========================================================= */

const STORAGE_KEY = "bajee_ai_practice_bank";

let practiceBank = [];
let filteredQuestions = [];
let answeredThisSession = 0;
let currentModalQuestion = null;
let modalAnswered = false;


/* =========================================================
   LOAD PRACTICE BANK
========================================================= */

function loadPracticeBank() {

    try {

        practiceBank =
            JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            ) || [];

    } catch (error) {

        console.error(
            "Unable to load AI Practice Bank:",
            error
        );

        practiceBank = [];
    }


    /*
       Add performance fields to older saved questions.
    */

    practiceBank = practiceBank.map(question => {

        if (
            typeof question !== "object" ||
            question === null
        ) {
            return question;
        }


        return {

            ...question,

            attempts:
                Number(
                    question.attempts || 0
                ),

            correct_count:
                Number(
                    question.correct_count || 0
                ),

            wrong_count:
                Number(
                    question.wrong_count || 0
                ),

            last_answer:
                question.last_answer || "",

            last_attempted_at:
                question.last_attempted_at || ""
        };
    });


    /*
       Newest saved questions first.
    */

    practiceBank.sort((a, b) => {

        const dateA =
            new Date(
                a.saved_at || 0
            ).getTime();

        const dateB =
            new Date(
                b.saved_at || 0
            ).getTime();

        return dateB - dateA;
    });


    savePracticeBank();
}


/* =========================================================
   SAVE PRACTICE BANK
========================================================= */

function savePracticeBank() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(practiceBank)
    );
}


/* =========================================================
   GET PRACTICE STATISTICS
========================================================= */

function getPracticeStatistics() {

    let attempts = 0;
    let correct = 0;
    let wrong = 0;


    practiceBank.forEach(question => {

        attempts +=
            Number(
                question.attempts || 0
            );


        correct +=
            Number(
                question.correct_count || 0
            );


        wrong +=
            Number(
                question.wrong_count || 0
            );
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


/* =========================================================
   RECORD QUESTION ATTEMPT
========================================================= */

function recordAttempt(
    question,
    selected,
    correct
) {

    if (!question) {
        return;
    }


    question.attempts =
        Number(
            question.attempts || 0
        ) + 1;


    if (selected === correct) {

        question.correct_count =
            Number(
                question.correct_count || 0
            ) + 1;

    } else {

        question.wrong_count =
            Number(
                question.wrong_count || 0
            ) + 1;
    }


    question.last_answer =
        selected;


    question.last_attempted_at =
        new Date().toISOString();


    savePracticeBank();
}


/* =========================================================
   FILTER QUESTIONS
========================================================= */

function filterQuestions() {

    const search =
        document
            .getElementById("searchInput")
            ?.value
            .trim()
            .toLowerCase() || "";


    const unit =
        document
            .getElementById("unitFilter")
            ?.value
            .trim()
            .toLowerCase() || "";


    const difficulty =
        document
            .getElementById("difficultyFilter")
            ?.value
            .trim()
            .toLowerCase() || "";


    filteredQuestions =
        practiceBank.filter(question => {

            const searchableText = [

                question.question,
                question.concept,
                question.knowledge_entity,
                question.unit,
                question.difficulty,
                question.question_style,
                question.answer_text,
                question.explanation

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchesSearch =
                !search ||
                searchableText.includes(search);


            const matchesUnit =
                !unit ||
                String(
                    question.unit || ""
                )
                    .toLowerCase()
                    === unit;


            const matchesDifficulty =
                !difficulty ||
                String(
                    question.difficulty || ""
                )
                    .toLowerCase()
                    === difficulty;


            return (
                matchesSearch &&
                matchesUnit &&
                matchesDifficulty
            );
        });


    renderQuestions();

    updateStatistics();
}


/* =========================================================
   RENDER QUESTIONS
========================================================= */

function renderQuestions() {

    const container =
        document.getElementById(
            "questionList"
        );


    const emptyState =
        document.getElementById(
            "emptyState"
        );


    const resultCount =
        document.getElementById(
            "resultCount"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (resultCount) {

        resultCount.textContent =
            `${filteredQuestions.length} question${
                filteredQuestions.length === 1
                    ? ""
                    : "s"
            }`;
    }


    if (
        filteredQuestions.length === 0
    ) {

        if (emptyState) {

            emptyState.style.display =
                "block";
        }

        return;
    }


    if (emptyState) {

        emptyState.style.display =
            "none";
    }


    filteredQuestions.forEach(
        (question, index) => {

            const originalIndex =
                practiceBank.indexOf(
                    question
                );


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "question-card";


            const safeQuestion =
                escapeHtml(
                    question.question ||
                    "Untitled question"
                );


            const entity =
                escapeHtml(
                    question.knowledge_entity ||
                    "General"
                );


            const concept =
                escapeHtml(
                    question.concept ||
                    "General concept"
                );


            const unit =
                escapeHtml(
                    question.unit ||
                    "—"
                );


            const difficulty =
                escapeHtml(
                    question.difficulty ||
                    "—"
                );


            const style =
                escapeHtml(
                    question.question_style ||
                    "Conceptual"
                );


            const attempts =
                Number(
                    question.attempts || 0
                );


            const correctCount =
                Number(
                    question.correct_count || 0
                );


            const wrongCount =
                Number(
                    question.wrong_count || 0
                );


            const accuracy =
                attempts > 0
                    ? Math.round(
                        (
                            correctCount /
                            attempts
                        ) * 100
                    )
                    : 0;


            card.innerHTML = `

                <div class="question-number">
                    AI PRACTICE #${index + 1}
                </div>


                <div class="question-title">
                    ${safeQuestion}
                </div>


                <div class="question-meta">

                    <span class="meta-badge">
                        ${entity}
                    </span>

                    <span class="meta-badge">
                        ${concept}
                    </span>

                    <span class="meta-badge">
                        ${unit}
                    </span>

                    <span class="meta-badge">
                        ${difficulty}
                    </span>

                    <span class="meta-badge">
                        ${style}
                    </span>

                </div>


                <!-- =========================================
                     PERFORMANCE INFORMATION
                ========================================== -->

                <div
                    class="practice-performance"
                    style="
                        display:block;
                        width:100%;
                        box-sizing:border-box;
                        margin-top:12px;
                        padding:9px 12px;
                        background:#f8f9fa;
                        border:1px solid #e2e6ea;
                        border-radius:7px;
                        color:#495057;
                        font-size:13px;
                        line-height:1.5;
                    "
                >

                    <span>
                        Attempts:
                        <strong>
                            ${attempts}
                        </strong>
                    </span>


                    <span
                        style="
                            margin-left:14px;
                        "
                    >
                        Correct:
                        <strong
                            style="
                                color:#198754;
                            "
                        >
                            ${correctCount}
                        </strong>
                    </span>


                    <span
                        style="
                            margin-left:14px;
                        "
                    >
                        Wrong:
                        <strong
                            style="
                                color:#dc3545;
                            "
                        >
                            ${wrongCount}
                        </strong>
                    </span>


                    <span
                        style="
                            margin-left:14px;
                        "
                    >
                        Accuracy:
                        <strong
                            style="
                                color:#08224d;
                            "
                        >
                            ${accuracy}%
                        </strong>
                    </span>

                </div>


                <!-- =========================================
                     ACTION BUTTONS
                ========================================== -->

                <div
                    class="d-flex
                           flex-wrap
                           gap-2
                           mt-3"
                >

                    <button
                        type="button"
                        class="btn btn-gold btn-sm"
                        data-action="practise"
                        data-index="${originalIndex}"
                    >
                        ▶ Practise
                    </button>


                    <button
                        type="button"
                        class="btn btn-outline-danger
                               btn-sm delete-btn"
                        data-action="delete"
                        data-index="${originalIndex}"
                    >
                        🗑️ Delete
                    </button>

                </div>
            `;


            const practiseButton =
                card.querySelector(
                    '[data-action="practise"]'
                );


            const deleteButton =
                card.querySelector(
                    '[data-action="delete"]'
                );


            if (practiseButton) {

                practiseButton.addEventListener(
                    "click",
                    () =>
                        openQuestion(
                            originalIndex
                        )
                );
            }


            if (deleteButton) {

                deleteButton.addEventListener(
                    "click",
                    () =>
                        deleteQuestion(
                            originalIndex
                        )
                );
            }


            container.appendChild(
                card
            );
        }
    );
}


/* =========================================================
   OPEN QUESTION
========================================================= */

function openQuestion(index) {

    const question =
        practiceBank[index];


    if (!question) {
        return;
    }


    currentModalQuestion =
        question;


    modalAnswered =
        false;


    const modal =
        document.getElementById(
            "questionModal"
        );


    if (!modal) {
        return;
    }


    const bootstrapModal =
        bootstrap.Modal.getOrCreateInstance(
            modal
        );


    const modalTitle =
        document.getElementById(
            "modalTitle"
        );


    const modalMeta =
        document.getElementById(
            "modalMeta"
        );


    const modalQuestion =
        document.getElementById(
            "modalQuestion"
        );


    const modalFeedback =
        document.getElementById(
            "modalFeedback"
        );


    const modalSolution =
        document.getElementById(
            "modalSolution"
        );


    if (modalTitle) {

        modalTitle.textContent =
            "AI Practice Question";
    }


    if (modalMeta) {

        modalMeta.innerHTML = `

            <span class="meta-badge">
                ${escapeHtml(
                    question.knowledge_entity ||
                    "General"
                )}
            </span>

            <span class="meta-badge">
                ${escapeHtml(
                    question.concept ||
                    "General concept"
                )}
            </span>

            <span class="meta-badge">
                ${escapeHtml(
                    question.unit ||
                    "—"
                )}
            </span>

            <span class="meta-badge">
                ${escapeHtml(
                    question.difficulty ||
                    "—"
                )}
            </span>

        `;
    }


    if (modalQuestion) {

        modalQuestion.textContent =
            question.question || "";
    }


    renderModalOptions(
        question
    );


    if (modalFeedback) {

        modalFeedback.style.display =
            "none";

        modalFeedback.innerHTML =
            "";
    }


    if (modalSolution) {

        modalSolution.style.display =
            "none";
    }


    bootstrapModal.show();
}


/* =========================================================
   RENDER MODAL OPTIONS
========================================================= */

function renderModalOptions(
    question
) {

    const container =
        document.getElementById(
            "modalOptions"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    ["A", "B", "C", "D"]
        .forEach(letter => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "modal-option";


            button.dataset.option =
                letter;


            const optionText =
                question.options?.[
                    letter
                ] ||
                question[
                    letter
                ] ||
                "";


            button.innerHTML =
                `<strong>${letter}.</strong> ${
                    escapeHtml(
                        optionText
                    )
                }`;


            button.addEventListener(
                "click",
                () =>
                    answerModalQuestion(
                        letter
                    )
            );


            container.appendChild(
                button
            );
        });
}


/* =========================================================
   ANSWER MODAL QUESTION
========================================================= */

function answerModalQuestion(
    selected
) {

    if (
        !currentModalQuestion ||
        modalAnswered
    ) {

        return;
    }


    modalAnswered =
        true;


    answeredThisSession++;


    const correct =
        String(
            currentModalQuestion.correct_answer ||
            ""
        )
            .trim()
            .toUpperCase();


    const isCorrect =
        selected === correct;


    /* =====================================================
       SAVE PERFORMANCE
    ====================================================== */

    recordAttempt(
        currentModalQuestion,
        selected,
        correct
    );


    /*
       Immediately rebuild the question cards
       so the performance information becomes
       visible after answering.
    */

    renderQuestions();


    const buttons =
        document.querySelectorAll(
            "#modalOptions .modal-option"
        );


    buttons.forEach(button => {

        const option =
            button.dataset.option;


        button.disabled =
            true;


        if (
            option === selected
        ) {

            if (isCorrect) {

                button.classList.add(
                    "correct"
                );

            } else {

                button.classList.add(
                    "wrong"
                );
            }
        }


        if (
            !isCorrect &&
            option === correct
        ) {

            button.classList.add(
                "correct"
            );
        }
    });


    const feedback =
        document.getElementById(
            "modalFeedback"
        );


    if (!feedback) {
        return;
    }


    if (isCorrect) {

        feedback.className =
            "modal-feedback correct-feedback";


        feedback.innerHTML = `
            <strong>✓ Correct!</strong>

            <div class="mt-1">
                Your answer is correct.
            </div>
        `;

    } else {

        feedback.className =
            "modal-feedback wrong-feedback";


        feedback.innerHTML = `
            <strong>✗ Incorrect</strong>

            <div class="mt-1">
                The correct answer is
                <strong>
                    ${escapeHtml(correct)}
                </strong>.
            </div>
        `;
    }


    feedback.style.display =
        "block";


    showModalSolution();


    updateStatistics();
}


/* =========================================================
   SHOW SOLUTION
========================================================= */

function showModalSolution() {

    const question =
        currentModalQuestion;


    if (!question) {
        return;
    }


    const solution =
        question.solution || {};


    const solutionBox =
        document.getElementById(
            "modalSolution"
        );


    const answerBox =
        document.getElementById(
            "modalSolutionAnswer"
        );


    const correct =
        String(
            question.correct_answer ||
            ""
        )
            .trim()
            .toUpperCase();


    const answerText =
        question.answer_text ||
        question.options?.[
            correct
        ] ||
        question[
            correct
        ] ||
        "";


    if (answerBox) {

        answerBox.innerHTML = `

            <strong>
                Correct Answer:
                ${escapeHtml(correct)}
            </strong>

            <br>

            ${escapeHtml(answerText)}

        `;
    }


    renderList(
        "modalKeyPoints",
        solution.key_points,
        "Review the central JRF facts."
    );


    const explanation =
        document.getElementById(
            "modalExplanation"
        );


    if (explanation) {

        explanation.textContent =
            solution.explanation ||
            question.explanation ||
            "Review the concept carefully.";
    }


    renderList(
        "modalAdditional",
        solution.additional_information,
        "Review related academic context."
    );


    renderList(
        "modalJrfFocus",
        solution.jrf_focus,
        "Remember the central examination fact."
    );


    renderList(
        "modalConfusion",
        solution.common_confusion,
        "Review closely related concepts."
    );


    if (solutionBox) {

        solutionBox.style.display =
            "block";
    }
}


/* =========================================================
   RENDER SOLUTION LIST
========================================================= */

function renderList(
    elementId,
    items,
    fallback
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    element.innerHTML =
        "";


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        const li =
            document.createElement(
                "li"
            );


        li.textContent =
            fallback;


        element.appendChild(
            li
        );


        return;
    }


    items.forEach(item => {

        const li =
            document.createElement(
                "li"
            );


        li.textContent =
            item;


        element.appendChild(
            li
        );
    });
}


/* =========================================================
   DELETE QUESTION
========================================================= */

function deleteQuestion(index) {

    const question =
        practiceBank[index];


    if (!question) {
        return;
    }


    const confirmed =
        window.confirm(
            "Delete this AI practice question from your Practice Bank?"
        );


    if (!confirmed) {
        return;
    }


    practiceBank.splice(
        index,
        1
    );


    savePracticeBank();


    filterQuestions();


    updateBankStatus();
}


/* =========================================================
   CLEAR PRACTICE BANK
========================================================= */

function clearPracticeBank() {

    if (
        practiceBank.length === 0
    ) {

        return;
    }


    const confirmed =
        window.confirm(
            "This will permanently remove all saved AI Practice questions from this browser. Continue?"
        );


    if (!confirmed) {
        return;
    }


    practiceBank = [];


    savePracticeBank();


    filterQuestions();


    updateBankStatus();
}


/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearFilters() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    const unitFilter =
        document.getElementById(
            "unitFilter"
        );


    const difficultyFilter =
        document.getElementById(
            "difficultyFilter"
        );


    if (searchInput) {

        searchInput.value =
            "";
    }


    if (unitFilter) {

        unitFilter.value =
            "";
    }


    if (difficultyFilter) {

        difficultyFilter.value =
            "";
    }


    filterQuestions();
}


/* =========================================================
   UPDATE STATISTICS
========================================================= */

function updateStatistics() {

    const total =
        document.getElementById(
            "totalQuestions"
        );


    const visible =
        document.getElementById(
            "visibleQuestions"
        );


    const answered =
        document.getElementById(
            "answeredQuestions"
        );


    if (total) {

        total.textContent =
            practiceBank.length;
    }


    if (visible) {

        visible.textContent =
            filteredQuestions.length;
    }


    if (answered) {

        answered.textContent =
            answeredThisSession;
    }


    /*
       Overall statistics.
       These IDs are ready for the next
       dashboard enhancement.
    */

    const stats =
        getPracticeStatistics();


    const attempts =
        document.getElementById(
            "attemptedQuestions"
        );


    const correct =
        document.getElementById(
            "correctAnswers"
        );


    const wrong =
        document.getElementById(
            "wrongAnswers"
        );


    const accuracy =
        document.getElementById(
            "accuracyRate"
        );


    if (attempts) {

        attempts.textContent =
            stats.attempts;
    }


    if (correct) {

        correct.textContent =
            stats.correct;
    }


    if (wrong) {

        wrong.textContent =
            stats.wrong;
    }


    if (accuracy) {

        accuracy.textContent =
            `${stats.accuracy}%`;
    }
}


/* =========================================================
   BANK STATUS
========================================================= */

function updateBankStatus() {

    const status =
        document.getElementById(
            "bankStatus"
        );


    if (!status) {
        return;
    }


    if (
        practiceBank.length > 0
    ) {

        status.textContent =
            "AI Practice Bank Ready";


        status.className =
            "badge bg-success";

    } else {

        status.textContent =
            "No Saved Questions";


        status.className =
            "badge bg-secondary";
    }
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)

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
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadPracticeBank();


        filterQuestions();


        updateBankStatus();


        const searchInput =
            document.getElementById(
                "searchInput"
            );


        const unitFilter =
            document.getElementById(
                "unitFilter"
            );


        const difficultyFilter =
            document.getElementById(
                "difficultyFilter"
            );


        const clearFiltersButton =
            document.getElementById(
                "clearFiltersBtn"
            );


        const clearBankButton =
            document.getElementById(
                "clearBankBtn"
            );


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                filterQuestions
            );
        }


        if (unitFilter) {

            unitFilter.addEventListener(
                "change",
                filterQuestions
            );
        }


        if (difficultyFilter) {

            difficultyFilter.addEventListener(
                "change",
                filterQuestions
            );
        }


        if (clearFiltersButton) {

            clearFiltersButton.addEventListener(
                "click",
                clearFilters
            );
        }


        if (clearBankButton) {

            clearBankButton.addEventListener(
                "click",
                clearPracticeBank
            );
        }

    }
);
