import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";


/* =========================================================
   BAJEE JRF AI
   YOUTUBE SOURCE / TRANSCRIPT ACQUISITION
========================================================= */


/* =========================================================
   VIDEO ID VALIDATION
========================================================= */

function isValidYouTubeVideoId(videoId) {

    return (
        typeof videoId === "string" &&
        /^[A-Za-z0-9_-]{11}$/.test(videoId)
    );

}


/* =========================================================
   EXTRACT YOUTUBE VIDEO ID
========================================================= */

function extractYouTubeVideoId(input) {

    const value =
        String(input || "").trim();


    if (!value) {

        return "";

    }


    let url;


    try {

        url =
            new URL(value);

    } catch (error) {

        return "";

    }


    const hostname =
        url.hostname
            .toLowerCase()
            .replace(
                /^www\./,
                ""
            );


    const allowedHosts = [

        "youtube.com",

        "m.youtube.com",

        "youtu.be",

        "youtube-nocookie.com",

        "m.youtube-nocookie.com"

    ];


    if (
        !allowedHosts.includes(
            hostname
        )
    ) {

        return "";

    }


    let videoId = "";


    /* -----------------------------------------------------
       youtu.be/VIDEO_ID
    ------------------------------------------------------ */

    if (
        hostname ===
        "youtu.be"
    ) {

        videoId =
            url.pathname
                .split("/")
                .filter(Boolean)[0] || "";

    }


    /* -----------------------------------------------------
       youtube.com/watch?v=VIDEO_ID
    ------------------------------------------------------ */

    else if (
        url.pathname ===
        "/watch"
    ) {

        videoId =
            url.searchParams.get(
                "v"
            ) || "";

    }


    /* -----------------------------------------------------
       youtube.com/shorts/VIDEO_ID
    ------------------------------------------------------ */

    else if (
        url.pathname.startsWith(
            "/shorts/"
        )
    ) {

        videoId =
            url.pathname
                .split("/")
                .filter(Boolean)[1] || "";

    }


    /* -----------------------------------------------------
       youtube.com/embed/VIDEO_ID
    ------------------------------------------------------ */

    else if (
        url.pathname.startsWith(
            "/embed/"
        )
    ) {

        videoId =
            url.pathname
                .split("/")
                .filter(Boolean)[1] || "";

    }


    /* -----------------------------------------------------
       youtube.com/live/VIDEO_ID
    ------------------------------------------------------ */

    else if (
        url.pathname.startsWith(
            "/live/"
        )
    ) {

        videoId =
            url.pathname
                .split("/")
                .filter(Boolean)[1] || "";

    }


    return isValidYouTubeVideoId(
        videoId
    )
        ? videoId
        : "";

}


/* =========================================================
   RUN COMMAND
   IMPORTANT:
   Streams progress to VS CODE TERMINAL for long jobs.
========================================================= */

function runCommand(
    command,
    args,
    options = {}
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const child =
                spawn(
                    command,
                    args,
                    {
                        windowsHide:
                            true,
                        ...options
                    }
                );


            let stdout = "";

            let stderr = "";


            child.stdout?.on(
                "data",
                chunk => {

                    const text =
                        chunk.toString();

                    stdout +=
                        text;


                    if (
                        options.streamOutput
                    ) {

                        process.stdout.write(
                            text
                        );

                    }

                }
            );


            child.stderr?.on(
                "data",
                chunk => {

                    const text =
                        chunk.toString();

                    stderr +=
                        text;


                    if (
                        options.streamOutput
                    ) {

                        process.stderr.write(
                            text
                        );

                    }

                }
            );


            child.on(
                "error",
                error => {

                    reject(
                        error
                    );

                }
            );


            child.on(
                "close",
                code => {

                    resolve({

                        code,

                        stdout,

                        stderr

                    });

                }
            );

        }
    );

}


/* =========================================================
   OPTIONAL YOUTUBE COOKIES
   Use only cookies exported from your own account.
   Never commit cookie files to GitHub or print their contents.
========================================================= */

let generatedCookiesPathPromise = null;

async function getYtDlpCookiesPath() {
    const configuredFile = String(
        process.env.YOUTUBE_COOKIES_FILE || ""
    ).trim();

    if (configuredFile) {
        const resolvedFile = path.resolve(configuredFile);

        try {
            await fs.access(resolvedFile);
            return resolvedFile;
        } catch {
            throw new Error(
                "YOUTUBE_COOKIES_FILE is set, but the file cannot be accessed."
            );
        }
    }

    const cookiesBase64 = String(
        process.env.YOUTUBE_COOKIES_BASE64 || ""
    ).trim();

    if (!cookiesBase64) {
        return "";
    }

    if (!generatedCookiesPathPromise) {
        generatedCookiesPathPromise = (async () => {
            let cookieBuffer;

            try {
                cookieBuffer = Buffer.from(cookiesBase64, "base64");
            } catch {
                throw new Error(
                    "YOUTUBE_COOKIES_BASE64 is not valid Base64."
                );
            }

            const cookieText = cookieBuffer.toString("utf8");

            if (
                !cookieText.trim() ||
                !/^(# Netscape HTTP Cookie File|# HTTP Cookie File|\.?youtube\.com|#)/m.test(
                    cookieText.trim()
                )
            ) {
                throw new Error(
                    "The configured YouTube cookie data does not look like a Netscape-format cookie file."
                );
            }

            const privateDir = await fs.mkdtemp(
                path.join(os.tmpdir(), "bajee-youtube-auth-")
            );

            const cookiePath = path.join(
                privateDir,
                "cookies.txt"
            );

            await fs.writeFile(
                cookiePath,
                cookieText,
                {
                    encoding: "utf8",
                    mode: 0o600,
                    flag: "wx"
                }
            );

            return cookiePath;
        })();
    }

    return generatedCookiesPathPromise;
}


/* =========================================================
   RUN YT-DLP
========================================================= */

async function runYtDlp(args, options = {}) {
    const configuredPath = String(
        process.env.YTDLP_PATH || ""
    ).trim();

    /*
       Render may start the service from either the repository
       root or the backend directory. Check both virtual
       environments before falling back to PATH executables.
    */
    const pythonCandidates = [
        path.resolve(
            process.cwd(),
            "backend",
            ".venv",
            "bin",
            "python"
        ),
        path.resolve(
            process.cwd(),
            ".venv",
            "bin",
            "python"
        )
    ];

    const candidates = configuredPath
        ? [
            {
                command: configuredPath,
                args
            }
        ]
        : [
            ...pythonCandidates.map(command => ({
                command,
                args: ["-m", "yt_dlp", ...args]
            })),
            {
                command: "yt-dlp",
                args
            },
            {
                command: "python3",
                args: ["-m", "yt_dlp", ...args]
            },
            {
                command: "python",
                args: ["-m", "yt_dlp", ...args]
            }
        ];

    const cookiesPath = await getYtDlpCookiesPath();

    if (cookiesPath) {
        console.log(
            "YouTube cookie authentication is configured (cookie contents are not logged)."
        );
    }

    let lastError = null;

    for (const candidate of candidates) {
        const candidateArgs = cookiesPath
            ? ["--cookies", cookiesPath, ...candidate.args]
            : candidate.args;

        try {
            const result = await runCommand(
                candidate.command,
                candidateArgs,
                options
            );

            if (result.code === 0) {
                return result;
            }

            const error = new Error(
                result.stderr ||
                `${candidate.command} exited with code ${result.code}`
            );

            error.code = "ytdlp_command_failed";
            error.stdout = result.stdout;
            error.stderr = result.stderr;
            lastError = error;

            // Continue only when this Python environment lacks yt-dlp.
            if (
                /No module named yt_dlp|No module named ['"]yt_dlp['"]/i
                    .test(result.stderr || "")
            ) {
                continue;
            }

            throw error;
        } catch (error) {
            lastError = error;

            if (
                error?.code === "ENOENT" ||
                /No module named yt_dlp|No module named ['"]yt_dlp['"]/i
                    .test(error?.message || "")
            ) {
                continue;
            }

            throw error;
        }
    }

    throw (
        lastError ||
        new Error("yt-dlp could not be started.")
    );
}

/* =========================================================
   CLEAN VTT TRANSCRIPT
========================================================= */

function cleanVttTranscript(
    vttText
) {

    const lines =
        String(vttText || "")
            .replace(
                /\r/g,
                ""
            )
            .split("\n");


    const output = [];

    let previous = "";


    for (
        const rawLine
        of lines
    ) {

        let line =
            rawLine.trim();


        if (!line) {

            continue;

        }


        if (

            line === "WEBVTT" ||

            line.startsWith("Kind:") ||

            line.startsWith("Language:") ||

            line.startsWith("NOTE") ||

            /^STYLE$/i.test(line) ||

            /^REGION$/i.test(line)

        ) {

            continue;

        }


        if (
            /^\d{2}:\d{2}(?::\d{2})?[.,]\d{3}\s+-->/
                .test(line)
        ) {

            continue;

        }


        if (
            /^\d+$/.test(line)
        ) {

            continue;

        }


        line =
            line.replace(

                /<\d{2}:\d{2}(?::\d{2})?[.,]\d{3}>/g,

                ""

            );


        line =
            line.replace(

                /<\/(?:c|i|b|u|v|lang)>/gi,

                ""

            );


        line =
            line.replace(

                /<(?:c|i|b|u|v|lang)(?:\.[^>]*)?>/gi,

                ""

            );


        line =
            line
                .replace(
                    /&amp;/g,
                    "&"
                )
                .replace(
                    /&lt;/g,
                    "<"
                )
                .replace(
                    /&gt;/g,
                    ">"
                )
                .replace(
                    /&quot;/g,
                    "\""
                )
                .replace(
                    /&#39;/g,
                    "'"
                );


        line =
            line
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();


        if (!line) {

            continue;

        }


        /*
           Remove immediately repeated
           caption lines.
        */

        if (
            line ===
            previous
        ) {

            continue;

        }


        output.push(
            line
        );


        previous =
            line;

    }


    return output
        .join(" ")
        .trim();

}


/* =========================================================
   FIND AUDIO FILE
========================================================= */

async function findAudioFile(
    directory
) {

    const files =
        await fs.readdir(
            directory
        );


    const allowedExtensions = [

        ".webm",

        ".m4a",

        ".mp4",

        ".opus",

        ".ogg",

        ".aac",

        ".wav",

        ".mp3",

        ".flac"

    ];


    const candidates = [];


    for (
        const file
        of files
    ) {

        const extension =
            path.extname(
                file
            ).toLowerCase();


        if (
            !allowedExtensions.includes(
                extension
            )
        ) {

            continue;

        }


        const fullPath =
            path.join(
                directory,
                file
            );


        try {

            const stat =
                await fs.stat(
                    fullPath
                );


            if (
                stat.isFile() &&
                stat.size > 0
            ) {

                candidates.push({

                    path:
                        fullPath,

                    size:
                        stat.size

                });

            }

        } catch (error) {

            /* Ignore files that disappear. */

        }

    }


    candidates.sort(
        (
            a,
            b
        ) =>
            b.size -
            a.size
    );


    return (
        candidates[0]?.path ||
        ""
    );

}


/* =========================================================
   DOWNLOAD AUDIO
========================================================= */

async function downloadYouTubeAudio(
    normalizedUrl,
    tempDir
) {

    console.log("");

    console.log(
        "=============================================="
    );

    console.log(
        "BAJEE JRF AI — LOCAL WHISPER FALLBACK"
    );

    console.log(
        "Downloading YouTube audio..."
    );

    console.log(
        "This may take some time for a 1–2 hour lecture."
    );

    console.log(
        "=============================================="
    );


    const outputTemplate =
        path.join(
            tempDir,
            "%(id)s.%(ext)s"
        );


    /*
        YouTube can return HTTP 403 for a format URL even when
        yt-dlp can successfully identify the video.

        Keep the normal/default yt-dlp attempt first.

        If that attempt fails, try alternative YouTube player
        clients that may expose a different set of playable
        formats. These are still local yt-dlp strategies:
        no paid API, no cloud service, and no account cookies.

        The second strategy uses web_safari because yt-dlp's
        current PO-token guidance notes that this client can
        expose HLS formats that may avoid the affected GVS
        PO-token requirement.

        The fallback stops after the default and web_safari
        strategies. The tv client is intentionally not used because
        some videos are reported as unavailable by that client even
        when other yt-dlp clients can access the source.
    */

    const strategies = [

        {
            name:
                "default yt-dlp client",

            format:
                "bestaudio/best",

            args: []

        },

        {
            name:
                "web_safari client / HLS-capable fallback",

            format:
                "bestaudio[protocol^=m3u8]/bestaudio/best",

            args: [

                "--extractor-args",
                "youtube:player_client=web_safari"

            ]

        },


    ];


    let lastError =
        null;


    for (
        let index = 0;
        index < strategies.length;
        index += 1
    ) {

        const strategy =
            strategies[index];


        console.log("");

        console.log(
            `Audio acquisition strategy ${index + 1}/${strategies.length}: ${strategy.name}`
        );


        const args = [

            "--no-playlist",

            "--newline",

            "--progress",

            "--no-warnings",

            "--format",

            strategy.format,

            ...strategy.args,

            "--output",

            outputTemplate,

            normalizedUrl

        ];


        try {

            const result =
                await runYtDlp(

                    args,

                    {

                        cwd:
                            tempDir,

                        streamOutput:
                            true

                    }

                );


            const audioPath =
                await findAudioFile(
                    tempDir
                );


            if (audioPath) {

                const stat =
                    await fs.stat(
                        audioPath
                    );


                console.log("");

                console.log(
                    `Audio acquired: ${path.basename(audioPath)}`
                );

                console.log(
                    `Audio size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`
                );

                console.log(
                    `Audio acquisition strategy succeeded: ${strategy.name}`
                );


                return audioPath;

            }


            const error =
                new Error(
                    "yt-dlp completed, but no audio file was found."
                );


            error.code =
                "youtube_audio_missing";


            error.details =
                result.stderr ||
                result.stdout ||
                "";


            lastError =
                error;


            console.warn(
                "No audio file was produced by this strategy."
            );


        } catch (error) {

            lastError =
                error;


            console.warn("");

            console.warn(
                `Audio acquisition strategy failed: ${strategy.name}`
            );

            console.warn(
                error?.message ||
                error
            );

        }

    }


    throw (
        lastError ||
        new Error(
            "yt-dlp could not acquire YouTube audio."
        )
    );

}


/* =========================================================
   PARSE JSON FROM WHISPER HELPER
========================================================= */

function parseWhisperJson(
    output
) {

    const text =
        String(
            output || ""
        ).trim();


    if (!text) {

        return null;

    }


    /*
       The helper prints progress/log messages
       before the final JSON object.

       Find the final JSON object safely.
    */

    const candidates = [];


    const lines =
        text.split(/\r?\n/);


    for (
        let index =
            0;
        index <
            lines.length;
        index +=
            1
    ) {

        if (
            !lines[index]
                .trim()
                .startsWith("{")
        ) {

            continue;

        }


        const candidate =
            lines
                .slice(index)
                .join("\n")
                .trim();


        try {

            candidates.push(
                JSON.parse(
                    candidate
                )
            );

        } catch (error) {

            /* Not the final JSON object. */

        }

    }


    return (
        candidates[
            candidates.length - 1
        ] ||
        null
    );

}


/* =========================================================
   RUN LOCAL FASTER-WHISPER
========================================================= */

async function transcribeWithLocalWhisper(
    audioPath
) {

    const configuredPython =
        String(
            process.env.PYTHON_PATH || ""
        ).trim();


    const scriptPath =
        path.resolve(

            process.cwd(),

            "src",

            "ingest",

            "transcribe_youtube.py"

        );


    try {

        await fs.access(
            scriptPath
        );

    } catch (error) {

        const helperError =
            new Error(

                `Whisper helper not found: ${scriptPath}`

            );


        helperError.code =
            "whisper_helper_missing";


        throw helperError;

    }


    /*
       Default:
       small model = better lecture accuracy.

       For a quick test you can use:
       WHISPER_MODEL=tiny
    */

    const whisperModel =
        String(
            process.env.WHISPER_MODEL ||
            "small"
        ).trim();


    const candidates =
        configuredPython

            ? [

                {

                    command:
                        configuredPython,

                    args: [

                        scriptPath,

                        audioPath,

                        "--model",

                        whisperModel,

                        "--device",

                        "cpu",

                        "--compute-type",

                        "int8"

                    ]

                }

            ]

            : [

                {

                    command:
                        "py",

                    args: [

                        "-3",

                        scriptPath,

                        audioPath,

                        "--model",

                        whisperModel,

                        "--device",

                        "cpu",

                        "--compute-type",

                        "int8"

                    ]

                },

                {

                    command:
                        "python",

                    args: [

                        scriptPath,

                        audioPath,

                        "--model",

                        whisperModel,

                        "--device",

                        "cpu",

                        "--compute-type",

                        "int8"

                    ]

                }

            ];


    let lastError =
        null;


    for (
        const candidate
        of candidates
    ) {

        console.log("");

        console.log(
            "=============================================="
        );

        console.log(
            "BAJEE JRF AI — FASTER-WHISPER"
        );

        console.log(
            `Model: ${whisperModel}`
        );

        console.log(
            "Device: CPU"
        );

        console.log(
            "Compute type: int8"
        );

        console.log(
            `Audio: ${path.basename(audioPath)}`
        );

        console.log(
            "Transcription started."
        );

        console.log(
            "For long lectures this can take several minutes."
        );

        console.log(
            "=============================================="
        );


        try {

            const result =
                await runCommand(

                    candidate.command,

                    candidate.args,

                    {

                        cwd:
                            process.cwd(),

                        streamOutput:
                            true

                    }

                );


            const parsed =
                parseWhisperJson(
                    result.stdout
                );


            if (
                result.code === 0 &&
                parsed
            ) {

                if (
                    parsed.success ===
                    false
                ) {

                    const error =
                        new Error(

                            parsed.error ||

                            "Local faster-whisper transcription failed."

                        );


                    error.code =
                        parsed.code ||
                        "whisper_transcription_failed";


                    error.details =
                        parsed.details ||
                        result.stderr ||
                        "";


                    throw error;

                }


                const transcript =
                    String(

                        parsed.transcript ||

                        parsed.text ||

                        ""

                    ).trim();


                if (!transcript) {

                    const error =
                        new Error(

                            "Whisper completed, but returned an empty transcript."

                        );


                    error.code =
                        "whisper_transcript_empty";


                    throw error;

                }


                console.log("");

                console.log(
                    "=============================================="
                );

                console.log(
                    "FASTER-WHISPER TRANSCRIPTION COMPLETE"
                );

                console.log(
                    `Transcript characters: ${transcript.length.toLocaleString()}`
                );

                console.log(
                    "=============================================="
                );


                return {

                    transcript,

                    language:
                        parsed.language ||
                        "en",

                    model:
                        parsed.model ||
                        whisperModel

                };

            }


            const error =
                new Error(

                    result.stderr ||

                    "Local faster-whisper transcription failed."

                );


            error.code =
                "whisper_transcription_failed";


            error.details =
                result.stderr ||
                result.stdout ||
                "";


            throw error;


        } catch (error) {

            lastError =
                error;


            if (
                error?.code !==
                "ENOENT"
            ) {

                throw error;

            }

        }

    }


    throw (
        lastError ||

        new Error(
            "Python could not be started."
        )
    );

}


/* =========================================================
   CREATE NORMALIZED SOURCE OBJECT
========================================================= */

function createSourceObject({

    videoId,

    normalizedUrl,

    metadata,

    transcript,

    acquisitionMethod,

    language,

    subtitleFile = "",

    whisperModel = ""

}) {

    return {

        sourceType:
            "youtube_transcript",

        acquisitionMethod,

        videoId,

        url:
            normalizedUrl,

        title:
            metadata?.title ||
            "YouTube video",

        channel:
            metadata?.channel ||
            metadata?.uploader ||
            "",

        durationSeconds:

            Number.isFinite(
                Number(
                    metadata?.duration
                )
            )

                ? Number(
                    metadata.duration
                )

                : null,

        language:
            language ||
            "en",

        subtitleFile,

        whisperModel,

        transcript,

        transcriptCharacters:
            transcript.length,

        sourceGrounded:
            true

    };

}


/* =========================================================
   ACQUIRE YOUTUBE SOURCE
========================================================= */

async function acquireYouTubeSource(
    videoUrl
) {

    const videoId =
        extractYouTubeVideoId(
            videoUrl
        );


    if (!videoId) {

        const error =
            new Error(

                "A valid YouTube video ID could not be extracted."

            );


        error.code =
            "invalid_youtube_url";


        throw error;

    }


    const normalizedUrl =
        `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;


    console.log("");

    console.log(
        "=============================================="
    );

    console.log(
        "BAJEE JRF AI — YOUTUBE SOURCE ACQUISITION"
    );

    console.log(
        `Video ID: ${videoId}`
    );

    console.log(
        normalizedUrl
    );

    console.log(
        "=============================================="
    );


    /* =====================================================
       STEP 1
       GET VIDEO METADATA
    ===================================================== */

    let metadata = {};


    try {

        console.log(
            "Getting YouTube metadata..."
        );


        const metadataResult =
            await runYtDlp(

                [

                    "--dump-single-json",

                    "--skip-download",

                    "--no-playlist",

                    "--no-warnings",

                    normalizedUrl

                ]

            );


        try {

            metadata =
                JSON.parse(
                    metadataResult.stdout.trim()
                );

        } catch (error) {

            metadata = {};

        }


        console.log(
            `Title: ${metadata?.title || "Unknown"}`
        );


        if (
            metadata?.duration
        ) {

            console.log(
                `Duration: ${Number(metadata.duration).toFixed(0)} seconds`
            );

        }

    } catch (error) {

        /*
           Metadata is useful but not required
           for transcription.

           Continue so the source can still
           be acquired.
        */

        console.warn(
            "Metadata acquisition failed. Continuing with source acquisition."
        );

        console.warn(
            error?.message || error
        );

    }


    /* =====================================================
       STEP 2
       CREATE TEMP DIRECTORY
    ===================================================== */

    const tempDir =
        await fs.mkdtemp(

            path.join(

                os.tmpdir(),

                "bajee-youtube-"

            )

        );


    try {


        /* =================================================
           STEP 3
           TRY YOUTUBE CAPTIONS FIRST
        ================================================= */

        console.log("");

        console.log(
            "Trying YouTube captions first..."
        );


        const outputTemplate =
            path.join(

                tempDir,

                "%(id)s.%(ext)s"

            );


        let subtitleResult =
            null;


        try {

            subtitleResult =
                await runYtDlp(

                    [

                        "--skip-download",

                        "--no-playlist",

                        "--newline",

                        "--write-subs",

                        "--write-auto-subs",

                        "--sub-langs",

                        "en.*,en",

                        "--sub-format",

                        "vtt/best",

                        "--output",

                        outputTemplate,

                        normalizedUrl

                    ],

                    {

                        cwd:
                            tempDir,

                        streamOutput:
                            true

                    }

                );


        } catch (error) {

            /*
               This is expected to happen for some
               videos, including YouTube 429 cases.

               Do NOT fail the entire acquisition.
               Continue to local Whisper fallback.
            */

            console.warn("");

            console.warn(
                "YouTube caption acquisition failed."
            );

            console.warn(
                "Reason:",
                error?.message ||
                error
            );

            console.warn(
                "Continuing with local Whisper fallback..."
            );

        }


        /* =================================================
           STEP 4
           CHECK CAPTION FILES
        ================================================= */

        const files =
            await fs.readdir(
                tempDir
            );


        const subtitleFiles =
            files.filter(

                file =>
                    /\.vtt$/i.test(
                        file
                    )

            );


        if (
            subtitleFiles.length
        ) {

            console.log("");

            console.log(
                `Caption files found: ${subtitleFiles.length}`
            );


            /*
               Prefer manual captions over
               automatic captions.
            */

            const manualFiles =
                subtitleFiles.filter(

                    file =>
                        !/\.auto\./i.test(
                            file
                        )

                );


            const orderedFiles =
                manualFiles.length

                    ? manualFiles

                    : subtitleFiles;


            let transcript = "";

            let selectedFile = "";


            for (
                const file
                of orderedFiles
            ) {

                const content =
                    await fs.readFile(

                        path.join(
                            tempDir,
                            file
                        ),

                        "utf8"

                    );


                const cleaned =
                    cleanVttTranscript(
                        content
                    );


                if (
                    cleaned.length >
                    transcript.length
                ) {

                    transcript =
                        cleaned;

                    selectedFile =
                        file;

                }

            }


            if (
                transcript
            ) {

                console.log("");

                console.log(
                    "YouTube caption acquisition successful."
                );

                console.log(
                    `Caption file: ${selectedFile}`
                );

                console.log(
                    `Transcript characters: ${transcript.length.toLocaleString()}`
                );


                return createSourceObject({

                    videoId,

                    normalizedUrl,

                    metadata,

                    transcript,

                    acquisitionMethod:
                        /\\.auto\\./i.test(
                            selectedFile
                        )

                            ? "yt-dlp automatic captions"

                            : "yt-dlp manual captions",

                    language:
                        "en",

                    subtitleFile:
                        selectedFile

                });

            }


            console.warn(
                "Caption files were found but produced no readable transcript."
            );

        } else {

            console.log(
                "No usable English caption file found."
            );

        }


        /* =================================================
           STEP 5
           LOCAL WHISPER FALLBACK
        ================================================= */

        console.log("");

        console.log(
            "No usable YouTube transcript."
        );

        console.log(
            "Starting local audio + faster-whisper fallback..."
        );


        const audioPath =
            await downloadYouTubeAudio(

                normalizedUrl,

                tempDir

            );


        const whisperResult =
            await transcribeWithLocalWhisper(
                audioPath
            );


        if (
            !whisperResult?.transcript
        ) {

            const error =
                new Error(

                    "Local Whisper did not return a usable transcript."

                );


            error.code =
                "whisper_transcript_empty";


            throw error;

        }


        return createSourceObject({

            videoId,

            normalizedUrl,

            metadata,

            transcript:
                whisperResult.transcript,

            acquisitionMethod:
                "yt-dlp audio + local faster-whisper",

            language:
                whisperResult.language ||
                "en",

            whisperModel:
                whisperResult.model ||
                ""

        });


    } finally {


        /* =================================================
           CLEAN TEMP DIRECTORY
        ================================================= */

        await fs.rm(

            tempDir,

            {

                recursive:
                    true,

                force:
                    true

            }

        ).catch(
            () => {}
        );


    }

}


/* =========================================================
   HTTP ROUTE HANDLER
========================================================= */

async function handleYouTubeSource(
    req,
    res
) {

    try {


        const url =

            typeof req.body?.url ===
            "string"

                ? req.body.url.trim()

                : "";


        if (!url) {

            return res.status(
                400
            ).json({

                success:
                    false,

                error:
                    "YouTube URL is required.",

                code:
                    "youtube_url_missing"

            });

        }


        console.log("");

        console.log(
            `YouTube source acquisition requested: ${url}`
        );


        const source =
            await acquireYouTubeSource(
                url
            );


        console.log("");

        console.log(
            "=============================================="
        );

        console.log(
            "YOUTUBE SOURCE READY"
        );

        console.log(
            `Method: ${source.acquisitionMethod}`
        );

        console.log(
            `Characters: ${source.transcriptCharacters.toLocaleString()}`
        );

        console.log(
            "=============================================="
        );


        return res.json({

            success:
                true,

            source

        });


    } catch (error) {


        console.error("");

        console.error(
            "=============================================="
        );

        console.error(
            "YOUTUBE SOURCE ACQUISITION ERROR"
        );

        console.error(
            "=============================================="
        );

        console.error(
            error
        );


        if (
            error?.code ===
            "invalid_youtube_url"
        ) {

            return res.status(
                400
            ).json({

                success:
                    false,

                error:
                    error.message,

                code:
                    error.code

            });

        }


        if (
            error?.code ===
            "ytdlp_command_failed"
        ) {

            return res.status(
                502
            ).json({

                success:
                    false,

                error:
                    "yt-dlp could not acquire the YouTube source.",

                code:
                    "ytdlp_command_failed",

                details:
                    error.stderr ||
                    error.message ||
                    ""

            });

        }


        if (
            error?.code ===
            "youtube_audio_missing"
        ) {

            return res.status(
                422
            ).json({

                success:
                    false,

                error:
                    error.message,

                code:
                    error.code,

                details:
                    error.details ||
                    ""

            });

        }


        if (
            error?.code ===
            "whisper_helper_missing"
        ) {

            return res.status(
                503
            ).json({

                success:
                    false,

                error:
                    "Local Whisper helper was not found.",

                code:
                    error.code,

                details:
                    error.message

            });

        }


        if (
            error?.code ===
            "whisper_transcription_failed"
        ) {

            return res.status(
                422
            ).json({

                success:
                    false,

                error:
                    "Local faster-whisper transcription failed.",

                code:
                    error.code,

                details:
                    error.details ||
                    error.message ||
                    ""

            });

        }


        if (
            error?.code ===
            "whisper_transcript_empty"
        ) {

            return res.status(
                422
            ).json({

                success:
                    false,

                error:
                    error.message,

                code:
                    error.code

            });

        }


        const message =
            String(
                error?.message ||
                ""
            );


        const toolMissing =
            /not found|enoent|could not be started|not recognized/i
                .test(
                    message
                );


        if (
            toolMissing
        ) {

            return res.status(
                503
            ).json({

                success:
                    false,

                error:
                    "A required local tool could not be started.",

                code:
                    "local_tool_missing",

                details:
                    message

            });

        }


        return res.status(
            500
        ).json({

            success:
                false,

            error:
                message ||

                "YouTube source acquisition failed.",

            code:
                "youtube_source_error"

        });

    }

}


/* =========================================================
   ROUTE REGISTRATION
========================================================= */

export function registerYouTubeSourceRoute(
    app
) {

    app.post(

        "/api/youtube/source",

        handleYouTubeSource

    );

}
