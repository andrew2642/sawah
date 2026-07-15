// Sawah Configuration
// SECURITY WARNING: In a production environment, API keys should never be
// exposed in client-side JavaScript. They should be handled by a backend
// server or a serverless function that proxies the requests.

export const SAWAH_CONFIG = {
    // AI Configuration
    // This app uses OpenRouter.ai to access various AI models.
    // Get your free API key from https://openrouter.ai/
    // NOTE: Do NOT commit real API keys to version control. Use a server-side proxy in production.
    OPENROUTER_API_KEY: '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',
    
    // The AI model to use via OpenRouter.
    // A prioritized list of models to try. The system will fall back to the next one if a model fails.
    // NOTE: Model availability on OpenRouter changes. These are valid as of the last update.
    // Verify available models at https://openrouter.ai/models
    OPENROUTER_MODELS: [
        "nousresearch/nous-hermes-2-mixtral-8x7b-dpo", // A powerful and commonly free model
        "gryphe/mythomax-l2-13b", // A reliable free alternative
        "huggingfaceh4/zephyr-7b-beta" // A solid third option
    ],
    
    // The base URL for the OpenRouter API.
    OPENROUTER_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
    
    // Max tokens for a response. Adjust based on the model and your needs.
    // NOTE: This value is set very low to stay within the strict free credit limits of
    // OpenRouter, as indicated by the "can only afford 111" error. A higher
    // value will produce more detailed archives but requires a paid account.
    OPENROUTER_MAX_TOKENS: 100,
    
    // Map Configuration
    MAP_CENTER: [20, 30],
    MAP_ZOOM: 2.4,
    
    // App Settings
    APP_NAME: 'Sawah',
    APP_TAGLINE: 'The Digital Curator'
};