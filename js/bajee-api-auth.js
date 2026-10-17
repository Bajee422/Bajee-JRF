/*
 * BAJEE JRF AI — browser-side API bearer-token bridge
 *
 * The backend access token is entered by the local user at runtime.
 * It is never hard-coded here and is not the Gemini API key.
 * This is intended for the local/private development app, not as a
 * substitute for a proper server-side session in a public deployment.
 */
(function () {
    "use strict";

    if (window.__BAJEE_API_AUTH_INSTALLED__) return;
    window.__BAJEE_API_AUTH_INSTALLED__ = true;

    const API_ORIGIN = "http://127.0.0.1:3000";
    const TOKEN_KEY = "bajee_api_access_token_session";
    const nativeFetch = window.fetch.bind(window);

    function isProtectedApi(input) {
        let url;
        try {
            url = new URL(
                typeof input === "string" || input instanceof URL ? input : input.url,
                window.location.href
            );
        } catch (_) {
            return false;
        }
        return url.origin === API_ORIGIN &&
            url.pathname.startsWith("/api/") &&
            url.pathname !== "/api/health";
    }

    function requestWithToken(input, init, token) {
        const source = input instanceof Request ? input : null;
        const headers = new Headers(
            init && init.headers !== undefined
                ? init.headers
                : source ? source.headers : undefined
        );
        headers.set("Authorization", "Bearer " + token);
        const options = Object.assign({}, init || {}, { headers });
        return nativeFetch(input, options);
    }

    function askForToken() {
        let token = "";
        try { token = window.sessionStorage.getItem(TOKEN_KEY) || ""; } catch (_) {}
        if (token) return token;

        token = window.prompt(
            "BAJEE JRF AI API access is protected. Enter BAJEE_API_ACCESS_TOKEN from your backend .env file. Do not enter your Gemini API key."
        );
        token = typeof token === "string" ? token.trim() : "";
        if (!token) return "";
        try { window.sessionStorage.setItem(TOKEN_KEY, token); } catch (_) {}
        return token;
    }

    window.fetch = async function (input, init) {
        if (!isProtectedApi(input)) return nativeFetch(input, init);

        let token = askForToken();
        if (!token) {
            return new Response(
                JSON.stringify({ success: false, error: "API access token was not supplied.", code: "token_required" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        let response = await requestWithToken(input, init, token);
        if (response.status !== 401) return response;

        // A stale/incorrect token can be replaced once, without weakening server checks.
        try { window.sessionStorage.removeItem(TOKEN_KEY); } catch (_) {}
        const replacement = window.prompt(
            "The API rejected the saved access token. Re-enter BAJEE_API_ACCESS_TOKEN from backend .env (not the Gemini key)."
        );
        token = typeof replacement === "string" ? replacement.trim() : "";
        if (!token) return response;
        try { window.sessionStorage.setItem(TOKEN_KEY, token); } catch (_) {}
        return requestWithToken(input, init, token);
    };

    window.BAJEE_API_AUTH = {
        clearSessionToken: function () {
            try { window.sessionStorage.removeItem(TOKEN_KEY); } catch (_) {}
        }
    };
})();
