
/*
 * BAJEE JRF AI — persistent API access token
 * Remembers the access token across app restarts on this device.
 */
(function () {
    "use strict";

    if (window.__BAJEE_API_AUTH_INSTALLED__) return;
    window.__BAJEE_API_AUTH_INSTALLED__ = true;

    const API_ORIGIN = "http://127.0.0.1:3000";
    const TOKEN_KEY = "bajee_api_access_token";
    const LEGACY_KEY = "bajee_api_access_token_session";
    const nativeFetch = window.fetch.bind(window);

    function isProtectedApi(input) {
        try {
            const url = new URL(
                typeof input === "string" || input instanceof URL
                    ? input
                    : input.url,
                window.location.href
            );
            return url.origin === API_ORIGIN &&
                url.pathname.startsWith("/api/") &&
                url.pathname !== "/api/health";
        } catch (_) {
            return false;
        }
    }

    function getSavedToken() {
        try {
            let token = localStorage.getItem(TOKEN_KEY);
            if (token) return token;

            token = sessionStorage.getItem(LEGACY_KEY);
            if (token) {
                localStorage.setItem(TOKEN_KEY, token);
                sessionStorage.removeItem(LEGACY_KEY);
                return token;
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
        try { localStorage.removeItem(TOKEN_KEY); } catch (_) {}
        try { sessionStorage.removeItem(LEGACY_KEY); } catch (_) {}
    }

    function requestWithToken(input, init, token) {
        const source = input instanceof Request ? input : null;
        const headers = new Headers(
            init && init.headers !== undefined
                ? init.headers
                : source ? source.headers : undefined
        );
        headers.set("Authorization", "Bearer " + token);
        return nativeFetch(
            input,
            Object.assign({}, init || {}, { headers })
        );
    }

    function askForToken() {
        let token = getSavedToken();
        if (token) return token;

        token = window.prompt(
            "BAJEE JRF AI API access is protected. Enter BAJEE_API_ACCESS_TOKEN from your backend .env file. Do not enter your Gemini API key."
        );

        token = typeof token === "string" ? token.trim() : "";
        if (!token) return "";

        saveToken(token);
        return token;
    }

    window.fetch = async function (input, init) {
        if (!isProtectedApi(input)) {
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
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        let response = await requestWithToken(input, init, token);
        if (response.status !== 401) return response;

        clearToken();

        const replacement = window.prompt(
            "The API rejected the saved access token. Re-enter BAJEE_API_ACCESS_TOKEN from backend .env (not the Gemini key)."
        );

        token = typeof replacement === "string"
            ? replacement.trim()
            : "";

        if (!token) return response;

        saveToken(token);
        return requestWithToken(input, init, token);
    };

    window.BAJEE_API_AUTH = {
        clearAccessToken: clearToken,
        clearSessionToken: clearToken
    };
})();
