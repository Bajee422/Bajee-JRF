/* =========================================================
   BAJEE JRF AI — YOUTUBE AI NOTES

   Phase 7.2.3
   Generate notes ONLY from the acquired YouTube transcript.
========================================================= */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";


const MODULE_DIRECTORY =
    path.dirname(
        fileURLToPath(import.meta.url)
    );


const YOUTUBE_LIBRARY_DIRECTORY =
    path.resolve(
        MODULE_DIRECTORY,
        "../../data/library"
    );


const YOUTUBE_LIBRARY_FILE =
    path.join(
        YOUTUBE_LIBRARY_DIRECTORY,
        "youtube-study-materials.json"
    );


/* =========================================================
   GEMINI CONFIGURATION

   IMPORTANT:
   Do NOT read GEMINI_API_KEY at module-load time.

   server.js imports this module before dotenv.config()
   executes in the server module body.

   Therefore process.env is read INSIDE the request flow.
========================================================= */

function getGeminiApiKey() {

    return (
        process.env.GEMINI_API_KEY ||
        ""
    );

}


function getGeminiModel() {

    return (
        process.env.GEMINI_MODEL ||
        "gemini-3.1-flash-lite"
    );

}


/* =========================================================
   GEMINI URL
========================================================= */

function getGeminiUrl() {

    const model =
        getGeminiModel();

    return (
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        encodeURIComponent(model) +
        ":generateContent"
    );

}


/* =========================================================
   EXTRACT GEMINI TEXT
========================================================= */

function extractGeminiText(data) {

    const parts =
        data?.candidates?.[0]?.content?.parts;


    if (!Array.isArray(parts)) {

        return "";

    }


    return parts
        .map(
            part =>
                typeof part?.text === "string"
                    ? part.text
                    : ""
        )
        .join("")
        .trim();

}


/* =========================================================
   CLEAN JSON TEXT
========================================================= */

function cleanJsonText(text) {

    const value =
        String(text || "")
            .trim();


    if (!value) {

        return "";

    }


    if (
        value.startsWith("```")
    ) {

        return value
            .replace(
                /^```(?:json)?\s*/i,
                ""
            )
            .replace(
                /\s*```$/,
                ""
            )
            .trim();

    }


    return value;

}


/* =========================================================
   VALIDATE NOTES STRUCTURE
========================================================= */

function validateNotes(notes) {

    if (
        !notes ||
        typeof notes !== "object"
    ) {

        return false;

    }


    if (
        typeof notes.title !==
        "string"
    ) {

        return false;

    }


    if (
        typeof notes.overview !==
        "string"
    ) {

        return false;

    }


    if (
        !Array.isArray(
            notes.sections
        )
    ) {

        return false;

    }


    return notes.sections.every(
        section =>

            section &&
            typeof section.heading ===
                "string" &&
            Array.isArray(
                section.points
            ) &&
            section.points.every(
                point =>
                    typeof point ===
                    "string"
            )

    );

}


/* =========================================================
   SOURCE-GROUNDED AI INSTRUCTION
========================================================= */

const NOTES_SYSTEM_INSTRUCTION = `

You are the BAJEE JRF AI source-grounded study-notes generator.

Your ONLY source of factual information is the ACQUIRED YOUTUBE TRANSCRIPT supplied in the user message.

STRICT SOURCE RULE:

- Use only information explicitly supported by the supplied transcript.
- Do NOT add outside facts.
- Do NOT add outside knowledge.
- Do NOT add unsupported dates.
- Do NOT add unsupported examples.
- Do NOT add unsupported quotations.
- Do NOT add unsupported interpretations.
- Do NOT add unsupported biographical information.
- Do NOT add unsupported publication information.
- Do NOT add unsupported historical connections.
- Do NOT silently correct the transcript using your own knowledge.
- Do NOT fill gaps using general knowledge.
- If a point is not supported by the transcript, omit it.
- If the transcript is incomplete or unclear, do not guess.
- Preserve the terminology and meaning used by the source.

NOTES TASK:

Create structured study notes from the supplied transcript only.

The notes should:

1. Give a concise overview of what the transcript actually covers.
2. Organize the material into logical sections based on the transcript.
3. Use concise but sufficiently detailed bullet points.
4. Preserve important names, terms, works, dates, concepts, or relationships ONLY when they appear in or are clearly stated by the transcript.
5. Avoid adding separate Key Points, Concepts, or Quiz sections.

Those are later BAJEE JRF AI Phase 7.2 milestones.

QUALITY RULE:

Accuracy is more important than completeness.

Do not invent material merely to make the notes longer.

If the transcript does not support a fact, leave it out.

OUTPUT RULE:

Return ONLY valid JSON matching the requested response schema.

Do not return markdown fences.

Do not return commentary outside the JSON.

`;


/* =========================================================
   NOTES RESPONSE SCHEMA
========================================================= */

const notesSchema = {

    type: "OBJECT",

    properties: {

        title: {

            type: "STRING"

        },


        overview: {

            type: "STRING"

        },


        sections: {

            type: "ARRAY",

            items: {

                type: "OBJECT",

                properties: {

                    heading: {

                        type: "STRING"

                    },


                    points: {

                        type: "ARRAY",

                        items: {

                            type: "STRING"

                        }

                    }

                },

                required: [

                    "heading",

                    "points"

                ]

            }

        }

    },

    required: [

        "title",

        "overview",

        "sections"

    ]

};


/* =========================================================
   YOUTUBE NOTES HANDLER
========================================================= */

async function handleYouTubeNotes(
    req,
    res
) {

    try {

        /* -------------------------------------------------
           READ ENVIRONMENT AT REQUEST TIME

           This is the important fix.
        ------------------------------------------------- */

        const GEMINI_API_KEY =
            getGeminiApiKey();

        const GEMINI_MODEL =
            getGeminiModel();


        /* -------------------------------------------------
           CHECK GEMINI KEY
        ------------------------------------------------- */

        if (!GEMINI_API_KEY) {

            console.error(
                "YouTube AI Notes: GEMINI_API_KEY is missing."
            );


            return res.status(
                500
            ).json({

                success: false,

                error:
                    "Gemini API key is not configured.",

                code:
                    "gemini_key_missing"

            });

        }


        /* -------------------------------------------------
           SOURCE OBJECT
        ------------------------------------------------- */

        const source =
            req.body?.source &&
            typeof req.body.source ===
                "object"

                ? req.body.source

                : null;


        if (!source) {

            return res.status(
                400
            ).json({

                success: false,

                error:
                    "Acquired source is required.",

                code:
                    "source_missing"

            });

        }


        /* -------------------------------------------------
           TRANSCRIPT
        ------------------------------------------------- */

        const transcript =
            typeof source.transcript ===
                "string"

                ? source.transcript.trim()

                : "";


        if (!transcript) {

            return res.status(
                400
            ).json({

                success: false,

                error:
                    "A readable transcript is required before AI Notes can be generated.",

                code:
                    "transcript_missing"

            });

        }


        /* -------------------------------------------------
           SOURCE METADATA
        ------------------------------------------------- */

        const sourceTitle =

            typeof source.title ===
                "string" &&

            source.title.trim()

                ? source.title.trim()

                : "YouTube Source";


        const sourceUrl =

            typeof source.url ===
                "string"

                ? source.url.trim()

                : "";


        const sourceLanguage =

            typeof source.language ===
                "string"

                ? source.language.trim()

                : "";


        const sourceMethod =

            typeof source.acquisitionMethod ===
                "string"

                ? source.acquisitionMethod.trim()

                : "";


        /* -------------------------------------------------
           PROMPT

           The transcript is the ONLY factual source.
        ------------------------------------------------- */

        const prompt = [

            NOTES_SYSTEM_INSTRUCTION,

            "SOURCE METADATA:",

            `Title: ${sourceTitle}`,

            `URL: ${
                sourceUrl ||
                "Not supplied"
            }`,

            `Language: ${
                sourceLanguage ||
                "Not supplied"
            }`,

            `Acquisition method: ${
                sourceMethod ||
                "Not supplied"
            }`,

            "",

            "ACQUIRED YOUTUBE TRANSCRIPT — THE ONLY FACTUAL SOURCE:",

            "----- BEGIN TRANSCRIPT -----",

            transcript,

            "----- END TRANSCRIPT -----",

            "",

            "Generate the study notes now using only the transcript above."

        ].join("\n");


        /* -------------------------------------------------
           LOG
        ------------------------------------------------- */

        console.log(
            "Generating source-grounded AI Notes:",
            {

                videoId:
                    source.videoId ||
                    "unknown",

                transcriptCharacters:
                    transcript.length,

                model:
                    GEMINI_MODEL

            }
        );


        /* -------------------------------------------------
           GEMINI REQUEST
        ------------------------------------------------- */

        const geminiResponse =
            await fetch(

                getGeminiUrl(),

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "x-goog-api-key":
                            GEMINI_API_KEY

                    },

                    body:
                        JSON.stringify({

                            system_instruction: {

                                parts: [

                                    {

                                        text:
                                            NOTES_SYSTEM_INSTRUCTION

                                    }

                                ]

                            },


                            contents: [

                                {

                                    role:
                                        "user",

                                    parts: [

                                        {

                                            text:
                                                prompt

                                        }

                                    ]

                                }

                            ],


                            generationConfig: {

                                temperature:
                                    0.15,

                                responseMimeType:
                                    "application/json",

                                responseSchema:
                                    notesSchema

                            }

                        })

                }

            );


        /* -------------------------------------------------
           GEMINI RESPONSE
        ------------------------------------------------- */

        const data =
            await geminiResponse.json();


        /* -------------------------------------------------
           GEMINI ERROR
        ------------------------------------------------- */

        if (
            !geminiResponse.ok
        ) {

            console.error(
                "Gemini AI Notes error:"
            );


            console.error(
                JSON.stringify(
                    data,
                    null,
                    2
                )
            );


            return res.status(
                geminiResponse.status
            ).json({

                success: false,

                error:
                    data?.error?.message ||

                    "Gemini AI Notes request failed.",

                code:
                    data?.error?.status ||

                    data?.error?.code ||

                    "gemini_notes_error"

            });

        }


        /* -------------------------------------------------
           EXTRACT TEXT
        ------------------------------------------------- */

        const rawText =
            extractGeminiText(
                data
            );


        const jsonText =
            cleanJsonText(
                rawText
            );


        if (!jsonText) {

            return res.status(
                502
            ).json({

                success: false,

                error:
                    "Gemini returned an empty AI Notes response.",

                code:
                    "empty_notes_response"

            });

        }


        /* -------------------------------------------------
           PARSE JSON
        ------------------------------------------------- */

        let notes;


        try {

            notes =
                JSON.parse(
                    jsonText
                );

        } catch (error) {

            console.error(
                "AI Notes JSON parse error:",
                error
            );


            console.error(
                "Raw Gemini response:",
                rawText
            );


            return res.status(
                502
            ).json({

                success: false,

                error:
                    "Gemini returned an invalid AI Notes JSON response.",

                code:
                    "invalid_notes_json"

            });

        }


        /* -------------------------------------------------
           VALIDATE STRUCTURE
        ------------------------------------------------- */

        if (
            !validateNotes(
                notes
            )
        ) {

            console.error(
                "AI Notes structure validation failed."
            );


            return res.status(
                502
            ).json({

                success: false,

                error:
                    "Gemini returned an incomplete AI Notes structure.",

                code:
                    "invalid_notes_structure"

            });

        }


        /* -------------------------------------------------
           RETURN NOTES
        ------------------------------------------------- */

        return res.json({

            success:
                true,

            notes: {

                ...notes,

                sourceGrounded:
                    true,

                sourceVideoId:
                    source.videoId ||
                    "",

                sourceTitle:
                    sourceTitle,

                sourceUrl:
                    sourceUrl,

                transcriptCharacters:
                    transcript.length,

                model:
                    GEMINI_MODEL

            }

        });


    } catch (error) {

        console.error(
            "BAJEE JRF AI YouTube Notes error:"
        );


        console.error(
            error
        );


        return res.status(
            500
        ).json({

            success: false,

            error:
                error?.message ||

                "Unexpected YouTube AI Notes error.",

            code:
                "youtube_notes_backend_error"

        });

    }

}


/* =========================================================
   PHASE 7.2.4 — KEY POINTS / CONCEPTS / QUIZ
========================================================= */

/*
   7.2.4 uses the SAME acquired transcript already produced
   by Phase 7.2.2 and does not reacquire the YouTube source.
*/

const materialsSystemInstruction = `

You are the BAJEE JRF AI source-grounded study-material generator.

Your ONLY factual source is the ACQUIRED YOUTUBE TRANSCRIPT supplied in the user message.

STRICT SOURCE RULE:
- Use only information explicitly supported by the supplied transcript.
- Do NOT add outside facts.
- Do NOT add outside knowledge.
- Do NOT invent dates, names, works, examples, quotations, definitions, interpretations, historical connections, or biographical information.
- Do NOT silently correct the transcript using general knowledge.
- Do NOT fill gaps using your own knowledge.
- If the transcript does not support a point, omit it.
- If the transcript is unclear, do not guess.
- Preserve the terminology and meaning used by the source.

KEY POINTS:
- Extract important points actually stated or clearly explained in the transcript.
- Do not turn unsupported general knowledge into key points.

CONCEPTS:
- Include only concepts that are actually introduced, discussed, or explained in the transcript.
- Explain each concept only to the extent supported by the transcript.

QUIZ:
- Create multiple-choice questions ONLY from the transcript.
- Every question must be answerable from the transcript alone.
- Each question must have exactly four options.
- There must be exactly one correct option.
- The explanation must be supported by the transcript.
- Write the explanation directly as the reason or factual justification for the correct answer.
- Do NOT begin explanations with phrases such as "The transcript states", "The transcript says", "According to the transcript", "The video states", "The source says", or similar source-referencing wording.
- Do NOT mention the transcript, source, video, or acquisition process inside the explanation unless the question itself specifically requires that reference.
- Do not test information that is absent from the transcript.
- Avoid ambiguous questions.
- Do not use outside knowledge to make distractors.
- Prefer meaningful exam-oriented questions based on the supplied source.

QUALITY RULE:
Accuracy is more important than quantity.
If the transcript supports fewer items, return fewer items rather than inventing content.

OUTPUT RULE:
Return ONLY valid JSON matching the requested response schema.
Do not return markdown fences.
Do not return commentary outside the JSON.

`;

const materialsSchema = {
    type: "OBJECT",

    properties: {

        keyPoints: {

            type: "ARRAY",

            items: {
                type: "STRING"
            }
        },

        concepts: {

            type: "ARRAY",

            items: {

                type: "OBJECT",

                properties: {

                    name: {
                        type: "STRING"
                    },

                    explanation: {
                        type: "STRING"
                    }
                },

                required: [
                    "name",
                    "explanation"
                ]
            }
        },

        quiz: {

            type: "ARRAY",

            items: {

                type: "OBJECT",

                properties: {

                    question: {
                        type: "STRING"
                    },

                    options: {

                        type: "ARRAY",

                        items: {
                            type: "STRING"
                        }
                    },

                    correctAnswer: {
                        type: "INTEGER"
                    },

                    explanation: {
                        type: "STRING"
                    }
                },

                required: [
                    "question",
                    "options",
                    "correctAnswer",
                    "explanation"
                ]
            }
        }
    },

    required: [
        "keyPoints",
        "concepts",
        "quiz"
    ]
};


function validateMaterials(materials) {

    if (
        !materials ||
        typeof materials !== "object"
    ) {
        return false;
    }

    if (
        !Array.isArray(materials.keyPoints) ||
        !materials.keyPoints.every(
            item => typeof item === "string"
        )
    ) {
        return false;
    }

    if (
        !Array.isArray(materials.concepts) ||
        !materials.concepts.every(
            concept =>
                concept &&
                typeof concept.name === "string" &&
                typeof concept.explanation === "string"
        )
    ) {
        return false;
    }

    if (!Array.isArray(materials.quiz)) {
        return false;
    }

    return materials.quiz.every(
        item => {

            if (
                !item ||
                typeof item.question !== "string" ||
                !Array.isArray(item.options) ||
                item.options.length !== 4 ||
                !item.options.every(
                    option => typeof option === "string"
                ) ||
                !Number.isInteger(item.correctAnswer) ||
                item.correctAnswer < 0 ||
                item.correctAnswer > 3 ||
                typeof item.explanation !== "string"
            ) {
                return false;
            }

            return true;
        }
    );
}


async function handleYouTubeMaterials(req, res) {

    try {

        const GEMINI_API_KEY =
            getGeminiApiKey();

        const GEMINI_MODEL =
            getGeminiModel();

        if (!GEMINI_API_KEY) {

            console.error(
                "YouTube materials: GEMINI_API_KEY is missing."
            );

            return res.status(500).json({

                success: false,

                error:
                    "Gemini API key is not configured.",

                code:
                    "gemini_key_missing"

            });

        }


        const source =
            req.body?.source &&
            typeof req.body.source === "object"
                ? req.body.source
                : null;


        if (!source) {

            return res.status(400).json({

                success: false,

                error:
                    "Acquired source is required.",

                code:
                    "source_missing"

            });

        }


        const transcript =
            typeof source.transcript === "string"
                ? source.transcript.trim()
                : "";


        if (!transcript) {

            return res.status(400).json({

                success: false,

                error:
                    "A readable transcript is required before Key Points, Concepts and Quiz can be generated.",

                code:
                    "transcript_missing"

            });

        }


        const sourceTitle =
            typeof source.title === "string" &&
            source.title.trim()
                ? source.title.trim()
                : "YouTube Source";


        const sourceUrl =
            typeof source.url === "string"
                ? source.url.trim()
                : "";


        const sourceLanguage =
            typeof source.language === "string"
                ? source.language.trim()
                : "";


        const sourceMethod =
            typeof source.acquisitionMethod === "string"
                ? source.acquisitionMethod.trim()
                : "";


        const prompt = [

            materialsSystemInstruction,

            "SOURCE METADATA:",

            `Title: ${sourceTitle}`,

            `URL: ${sourceUrl || "Not supplied"}`,

            `Language: ${sourceLanguage || "Not supplied"}`,

            `Acquisition method: ${sourceMethod || "Not supplied"}`,

            "",

            "ACQUIRED YOUTUBE TRANSCRIPT — THE ONLY FACTUAL SOURCE:",

            "----- BEGIN TRANSCRIPT -----",

            transcript,

            "----- END TRANSCRIPT -----",

            "",

            "Generate source-grounded Key Points, Concepts and Quiz now."

        ].join("\n");


        console.log(
            "Generating source-grounded Key Points / Concepts / Quiz:",
            {
                videoId:
                    source.videoId || "unknown",

                transcriptCharacters:
                    transcript.length,

                model:
                    GEMINI_MODEL
            }
        );


        const geminiResponse =
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

                    body: JSON.stringify({

                        system_instruction: {

                            parts: [
                                {
                                    text:
                                        materialsSystemInstruction
                                }
                            ]

                        },

                        contents: [

                            {

                                role: "user",

                                parts: [
                                    {
                                        text: prompt
                                    }
                                ]

                            }

                        ],

                        generationConfig: {

                            temperature: 0.15,

                            responseMimeType:
                                "application/json",

                            responseSchema:
                                materialsSchema

                        }

                    })

                }

            );


        const data =
            await geminiResponse.json();


        if (!geminiResponse.ok) {

            console.error(
                "Gemini Key Points / Concepts / Quiz error:"
            );

            console.error(
                JSON.stringify(
                    data,
                    null,
                    2
                )
            );

            return res.status(
                geminiResponse.status
            ).json({

                success: false,

                error:
                    data?.error?.message ||
                    "Gemini Key Points / Concepts / Quiz request failed.",

                code:
                    data?.error?.status ||
                    data?.error?.code ||
                    "gemini_materials_error"

            });

        }


        const rawText =
            extractGeminiText(data);


        const jsonText =
            cleanJsonText(rawText);


        if (!jsonText) {

            return res.status(502).json({

                success: false,

                error:
                    "Gemini returned an empty Key Points / Concepts / Quiz response.",

                code:
                    "empty_materials_response"

            });

        }


        let materials;

        try {

            materials =
                JSON.parse(jsonText);

        } catch (error) {

            console.error(
                "Key Points / Concepts / Quiz JSON parse error:",
                error
            );

            console.error(
                "Raw Gemini response:",
                rawText
            );

            return res.status(502).json({

                success: false,

                error:
                    "Gemini returned an invalid Key Points / Concepts / Quiz JSON response.",

                code:
                    "invalid_materials_json"

            });

        }


        if (
            !validateMaterials(materials)
        ) {

            console.error(
                "Key Points / Concepts / Quiz structure validation failed."
            );

            return res.status(502).json({

                success: false,

                error:
                    "Gemini returned an incomplete Key Points / Concepts / Quiz structure.",

                code:
                    "invalid_materials_structure"

            });

        }


        return res.json({

            success: true,

            materials: {

                ...materials,

                sourceGrounded:
                    true,

                sourceVideoId:
                    source.videoId || "",

                sourceTitle,

                sourceUrl,

                transcriptCharacters:
                    transcript.length,

                model:
                    GEMINI_MODEL

            }

        });


    } catch (error) {

        console.error(
            "BAJEE JRF AI YouTube materials error:"
        );

        console.error(error);

        return res.status(500).json({

            success: false,

            error:
                error?.message ||
                "Unexpected YouTube materials error.",

            code:
                "youtube_materials_backend_error"

        });

    }

}


/* =========================================================
   PHASE 7.2.5 — LOCAL STUDY LIBRARY

   Zero-cost local JSON persistence.
   No database or paid service is required.
========================================================= */

async function readYouTubeLibrary() {

    try {

        const raw =
            await fs.readFile(
                YOUTUBE_LIBRARY_FILE,
                "utf8"
            );

        const parsed =
            JSON.parse(raw);

        if (
            !parsed ||
            typeof parsed !== "object" ||
            !Array.isArray(parsed.items)
        ) {

            return {
                version: 1,
                items: []
            };
        }

        return parsed;

    } catch (error) {

        if (error?.code === "ENOENT") {

            return {
                version: 1,
                items: []
            };
        }

        throw error;
    }
}


async function writeYouTubeLibrary(
    library
) {

    await fs.mkdir(
        YOUTUBE_LIBRARY_DIRECTORY,
        {
            recursive: true
        }
    );

    const temporaryFile =
        `${YOUTUBE_LIBRARY_FILE}.tmp`;

    await fs.writeFile(
        temporaryFile,
        JSON.stringify(
            library,
            null,
            2
        ),
        "utf8"
    );

    await fs.rename(
        temporaryFile,
        YOUTUBE_LIBRARY_FILE
    );
}


function validateLibraryPayload(
    payload
) {

    const source =
        payload?.source;

    const notes =
        payload?.notes;

    const materials =
        payload?.materials;

    if (
        !source ||
        typeof source !== "object" ||
        !source.videoId ||
        typeof source.transcript !== "string" ||
        !notes ||
        typeof notes !== "object" ||
        !materials ||
        typeof materials !== "object"
    ) {

        return false;
    }

    return (
        typeof notes.title === "string" &&
        typeof notes.overview === "string" &&
        Array.isArray(notes.sections) &&
        Array.isArray(materials.keyPoints) &&
        Array.isArray(materials.concepts) &&
        Array.isArray(materials.quiz)
    );
}


async function handleYouTubeLibraryList(
    req,
    res
) {

    try {

        const library =
            await readYouTubeLibrary();

        return res.json({

            success: true,

            version:
                library.version || 1,

            count:
                library.items.length,

            items:
                library.items

        });

    } catch (error) {

        console.error(
            "BAJEE JRF AI YouTube library read error:",
            error
        );

        return res.status(500).json({

            success: false,

            error:
                "Could not read the local YouTube Study Library.",

            code:
                "youtube_library_read_error"
        });
    }
}


async function handleYouTubeLibrarySave(
    req,
    res
) {

    try {

        if (
            !validateLibraryPayload(
                req.body
            )
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Source, AI Notes and Key Points / Concepts / Quiz are required before saving.",

                code:
                    "youtube_library_payload_invalid"
            });
        }

        const source =
            req.body.source;

        const notes =
            req.body.notes;

        const materials =
            req.body.materials;

        const videoId =
            String(
                source.videoId
            ).trim();

        const now =
            new Date().toISOString();

        const library =
            await readYouTubeLibrary();

        const existingIndex =
            library.items.findIndex(
                item =>
                    item?.source?.videoId ===
                    videoId
            );

        const item = {

            id:
                `youtube-${videoId}`,

            type:
                "YouTube Study Material",

            savedAt:
                existingIndex >= 0
                    ? library.items[existingIndex].savedAt || now
                    : now,

            updatedAt:
                now,

            source: {

                videoId,

                title:
                    source.title ||
                    "YouTube Study Material",

                channel:
                    source.channel ||
                    "",

                url:
                    source.url ||
                    `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,

                normalizedUrl:
                    source.normalizedUrl ||
                    `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,

                language:
                    source.language ||
                    "",

                durationSeconds:
                    source.durationSeconds ||
                    null,

                acquisitionMethod:
                    source.acquisitionMethod ||
                    "",

                sourceType:
                    source.sourceType ||
                    "youtube_transcript",

                transcript:
                    source.transcript,

                transcriptCharacters:
                    source.transcript.length,

                sourceGrounded:
                    true
            },

            notes: {
                ...notes,
                sourceGrounded: true
            },

            materials: {
                ...materials,
                sourceGrounded: true
            }
        };

        if (existingIndex >= 0) {

            library.items[
                existingIndex
            ] = item;

        } else {

            library.items.unshift(
                item
            );
        }

        library.version = 1;
        library.updatedAt = now;

        await writeYouTubeLibrary(
            library
        );

        return res.json({

            success: true,

            created:
                existingIndex < 0,

            updated:
                existingIndex >= 0,

            item

        });

    } catch (error) {

        console.error(
            "BAJEE JRF AI YouTube library save error:",
            error
        );

        return res.status(500).json({

            success: false,

            error:
                error?.message ||
                "Could not save the YouTube Study Material.",

            code:
                "youtube_library_save_error"
        });
    }
}


/* =========================================================
   ROUTE REGISTRATION
========================================================= */

export function registerYouTubeNotesRoute(
    app
) {

    app.post(

        "/api/youtube/notes",

        handleYouTubeNotes

    );


    app.post(

        "/api/youtube/materials",

        handleYouTubeMaterials

    );


    app.get(

        "/api/youtube/library",

        handleYouTubeLibraryList

    );


    app.post(

        "/api/youtube/library",

        handleYouTubeLibrarySave

    );

}
