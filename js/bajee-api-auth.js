
/*
 * BAJEE JRF AI — persistent API access-token bridge
 *
 * Saves BAJEE_API_ACCESS_TOKEN in localStorage so it survives closing and
 * reopening the browser/app. It is NOT the Gemini API key.
 *
 * Public deployment: GitHub Pages frontend -> Render backend.
 * Existing localhost API URLs are redirected to Render.
 */
(function () {
    "use strict";

    if (window.__BAJEE_API_AUTH_INSTALLED__) return;
    window.__BAJEE_API_AUTH_INSTALLED__ = true;

    const API_ORIGIN = "https://bajee-jrf.onrender.com";
    const TOKEN_KEY = "bajee_api_access_token";
    const LEGACY_KEYS = ["bajee_api_access_token_session"];
    const nativeFetch = window.fetch.bind(window);

    function resolveApiUrl(input) {
        try {
            const rawUrl =
                typeof input === "string" || input instanceof URL
                    ? input.toString()
                    : input.url;

            const url = new URL(rawUrl, window.location.href);

            if (
                (url.hostname === "127.0.0.1" ||
                    url.hostname === "localhost") &&
                url.pathname.startsWith("/api/")
            ) {
                url.protocol = "https:";
                url.host = "bajee-jrf.onrender.com";
            }

            return url;
        } catch (_) {
            return null;
        }
    }

    function isProtectedApi(url) {
        return Boolean(
            url &&
            url.origin === API_ORIGIN &&
            url.pathname.startsWith("/api/") &&
            url.pathname !== "/api/health"
        );
    }

    function getSavedToken() {
        try {
            const saved = localStorage.getItem(TOKEN_KEY);
            if (saved) return saved;

            // Migrate an older session-only token, if available.
            for (const key of LEGACY_KEYS) {
                const oldToken = sessionStorage.getItem(key);
                if (oldToken) {
                    localStorage.setItem(TOKEN_KEY, oldToken);
                    sessionStorage.removeItem(key);
                    return oldToken;
                }
            }
        } catch (_) {}

        return "";
    }

    function saveToken(token) {
        try {
            localStorage.setItem(TOKEN_KEY, token);
        } catch (_) {}
    }

    function clearToken() {
        try {
            localStorage.removeItem(TOKEN_KEY);
        } catch (_) {}

        try {
            for (const key of LEGACY_KEYS) {
                sessionStorage.removeItem(key);
            }
        } catch (_) {}
    }

    function askForToken(message) {
        let token = getSavedToken();
        if (token) return token;

        const entered = window.prompt(
            message ||
            "BAJEE JRF AI API access is protected. Enter BAJEE_API_ACCESS_TOKEN from your backend .env file. Do not enter your Gemini API key."
        );

        token = typeof entered === "string" ? entered.trim() : "";

        if (!token) return "";

        saveToken(token);
        return token;
    }

    function buildRequest(input, init, url, token) {
        const source = input instanceof Request ? input : null;

        const headers = new Headers(
            init && init.headers !== undefined
                ? init.headers
                : source
                    ? source.headers
                    : undefined
        );

        headers.set("Authorization", "Bearer " + token);

        const options = Object.assign({}, init || {}, { headers });

        return nativeFetch(url.href, options);
    }

    window.fetch = async function (input, init) {
        const url = resolveApiUrl(input);

        if (!url) {
            return nativeFetch(input, init);
        }

        // Redirect legacy localhost API calls to the deployed backend.
        if (!isProtectedApi(url)) {
            if (url.href !== (input instanceof Request ? input.url : String(input))) {
                return nativeFetch(url.href, init);
            }

            return nativeFetch(input, init);
        }

        let token = askForToken();

        if (!token) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "API access token was not supplied.",
                    code: "token_required"
                }),
                {
                    status: 401,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        let response = await buildRequest(input, init, url, token);

        // Keep the saved token unless the backend rejects it.
        if (response.status !== 401) {
            return response;
        }

        clearToken();

        const replacement = window.prompt(
            "The API rejected the saved access token. Re-enter BAJEE_API_ACCESS_TOKEN from backend .env. Do not enter your Gemini API key."
        );

        token =
            typeof replacement === "string"
                ? replacement.trim()
                : "";

        if (!token) return response;

        saveToken(token);

        return buildRequest(input, init, url, token);
    };

    window.BAJEE_API_AUTH = {
        clearAccessToken: clearToken,
        clearSessionToken: clearToken
    };
})();
