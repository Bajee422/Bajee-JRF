import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "node:crypto";
import {
    registerYouTubeSourceRoute
} from "./youtube-source.js";
import {
    registerYouTubeNotesRoute
} from "./youtube-notes.js";

dotenv.config();

const app = express();

const PORT =
    Number(process.env.PORT || 3000);

const GEMINI_API_KEY =
    process.env.GEMINI_API_KEY || "";

const GEMINI_MODEL =
    process.env.GEMINI_MODEL ||
    "gemini-3.5-flash-lite";

const BAJEE_API_ACCESS_TOKEN =
    process.env.BAJEE_API_ACCESS_TOKEN || "";

const NODE_ENV =
    process.env.NODE_ENV || "development";

const RATE_LIMIT_PER_MIN =
    Math.max(
        10,
        Math.min(
            300,
            Number(process.env.RATE_LIMIT_PER_MIN || 60)
        )
    );

const GEMINI_TIMEOUT_MS =
    Math.max(
        5000,
        Math.min(
            60000,
            Number(process.env.GEMINI_TIMEOUT_MS || 30000)
        )
    );

const MAX_MESSAGE_CHARS =
    Math.max(1000, Math.min(50000, Number(process.env.MAX_MESSAGE_CHARS || 12000)));

const MAX_CONTEXT_VALUE_CHARS =
    Math.max(200, Math.min(10000, Number(process.env.MAX_CONTEXT_VALUE_CHARS || 2000)));

const DEFAULT_ALLOWED_ORIGINS = [
    "http://127.0.0.1:3000",
    "http://localhost:3000"
];

const ALLOWED_ORIGINS =
    (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(","))
        .split(",")
        .map(origin => origin.trim())
        .filter(Boolean);

if (NODE_ENV === "production" && !BAJEE_API_ACCESS_TOKEN) {
    throw new Error(
        "BAJEE_API_ACCESS_TOKEN must be configured in production."
    );
}

if (NODE_ENV === "production" && ALLOWED_ORIGINS.length === 0) {
    throw new Error(
        "ALLOWED_ORIGINS must be configured in production."
    );
}

const rateLimitStore = new Map();


/* =========================================================
   SECURITY HELPERS
========================================================= */

function getClientKey(req) {

    return req.socket?.remoteAddress || "unknown";
}


function consumeRateLimit(req) {

    const now = Date.now();
    const key = getClientKey(req);
    const existing = rateLimitStore.get(key);

    if (!existing || now - existing.windowStart >= 60000) {

        rateLimitStore.set(key, {
            windowStart: now,
            count: 1
        });

        return {
            allowed: true,
            remaining: RATE_LIMIT_PER_MIN - 1,
            retryAfter: 60
        };
    }

    existing.count += 1;

    return {
        allowed: existing.count <= RATE_LIMIT_PER_MIN,
        remaining: Math.max(0, RATE_LIMIT_PER_MIN - existing.count),
        retryAfter: Math.max(1, Math.ceil((60000 - (now - existing.windowStart)) / 1000))
    };
}


function cleanupRateLimitStore() {

    const cutoff = Date.now() - 60000;

    for (const [key, entry] of rateLimitStore.entries()) {

        if (entry.windowStart < cutoff) {
            rateLimitStore.delete(key);
        }
    }
}

setInterval(
    cleanupRateLimitStore,
    60000
).unref();


function safeTimingEqual(left, right) {

    const leftBuffer = Buffer.from(String(left));
    const rightBuffer = Buffer.from(String(right));

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        leftBuffer,
        rightBuffer
    );
}


function validateAccessToken(req) {

    // Fail closed: callers must handle missing server configuration separately.
    if (!BAJEE_API_ACCESS_TOKEN) {
        return false;
    }

    const authorization =
        typeof req.headers.authorization === "string"
            ? req.headers.authorization
            : "";

    if (!authorization.startsWith("Bearer ")) {
        return false;
    }

    const suppliedToken =
        authorization.slice(7).trim();

    return Boolean(
        suppliedToken &&
        safeTimingEqual(
            suppliedToken,
            BAJEE_API_ACCESS_TOKEN
        )
    );
}


function securityHeaders(req, res, next) {

    res.setHeader(
        "X-Content-Type-Options",
        "nosniff"
    );

    res.setHeader(
        "X-Frame-Options",
        "DENY"
    );

    res.setHeader(
        "Referrer-Policy",
        "no-referrer"
    );

    res.setHeader(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), payment=()"
    );

    res.setHeader(
        "Cross-Origin-Resource-Policy",
        "same-origin"
    );

    if (NODE_ENV === "production") {
        res.setHeader(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains"
        );
    }

    next();
}


function apiSecurity(req, res, next) {

    const rate = consumeRateLimit(req);

    res.setHeader(
        "X-RateLimit-Limit",
        String(RATE_LIMIT_PER_MIN)
    );

    res.setHeader(
        "X-RateLimit-Remaining",
        String(rate.remaining)
    );

    if (!rate.allowed) {

        res.setHeader(
            "Retry-After",
            String(rate.retryAfter)
        );

        return res.status(429).json({
            success: false,
            error: "Too many requests. Please try again later.",
            code: "rate_limited"
        });
    }

    // A missing server-side token is a configuration failure, never permission.
    if (!BAJEE_API_ACCESS_TOKEN) {
        return res.status(503).json({
            success: false,
            error: "API access protection is not configured.",
            code: "access_token_not_configured"
        });
    }

    if (!validateAccessToken(req)) {
        return res.status(401).json({
            success: false,
            error: "Unauthorized.",
            code: "unauthorized"
        });
    }

    return next();
}


/* =========================================================
   MIDDLEWARE
========================================================= */

app.disable("x-powered-by");

app.use(securityHeaders);

app.use(
    cors({
        origin(origin, callback) {

            if (!origin) {
                return callback(null, true);
            }

            if (ALLOWED_ORIGINS.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("CORS origin not allowed")
            );
        },
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ],
        credentials: false,
        maxAge: 600
    })
);

app.use(
    express.json({
        limit: "2mb",
        strict: true
    })
);

/* ---------------------------------------------------------
   PUBLIC HEALTH CHECK
   Deliberately contains no secrets, model names or config.
--------------------------------------------------------- */

app.get(
    "/api/health",
    (req, res) => {
        res.json({
            success: true,
            service: "BAJEE JRF AI AI Gateway",
            status: "healthy"
        });
    }
);


app.use(
    "/api",
    apiSecurity
);


/* =========================================================
   GEMINI URL
========================================================= */

function getGeminiUrl() {

    return (
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        encodeURIComponent(GEMINI_MODEL) +
        ":generateContent"
    );
}


/* =========================================================
   EXTRACT GEMINI TEXT
========================================================= */

function extractGeminiText(data) {

    const parts =
        data?.candidates?.[0]?.content?.parts || [];

    return parts
        .map(
            part =>
                part?.text || ""
        )
        .join("")
        .trim();
}


/* =========================================================
   BAJEE JRF AI ACADEMIC INSTRUCTIONS
========================================================= */

const BAJEE_ACADEMIC_INSTRUCTION = `

You are BAJEE JRF AI, an expert academic assistant
for UGC NET English Paper II and JRF preparation.

Your priority is ACADEMIC ACCURACY and EXAM VALUE,
not producing unnecessarily long answers.

=========================================================
QUESTION QUALITY
=========================================================

Respond to the user's actual request first. If the user asks to learn, explain, describe, summarize, or understand a topic, provide structured UGC NET/JRF learning material with a clear title, author, period, genre, overview, major literary features, and exam-focused points where relevant. Do not replace a learning request with a quiz. Include a practice question only when the user requests one or after the requested explanation as an optional final section. If the user explicitly asks for a practice question, generate the question and answer in the required format.
question.


RESPONSE RULES

1. Answer the user's actual request before adding optional material.
2. For learning requests, provide a structured UGC NET/JRF learning note.
3. Use a suitable title and relevant metadata such as author, period, genre, and language when known.
4. Include an overview, major literary features, and exam-focused points when relevant.
5. Include a practice question only when requested or as a clearly separate optional final section.
6. For explicit quiz requests, provide four plausible options and one correct answer.
7. Never invent authors, works, dates, theories, quotations, movements, or literary facts.
8. Distinguish verified source material from AI-generated practice content.


=========================================================
FACTUAL ACCURACY
=========================================================

Use established literary, linguistic, theoretical,
historical and critical information.

Do NOT invent information to make the response longer.

If a peripheral fact is uncertain, OMIT IT.

Do not create:

- invented publication dates
- invented quotations
- invented author relationships
- invented theoretical terminology
- invented influence claims
- unsupported biographical details
- unsupported pronunciation claims
- unsupported historical connections

Accuracy is more important than completeness.

=========================================================
EXPLANATION
=========================================================

The explanation should answer:

WHY is this answer correct?

Explain the actual concept tested by the question.

The explanation should normally be one concise,
well-developed academic paragraph.

Do not turn the explanation into a list.

Do not repeat the key points word-for-word.

Do not include JRF study advice inside the explanation.

=========================================================
KEY POINTS
=========================================================

Key points are HIGH-VALUE FACTS that a JRF aspirant
should remember.

Each point should be:

- short
- factual
- directly relevant
- independently useful

Do NOT create filler points merely to reach a number.

Usually 2–4 strong points are better than many weak points.

Do not include trivial spelling, pronunciation or
word-origin details unless they are directly relevant
to the concept being tested.

Do not repeat the explanation.

=========================================================
ADDITIONAL INFORMATION
=========================================================

Use this section only for genuinely useful related
academic information.

Depending on the topic, this may include:

- related author
- related work
- related movement
- related theory
- related critic
- important terminology
- relevant historical context
- meaningful chronology
- connection with another important concept

Do NOT repeat the key points.

Do NOT add unrelated trivia.

If there is no important additional information,
provide a short empty array rather than inventing facts.

=========================================================
JRF FOCUS
=========================================================

This section is specifically for examination preparation.

Give concise memory-oriented points such as:

- what distinction the student must remember
- what concept is commonly tested
- what author/work/theory association matters
- what terminology should trigger recognition
- what relationship is useful for NET/JRF questions

Do not write generic advice such as:

"Study this carefully."

"Remember this for JRF."

"Review the topic."

Every JRF Focus point must contain actual academic
information.

=========================================================
COMMON CONFUSION
=========================================================

Identify realistic mistakes a student might make.

The confusion should relate directly to the options
or to closely related academic concepts.

For example:

- two similar theoretical terms
- two authors associated with related movements
- a work confused with another work
- a concept confused with a related concept
- a date/chronology confusion
- a critic confused with another critic

Do not invent a confusion merely to fill this section.

=========================================================
NO DUPLICATION
=========================================================

The following sections must contain DIFFERENT information:

explanation
key_points
additional_information
jrf_focus
common_confusion

Do not copy the same sentence into multiple sections.

A fact may be related across sections, but the wording
and purpose must be different.

=========================================================
SOURCE TYPE
=========================================================

The question is:

"AI Practice"

It is NOT:

"Official PYQ"

"Previous Year Question"

"UGC NET official question"

Never label it as an official examination question.

=========================================================
OUTPUT
=========================================================

Return ONLY the JSON structure requested by the schema.

Do not add markdown.

Do not add commentary.

Do not add headings outside JSON.

`;


/* =========================================================
   AI CHAT
========================================================= */

async function handleAIChat(req, res) {

    try {

        /* -------------------------------------------------
           CHECK API KEY
        ------------------------------------------------- */

        if (!GEMINI_API_KEY) {

            return res.status(500).json({

                success: false,

                error:
                    "Gemini API key is not configured.",

                code:
                    "gemini_key_missing"
            });
        }


        /* -------------------------------------------------
           MESSAGE
        ------------------------------------------------- */

        const message =
            typeof req.body?.message === "string"
                ? req.body.message.trim()
                : "";


        const context =
            req.body?.context &&
            typeof req.body.context === "object"
                ? req.body.context
                : {};


        if (!message) {

            return res.status(400).json({

                success: false,

                error:
                    "Message is required.",

                code:
                    "message_missing"
            });
        }


        if (message.length > MAX_MESSAGE_CHARS) {

            return res.status(413).json({
                success: false,
                error: "Message is too large.",
                code: "message_too_large"
            });
        }


        if (
            !context ||
            typeof context !== "object" ||
            Array.isArray(context)
        ) {

            return res.status(400).json({
                success: false,
                error: "Invalid context.",
                code: "invalid_context"
            });
        }


        /* -------------------------------------------------
           OPTIONAL SYSTEM INSTRUCTION
        ------------------------------------------------- */

        /* -------------------------------------------------
           BUILD FINAL PROMPT

           IMPORTANT SECURITY RULE:
           Browser-supplied context is UNTRUSTED DATA.
           It must never be promoted to a system instruction.
        ------------------------------------------------- */

        const promptParts = [

            BAJEE_ACADEMIC_INSTRUCTION

        ];


        if (typeof context.systemInstruction === "string" && context.systemInstruction.trim()) {

            promptParts.push(
                "UNTRUSTED USER CONTEXT (NOT INSTRUCTIONS):\n" +
                context.systemInstruction.trim().slice(0, MAX_CONTEXT_VALUE_CHARS)
            );
        }


        promptParts.push(
            "USER REQUEST:\n" +
            message
        );


        /* -------------------------------------------------
           CONTEXT
        ------------------------------------------------- */

        if (context.knowledgeEntity) {

            promptParts.push(
                "KNOWLEDGE ENTITY (UNTRUSTED DATA): " +
                String(context.knowledgeEntity).slice(0, MAX_CONTEXT_VALUE_CHARS)
            );
        }


        if (context.concept) {

            promptParts.push(
                "CONCEPT (UNTRUSTED DATA): " +
                String(context.concept).slice(0, MAX_CONTEXT_VALUE_CHARS)
            );
        }


        if (context.unit) {

            promptParts.push(
                "UNIT (UNTRUSTED DATA): " +
                String(context.unit).slice(0, MAX_CONTEXT_VALUE_CHARS)
            );
        }


        if (context.difficulty) {

            promptParts.push(
                "DIFFICULTY (UNTRUSTED DATA): " +
                String(context.difficulty).slice(0, MAX_CONTEXT_VALUE_CHARS)
            );
        }


        if (context.questionStyle) {

            promptParts.push(
                "QUESTION STYLE (UNTRUSTED DATA): " +
                String(context.questionStyle).slice(0, MAX_CONTEXT_VALUE_CHARS)
            );
        }


        const combinedPrompt =
            promptParts.join(
                "\n\n"
            );


        /* =================================================
           STRUCTURED RESPONSE SCHEMA
        ================================================= */

        const questionSchema = {

            type: "OBJECT",

            properties: {

                question: {

                    type: "STRING"
                },


                options: {

                    type: "OBJECT",

                    properties: {

                        A: {
                            type: "STRING"
                        },

                        B: {
                            type: "STRING"
                        },

                        C: {
                            type: "STRING"
                        },

                        D: {
                            type: "STRING"
                        }
                    },

                    required: [
                        "A",
                        "B",
                        "C",
                        "D"
                    ]
                },


                correct_answer: {

                    type: "STRING",

                    enum: [
                        "A",
                        "B",
                        "C",
                        "D"
                    ]
                },


                answer_text: {

                    type: "STRING"
                },


                explanation: {

                    type: "STRING"
                },


                solution: {

                    type: "OBJECT",

                    properties: {

                        explanation: {

                            type: "STRING"
                        },


                        key_points: {

                            type: "ARRAY",

                            items: {

                                type: "STRING"
                            }
                        },


                        additional_information: {

                            type: "ARRAY",

                            items: {

                                type: "STRING"
                            }
                        },


                        jrf_focus: {

                            type: "ARRAY",

                            items: {

                                type: "STRING"
                            }
                        },


                        common_confusion: {

                            type: "ARRAY",

                            items: {

                                type: "STRING"
                            }
                        }
                    },

                    required: [

                        "explanation",

                        "key_points",

                        "additional_information",

                        "jrf_focus",

                        "common_confusion"
                    ]
                },


                knowledge_entity: {

                    type: "STRING"
                },


                concept: {

                    type: "STRING"
                },


                unit: {

                    type: "STRING"
                },


                difficulty: {

                    type: "STRING"
                },


                question_style: {

                    type: "STRING"
                },


                source_type: {

                    type: "STRING"
                }
            },


            required: [

                "question",

                "options",

                "correct_answer",

                "answer_text",

                "explanation",

                "solution",

                "knowledge_entity",

                "concept",

                "unit",

                "difficulty",

                "question_style",

                "source_type"
            ]
        };


        /* =================================================
           GEMINI REQUEST
        ================================================= */

        const requestBody = {

            system_instruction: {

                parts: [

                    {

                        text:
                            BAJEE_ACADEMIC_INSTRUCTION
                    }
                ]
            },


            contents: [

                {

                    role: "user",

                    parts: [

                        {

                            text:
                                combinedPrompt
                        }
                    ]
                }
            ],


            generationConfig: {

                /*
                   Lower temperature improves consistency
                   and reduces unnecessary creative additions.
                */

                temperature: 0.25,

                responseMimeType:
                    "application/json",

                responseSchema:
                    questionSchema
            }
        };


        console.log(
            "Sending BAJEE JRF AI structured request..."
        );


        /* =================================================
           GEMINI REQUEST
        ================================================= */

        const geminiAbortController =
            new AbortController();

        const geminiTimeout =
            setTimeout(
                () => geminiAbortController.abort(),
                GEMINI_TIMEOUT_MS
            );

        let geminiResponse;

        try {

            geminiResponse =
                await fetch(
                    getGeminiUrl(),
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "x-goog-api-key":
                                GEMINI_API_KEY
                        },

                        body:
                            JSON.stringify(
                                requestBody
                            ),

                        signal:
                            geminiAbortController.signal
                    }
                );

        } catch (error) {

            if (error?.name === "AbortError") {

                return res.status(504).json({
                    success: false,
                    error: "AI service timed out. Please try again.",
                    code: "gemini_timeout"
                });
            }

            return res.status(502).json({
                success: false,
                error: "AI service is temporarily unavailable.",
                code: "gemini_unavailable"
            });

        } finally {

            clearTimeout(geminiTimeout);
        }


        const data =
            await geminiResponse.json();


        /* =================================================
           GEMINI ERROR
        ================================================= */

        if (!geminiResponse.ok) {

            console.error(
                "Gemini API error:"
            );

            console.error(
                JSON.stringify(
                    data,
                    null,
                    2
                )
            );


            const upstreamStatus =
                Number(geminiResponse.status);

            return res.status(
                upstreamStatus >= 400 && upstreamStatus < 600
                    ? upstreamStatus
                    : 502
            ).json({

                success: false,

                error:
                    "AI service request failed. Please try again.",

                code:
                    "gemini_api_error"
            });
        }


        /* =================================================
           EXTRACT RESPONSE
        ================================================= */

        const reply =
            extractGeminiText(
                data
            );


        if (!reply) {

            return res.status(
                502
            ).json({

                success: false,

                error:
                    "Gemini returned an empty response.",

                code:
                    "empty_gemini_response"
            });
        }


        /* =================================================
           DEBUG STRUCTURE ONLY
        ================================================= */

        try {

            const parsed =
                JSON.parse(reply);


            console.log(
                "BAJEE JRF AI response quality structure:",
                {

                    question:
                        Boolean(
                            parsed.question
                        ),

                    options:
                        Boolean(
                            parsed.options
                        ),

                    correctAnswer:
                        Boolean(
                            parsed.correct_answer
                        ),

                    explanation:
                        Boolean(
                            parsed.explanation
                        ),

                    solution:
                        Boolean(
                            parsed.solution
                        ),

                    keyPoints:
                        Array.isArray(
                            parsed.solution
                                ?.key_points
                        )
                        ? parsed.solution
                            .key_points.length
                        : 0,

                    additionalInformation:
                        Array.isArray(
                            parsed.solution
                                ?.additional_information
                        )
                        ? parsed.solution
                            .additional_information.length
                        : 0,

                    jrfFocus:
                        Array.isArray(
                            parsed.solution
                                ?.jrf_focus
                        )
                        ? parsed.solution
                            .jrf_focus.length
                        : 0,

                    commonConfusion:
                        Array.isArray(
                            parsed.solution
                                ?.common_confusion
                        )
                        ? parsed.solution
                            .common_confusion.length
                        : 0
                }
            );

        } catch (error) {

            console.warn(
                "Could not inspect structured AI response."
            );
        }


        /* =================================================
           RETURN RESPONSE
        ================================================= */

        return res.json({

            success: true,

            response: {

                provider:
                    "Google Gemini",

                model:
                    GEMINI_MODEL,

                reply:
                    reply
            }
        });


    } catch (error) {

        console.error(
            "BAJEE JRF AI backend error:"
        );

        console.error(
            error
        );


        return res.status(
            500
        ).json({

            success: false,

            error:
                "Unexpected server error.",

            code:
                "backend_error"
        });
    }
}


/* =========================================================
   ROOT
========================================================= */

app.get(
    "/",
    (req, res) => {

        res.json({
            success: true,
            service: "BAJEE JRF AI AI Gateway",
            status: "online"
        });
    }
);


/* =========================================================
   HEALTH
========================================================= */

/* =========================================================
   AI ROUTES
========================================================= */

app.post(
    "/api/ai/chat",
    handleAIChat
);

app.post(
    "/api/chat",
    handleAIChat
);


/* =========================================================
   YOUTUBE SOURCE ROUTE
========================================================= */

registerYouTubeSourceRoute(
    app
);


/* =========================================================
   YOUTUBE AI NOTES / MATERIALS / STUDY LIBRARY ROUTES — PHASE 7.2.5
========================================================= */

registerYouTubeNotesRoute(
    app
);


/* =========================================================
   404
========================================================= */

app.use(
    (req, res) => {

        res.status(
            404
        ).json({

            success: false,

            error:
                "Route not found.",

            code:
                "route_not_found"
        });
    }
);


/* =========================================================
   SECURITY ERROR HANDLER
========================================================= */

app.use(
    (error, req, res, next) => {

        if (error?.message === "CORS origin not allowed") {
            return res.status(403).json({
                success: false,
                error: "Origin not allowed.",
                code: "cors_denied"
            });
        }

        if (error?.type === "entity.too.large") {
            return res.status(413).json({
                success: false,
                error: "Request body is too large.",
                code: "payload_too_large"
            });
        }

        if (error instanceof SyntaxError && error?.status === 400) {
            return res.status(400).json({
                success: false,
                error: "Malformed JSON request.",
                code: "invalid_json"
            });
        }

        return res.status(500).json({
            success: false,
            error: "Unexpected server error.",
            code: "server_error"
        });
    }
);



app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");

        console.log(
            "=============================================="
        );

        console.log(
            "        BAJEE JRF AI - AI GATEWAY"
        );

        console.log(
            "=============================================="
        );

        console.log(
            `Server: http://127.0.0.1:${PORT}`
        );

        console.log(
            `Health: http://127.0.0.1:${PORT}/api/health`
        );

        console.log(
            `AI: http://127.0.0.1:${PORT}/api/ai/chat`
        );

        console.log(
            "Provider: Google Gemini"
        );

        console.log(
            `Gemini API key configured: ${GEMINI_API_KEY ? "YES" : "NO (AI requests will return gemini_key_missing)"}`
        );

        console.log(
            `Gemini model: ${GEMINI_MODEL}`
        );

        console.log(
            `Access token protection: ${
                BAJEE_API_ACCESS_TOKEN
                    ? "ENABLED"
                    : "DISABLED (development mode)"
            }`
        );

        console.log(
            `Rate limit: ${RATE_LIMIT_PER_MIN} requests/minute`
        );

        console.log(
            "Structured Solution Schema: ENABLED"
        );

        console.log(
            "JRF Academic Quality Controls: ENABLED"
        );

        console.log(
            "=============================================="
        );

        console.log("");
    }
);
