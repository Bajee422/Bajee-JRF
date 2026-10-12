/* =========================================================
   BAJEE JRF AI
   AI PRACTICE QUESTION GENERATOR
   STEP 8.6
   + STEP 10.5 PYQ PRACTICE BRIDGE
========================================================= */

"use strict";

let currentQuestion = null;
let questionAnswered = false;
let currentQuestionSource = "AI Practice";


/* =========================================================
   API BASE
========================================================= */

function getApiBase() {

    if (window.BAJEE_API_BASE) {
        return String(
            window.BAJEE_API_BASE
        ).replace(/\/+$/, "");
    }

    if (
        window.RUNTIME_CONFIG &&
        window.RUNTIME_CONFIG.BAJEE_API_BASE
    ) {
        return String(
            window.RUNTIME_CONFIG.BAJEE_API_BASE
        ).replace(/\/+$/, "");
    }

    return "http://127.0.0.1:3000/api";
}


/* =========================================================
   STATUS
========================================================= */

function setStatus(message, type = "info") {

    const box =
        document.getElementById("statusBox");

    if (!box) return;

    box.className =
        "alert status-box";

    if (type === "success") {

        box.classList.add(
            "alert-success"
        );

    } else if (type === "danger") {

        box.classList.add(
            "alert-danger"
        );

    } else if (type === "warning") {

        box.classList.add(
            "alert-warning"
        );

    } else {

        box.classList.add(
            "alert-info"
        );
    }

    box.textContent =
        message;
}


/* =========================================================
   SAFE JSON PARSE
========================================================= */

function safeJsonParse(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    if (
        typeof value === "object"
    ) {
        return value;
    }

    if (
        typeof value !== "string"
    ) {
        return null;
    }

    let text =
        value.trim();

    if (!text) {
        return null;
    }

    text =
        text
            .replace(
                /^```json\s*/i,
                ""
            )
            .replace(
                /^```\s*/i,
                ""
            )
            .replace(
                /\s*```$/i,
                ""
            )
            .trim();

    try {

        return JSON.parse(text);

    } catch (error) {

        return null;
    }
}


/* =========================================================
   EXTRACT AI TEXT
========================================================= */

function extractAIText(data) {

    if (!data) return "";

    if (
        typeof data === "string"
    ) {
        return data;
    }

    if (data.reply) {
        return String(
            data.reply
        );
    }

    if (
        data.response?.reply
    ) {
        return String(
            data.response.reply
        );
    }

    if (
        data.response?.text
    ) {
        return String(
            data.response.text
        );
    }

    if (data.text) {
        return String(
            data.text
        );
    }

    if (
        data.candidates?.[0]?.content?.parts
    ) {

        return data.candidates[0]
            .content.parts
            .map(
                part =>
                    part?.text || ""
            )
            .join("");
    }

    return "";
}


/* =========================================================
   CLEAN AI JSON
========================================================= */

function cleanAIJson(text) {

    if (!text) {
        return null;
    }

    let cleaned =
        String(text).trim();

    cleaned =
        cleaned
            .replace(
                /^```json\s*/i,
                ""
            )
            .replace(
                /^```\s*/i,
                ""
            )
            .replace(
                /\s*```$/i,
                ""
            )
            .trim();

    const direct =
        safeJsonParse(
            cleaned
        );

    if (direct) {
        return direct;
    }

    const firstBrace =
        cleaned.indexOf("{");

    const lastBrace =
        cleaned.lastIndexOf("}");

    if (
        firstBrace !== -1 &&
        lastBrace !== -1 &&
        lastBrace > firstBrace
    ) {

        const possibleJson =
            cleaned.substring(
                firstBrace,
                lastBrace + 1
            );

        return safeJsonParse(
            possibleJson
        );
    }

    return null;
}


/* =========================================================
   NORMALIZE DISPLAY TEXT
========================================================= */

function normalizeDisplayText(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    if (
        typeof value === "string"
    ) {

        const parsed =
            safeJsonParse(value);

        if (
            parsed &&
            typeof parsed === "object"
        ) {

            if (parsed.explanation) {

                return String(
                    parsed.explanation
                ).trim();
            }

            if (parsed.answer_text) {

                return String(
                    parsed.answer_text
                ).trim();
            }

            return "";
        }

        return value.trim();
    }

    if (
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return String(value);
    }

    if (
        typeof value === "object"
    ) {

        if (value.text) {
            return String(
                value.text
            ).trim();
        }

        if (value.content) {
            return String(
                value.content
            ).trim();
        }

        if (value.explanation) {
            return String(
                value.explanation
            ).trim();
        }

        if (value.answer_text) {
            return String(
                value.answer_text
            ).trim();
        }
    }

    return "";
}


/* =========================================================
   NORMALIZE ARRAY
========================================================= */

function normalizeStringArray(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return [];
    }

    if (
        Array.isArray(value)
    ) {

        return value
            .map(
                item =>
                    normalizeDisplayText(item)
            )
            .filter(Boolean);
    }

    if (
        typeof value === "string"
    ) {

        const parsed =
            safeJsonParse(value);

        if (
            Array.isArray(parsed)
        ) {

            return parsed
                .map(
                    item =>
                        normalizeDisplayText(item)
                )
                .filter(Boolean);
        }

        return value.trim()
            ? [value.trim()]
            : [];
    }

    return [];
}


/* =========================================================
   CLEAN TEXT
========================================================= */

function cleanSectionText(text) {

    if (!text) {
        return "";
    }

    return String(text)
        .replace(
            /\s+/g,
            " "
        )
        .replace(
            /\s+([,.!?;:])/g,
            "$1"
        )
        .trim();
}


/* =========================================================
   SPLIT INTO USEFUL POINTS
========================================================= */

function splitIntoUsefulPoints(text) {

    if (!text) {
        return [];
    }

    let pieces =
        text.split(
            /\s*(?:•|▪|●|\u2022)\s*/
        );

    if (
        pieces.length === 1
    ) {

        pieces =
            text.split(
                /;\s+/
            );
    }

    pieces =
        pieces
            .map(
                item =>
                    item
                        .replace(
                            /^[-*]\s*/,
                            ""
                        )
                        .trim()
            )
            .filter(Boolean);

    return pieces.length
        ? pieces
        : [text];
}


/* =========================================================
   PARSE MERGED AI SOLUTION
========================================================= */

function parseMergedSolutionText(text) {

    if (!text) {

        return {

            explanation: "",

            key_points: [],

            additional_information: [],

            jrf_focus: [],

            common_confusion: []
        };
    }

    const source =
        String(text)
            .replace(
                /\n+/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    const markerPatterns = {

        key_points: [
            /\bkey points include\s*:/i,
            /\bkey points\s*:/i,
            /\bkey point\s*:/i
        ],

        additional_information: [
            /\badditional information connects\s*:/i,
            /\badditional information\s*:/i,
            /\badditional info\s*:/i
        ],

        jrf_focus: [
            /\bjrf focus\s*:/i,
            /\bnet\/jrf focus\s*:/i,
            /\bexam focus\s*:/i
        ],

        common_confusion: [
            /\bcommon confusion\s*:/i,
            /\bcommon confusions\s*:/i,
            /\bcommon mistake\s*:/i,
            /\bcommon mistakes\s*:/i
        ]
    };

    const markers = [];

    for (
        const [section, patterns]
        of Object.entries(
            markerPatterns
        )
    ) {

        for (
            const pattern
            of patterns
        ) {

            const match =
                pattern.exec(
                    source
                );

            if (match) {

                markers.push({

                    section,

                    index:
                        match.index,

                    length:
                        match[0].length

                });

                break;
            }
        }
    }

    markers.sort(
        (a, b) =>
            a.index - b.index
    );

    if (
        markers.length === 0
    ) {

        return {

            explanation:
                cleanSectionText(
                    source
                ),

            key_points: [],

            additional_information: [],

            jrf_focus: [],

            common_confusion: []
        };
    }

    let explanation =
        source.substring(
            0,
            markers[0].index
        ).trim();

    explanation =
        explanation
            .replace(
                /^the solution includes detailed jrf-oriented insights\s*:\s*/i,
                ""
            )
            .trim();

    const result = {

        explanation:
            cleanSectionText(
                explanation
            ),

        key_points: [],

        additional_information: [],

        jrf_focus: [],

        common_confusion: []
    };

    markers.forEach(
        (marker, index) => {

            const start =
                marker.index +
                marker.length;

            const end =
                index + 1 <
                markers.length
                    ? markers[
                        index + 1
                    ].index
                    : source.length;

            const content =
                cleanSectionText(
                    source.substring(
                        start,
                        end
                    )
                );

            if (!content) {
                return;
            }

            const items =
                splitIntoUsefulPoints(
                    content
                );

            result[
                marker.section
            ].push(
                ...items
            );
        }
    );

    return result;
}


/* =========================================================
   NORMALIZE SOLUTION
========================================================= */

function normalizeSolution(
    rawSolution,
    rawQuestion = {}
) {

    let solution =
        rawSolution;

    if (
        typeof solution === "string"
    ) {

        const parsed =
            safeJsonParse(
                solution
            );

        if (
            parsed &&
            typeof parsed === "object"
        ) {
            solution = parsed;
        }
    }

    if (
        !solution ||
        typeof solution !== "object"
    ) {
        solution = {};
    }

    let explanation =
        solution.explanation ||
        solution.Explanation ||
        rawQuestion.explanation ||
        rawQuestion.Explanation ||
        "";

    let keyPoints =
        solution.key_points ??
        solution.keyPoints ??
        solution["key points"] ??
        [];

    let additionalInformation =
        solution.additional_information ??
        solution.additionalInformation ??
        solution["additional information"] ??
        [];

    let jrfFocus =
        solution.jrf_focus ??
        solution.jrfFocus ??
        solution["jrf focus"] ??
        [];

    let commonConfusion =
        solution.common_confusion ??
        solution.commonConfusion ??
        solution["common confusion"] ??
        [];

    explanation =
        normalizeDisplayText(
            explanation
        );

    keyPoints =
        normalizeStringArray(
            keyPoints
        );

    additionalInformation =
        normalizeStringArray(
            additionalInformation
        );

    jrfFocus =
        normalizeStringArray(
            jrfFocus
        );

    commonConfusion =
        normalizeStringArray(
            commonConfusion
        );

    const combinedCandidates = [

        explanation,

        ...keyPoints,

        ...additionalInformation,

        ...jrfFocus,

        ...commonConfusion

    ].filter(Boolean);

    const combinedText =
        combinedCandidates
            .sort(
                (a, b) =>
                    b.length - a.length
            )[0] || "";

    const hasMergedMarkers =
        /key points\s*:|key points include\s*:|additional information\s*:|jrf focus\s*:|common confusion\s*:/i
            .test(
                combinedText
            );

    if (
        hasMergedMarkers
    ) {

        const parsedMerged =
            parseMergedSolutionText(
                combinedText
            );

        if (
            parsedMerged.explanation
        ) {
            explanation =
                parsedMerged.explanation;
        }

        if (
            parsedMerged.key_points.length
        ) {
            keyPoints =
                parsedMerged.key_points;
        }

        if (
            parsedMerged.additional_information.length
        ) {
            additionalInformation =
                parsedMerged.additional_information;
        }

        if (
            parsedMerged.jrf_focus.length
        ) {
            jrfFocus =
                parsedMerged.jrf_focus;
        }

        if (
            parsedMerged.common_confusion.length
        ) {
            commonConfusion =
                parsedMerged.common_confusion;
        }
    }

    const unique =
        array =>
            [
                ...new Set(
                    array
                        .map(
                            item =>
                                cleanSectionText(
                                    item
                                )
                        )
                        .filter(Boolean)
                )
            ];

    keyPoints =
        unique(keyPoints);

    additionalInformation =
        unique(
            additionalInformation
        );

    jrfFocus =
        unique(jrfFocus);

    commonConfusion =
        unique(
            commonConfusion
        );

    keyPoints =
        keyPoints.filter(
            item =>
                item !== explanation
        );

    const sectionNames = [

        "additional information",

        "jrf focus",

        "common confusion"

    ];

    keyPoints =
        keyPoints.filter(
            item => {

                const lower =
                    item.toLowerCase();

                return !sectionNames.some(
                    name =>
                        lower.includes(
                            name + ":"
                        )
                );
            }
        );

    return {

        explanation,

        key_points:
            keyPoints,

        additional_information:
            additionalInformation,

        jrf_focus:
            jrfFocus,

        common_confusion:
            commonConfusion
    };
}


/* =========================================================
   NORMALIZE QUESTION
========================================================= */

function normalizeQuestion(raw) {

    if (
        !raw ||
        typeof raw !== "object"
    ) {

        throw new Error(
            "AI returned invalid question data."
        );
    }

    let options =
        raw.options;

    if (
        typeof options === "string"
    ) {

        options =
            safeJsonParse(
                options
            );
    }

    if (
        !options ||
        typeof options !== "object"
    ) {

        options = {

            A:
                raw.A || "",

            B:
                raw.B || "",

            C:
                raw.C || "",

            D:
                raw.D || ""
        };
    }

    const normalizedOptions = {

        A:
            normalizeDisplayText(
                options.A
            ),

        B:
            normalizeDisplayText(
                options.B
            ),

        C:
            normalizeDisplayText(
                options.C
            ),

        D:
            normalizeDisplayText(
                options.D
            )
    };

    const correctAnswer =
        String(
            raw.correct_answer ||
            raw.correctAnswer ||
            raw.answer ||
            ""
        )
            .trim()
            .toUpperCase()
            .replace(
                /[^ABCD]/g,
                ""
            )
            .charAt(0);

    const answerText =
        normalizeDisplayText(
            raw.answer_text ||
            raw.answerText ||
            raw.correct_answer_text ||
            ""
        );

    const solution =
        normalizeSolution(
            raw.solution,
            raw
        );

    return {

        question:
            normalizeDisplayText(
                raw.question
            ),

        options:
            normalizedOptions,

        correct_answer:
            correctAnswer,

        answer_text:
            answerText ||
            normalizedOptions[
                correctAnswer
            ] ||
            "",

        explanation:
            solution.explanation,

        solution,

        knowledge_entity:
            normalizeDisplayText(
                raw.knowledge_entity ||
                raw.knowledgeEntity ||
                ""
            ),

        concept:
            normalizeDisplayText(
                raw.concept ||
                ""
            ),

        unit:
            normalizeDisplayText(
                raw.unit ||
                ""
            ),

        difficulty:
            normalizeDisplayText(
                raw.difficulty ||
                ""
            ),

        question_style:
            normalizeDisplayText(
                raw.question_style ||
                raw.questionStyle ||
                ""
            ),

        source_type:
            raw.source_type ||
            "AI Practice"
    };
}


/* =========================================================
   PYQ BRIDGE
   =========================================================

   Reads:

   1. URL:
      ?source=pyq&pyq=PYQ_ID

   2. localStorage:
      bajee_selected_pyq

   The PYQ is displayed in the existing Step 8.6
   answer/reveal interface.

========================================================= */

function getPYQBridgeData() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const source =
        String(
            params.get("source") ||
            ""
        ).toLowerCase();

    if (
        source !== "pyq"
    ) {
        return null;
    }

    let stored =
        null;

    try {

        const raw =
            localStorage.getItem(
                "bajee_selected_pyq"
            );

        if (raw) {

            stored =
                safeJsonParse(
                    raw
                );
        }

    } catch (error) {

        console.warn(
            "Unable to read selected PYQ.",
            error
        );
    }

    if (!stored) {
        return null;
    }

    const requestedId =
        params.get("pyq");

    if (
        requestedId &&
        stored.id &&
        String(stored.id) !==
            String(requestedId)
    ) {

        return null;
    }

    return stored;
}


/* =========================================================
   CONVERT PYQ ANSWER TO LETTER
========================================================= */

function getPYQCorrectAnswer(
    pyq
) {

    if (!pyq) {
        return "";
    }

    const answer =
        String(
            pyq.answer ||
            pyq.correct_answer ||
            pyq.correctAnswer ||
            ""
        ).trim();

    if (
        /^[ABCD]$/i.test(answer)
    ) {

        return answer
            .toUpperCase();
    }

    const options =
        Array.isArray(
            pyq.options
        )
            ? pyq.options
            : [];

    const answerNormalized =
        answer.toLowerCase();

    const index =
        options.findIndex(
            option =>
                String(option)
                    .trim()
                    .toLowerCase() ===
                answerNormalized
        );

    if (
        index >= 0 &&
        index < 4
    ) {

        return String
            .fromCharCode(
                65 + index
            );
    }

    return "";
}


/* =========================================================
   CONVERT PYQ TO PRACTICE QUESTION
========================================================= */

function normalizePYQForPractice(
    pyq
) {

    if (
        !pyq ||
        typeof pyq !== "object"
    ) {

        return null;
    }

    const options =
        Array.isArray(
            pyq.options
        )
            ? pyq.options
            : [];

    const normalizedOptions = {

        A:
            normalizeDisplayText(
                options[0]
            ),

        B:
            normalizeDisplayText(
                options[1]
            ),

        C:
            normalizeDisplayText(
                options[2]
            ),

        D:
            normalizeDisplayText(
                options[3]
            )
    };

    const correctAnswer =
        getPYQCorrectAnswer(
            pyq
        );

    if (
        !pyq.question ||
        !correctAnswer
    ) {

        return null;
    }

    const entity =
        normalizeDisplayText(
            pyq.knowledge_entity ||
            pyq.knowledgeEntity ||
            pyq.entities?.[0] ||
            ""
        );

    const concept =
        normalizeDisplayText(
            pyq.concept ||
            pyq.concepts?.[0] ||
            pyq.topic ||
            ""
        );

    return {

        question:
            normalizeDisplayText(
                pyq.question
            ),

        options:
            normalizedOptions,

        correct_answer:
            correctAnswer,

        answer_text:
            normalizedOptions[
                correctAnswer
            ],

        explanation:
            normalizeDisplayText(
                pyq.explanation ||
                pyq.solution ||
                ""
            ),

        solution: {

            explanation:
                normalizeDisplayText(
                    pyq.explanation ||
                    pyq.solution ||
                    ""
                ),

            key_points:
                normalizeStringArray(
                    pyq.key_points ||
                    pyq.keyPoints ||
                    []
                ),

            additional_information:
                normalizeStringArray(
                    pyq.additional_information ||
                    pyq.additionalInformation ||
                    []
                ),

            jrf_focus:
                normalizeStringArray(
                    pyq.jrf_focus ||
                    pyq.jrfFocus ||
                    []
                ),

            common_confusion:
                normalizeStringArray(
                    pyq.common_confusion ||
                    pyq.commonConfusion ||
                    []
                )
        },

        knowledge_entity:
            entity,

        concept,

        unit:
            normalizeDisplayText(
                pyq.unit ||
                ""
            ),

        difficulty:
            normalizeDisplayText(
                pyq.difficulty ||
                "PYQ"
            ),

        question_style:
            "Previous Year Question",

        source_type:
            "Connected PYQ",

        pyq_id:
            pyq.id || "",

        pyq_year:
            pyq.year || "",

        pyq_exam:
            pyq.exam || "UGC NET English"
    };
}


/* =========================================================
   LOAD PYQ INTO PRACTICE
========================================================= */

function loadPYQPractice() {

    const pyq =
        getPYQBridgeData();

    if (!pyq) {
        return false;
    }

    const question =
        normalizePYQForPractice(
            pyq
        );

    if (!question) {

        setStatus(
            "The selected PYQ could not be loaded into Practice.",
            "danger"
        );

        return true;
    }

    currentQuestion =
        question;

    questionAnswered =
        false;

    currentQuestionSource =
        "Connected PYQ";

    displayQuestion(
        question
    );

    updatePYQPracticeUI(
        question
    );

    setStatus(
        "Connected PYQ loaded. Select an answer to reveal the solution.",
        "success"
    );

    return true;
}


/* =========================================================
   PYQ PRACTICE UI
========================================================= */

function updatePYQPracticeUI(
    question
) {

    const title =
        document.getElementById(
            "resultSource"
        );

    if (title) {

        title.textContent =
            question.source_type ||
            "Connected PYQ";
    }

    const questionSource =
        document.getElementById(
            "questionSource"
        );

    if (questionSource) {

        questionSource.textContent =
            question.source_type ||
            "Connected PYQ";
    }

    const generateButton =
        document.getElementById(
            "generateBtn"
        );

    /*
       Keep Generate New Question available.
       PYQ practice is an additional pathway,
       not a replacement for AI generation.
    */

    if (generateButton) {

        generateButton.title =
            "Generate a new AI practice question";
    }
}


/* =========================================================
   BUILD PROMPT
========================================================= */

function buildPracticePrompt() {

    const knowledgeEntity =
        document
            .getElementById(
                "knowledgeEntity"
            )
            ?.value
            .trim() || "";

    const concept =
        document
            .getElementById(
                "concept"
            )
            ?.value
            .trim() || "";

    const unit =
        document
            .getElementById(
                "unit"
            )
            ?.value || "";

    const difficulty =
        document
            .getElementById(
                "difficulty"
            )
            ?.value ||
        "Medium";

    const questionStyle =
        document
            .getElementById(
                "questionStyle"
            )
            ?.value ||
        "Conceptual";

    return `
You are BAJEE JRF AI, an expert UGC NET English JRF practice-question generator.

Create ONE original UGC NET English Paper II practice question.

Knowledge Entity: ${knowledgeEntity || "Use selected topic"}
Concept: ${concept || "Use selected concept"}
Unit: ${unit || "Relevant Unit"}
Difficulty: ${difficulty}
Question Style: ${questionStyle}

IMPORTANT:

1. This is AI-generated practice material.
2. Never present it as an official PYQ.
3. Do not copy an official PYQ.
4. Exactly four options: A, B, C and D.
5. Exactly one correct answer.
6. Distractors must be plausible.
7. Do not invent facts.
8. Keep the question concise.
9. The explanation must teach the concept.
10. Key points must be short factual JRF points.
11. Additional information must contain related contextual facts.
12. JRF focus must contain exam-memory guidance.
13. Common confusion must contain likely misconceptions.

VERY IMPORTANT:
Each field must contain ONLY its own content.

Do NOT merge the sections.

Return ONLY valid JSON using EXACTLY this structure:

{
  "question": "Original question",
  "options": {
    "A": "Option A",
    "B": "Option B",
    "C": "Option C",
    "D": "Option D"
  },
  "correct_answer": "A",
  "answer_text": "Full text of correct answer",
  "explanation": "One clear teaching paragraph.",
  "solution": {
    "explanation": "A separate teaching explanation. Do not copy key points into this field.",
    "key_points": [
      "Short factual point 1",
      "Short factual point 2",
      "Short factual point 3"
    ],
    "additional_information": [
      "Related contextual fact 1",
      "Related contextual fact 2"
    ],
    "jrf_focus": [
      "Specific fact or connection to remember for JRF."
    ],
    "common_confusion": [
      "Likely confusion between related concepts."
    ]
  },
  "knowledge_entity": "${knowledgeEntity}",
  "concept": "${concept}",
  "unit": "${unit}",
  "difficulty": "${difficulty}",
  "question_style": "${questionStyle}",
  "source_type": "AI Practice"
}

STRICT OUTPUT RULES:

- Do not put all fields into one paragraph.
- Do not put JSON inside a JSON string.
- key_points must be an array.
- additional_information must be an array.
- jrf_focus must be an array.
- common_confusion must be an array.
- Never repeat the complete explanation in key_points.
- Never repeat key_points inside explanation.
- Return JSON only.
`;
}


/* =========================================================
   GENERATE QUESTION
========================================================= */

async function generateQuestion() {

    const generateButton =
        document.getElementById(
            "generateBtn"
        );

    const loadingBox =
        document.getElementById(
            "loadingBox"
        );

    const resultSection =
        document.getElementById(
            "resultSection"
        );

    try {

        questionAnswered =
            false;

        currentQuestion =
            null;

        currentQuestionSource =
            "AI Practice";

        if (generateButton) {
            generateButton.disabled =
                true;
        }

        if (loadingBox) {
            loadingBox.style.display =
                "block";
        }

        if (resultSection) {
            resultSection.style.display =
                "none";
        }

        setStatus(
            "Generating a new JRF practice question...",
            "info"
        );

        const prompt =
            buildPracticePrompt();

        const apiBase =
            getApiBase();

        const response =
            await fetch(
                `${apiBase}/ai/chat`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            message:
                                prompt,

                            mentor:
                                "BAJEE JRF AI",

                            sessionId:
                                "ai-practice-" +
                                Date.now(),

                            context: {

                                source:
                                    "AI Practice",

                                mode:
                                    "Step 8.6"
                            }
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data?.error ||
                data?.message ||
                "AI request failed."
            );
        }

        const aiText =
            extractAIText(
                data
            );

        if (!aiText) {

            throw new Error(
                "The AI returned an empty response."
            );
        }

        const parsed =
            cleanAIJson(
                aiText
            );

        if (!parsed) {

            console.error(
                "RAW AI RESPONSE:",
                aiText
            );

            throw new Error(
                "AI returned invalid JSON."
            );
        }

        const question =
            normalizeQuestion(
                parsed
            );

        if (!question.question) {

            throw new Error(
                "AI question text is missing."
            );
        }

        for (
            const letter
            of ["A", "B", "C", "D"]
        ) {

            if (
                !question.options[
                    letter
                ]
            ) {

                throw new Error(
                    `Option ${letter} is missing.`
                );
            }
        }

        if (
            !["A", "B", "C", "D"]
                .includes(
                    question.correct_answer
                )
        ) {

            throw new Error(
                "AI did not provide a valid correct answer."
            );
        }

        currentQuestion =
            question;

        displayQuestion(
            question
        );

        setStatus(
            "Question generated successfully. Select an answer to reveal the solution.",
            "success"
        );

    } catch (error) {

        console.error(
            "AI Practice Error:",
            error
        );

        setStatus(
            error.message ||
            "Unable to generate question.",
            "danger"
        );

    } finally {

        if (generateButton) {
            generateButton.disabled =
                false;
        }

        if (loadingBox) {
            loadingBox.style.display =
                "none";
        }
    }
}


/* =========================================================
   DISPLAY QUESTION
========================================================= */

function displayQuestion(
    question
) {

    const resultSection =
        document.getElementById(
            "resultSection"
        );

    const resultDifficulty =
        document.getElementById(
            "resultDifficulty"
        );

    const resultUnit =
        document.getElementById(
            "resultUnit"
        );

    const resultQuestion =
        document.getElementById(
            "resultQuestion"
        );

    const optionsContainer =
        document.getElementById(
            "optionsContainer"
        );

    const answerFeedback =
        document.getElementById(
            "answerFeedback"
        );

    const solutionSection =
        document.getElementById(
            "solutionSection"
        );

    if (resultSection) {

        resultSection.style.display =
            "block";
    }

    if (resultDifficulty) {

        resultDifficulty.textContent =
            question.difficulty ||
            "—";
    }

    if (resultUnit) {

        resultUnit.textContent =
            question.unit ||
            "—";
    }

    if (resultQuestion) {

        resultQuestion.textContent =
            question.question;
    }

    if (answerFeedback) {

        answerFeedback.style.display =
            "none";

        answerFeedback.innerHTML =
            "";
    }

    if (solutionSection) {

        solutionSection.style.display =
            "none";
    }

    if (optionsContainer) {

        optionsContainer.innerHTML =
            "";

        ["A", "B", "C", "D"]
            .forEach(
                letter => {

                    const button =
                        document.createElement(
                            "button"
                        );

                    button.type =
                        "button";

                    button.className =
                        "option-btn";

                    button.dataset.option =
                        letter;

                    button.innerHTML =
                        `<strong>${letter}.</strong> ` +
                        escapeHtml(
                            question.options[
                                letter
                            ]
                        );

                    button.addEventListener(
                        "click",
                        () =>
                            handleAnswer(
                                letter
                            )
                    );

                    optionsContainer
                        .appendChild(
                            button
                        );
                }
            );
    }

    updateResultMetadata(
        question
    );

    updateSaveButton();

    if (resultSection) {

        resultSection.scrollIntoView({

            behavior:
                "smooth",

            block:
                "start"
        });
    }
}


/* =========================================================
   HANDLE ANSWER
========================================================= */

function handleAnswer(
    selectedOption
) {

    if (
        !currentQuestion ||
        questionAnswered
    ) {
        return;
    }

    questionAnswered =
        true;

    const correctAnswer =
        currentQuestion.correct_answer;

    const buttons =
        document.querySelectorAll(
            "#optionsContainer .option-btn"
        );

    buttons.forEach(
        button => {

            const option =
                button.dataset.option;

            button.disabled =
                true;

            if (
                option ===
                selectedOption
            ) {

                if (
                    option ===
                    correctAnswer
                ) {

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
                selectedOption !==
                    correctAnswer &&
                option ===
                    correctAnswer
            ) {

                button.classList.add(
                    "correct"
                );
            }
        }
    );

    const answerFeedback =
        document.getElementById(
            "answerFeedback"
        );

    if (answerFeedback) {

        if (
            selectedOption ===
            correctAnswer
        ) {

            answerFeedback.className =
                "answer-feedback correct-feedback";

            answerFeedback.innerHTML = `
                <div class="feedback-title">
                    ✓ Correct!
                </div>

                <div>
                    Your answer is correct.
                    Read the solution below.
                </div>
            `;

        } else {

            answerFeedback.className =
                "answer-feedback wrong-feedback";

            answerFeedback.innerHTML = `
                <div class="feedback-title">
                    ✗ Incorrect
                </div>

                <div>
                    The correct answer is
                    <strong>${escapeHtml(
                        correctAnswer
                    )}</strong>.
                    The correct option is highlighted.
                </div>
            `;
        }

        answerFeedback.style.display =
            "block";
    }

    showSolution();

    recordPracticeAttempt(
        selectedOption
    );

    updateSaveButton();
}


/* =========================================================
   RECORD PRACTICE ATTEMPT
========================================================= */

function recordPracticeAttempt(
    selectedOption
) {

    if (!currentQuestion) {
        return;
    }

    const correct =
        selectedOption ===
        currentQuestion.correct_answer;

    const record = {

        id:
            currentQuestion.pyq_id ||
            "practice-" +
            Date.now(),

        question:
            currentQuestion.question,

        knowledge_entity:
            currentQuestion.knowledge_entity ||
            "",

        concept:
            currentQuestion.concept ||
            "",

        unit:
            currentQuestion.unit ||
            "",

        selected_answer:
            selectedOption,

        correct_answer:
            currentQuestion.correct_answer,

        correct,

        source:
            currentQuestion.source_type ||
            currentQuestionSource,

        timestamp:
            new Date()
                .toISOString()
    };

    try {

        const key =
            "bajee_ai_practice_attempts";

        let attempts = [];

        const raw =
            localStorage.getItem(
                key
            );

        if (raw) {

            const parsed =
                safeJsonParse(
                    raw
                );

            if (
                Array.isArray(parsed)
            ) {

                attempts =
                    parsed;
            }
        }

        attempts.push(
            record
        );

        localStorage.setItem(
            key,
            JSON.stringify(
                attempts
            )
        );

        /*
           STEP 10.5 PERFORMANCE BRIDGE

           A connected PYQ answer must also create
           entity-level performance evidence.

           The existing Knowledge Entity page reads
           the vertical-slice performance store, so
           write the same attempt there as well.

           This does NOT modify the PYQ itself.
           It only records the student's practice result.
        */

        syncPracticeAttemptToEntityPerformance(
            record
        );

    } catch (error) {

        console.warn(
            "Unable to save practice attempt.",
            error
        );
    }
}


/* =========================================================
   STEP 10.5 — ENTITY PERFORMANCE BRIDGE
========================================================= */

function syncPracticeAttemptToEntityPerformance(
    record
) {

    if (
        !record ||
        !record.knowledge_entity
    ) {
        return;
    }

    const performanceKey =
        "bajee_jrf_ai_vertical_slice_performance_v2";

    try {

        let performance = {};

        const raw =
            localStorage.getItem(
                performanceKey
            );

        if (raw) {

            const parsed =
                safeJsonParse(raw);

            if (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {
                performance = parsed;
            }
        }

        /*
           Resolve the canonical knowledge-entity name
           when the connected PYQ carries an ID such as
           "derrida" while the graph stores "Jacques Derrida".
        */

        const entityName =
            resolveCanonicalEntityName(
                record.knowledge_entity
            );

        let storageName =
            Object.keys(performance).find(
                key =>
                    normaliseEntityKey(key) ===
                    normaliseEntityKey(entityName)
            );

        if (!storageName) {

            storageName =
                entityName ||
                record.knowledge_entity;
        }

        if (!performance[storageName]) {

            performance[storageName] = {
                attempted: 0,
                correct: 0,
                wrong: 0,
                questions: {},
                history: []
            };
        }

        const entityRecord =
            performance[storageName];

        entityRecord.attempted =
            Number(
                entityRecord.attempted || 0
            );

        entityRecord.correct =
            Number(
                entityRecord.correct || 0
            );

        entityRecord.wrong =
            Number(
                entityRecord.wrong || 0
            );

        if (
            !Array.isArray(
                entityRecord.history
            )
        ) {
            entityRecord.history = [];
        }

        if (
            !entityRecord.questions ||
            typeof entityRecord.questions !== "object"
        ) {
            entityRecord.questions = {};
        }

        entityRecord.attempted += 1;

        if (record.correct) {
            entityRecord.correct += 1;
        } else {
            entityRecord.wrong += 1;
        }

        const recordedAt =
            record.timestamp ||
            new Date().toISOString();

        entityRecord.history.push({

            attempt:
                entityRecord.attempted,

            question_id:
                record.id,

            selected:
                record.selected_answer,

            correct_answer:
                record.correct_answer,

            result:
                record.correct
                    ? "correct"
                    : "wrong",

            mode:
                record.source === "Connected PYQ"
                    ? "connected-pyq"
                    : "ai-practice",

            recorded_at:
                recordedAt
        });

        entityRecord.questions[
            record.id
        ] = {

            selected:
                record.selected_answer,

            correct_answer:
                record.correct_answer,

            result:
                record.correct
                    ? "correct"
                    : "wrong",

            source:
                record.source,

            recorded_at:
                recordedAt
        };

        localStorage.setItem(
            performanceKey,
            JSON.stringify(
                performance
            )
        );

        console.log(
            "BAJEE JRF AI: Entity performance updated.",
            {
                entity: storageName,
                attempted:
                    entityRecord.attempted,
                correct:
                    entityRecord.correct,
                wrong:
                    entityRecord.wrong
            }
        );

    } catch (error) {

        console.warn(
            "Unable to sync practice attempt to entity performance.",
            error
        );
    }
}


/* =========================================================
   STEP 10.5 — REPAIR EXISTING PRACTICE ATTEMPTS
========================================================= */

function syncExistingPracticeAttemptsToEntityPerformance() {

    const key =
        "bajee_ai_practice_attempts";

    try {

        const raw =
            localStorage.getItem(key);

        if (!raw) {
            return;
        }

        const attempts =
            safeJsonParse(raw);

        if (!Array.isArray(attempts) || !attempts.length) {
            return;
        }

        const performanceKey =
            "bajee_jrf_ai_vertical_slice_performance_v2";

        let performance = {};

        const performanceRaw =
            localStorage.getItem(
                performanceKey
            );

        if (performanceRaw) {

            const parsed =
                safeJsonParse(
                    performanceRaw
                );

            if (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {
                performance = parsed;
            }
        }

        let changed = false;

        attempts.forEach(record => {

            if (
                !record ||
                !record.knowledge_entity
            ) {
                return;
            }

            const entityName =
                resolveCanonicalEntityName(
                    record.knowledge_entity
                );

            let storageName =
                Object.keys(performance).find(
                    name =>
                        normaliseEntityKey(name) ===
                        normaliseEntityKey(entityName)
                );

            if (!storageName) {
                storageName = entityName;
            }

            if (!storageName) {
                return;
            }

            if (!performance[storageName]) {

                performance[storageName] = {
                    attempted: 0,
                    correct: 0,
                    wrong: 0,
                    questions: {},
                    history: []
                };

                changed = true;
            }

            const entityRecord =
                performance[storageName];

            if (
                !Array.isArray(
                    entityRecord.history
                )
            ) {
                entityRecord.history = [];
                changed = true;
            }

            if (
                !entityRecord.questions ||
                typeof entityRecord.questions !== "object"
            ) {
                entityRecord.questions = {};
                changed = true;
            }

            const alreadyRecorded =
                entityRecord.history.some(
                    item =>
                        String(
                            item.question_id || ""
                        ) ===
                            String(
                                record.id || ""
                            ) &&
                        String(
                            item.recorded_at || ""
                        ) ===
                            String(
                                record.timestamp || ""
                            )
                );

            if (alreadyRecorded) {
                return;
            }

            entityRecord.attempted =
                Number(
                    entityRecord.attempted || 0
                ) + 1;

            if (record.correct) {
                entityRecord.correct =
                    Number(
                        entityRecord.correct || 0
                    ) + 1;
            } else {
                entityRecord.wrong =
                    Number(
                        entityRecord.wrong || 0
                    ) + 1;
            }

            entityRecord.history.push({
                attempt:
                    entityRecord.attempted,
                question_id:
                    record.id,
                selected:
                    record.selected_answer,
                correct_answer:
                    record.correct_answer,
                result:
                    record.correct
                        ? "correct"
                        : "wrong",
                mode:
                    record.source === "Connected PYQ"
                        ? "connected-pyq"
                        : "ai-practice",
                recorded_at:
                    record.timestamp ||
                    new Date().toISOString()
            });

            changed = true;
        });

        if (changed) {

            localStorage.setItem(
                performanceKey,
                JSON.stringify(
                    performance
                )
            );

            console.log(
                "BAJEE JRF AI: Existing practice attempts synced to entity performance."
            );
        }

    } catch (error) {

        console.warn(
            "Unable to repair existing entity performance data.",
            error
        );
    }
}


/* =========================================================
   RESOLVE CANONICAL ENTITY NAME
========================================================= */

function resolveCanonicalEntityName(
    value
) {

    const fallback =
        String(value || "").trim();

    if (!fallback) {
        return "";
    }

    const graphKeys = [

        "bajee_knowledge_graph",
        "bajee_knowledge_graph_data",
        "knowledgeGraph",
        "knowledgeGraphData",
        "bajeeKnowledgeGraph"
    ];

    const target =
        normaliseEntityKey(
            fallback
        );

    for (const key of graphKeys) {

        try {

            const raw =
                localStorage.getItem(key);

            if (!raw) continue;

            const data =
                safeJsonParse(raw);

            const entities =
                Array.isArray(data?.entities)
                    ? data.entities
                    : Array.isArray(data?.nodes)
                        ? data.nodes
                        : [];

            const match =
                entities.find(entity => {

                    const id =
                        normaliseEntityKey(
                            entity?.id
                        );

                    const name =
                        normaliseEntityKey(
                            entity?.name
                        );

                    return (
                        id === target ||
                        name === target
                    );
                });

            if (match?.name) {
                return String(
                    match.name
                ).trim();
            }

        } catch (error) {
            // Ignore optional graph-storage errors.
        }
    }

    /*
       Small compatibility aliases for the current
       Step 10.5 fallback graph.
    */

    const aliases = {
        derrida:
            "Jacques Derrida",
        deconstruction:
            "Deconstruction",
        differance:
            "Différance",
        "binary-opposition":
            "Binary Opposition",
        logocentrism:
            "Logocentrism",
        structuralism:
            "Structuralism",
        "post-structuralism":
            "Post-Structuralism"
    };

    return
        aliases[fallback.toLowerCase()] ||
        fallback;
}


/* =========================================================
   NORMALISE ENTITY KEY
========================================================= */

function normaliseEntityKey(
    value
) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[’']/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}


/* =========================================================
   SHOW SOLUTION
========================================================= */

function showSolution() {

    if (!currentQuestion) {
        return;
    }

    const solution =
        currentQuestion.solution ||
        {};

    const solutionSection =
        document.getElementById(
            "solutionSection"
        );

    const solutionAnswer =
        document.getElementById(
            "solutionAnswer"
        );

    const keyPointsList =
        document.getElementById(
            "keyPointsList"
        );

    const resultExplanation =
        document.getElementById(
            "resultExplanation"
        );

    const additionalInformationList =
        document.getElementById(
            "additionalInformationList"
        );

    const jrfFocusList =
        document.getElementById(
            "jrfFocusList"
        );

    const commonConfusionList =
        document.getElementById(
            "commonConfusionList"
        );

    if (solutionSection) {

        solutionSection.style.display =
            "block";
    }

    if (solutionAnswer) {

        const letter =
            currentQuestion.correct_answer;

        const text =
            currentQuestion.answer_text ||
            currentQuestion.options[
                letter
            ] ||
            "";

        solutionAnswer.innerHTML = `
            <strong>
                Correct Answer: ${escapeHtml(
                    letter
                )}
            </strong>

            <br>

            ${escapeHtml(
                text
            )}
        `;
    }

    if (keyPointsList) {

        keyPointsList.innerHTML =
            "";

        const points =
            solution.key_points ||
            [];

        if (points.length) {

            points.forEach(
                point => {

                    const li =
                        document.createElement(
                            "li"
                        );

                    li.textContent =
                        point;

                    keyPointsList
                        .appendChild(
                            li
                        );
                }
            );

        } else {

            keyPointsList.innerHTML = `
                <li>
                    Remember the central concept,
                    author/work connection and
                    its JRF relevance.
                </li>
            `;
        }
    }

    if (resultExplanation) {

        resultExplanation.textContent =
            solution.explanation ||
            "Review the concept carefully for JRF preparation.";
    }

    if (
        additionalInformationList
    ) {

        renderSolutionList(
            additionalInformationList,

            solution.additional_information,

            "Review related authors, works, movements, theories or concepts."
        );
    }

    if (jrfFocusList) {

        renderSolutionList(
            jrfFocusList,

            solution.jrf_focus,

            "Remember the central fact and its examination relevance."
        );
    }

    if (commonConfusionList) {

        renderSolutionList(
            commonConfusionList,

            solution.common_confusion,

            "Be careful not to confuse closely related concepts."
        );
    }
}


/* =========================================================
   RENDER SOLUTION LIST
========================================================= */

function renderSolutionList(
    element,
    items,
    fallbackText
) {

    element.innerHTML =
        "";

    const cleanItems =
        Array.isArray(items)
            ? items.filter(Boolean)
            : [];

    if (
        !cleanItems.length
    ) {

        const li =
            document.createElement(
                "li"
            );

        li.textContent =
            fallbackText;

        element.appendChild(
            li
        );

        return;
    }

    cleanItems.forEach(
        item => {

            const li =
                document.createElement(
                    "li"
                );

            li.textContent =
                item;

            element.appendChild(
                li
            );
        }
    );
}


/* =========================================================
   RESULT METADATA
========================================================= */

function updateResultMetadata(
    question
) {

    const resultEntity =
        document.getElementById(
            "resultEntity"
        );

    const resultConcept =
        document.getElementById(
            "resultConcept"
        );

    if (resultEntity) {

        resultEntity.textContent =
            question.knowledge_entity ||
            "—";
    }

    if (resultConcept) {

        resultConcept.textContent =
            question.concept ||
            "—";
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
   SAVE QUESTION
========================================================= */

function savePracticeQuestion() {

    if (!currentQuestion) {
        return;
    }

    const storageKey =
        "bajee_ai_practice_bank";

    let bank = [];

    try {

        bank =
            JSON.parse(
                localStorage.getItem(
                    storageKey
                )
            ) || [];

    } catch (error) {

        bank = [];
    }

    const duplicate =
        bank.some(
            item =>
                item.question ===
                currentQuestion.question
        );

    if (!duplicate) {

        bank.push({

            ...currentQuestion,

            saved_at:
                new Date()
                    .toISOString()
        });

        localStorage.setItem(
            storageKey,
            JSON.stringify(
                bank
            )
        );

        const savedMessage =
            document.getElementById(
                "savedMessage"
            );

        if (savedMessage) {

            savedMessage.textContent =
                "Question saved to your AI Practice Bank.";

            savedMessage.style.display =
                "block";
        }
    }

    updateSavedCount();

    updateSaveButton();
}


/* =========================================================
   SAVED COUNT
========================================================= */

function updateSavedCount() {

    const savedCount =
        document.getElementById(
            "savedCount"
        );

    if (!savedCount) {
        return;
    }

    let bank = [];

    try {

        bank =
            JSON.parse(
                localStorage.getItem(
                    "bajee_ai_practice_bank"
                )
            ) || [];

    } catch (error) {

        bank = [];
    }

    savedCount.textContent =
        bank.length;
}


/* =========================================================
   SAVE BUTTON
========================================================= */

function updateSaveButton() {

    const saveButton =
        document.getElementById(
            "saveButton"
        );

    if (!saveButton) {
        return;
    }

    saveButton.disabled =
        !currentQuestion ||
        !questionAnswered;

    if (!currentQuestion) {
        return;
    }

    let bank = [];

    try {

        bank =
            JSON.parse(
                localStorage.getItem(
                    "bajee_ai_practice_bank"
                )
            ) || [];

    } catch (error) {

        bank = [];
    }

    const exists =
        bank.some(
            item =>
                item.question ===
                currentQuestion.question
        );

    if (exists) {

        saveButton.textContent =
            "✓ Saved";

        saveButton.disabled =
            true;

    } else {

        saveButton.textContent =
            "Save to Practice Bank";
    }
}


/* =========================================================
   ADAPTIVE CONTEXT
========================================================= */

function loadAdaptiveContext() {

    const keys = [

        "bajee_balanced_queue",

        "balancedQueue",

        "adaptiveBalancedQueue",

        "bajee_adaptive_queue",

        "adaptiveQuestionQueue",

        "step85BalancedQueue"

    ];

    let data = null;

    for (
        const key of keys
    ) {

        try {

            const stored =
                localStorage.getItem(
                    key
                );

            if (stored) {

                const parsed =
                    JSON.parse(
                        stored
                    );

                if (parsed) {

                    data =
                        parsed;

                    break;
                }
            }

        } catch (error) {

            // Optional adaptive data.
        }
    }

    if (!data) {
        return;
    }

    let item = null;

    if (
        Array.isArray(data)
    ) {

        item =
            data[0];

    } else if (
        Array.isArray(
            data.queue
        )
    ) {

        item =
            data.queue[0];

    } else if (
        Array.isArray(
            data.items
        )
    ) {

        item =
            data.items[0];
    }

    if (
        !item ||
        typeof item !== "object"
    ) {
        return;
    }

    const entity =
        item.knowledge_entity ||
        item.knowledgeEntity ||
        item.entity ||
        "";

    const concept =
        item.concept ||
        "";

    const unit =
        item.unit ||
        "";

    const difficulty =
        item.difficulty ||
        "";

    const entityField =
        document.getElementById(
            "knowledgeEntity"
        );

    const conceptField =
        document.getElementById(
            "concept"
        );

    const unitField =
        document.getElementById(
            "unit"
        );

    const difficultyField =
        document.getElementById(
            "difficulty"
        );

    if (
        entityField &&
        !entityField.value &&
        entity
    ) {

        entityField.value =
            entity;
    }

    if (
        conceptField &&
        !conceptField.value &&
        concept
    ) {

        conceptField.value =
            concept;
    }

    if (
        unitField &&
        unit
    ) {

        unitField.value =
            unit;
    }

    if (
        difficultyField &&
        difficulty
    ) {

        difficultyField.value =
            difficulty;
    }
}


/* =========================================================
   API STATUS
========================================================= */

async function checkApiStatus() {

    const apiStatus =
        document.getElementById(
            "apiStatus"
        );

    if (!apiStatus) {
        return;
    }

    try {

        const response =
            await fetch(
                `${getApiBase()}/health`
            );

        if (!response.ok) {

            throw new Error(
                "API unavailable"
            );
        }

        const data =
            await response.json();

        if (
            data.status === "ok"
        ) {

            apiStatus.textContent =
                "AI API: Connected";

            apiStatus.className =
                "badge bg-success";

        } else {

            apiStatus.textContent =
                "AI API: Check server";

            apiStatus.className =
                "badge bg-warning";
        }

    } catch (error) {

        apiStatus.textContent =
            "AI API: Offline";

        apiStatus.className =
            "badge bg-danger";
    }
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const generateButton =
            document.getElementById(
                "generateBtn"
            );

        const saveButton =
            document.getElementById(
                "saveButton"
            );

        if (generateButton) {

            generateButton.addEventListener(
                "click",
                generateQuestion
            );
        }

        if (saveButton) {

            saveButton.addEventListener(
                "click",
                savePracticeQuestion
            );
        }

        updateSavedCount();

        updateSaveButton();

        loadAdaptiveContext();

        checkApiStatus();


        /*
           IMPORTANT:
           Try the PYQ bridge AFTER the normal page
           controls have been initialized.
        */

        const loadedPYQ =
            loadPYQPractice();

        if (loadedPYQ) {

            currentQuestionSource =
                "Connected PYQ";
        }

        /*
           Repair any Connected PYQ attempt that was
           recorded before the entity-performance bridge
           was added. This is safe because each history
           entry is checked by question ID + timestamp.
        */

        syncExistingPracticeAttemptsToEntityPerformance();
    }
);