import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "node:crypto";
import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";
import pdfParse from "pdf-parse";
import AdmZip from "adm-zip";
import { OAuth2Client } from "google-auth-library";
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

const GOOGLE_CLIENT_ID =
    process.env.GOOGLE_CLIENT_ID || "";

const googleOAuthClient = new OAuth2Client(
    GOOGLE_CLIENT_ID
);

/* =========================================================
   GOOGLE DRIVE MASTER STORAGE CONFIGURATION
   Drive authorization is separate from app Google sign-in.
========================================================= */
// Dedicated OAuth client for Drive; keep GOOGLE_CLIENT_ID reserved for app sign-in.
const DRIVE_GOOGLE_CLIENT_ID = process.env.DRIVE_GOOGLE_CLIENT_ID || "";
const DRIVE_GOOGLE_CLIENT_SECRET = process.env.DRIVE_GOOGLE_CLIENT_SECRET || "";
const DRIVE_REDIRECT_URI = process.env.DRIVE_REDIRECT_URI ||
    "https://bajee-jrf.onrender.com/api/drive/callback";
const DRIVE_FRONTEND_URL = process.env.DRIVE_FRONTEND_URL ||
    "https://bajee422.github.io/Bajee-JRF/";
// Durable backend-only storage for encrypted Google Drive connection metadata.
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || "";
const DRIVE_STATE_TTL_SECONDS = 10 * 60;
const DRIVE_MAX_PAGE_SIZE = 100;
// Keep plain-text files conservative; allow larger document uploads for course PDFs/DOCX/PPTX.
const DRIVE_MAX_CONTENT_BYTES = 2 * 1024 * 1024;
const DRIVE_MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;
const DRIVE_MAX_EXTRACTED_TEXT_BYTES = 25 * 1024 * 1024;
const driveOAuthClient = new OAuth2Client(
    DRIVE_GOOGLE_CLIENT_ID,
    DRIVE_GOOGLE_CLIENT_SECRET,
    DRIVE_REDIRECT_URI
);

const NODE_ENV =
    process.env.NODE_ENV || "development";

const APP_SESSION_SECRET =
    process.env.APP_SESSION_SECRET ||
    (NODE_ENV === "production" ? "" : crypto.randomBytes(32).toString("hex"));

const APP_ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const APP_REFRESH_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const APP_REFRESH_COOKIE = "bajee_refresh";

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

if (NODE_ENV === "production" && !APP_SESSION_SECRET) {
    throw new Error(
        "APP_SESSION_SECRET must be configured in production."
    );
}

if (NODE_ENV === "production" && ALLOWED_ORIGINS.length === 0) {
    throw new Error(
        "ALLOWED_ORIGINS must be configured in production."
    );
}

const rateLimitStore = new Map();


/* =========================================================
   GOOGLE DRIVE STORAGE / OAUTH HELPERS
========================================================= */
function driveEncryptionKey() {
    if (!APP_SESSION_SECRET) throw new Error("APP_SESSION_SECRET is required for Drive token storage.");
    return crypto.createHash("sha256")
        .update(`${APP_SESSION_SECRET}:BAJEE_JRF_DRIVE_TOKEN_STORE:v1`).digest();
}
function encryptDriveStore(value) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", driveEncryptionKey(), iv);
    const data = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
    return JSON.stringify({ version: 1, iv: iv.toString("base64url"), tag: cipher.getAuthTag().toString("base64url"), data: data.toString("base64url") });
}
function decryptDriveStore(raw) {
    const e = JSON.parse(raw);
    if (e?.version !== 1 || typeof e.iv !== "string" || typeof e.tag !== "string" || typeof e.data !== "string") {
        throw new Error("Unsupported encrypted Drive store format.");
    }
    const decipher = crypto.createDecipheriv("aes-256-gcm", driveEncryptionKey(), Buffer.from(e.iv, "base64url"));
    decipher.setAuthTag(Buffer.from(e.tag, "base64url"));
    const value = JSON.parse(Buffer.concat([decipher.update(Buffer.from(e.data, "base64url")), decipher.final()]).toString("utf8"));
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function supabaseDriveStorageReady() {
    return Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY);
}

async function supabaseDriveRequest(method, query = "", body = null, prefer = "") {
    if (!supabaseDriveStorageReady()) {
        throw new Error("Supabase Drive storage is not configured.");
    }
    const url = `${SUPABASE_URL}/rest/v1/bajee_drive_connections${query}`;
    const headers = {
        apikey: SUPABASE_SECRET_KEY,
        "Content-Type": "application/json",
        Accept: "application/json"
    };
    if (prefer) headers.Prefer = prefer;
    const response = await fetch(url, {
        method,
        headers,
        ...(body === null ? {} : { body: JSON.stringify(body) })
    });
    if (!response.ok) {
        // Do not log response bodies or credentials; they may contain sensitive details.
        console.error(`Supabase Drive storage request failed with HTTP ${response.status}.`);
        throw new Error("Drive connection storage is unavailable.");
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}
function createSignedDriveState(userId) {
    if (!APP_SESSION_SECRET) throw new Error("APP_SESSION_SECRET is not configured.");
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(JSON.stringify({ sub: String(userId), iat: now, exp: now + DRIVE_STATE_TTL_SECONDS,
        nonce: crypto.randomBytes(18).toString("base64url"), purpose: "bajee_drive_oauth" })).toString("base64url");
    const signature = crypto.createHmac("sha256", APP_SESSION_SECRET).update(payload).digest("base64url");
    return `${payload}.${signature}`;
}
function verifySignedDriveState(state) {
    if (!APP_SESSION_SECRET || typeof state !== "string") return null;
    const parts = state.split(".");
    if (parts.length !== 2) return null;
    const expected = crypto.createHmac("sha256", APP_SESSION_SECRET).update(parts[0]).digest("base64url");
    if (!safeTimingEqual(parts[1], expected)) return null;
    try {
        const p = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
        const now = Math.floor(Date.now() / 1000);
        if (p.purpose !== "bajee_drive_oauth" || typeof p.sub !== "string" || !p.sub ||
            !Number.isFinite(p.exp) || p.exp <= now || !Number.isFinite(p.iat) || p.iat > now + 60) return null;
        return p;
    } catch { return null; }
}
function driveUserId(req) {
    return typeof req.googleUser?.id === "string" && req.googleUser.id ? req.googleUser.id : "";
}
function driveConfigReady() {
    return Boolean(DRIVE_GOOGLE_CLIENT_ID && DRIVE_GOOGLE_CLIENT_SECRET && DRIVE_REDIRECT_URI && APP_SESSION_SECRET && supabaseDriveStorageReady());
}
async function getDriveConnection(userId) {
    if (typeof userId !== "string" || !userId) throw new Error("A valid Drive user ID is required.");
    const query = `?${new URLSearchParams({ id: `eq.${userId}`, select: "id,encrypted_payload,updated_at" })}`;
    const rows = await supabaseDriveRequest("GET", query);
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return { entry: null };
    const entry = decryptDriveStore(row.encrypted_payload);
    return { entry: entry && typeof entry === "object" && !Array.isArray(entry) ? entry : null };
}
async function saveDriveConnection(userId, entry) {
    if (typeof userId !== "string" || !userId) throw new Error("A valid Drive user ID is required.");
    const value = { ...entry, updatedAt: new Date().toISOString() };
    const payload = {
        id: userId,
        encrypted_payload: encryptDriveStore(value),
        updated_at: value.updatedAt
    };
    await supabaseDriveRequest("POST", "", payload, "resolution=merge-duplicates,return=minimal");
}
async function deleteDriveConnection(userId) {
    if (typeof userId !== "string" || !userId) throw new Error("A valid Drive user ID is required.");
    const query = `?${new URLSearchParams({ id: `eq.${userId}` })}`;
    await supabaseDriveRequest("DELETE", query, null, "return=minimal");
}
async function getAuthorizedDriveClient(userId) {
    const { entry } = await getDriveConnection(userId);
    if (!entry?.credentials || (!entry.credentials.refresh_token && !entry.credentials.access_token))
        return { connected: false, client: null, entry: null };
    const client = new OAuth2Client(DRIVE_GOOGLE_CLIENT_ID, DRIVE_GOOGLE_CLIENT_SECRET, DRIVE_REDIRECT_URI);
    client.setCredentials(entry.credentials);
    try {
        const token = await client.getAccessToken();
        if (!token?.token) return { connected: false, client: null, entry: null };
        const credentials = { ...entry.credentials, ...client.credentials };
        await saveDriveConnection(userId, { ...entry, credentials });
        return { connected: true, client, entry: { ...entry, credentials } };
    } catch (error) {
        console.error("Google Drive token refresh failed:", error?.message || "unknown error");
        return { connected: false, client: null, entry };
    }
}
async function driveApiRequest(client, endpoint) {
    const token = await client.getAccessToken();
    if (!token?.token) throw Object.assign(new Error("Drive authorization expired."), { status: 401 });
    const response = await fetch(`https://www.googleapis.com/drive/v3/${endpoint}`, {
        headers: { Authorization: `Bearer ${token.token}` }
    });
    const ct = response.headers.get("content-type") || "";
    const body = ct.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) throw Object.assign(new Error(body?.error?.message || "Google Drive request failed."), { status: response.status });
    return body;
}
function driveSafeError(res, error, fallback) {
    const status = Number(error?.status);
    if (status === 401 || status === 403) return res.status(status).json({
        success: false,
        error: status === 401 ? "Google Drive authorization expired. Reconnect Drive and try again." : "Google Drive denied access. Check the granted permissions.",
        code: status === 401 ? "drive_reauthorization_required" : "drive_permission_denied"
    });
    console.error("Google Drive operation failed:", error?.message || fallback);
    return res.status(502).json({ success: false, error: fallback, code: "drive_request_failed" });
}

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


function base64urlEncode(value) {
    return Buffer.from(value).toString("base64url");
}

function signAppAccessToken(user) {
    if (!APP_SESSION_SECRET) {
        throw new Error("APP_SESSION_SECRET is not configured.");
    }

    const now = Math.floor(Date.now() / 1000);
    const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = base64urlEncode(JSON.stringify({
        sub: user.id,
        email: user.email,
        name: user.name || "",
        iat: now,
        exp: now + APP_ACCESS_TOKEN_TTL_SECONDS,
        typ: "bajee_access"
    }));
    const signingInput = `${header}.${payload}`;
    const signature = crypto
        .createHmac("sha256", APP_SESSION_SECRET)
        .update(signingInput)
        .digest("base64url");

    return `${signingInput}.${signature}`;
}

function verifyAppAccessToken(token) {
    if (!APP_SESSION_SECRET || typeof token !== "string") return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const signingInput = `${parts[0]}.${parts[1]}`;
    const expected = crypto
        .createHmac("sha256", APP_SESSION_SECRET)
        .update(signingInput)
        .digest("base64url");

    if (!safeTimingEqual(parts[2], expected)) return null;

    try {
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
        const now = Math.floor(Date.now() / 1000);

        if (
            payload.typ !== "bajee_access" ||
            !payload.sub ||
            !payload.email ||
            !Number.isFinite(payload.exp) ||
            payload.exp <= now
        ) {
            return null;
        }

        return {
            id: payload.sub,
            email: payload.email,
            name: payload.name || ""
        };
    } catch {
        return null;
    }
}

function getCookie(req, name) {
    const cookieHeader = typeof req.headers.cookie === "string"
        ? req.headers.cookie
        : "";

    for (const part of cookieHeader.split(";")) {
        const separator = part.indexOf("=");
        if (separator < 0) continue;

        const key = part.slice(0, separator).trim();
        if (key === name) {
            return part.slice(separator + 1).trim();
        }
    }

    return "";
}

function signRefreshToken(user) {
    if (!APP_SESSION_SECRET) {
        throw new Error("APP_SESSION_SECRET is not configured.");
    }

    const now = Math.floor(Date.now() / 1000);
    const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = base64urlEncode(JSON.stringify({
        sub: user.id,
        email: user.email,
        name: user.name || "",
        picture: user.picture || "",
        iat: now,
        exp: now + Math.floor(APP_REFRESH_SESSION_TTL_MS / 1000),
        jti: crypto.randomBytes(16).toString("base64url"),
        typ: "bajee_refresh"
    }));
    const signingInput = `${header}.${payload}`;
    const signature = crypto
        .createHmac("sha256", APP_SESSION_SECRET)
        .update(signingInput)
        .digest("base64url");

    return `${signingInput}.${signature}`;
}

function verifyRefreshToken(token) {
    if (!APP_SESSION_SECRET || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const signingInput = `${parts[0]}.${parts[1]}`;
    const expected = crypto
        .createHmac("sha256", APP_SESSION_SECRET)
        .update(signingInput)
        .digest("base64url");

    if (!safeTimingEqual(parts[2], expected)) return null;

    try {
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
        const now = Math.floor(Date.now() / 1000);
        if (
            payload.typ !== "bajee_refresh" ||
            !payload.sub ||
            !payload.email ||
            !Number.isFinite(payload.exp) ||
            payload.exp <= now
        ) return null;

        return {
            id: payload.sub,
            email: payload.email,
            name: payload.name || "",
            picture: payload.picture || ""
        };
    } catch {
        return null;
    }
}

function setRefreshCookie(res, token) {
    const cookie = [
        `${APP_REFRESH_COOKIE}=${token}`,
        "Path=/api/auth",
        "HttpOnly",
        "Secure",
        "SameSite=None",
        "Partitioned",
        `Max-Age=${Math.floor(APP_REFRESH_SESSION_TTL_MS / 1000)}`
    ].join("; ");
    res.setHeader("Set-Cookie", cookie);
}

function clearRefreshCookie(res) {
    res.setHeader(
        "Set-Cookie",
        `${APP_REFRESH_COOKIE}=; Path=/api/auth; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=0`
    );
}

function createAppSession(user, res) {
    const safeUser = {
        id: user.id,
        email: user.email,
        name: user.name || "",
        picture: user.picture || ""
    };
    setRefreshCookie(res, signRefreshToken(safeUser));

    return {
        accessToken: signAppAccessToken(safeUser),
        user: safeUser,
        expiresIn: APP_ACCESS_TOKEN_TTL_SECONDS
    };
}

function requestOriginAllowed(req) {
    const origin = typeof req.headers.origin === "string"
        ? req.headers.origin
        : "";

    // Browser requests must originate from the configured frontend.
    // Non-browser clients without an Origin header are not accepted for
    // refresh/logout because they cannot use the HttpOnly browser cookie
    // through the intended cross-origin flow.
    return Boolean(origin && ALLOWED_ORIGINS.includes(origin));
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



async function apiSecurity(req, res, next) {
    const rate = consumeRateLimit(req);

    res.setHeader("X-RateLimit-Limit", String(RATE_LIMIT_PER_MIN));
    res.setHeader("X-RateLimit-Remaining", String(rate.remaining));

    if (!rate.allowed) {
        res.setHeader("Retry-After", String(rate.retryAfter));
        return res.status(429).json({
            success: false,
            error: "Too many requests. Please try again later.",
            code: "rate_limited"
        });
    }

    const authorization =
        typeof req.headers.authorization === "string"
            ? req.headers.authorization
            : "";

    if (!authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            error: "Sign in required.",
            code: "unauthorized"
        });
    }

    const suppliedToken = authorization.slice(7).trim();

    // Preserve existing API-token authentication.
    if (validateAccessToken(req)) {
        return next();
    }

    // Prefer the short-lived BAJEE application access token.
    const appUser = verifyAppAccessToken(suppliedToken);
    if (appUser) {
        req.googleUser = appUser;
        req.authType = "bajee_session";
        return next();
    }

    // Backward compatibility: also accept a valid Google ID token.
    if (!GOOGLE_CLIENT_ID || !suppliedToken) {
        return res.status(401).json({
            success: false,
            error: "Invalid sign-in. Please sign in with Google again.",
            code: "unauthorized"
        });
    }

    try {
        const ticket = await googleOAuthClient.verifyIdToken({
            idToken: suppliedToken,
            audience: GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.sub || !payload.email) {
            return res.status(401).json({
                success: false,
                error: "Google identity verification failed.",
                code: "unauthorized"
            });
        }

        req.googleUser = {
            id: payload.sub,
            email: payload.email,
            name: payload.name || ""
        };

        return next();
    } catch {
        return res.status(401).json({
            success: false,
            error: "Invalid or expired sign-in. Please sign in again.",
            code: "unauthorized"
        });
    }
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
        credentials: true,
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
/* =========================================================
   GOOGLE SIGN-IN — VERIFY GOOGLE ID TOKEN
========================================================= */

app.post("/api/auth/google", async (req, res) => {
    try {
        if (!GOOGLE_CLIENT_ID) {
            return res.status(503).json({
                success: false,
                error: "Google Sign-In is not configured."
            });
        }

        const credential = req.body?.credential;

        if (
            typeof credential !== "string" ||
            !credential ||
            credential.length > 10000
        ) {
            return res.status(400).json({
                success: false,
                error: "A valid Google credential is required."
            });
        }

        const ticket = await googleOAuthClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.sub || !payload.email) {
            return res.status(401).json({
                success: false,
                error: "Google identity verification failed."
            });
        }

        const session = createAppSession({
            id: payload.sub,
            name: payload.name || "",
            email: payload.email,
            picture: payload.picture || ""
        }, res);

        return res.json({
            success: true,
            ...session
        });
    } catch (error) {
        console.error(
            "Google ID token verification/session creation failed:",
            error.message
        );

        return res.status(401).json({
            success: false,
            error: "Google sign-in failed. Please try again."
        });
    }
});

/* ---------------------------------------------------------
   REFRESH APPLICATION SESSION
   Signed HttpOnly cookie; no database or in-memory session store.
--------------------------------------------------------- */
app.post("/api/auth/refresh", (req, res) => {
    if (!requestOriginAllowed(req)) {
        return res.status(403).json({
            success: false,
            error: "Origin not allowed.",
            code: "cors_denied"
        });
    }

    const refreshToken = getCookie(req, APP_REFRESH_COOKIE);
    const user = verifyRefreshToken(refreshToken);

    if (!user) {
        clearRefreshCookie(res);
        return res.status(401).json({
            success: false,
            error: "Your session has expired. Please sign in again.",
            code: "session_expired"
        });
    }

    try {
        // Rotate the signed refresh cookie. This survives server restarts without a database.
        setRefreshCookie(res, signRefreshToken(user));
        return res.json({
            success: true,
            accessToken: signAppAccessToken(user),
            user,
            expiresIn: APP_ACCESS_TOKEN_TTL_SECONDS
        });
    } catch (error) {
        clearRefreshCookie(res);
        return res.status(503).json({
            success: false,
            error: "Application sessions are not configured.",
            code: "session_not_configured"
        });
    }
});

/* ---------------------------------------------------------
   SIGN OUT AND REVOKE THE CURRENT APPLICATION SESSION
--------------------------------------------------------- */
app.post("/api/auth/logout", (req, res) => {
    if (!requestOriginAllowed(req)) {
        return res.status(403).json({
            success: false,
            error: "Origin not allowed.",
            code: "cors_denied"
        });
    }

    clearRefreshCookie(res);

    return res.json({
        success: true,
        message: "Signed out."
    });
});

/* =========================================================
   GOOGLE DRIVE OAUTH CALLBACK (public redirect endpoint)
   Must be registered before apiSecurity: Google cannot send our
   application's Authorization header on a redirect.
========================================================= */
app.get("/api/drive/callback", async (req, res) => {
    const returnToApp = (status) => {
        try { const url = new URL(DRIVE_FRONTEND_URL); url.searchParams.set("drive", status); return res.redirect(303, url.toString()); }
        catch { return res.status(500).json({ success: false, error: "Drive return URL is invalid.", code: "drive_return_url_invalid" }); }
    };
    if (!driveConfigReady()) return returnToApp("not-configured");
    if (req.query?.error) return returnToApp("cancelled");
    const state = verifySignedDriveState(req.query?.state);
    const code = req.query?.code;
    if (!state || typeof code !== "string" || !code || code.length > 4096) return returnToApp("invalid-state");
    try {
        const result = await driveOAuthClient.getToken({ code, redirect_uri: DRIVE_REDIRECT_URI });
        const credentials = result.tokens || {};
        if (!credentials.refresh_token && !credentials.access_token) return returnToApp("token-failed");
        const previous = await getDriveConnection(state.sub);
        await saveDriveConnection(state.sub, {
            credentials: { ...(previous.entry?.credentials || {}), ...credentials },
            selectedFolder: previous.entry?.selectedFolder || null,
            connectedAt: new Date().toISOString()
        });
        return returnToApp("connected");
    } catch (error) {
        console.error("Google Drive OAuth callback failed:", error?.message || "unknown error");
        return returnToApp("connection-failed");
    }
});

/* =========================================================
   SHORT-LIVED, SIGNED GOOGLE DRIVE MEDIA STREAM
   The HTML video element cannot attach the app Authorization header.
   A signed URL grants access to one verified file for 10 minutes.
========================================================= */
function createDrivePlaybackToken(userId, fileId) {
    if (!APP_SESSION_SECRET) throw new Error("Playback signing is not configured.");
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(JSON.stringify({ purpose: "bajee_drive_playback", sub: userId, fid: fileId, iat: now, exp: now + 600 })).toString("base64url");
    const signature = crypto.createHmac("sha256", APP_SESSION_SECRET).update(payload).digest("base64url");
    return `${payload}.${signature}`;
}
function verifyDrivePlaybackToken(token, fileId) {
    if (!APP_SESSION_SECRET || typeof token !== "string" || token.length > 2048) return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const expected = crypto.createHmac("sha256", APP_SESSION_SECRET).update(parts[0]).digest("base64url");
    if (!safeTimingEqual(parts[1], expected)) return null;
    try {
        const p = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
        const now = Math.floor(Date.now() / 1000);
        if (p.purpose !== "bajee_drive_playback" || typeof p.sub !== "string" || !p.sub || p.fid !== fileId || !Number.isFinite(p.exp) || p.exp <= now || !Number.isFinite(p.iat) || p.iat > now + 30) return null;
        return p;
    } catch { return null; }
}
async function driveFileIsWithinRoot(client, fileId, rootId) {
    const meta = await driveApiRequest(client, `files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,modifiedTime,webViewLink,parents`);
    let belongs = Array.isArray(meta.parents) && meta.parents.includes(rootId);
    let parents = Array.isArray(meta.parents) ? [...meta.parents] : [];
    const visited = new Set();
    for (let depth = 0; !belongs && depth < 10 && parents.length; depth++) {
        const next = [];
        for (const parentId of parents) {
            if (!parentId || visited.has(parentId)) continue;
            visited.add(parentId);
            if (parentId === rootId) { belongs = true; break; }
            try {
                const parent = await driveApiRequest(client, `files/${encodeURIComponent(parentId)}?fields=id,mimeType,parents`);
                if (Array.isArray(parent.parents)) next.push(...parent.parents);
            } catch { /* cannot prove membership through inaccessible parent */ }
        }
        parents = next;
    }
    return { meta, belongs };
}
app.get("/api/drive/media/:fileId", async (req, res) => {
    const fileId = typeof req.params?.fileId === "string" ? req.params.fileId : "";
    if (!fileId || fileId.length > 256 || !/^[A-Za-z0-9_-]+$/.test(fileId)) return res.status(400).end("Invalid file ID");
    const playback = verifyDrivePlaybackToken(req.query?.token, fileId);
    if (!playback) return res.status(401).end("Playback link expired. Press Play again.");
    try {
        const connection = await getAuthorizedDriveClient(playback.sub);
        if (!connection.connected) return res.status(401).end("Drive connection expired. Reconnect Google Drive.");
        const rootId = connection.entry?.selectedFolder?.id;
        if (!rootId) return res.status(403).end("No Master Storage folder is selected.");
        const { meta, belongs } = await driveFileIsWithinRoot(connection.client, fileId, rootId);
        if (!belongs) return res.status(403).end("This file is outside the selected Master Storage folder.");
        const mediaMime = String(meta.mimeType || "");
        if (!mediaMime.startsWith("video/") && !mediaMime.startsWith("audio/")) return res.status(415).end("This file is not a supported audio/video media type.");
        const access = await connection.client.getAccessToken();
        if (!access?.token) return res.status(401).end("Drive authorization expired.");
        const headers = { Authorization: `Bearer ${access.token}` };
        const range = req.headers.range;
        if (range && /^bytes=\d*-\d*$/.test(range)) headers.Range = range;
        const upstream = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, { headers });
        if (!upstream.ok || !upstream.body) {
            const status = upstream.status === 416 ? 416 : upstream.status === 404 ? 404 : 502;
            return res.status(status).end("Google Drive could not stream this media file.");
        }
        res.status(upstream.status === 206 ? 206 : 200);
        res.setHeader("Content-Type", meta.mimeType || (mediaMime.startsWith("audio/") ? "audio/mpeg" : "video/mp4"));
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("Accept-Ranges", upstream.headers.get("accept-ranges") || "bytes");
        res.setHeader("Cache-Control", "private, no-store");
        const contentLength = upstream.headers.get("content-length");
        const contentRange = upstream.headers.get("content-range");
        if (contentLength) res.setHeader("Content-Length", contentLength);
        if (contentRange) res.setHeader("Content-Range", contentRange);
        const dispositionName = String(meta.name || "video").replace(/[\r\n"\\]/g, "_");
        res.setHeader("Content-Disposition", `inline; filename="${dispositionName}"`);
        if (typeof upstream.body.pipe === "function") upstream.body.pipe(res);
        else {
            const reader = upstream.body.getReader();
            try { while (true) { const { done, value } = await reader.read(); if (done) break; if (!res.write(Buffer.from(value))) await new Promise(resolve => res.once("drain", resolve)); } res.end(); }
            catch { res.destroy(); }
        }
    } catch (error) {
        console.error("Drive media stream failed:", error?.message || "unknown error");
        if (!res.headersSent) res.status(502).end("Could not stream this media file from Google Drive."); else res.destroy();
    }
});

app.use(
    "/api",
    apiSecurity
);

app.post("/api/source/extract-url", async (req, res) => {
    const rawUrl = typeof req.body?.url === "string" ? req.body.url.trim() : "";
    if (!rawUrl || rawUrl.length > 2048) return res.status(400).json({ success: false, error: "Provide a valid source URL (maximum 2048 characters).", code: "source_url_invalid" });
    try {
        const result = await fetchPublicSource(rawUrl);
        return res.json({ success: true, source: result });
    } catch (error) {
        const status = Number(error?.status);
        const safeStatus = status >= 400 && status <= 599 ? status : 502;
        return res.status(safeStatus).json({ success: false, error: error?.message || "Could not extract text from this source URL.", code: "source_extraction_failed" });
    }
});

/* =========================================================
   GOOGLE DRIVE MASTER STORAGE API
========================================================= */
app.get("/api/drive/auth/start", (req, res) => {
    if (!driveUserId(req)) return res.status(401).json({ success: false, error: "Sign in to BAJEE JRF AI before connecting Drive.", code: "app_signin_required" });
    if (!driveConfigReady()) return res.status(503).json({ success: false, error: "Google Drive OAuth is not configured on the server.", code: "drive_not_configured" });
    try {
        const authUrl = driveOAuthClient.generateAuthUrl({ access_type: "offline", prompt: "consent", include_granted_scopes: true,
            scope: ["https://www.googleapis.com/auth/drive.readonly"], state: createSignedDriveState(driveUserId(req)) });
        return res.json({ success: true, authUrl });
    } catch (error) {
        console.error("Could not start Google Drive OAuth:", error?.message || "unknown error");
        return res.status(500).json({ success: false, error: "Could not start Drive authorization.", code: "drive_oauth_start_failed" });
    }
});

app.get("/api/drive/status", async (req, res) => {
    const userId = driveUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: "A signed-in BAJEE user is required.", code: "app_signin_required" });
    try {
        const { entry } = await getDriveConnection(userId);
        const connection = await getAuthorizedDriveClient(userId);
        return res.json({ success: true, configured: driveConfigReady(), connected: Boolean(connection.connected),
            selectedFolder: entry?.selectedFolder || null, connectedAt: entry?.connectedAt || null,
            storage: "supabase-encrypted-payload", note: "Drive connection metadata is encrypted by the backend before it is stored in Supabase." });
    } catch {
        return res.status(503).json({ success: false, error: "Drive connection storage is unavailable.", code: "drive_storage_unavailable" });
    }
});

app.post("/api/drive/disconnect", async (req, res) => {
    const userId = driveUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: "A signed-in BAJEE user is required.", code: "app_signin_required" });
    try {
        await deleteDriveConnection(userId);
        return res.json({ success: true, message: "Stored Drive credentials removed. To revoke Google's grant too, remove BAJEE JRF AI from your Google Account security settings." });
    } catch {
        return res.status(503).json({ success: false, error: "Could not remove the stored Drive connection.", code: "drive_storage_unavailable" });
    }
});

app.get("/api/drive/folders", async (req, res) => {
    const userId = driveUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: "A signed-in BAJEE user is required.", code: "app_signin_required" });
    try {
        const connection = await getAuthorizedDriveClient(userId);
        if (!connection.connected) return res.status(409).json({ success: false, error: "Connect Google Drive before listing folders.", code: "drive_not_connected" });
        const query = new URLSearchParams({ q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false", pageSize: String(DRIVE_MAX_PAGE_SIZE), orderBy: "name", fields: "nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink)" });
        const data = await driveApiRequest(connection.client, `files?${query}`);
        return res.json({ success: true, folders: Array.isArray(data.files) ? data.files : [], nextPageToken: data.nextPageToken || null });
    } catch (error) { return driveSafeError(res, error, "Could not list Google Drive folders."); }
});

app.post("/api/drive/folder/select", async (req, res) => {
    const userId = driveUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: "A signed-in BAJEE user is required.", code: "app_signin_required" });
    const folderId = typeof req.body?.folderId === "string" ? req.body.folderId.trim() : "";
    if (!folderId || folderId.length > 256 || !/^[A-Za-z0-9_-]+$/.test(folderId)) return res.status(400).json({ success: false, error: "Provide a valid Google Drive folder ID.", code: "invalid_folder_id" });
    try {
        const connection = await getAuthorizedDriveClient(userId);
        if (!connection.connected) return res.status(409).json({ success: false, error: "Connect Google Drive before selecting a folder.", code: "drive_not_connected" });
        const folder = await driveApiRequest(connection.client, `files/${encodeURIComponent(folderId)}?fields=id,name,mimeType,webViewLink`);
        if (folder.mimeType !== "application/vnd.google-apps.folder") return res.status(400).json({ success: false, error: "The selected Drive item is not a folder.", code: "drive_item_not_folder" });
        await saveDriveConnection(userId, { ...connection.entry, selectedFolder: { id: folder.id, name: folder.name || "Unnamed folder", webViewLink: folder.webViewLink || null } });
        return res.json({ success: true, selectedFolder: { id: folder.id, name: folder.name || "Unnamed folder", webViewLink: folder.webViewLink || null } });
    } catch (error) { return driveSafeError(res, error, "Could not select that Google Drive folder."); }
});

app.get("/api/drive/files", async (req, res) => {
    const userId = driveUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: "A signed-in BAJEE user is required.", code: "app_signin_required" });
    const n = Number(req.query?.pageSize || DRIVE_MAX_PAGE_SIZE);
    const pageSize = Number.isFinite(n) ? Math.max(1, Math.min(DRIVE_MAX_PAGE_SIZE, Math.floor(n))) : DRIVE_MAX_PAGE_SIZE;
    const pageToken = typeof req.query?.pageToken === "string" ? req.query.pageToken.slice(0, 2048) : "";
    try {
        const connection = await getAuthorizedDriveClient(userId);
        if (!connection.connected) return res.status(409).json({ success: false, error: "Connect Google Drive before listing files.", code: "drive_not_connected" });
        const folderId = connection.entry?.selectedFolder?.id;
        if (!folderId) return res.status(409).json({ success: false, error: "Select the Master Storage folder first.", code: "drive_folder_not_selected" });
        const query = new URLSearchParams({ q: `'${folderId}' in parents and trashed = false`, pageSize: String(pageSize), orderBy: "name", fields: "nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink,md5Checksum)" });
        if (pageToken) query.set("pageToken", pageToken);
        const data = await driveApiRequest(connection.client, `files?${query}`);
        return res.json({ success: true, folder: connection.entry.selectedFolder, files: Array.isArray(data.files) ? data.files : [], nextPageToken: data.nextPageToken || null });
    } catch (error) { return driveSafeError(res, error, "Could not list files in the selected Drive folder."); }
});

/*
 * Bounded recursive inventory of the selected Master Storage folder.
 * This lists metadata only; it does not download or index file contents.
 * Bounds protect the free backend from unexpectedly huge Drive trees.
 */
app.get("/api/drive/files/recursive", async (req, res) => {
    const userId = driveUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: "A signed-in BAJEE user is required.", code: "app_signin_required" });
    const requestedDepth = Number(req.query?.maxDepth || 8);
    const requestedItems = Number(req.query?.maxItems || 1000);
    const maxDepth = Number.isFinite(requestedDepth) ? Math.max(1, Math.min(10, Math.floor(requestedDepth))) : 8;
    const maxItems = Number.isFinite(requestedItems) ? Math.max(1, Math.min(2000, Math.floor(requestedItems))) : 1000;
    try {
        const connection = await getAuthorizedDriveClient(userId);
        if (!connection.connected) return res.status(409).json({ success: false, error: "Connect Google Drive before scanning folders.", code: "drive_not_connected" });
        const root = connection.entry?.selectedFolder;
        if (!root?.id) return res.status(409).json({ success: false, error: "Save your Master Storage folder first.", code: "drive_folder_not_selected" });

        const files = [];
        const folders = [];
        const queue = [{ id: root.id, name: root.name || "Master Storage", depth: 0, path: root.name || "Master Storage" }];
        const visited = new Set([root.id]);
        let truncated = false;

        while (queue.length && files.length + folders.length < maxItems) {
            const current = queue.shift();
            let pageToken = "";
            do {
                const params = new URLSearchParams({
                    q: `'${current.id}' in parents and trashed = false`,
                    pageSize: String(DRIVE_MAX_PAGE_SIZE),
                    orderBy: "name",
                    fields: "nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink,md5Checksum,parents)"
                });
                if (pageToken) params.set("pageToken", pageToken);
                const data = await driveApiRequest(connection.client, `files?${params}`);
                const entries = Array.isArray(data.files) ? data.files : [];
                for (const item of entries) {
                    if (files.length + folders.length >= maxItems) { truncated = true; break; }
                    const isFolder = item.mimeType === "application/vnd.google-apps.folder";
                    const entry = {
                        id: item.id,
                        name: item.name || "Unnamed item",
                        mimeType: item.mimeType || "application/octet-stream",
                        size: item.size || null,
                        modifiedTime: item.modifiedTime || null,
                        webViewLink: item.webViewLink || null,
                        parentId: current.id,
                        path: `${current.path}/${item.name || "Unnamed item"}`,
                        depth: current.depth + 1
                    };
                    if (isFolder) {
                        folders.push(entry);
                        if (current.depth + 1 < maxDepth && !visited.has(item.id)) {
                            visited.add(item.id);
                            queue.push({ id: item.id, name: entry.name, depth: current.depth + 1, path: entry.path });
                        } else if (current.depth + 1 >= maxDepth) {
                            truncated = true;
                        }
                    } else {
                        files.push(entry);
                    }
                }
                if (truncated) break;
                pageToken = data.nextPageToken || "";
            } while (pageToken);
            if (truncated) break;
        }
        if (queue.length) truncated = true;
        return res.json({
            success: true,
            folder: root,
            files,
            folders,
            totalFiles: files.length,
            totalFolders: folders.length,
            scannedItems: files.length + folders.length,
            maxDepth,
            maxItems,
            truncated,
            note: "Recursive metadata inventory only. File content extraction and indexing are separate steps."
        });
    } catch (error) {
        return driveSafeError(res, error, "Could not scan the Master Storage folder and its subfolders.");
    }
});

app.get("/api/drive/files/:fileId/playback", async (req, res) => {
    const userId = driveUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: "A signed-in BAJEE user is required.", code: "app_signin_required" });
    const fileId = typeof req.params?.fileId === "string" ? req.params.fileId : "";
    if (!fileId || fileId.length > 256 || !/^[A-Za-z0-9_-]+$/.test(fileId)) return res.status(400).json({ success: false, error: "Provide a valid Google Drive file ID.", code: "invalid_file_id" });
    try {
        const connection = await getAuthorizedDriveClient(userId);
        if (!connection.connected) return res.status(409).json({ success: false, error: "Connect Google Drive before playing media.", code: "drive_not_connected" });
        const rootId = connection.entry?.selectedFolder?.id;
        if (!rootId) return res.status(409).json({ success: false, error: "Select the Master Storage folder first.", code: "drive_folder_not_selected" });
        const { meta, belongs } = await driveFileIsWithinRoot(connection.client, fileId, rootId);
        if (!belongs) return res.status(403).json({ success: false, error: "Only files inside the selected Master Storage folder can be played.", code: "file_outside_master_folder" });
        const mediaMime = String(meta.mimeType || "");
        if (!mediaMime.startsWith("video/") && !mediaMime.startsWith("audio/")) return res.status(415).json({ success: false, error: "This file is not a browser-supported audio/video media type.", code: "unsupported_media_type" });
        const token = createDrivePlaybackToken(userId, fileId);
        // Render terminates HTTPS at its proxy. Express may still report req.protocol as
        // "http" unless trust proxy is enabled; an HTTP media URL is blocked as mixed
        // content by the HTTPS GitHub Pages frontend. Use the configured public API origin.
        const base = String(process.env.PUBLIC_API_BASE_URL || "https://bajee-jrf.onrender.com").replace(/\/+$/, "");
        return res.json({ success: true, url: `${base}/api/drive/media/${encodeURIComponent(fileId)}?token=${encodeURIComponent(token)}`, expiresIn: 600, file: { id: meta.id, name: meta.name, mimeType: meta.mimeType, size: meta.size || null } });
    } catch (error) { return driveSafeError(res, error, "Could not prepare video playback."); }
});

app.get("/api/drive/files/:fileId/content", async (req, res) => {
    const userId = driveUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: "A signed-in BAJEE user is required.", code: "app_signin_required" });
    const fileId = typeof req.params?.fileId === "string" ? req.params.fileId : "";
    if (!fileId || fileId.length > 256 || !/^[A-Za-z0-9_-]+$/.test(fileId)) return res.status(400).json({ success: false, error: "Provide a valid Google Drive file ID.", code: "invalid_file_id" });
    try {
        const connection = await getAuthorizedDriveClient(userId);
        if (!connection.connected) return res.status(409).json({ success: false, error: "Connect Google Drive before reading files.", code: "drive_not_connected" });
        const folderId = connection.entry?.selectedFolder?.id;
        if (!folderId) return res.status(409).json({ success: false, error: "Select the Master Storage folder first.", code: "drive_folder_not_selected" });
        const meta = await driveApiRequest(connection.client, `files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,modifiedTime,webViewLink,parents`);
        // Verify the file is inside the selected root, including nested folders.
        let belongsToRoot = Array.isArray(meta.parents) && meta.parents.includes(folderId);
        let parentIds = Array.isArray(meta.parents) ? [...meta.parents] : [];
        const visitedParents = new Set();
        for (let depth = 0; !belongsToRoot && depth < 10 && parentIds.length; depth++) {
            const nextParents = [];
            for (const parentId of parentIds) {
                if (!parentId || visitedParents.has(parentId)) continue;
                visitedParents.add(parentId);
                if (parentId === folderId) { belongsToRoot = true; break; }
                try {
                    const parentMeta = await driveApiRequest(connection.client, `files/${encodeURIComponent(parentId)}?fields=id,mimeType,parents`);
                    if (Array.isArray(parentMeta.parents)) nextParents.push(...parentMeta.parents);
                } catch { /* inaccessible parent means authorization cannot be proven */ }
            }
            parentIds = nextParents;
        }
        if (!belongsToRoot) return res.status(403).json({ success: false, error: "Only files inside the selected Master Storage folder or its subfolders can be read here.", code: "file_outside_master_folder" });

        const mime = meta.mimeType || "";
        const isText = mime === "application/vnd.google-apps.document" || ["text/plain", "text/markdown", "text/csv", "application/json"].includes(mime);
        const isPdf = mime === "application/pdf";
        const isPptx = mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        const isDocx = mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (!isText && !isPdf && !isPptx && !isDocx) return res.status(415).json({ success: false, error: "Supported for text extraction: Google Docs, text files, selectable-text PDF, DOCX and PPTX. Scanned-PDF OCR and audio/video transcription are not included.", code: "drive_file_type_not_supported" });

        const declaredSize = Number(meta.size || 0);
        const maxBytes = isText ? DRIVE_MAX_CONTENT_BYTES : DRIVE_MAX_DOCUMENT_BYTES;
        if (declaredSize > maxBytes) return res.status(413).json({ success: false, error: `This file exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit for its type.`, code: "drive_file_too_large" });

        let text = "";
        let extraction = { type: isPdf ? "pdf-text" : isPptx ? "pptx-text" : isDocx ? "docx-text" : "text", pages: null, slides: null, ocr: false };
        const token = await connection.client.getAccessToken();
        if (mime === "application/vnd.google-apps.document") {
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text%2Fplain`, { headers: { Authorization: `Bearer ${token.token}` } });
            if (!response.ok) throw Object.assign(new Error("Google Docs export failed."), { status: response.status });
            text = await response.text();
        } else {
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, { headers: { Authorization: `Bearer ${token.token}` } });
            if (!response.ok) throw Object.assign(new Error("Drive file download failed."), { status: response.status });
            const buffer = Buffer.from(await response.arrayBuffer());
            if (buffer.length > maxBytes) return res.status(413).json({ success: false, error: `This file exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit for its type.`, code: "drive_file_too_large" });
            if (isText) {
                text = buffer.toString("utf8");
            } else if (isPdf) {
                const parsed = await pdfParse(buffer);
                text = (parsed.text || "").trim();
                extraction.pages = Number(parsed.numpages || 0);
                if (!text) return res.status(422).json({ success: false, error: "No selectable text was found in this PDF. It may be scanned; OCR is not enabled yet.", code: "pdf_no_selectable_text", extraction: { ...extraction, status: "needs_ocr" } });
            } else if (isPptx) {
                const zip = new AdmZip(buffer);
                const slideEntries = zip.getEntries().filter(entry => /^ppt\/slides\/slide\d+\.xml$/.test(entry.entryName))
                    .sort((a, b) => Number(a.entryName.match(/slide(\d+)/)[1]) - Number(b.entryName.match(/slide(\d+)/)[1]));
                if (!slideEntries.length) return res.status(422).json({ success: false, error: "No slide XML was found in this PPTX file.", code: "pptx_no_slides" });
                const decodeXml = value => value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
                text = slideEntries.map((entry, index) => {
                    const xml = entry.getData().toString("utf8");
                    const pieces = [...xml.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)].map(match => decodeXml(match[1]));
                    return pieces.length ? `[Slide ${index + 1}]\n${pieces.join(" ")}` : "";
                }).filter(Boolean).join("\n\n");
                extraction.slides = slideEntries.length;
                if (!text.trim()) return res.status(422).json({ success: false, error: "No readable slide text was found in this PPTX file.", code: "pptx_no_text" });
            } else if (isDocx) {
                const zip = new AdmZip(buffer);
                const documentEntry = zip.getEntry("word/document.xml");
                if (!documentEntry) return res.status(422).json({ success: false, error: "This DOCX file does not contain a readable Word document body.", code: "docx_no_document" });
                const xml = documentEntry.getData().toString("utf8");
                const decodeXml = value => value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
                text = xml.replace(/<w:tab\b[^>]*\/>/g, "\t").replace(/<w:br\b[^>]*\/>/g, "\n").replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, " ");
                text = decodeXml(text).replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
                if (!text) return res.status(422).json({ success: false, error: "No readable text was found in this DOCX file.", code: "docx_no_text" });
            }
        }
        if (Buffer.byteLength(text, "utf8") > DRIVE_MAX_EXTRACTED_TEXT_BYTES) return res.status(413).json({ success: false, error: `Extracted text exceeds the ${Math.round(DRIVE_MAX_EXTRACTED_TEXT_BYTES / 1024 / 1024)} MB response limit.`, code: "drive_extracted_text_too_large" });
        return res.json({ success: true, file: { id: meta.id, name: meta.name, mimeType: mime, modifiedTime: meta.modifiedTime || null, webViewLink: meta.webViewLink || null }, text, extraction: { ...extraction, status: "extracted" } });
    } catch (error) {
        if (error?.name === "InvalidPDFException" || /Invalid PDF/i.test(error?.message || "")) return res.status(422).json({ success: false, error: "This PDF could not be parsed. Scanned-PDF OCR is not enabled yet.", code: "pdf_parse_failed" });
        return driveSafeError(res, error, "Could not read or extract this Master Storage file.");
    }
});

/* =========================================================
   GEMINI URL
========================================================= */

/* =========================================================
   SAFE PUBLIC WEBPAGE / PDF SOURCE EXTRACTION
   Only public HTTP(S) hosts; blocks private/internal destinations and
   re-checks every redirect. This route is protected by apiSecurity.
========================================================= */
const SOURCE_FETCH_TIMEOUT_MS = 10000;
const SOURCE_FETCH_MAX_BYTES = 8 * 1024 * 1024;
const SOURCE_FETCH_MAX_CHARS = 12000;

function isPublicSourceIp(address) {
    const version = isIP(address);
    if (version === 4) {
        const parts = address.split(".").map(Number);
        if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
        const [a, b] = parts;
        if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
        if (a === 100 && b >= 64 && b <= 127) return false;
        if (a === 169 && b === 254) return false;
        if (a === 172 && b >= 16 && b <= 31) return false;
        if (a === 192 && (b === 0 || b === 168)) return false;
        if (a === 198 && (b === 18 || b === 19)) return false;
        return true;
    }
    if (version === 6) {
        const ip = address.toLowerCase();
        if (ip === "::" || ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || /^fe[89ab]/.test(ip)) return false;
        if (ip.startsWith("::ffff:")) return isPublicSourceIp(ip.slice(7));
        // Public IPv6 global unicast is within 2000::/3.
        return /^2[0-9a-f]{3}:/.test(ip);
    }
    return false;
}

async function validatePublicSourceUrl(raw) {
    let url;
    try { url = new URL(raw); } catch { throw Object.assign(new Error("Enter a valid public webpage URL."), { status: 400 }); }
    if (!['http:', 'https:'].includes(url.protocol)) throw Object.assign(new Error("Only HTTP and HTTPS webpage URLs are supported."), { status: 400 });
    if (url.username || url.password) throw Object.assign(new Error("URLs containing embedded credentials are not allowed."), { status: 400 });
    if (url.port && !['80', '443'].includes(url.port)) throw Object.assign(new Error("Only standard HTTP/HTTPS ports are allowed."), { status: 400 });
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
        throw Object.assign(new Error("Private or local network URLs are not allowed."), { status: 400 });
    }
    if (isIP(host)) {
        if (!isPublicSourceIp(host)) throw Object.assign(new Error("Private or reserved IP addresses are not allowed."), { status: 400 });
    } else {
        let records;
        try { records = await dnsLookup(host, { all: true, verbatim: true }); }
        catch { throw Object.assign(new Error("The webpage host could not be resolved."), { status: 422 }); }
        if (!records.length || records.some(record => !isPublicSourceIp(record.address))) {
            throw Object.assign(new Error("The webpage host does not resolve exclusively to public IP addresses."), { status: 400 });
        }
    }
    url.hash = '';
    return url;
}

function decodeSourceHtmlEntities(value) {
    const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', copy: '©', reg: '®' };
    return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
        if (entity[0] === '#') {
            const hex = entity[1]?.toLowerCase() === 'x';
            const number = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
            try { return Number.isFinite(number) && number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : ' '; } catch { return ' '; }
        }
        return named[entity.toLowerCase()] ?? match;
    });
}

function extractReadableHtml(html) {
    return decodeSourceHtmlEntities(String(html)
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<(script|style|noscript|svg|canvas|iframe|nav|footer|header|form)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
        .replace(/<(script|style|noscript|svg|canvas|iframe|nav|footer|header|form)\b[^>]*\/?\s*>/gi, ' ')
        .replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6]|\/section|\/article|\/table)\b[^>]*>/gi, '\n')
        .replace(/<[^>]+>/g, ' '))
        .replace(/[\t\f\v ]+/g, ' ')
        .replace(/ *\n */g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

async function fetchPublicSource(rawUrl) {
    let url = await validatePublicSourceUrl(rawUrl);
    for (let redirects = 0; redirects <= 3; redirects++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), SOURCE_FETCH_TIMEOUT_MS);
        let response;
        try {
            response = await fetch(url, {
                method: 'GET',
                redirect: 'manual',
                signal: controller.signal,
                headers: {
                    'User-Agent': 'BAJEE-JRF-Academic-Source-Reader/1.0 (+public-page-text-extraction)',
                    'Accept': 'text/html, text/plain, application/pdf;q=0.9, */*;q=0.1'
                }
            });
        } catch (error) {
            if (error?.name === 'AbortError') throw Object.assign(new Error("The source website took too long to respond."), { status: 504 });
            throw Object.assign(new Error("Could not connect to the source website."), { status: 502 });
        } finally { clearTimeout(timer); }

        if ([301, 302, 303, 307, 308].includes(response.status)) {
            const location = response.headers.get('location');
            if (!location || redirects === 3) throw Object.assign(new Error("The source website redirected too many times."), { status: 422 });
            try { await response.body?.cancel(); } catch {}
            url = await validatePublicSourceUrl(new URL(location, url).toString());
            continue;
        }
        if (!response.ok) {
            try { await response.body?.cancel(); } catch {}
            throw Object.assign(new Error(`The source website returned HTTP ${response.status}. It may block automated access.`), { status: 422 });
        }
        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/pdf')) {
            try { await response.body?.cancel(); } catch {}
            throw Object.assign(new Error("This URL did not return an HTML webpage, plain text, or PDF. For YouTube, paste a transcript or use the existing YouTube source workflow."), { status: 415 });
        }
        const declaredLength = Number(response.headers.get('content-length') || 0);
        if (declaredLength > SOURCE_FETCH_MAX_BYTES) {
            try { await response.body?.cancel(); } catch {}
            throw Object.assign(new Error("The source file exceeds the 8 MB retrieval limit."), { status: 413 });
        }
        const chunks = [];
        let total = 0;
        const reader = response.body?.getReader();
        if (!reader) throw Object.assign(new Error("The source website returned an empty response."), { status: 422 });
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                total += value.byteLength;
                if (total > SOURCE_FETCH_MAX_BYTES) {
                    await reader.cancel();
                    throw Object.assign(new Error("The source file exceeds the 8 MB retrieval limit."), { status: 413 });
                }
                chunks.push(Buffer.from(value));
            }
        } catch (error) {
            if (error?.status) throw error;
            throw Object.assign(new Error("The source response could not be read completely."), { status: 502 });
        }
        const buffer = Buffer.concat(chunks);
        let text;
        let extractionType;
        if (contentType.includes('application/pdf') || url.pathname.toLowerCase().endsWith('.pdf')) {
            try {
                const parsed = await pdfParse(buffer);
                text = String(parsed.text || '').trim();
                extractionType = 'pdf-text';
            } catch {
                throw Object.assign(new Error("The PDF could not be parsed. Scanned PDFs need OCR, which is not enabled yet."), { status: 422 });
            }
            if (!text) throw Object.assign(new Error("No selectable text was found in this PDF. It may be scanned; OCR is not enabled yet."), { status: 422 });
        } else if (contentType.includes('text/plain')) {
            text = buffer.toString('utf8').trim();
            extractionType = 'plain-text';
        } else {
            text = extractReadableHtml(buffer.toString('utf8'));
            extractionType = 'html-text';
        }
        if (!text) throw Object.assign(new Error("No readable text was found on this webpage."), { status: 422 });
        const truncated = text.length > SOURCE_FETCH_MAX_CHARS;
        if (truncated) text = text.slice(0, SOURCE_FETCH_MAX_CHARS);
        return { url: url.toString(), title: null, text, extractionType, truncated, characters: text.length };
    }
    throw Object.assign(new Error("Could not retrieve the source webpage."), { status: 422 });
}

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
            `API access-token protection: ${
                BAJEE_API_ACCESS_TOKEN
                    ? "ENABLED"
                    : "DISABLED (development mode)"
            }`
        );

        console.log(
            `Persistent Google sessions: ${
                GOOGLE_CLIENT_ID && APP_SESSION_SECRET
                    ? "CONFIGURED (signed HttpOnly cookie)"
                    : "NOT CONFIGURED"
            }`
        );

        console.log(
            `Rate limit: ${RATE_LIMIT_PER_MIN} requests/minute`
        );

        console.log(`Google Drive OAuth: ${driveConfigReady() ? "CONFIGURED" : "NOT CONFIGURED"}`);
        console.log(`Google Drive connection storage: ${supabaseDriveStorageReady() ? "Supabase configured (encrypted payloads)" : "NOT CONFIGURED"}`);

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
