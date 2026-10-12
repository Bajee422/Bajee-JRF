/*
=========================================================
BAJEE JRF AI
RUNTIME CONFIGURATION
=========================================================

This file contains only browser-safe runtime configuration.

The Gemini API key MUST remain in the backend .env file.
Never place the Gemini API key in this file.
=========================================================
*/

window.BAJEE_RUNTIME_CONFIG = {

    /*
     * Local Express backend
     */
    API_BASE:
        "http://127.0.0.1:3000/api",

    /*
     * AI gateway endpoint
     */
    AI_API_URL:
        "http://127.0.0.1:3000/api/ai/chat"

};