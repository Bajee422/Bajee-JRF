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
        "https://bajee-jrf.onrender.com/api",

    /*
     * AI gateway endpoint
     */
    AI_API_URL:
         "https://bajee-jrf.onrender.com/api/ai/chat"

};
