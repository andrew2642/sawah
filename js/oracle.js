/**
 * Sawah Oracle
 * Handles direct communication with the AI model (now via OpenRouter API).
 * This module is for raw AI queries, not the structured research process.
 */
import { SAWAH_CONFIG } from './config.js';

const { OPENROUTER_API_KEY, OPENROUTER_MODELS, OPENROUTER_API_URL, OPENROUTER_MAX_TOKENS } = SAWAH_CONFIG;

/**
 * Sends a query to the OpenRouter AI and returns the response.
 * @param {string} systemPrompt - The system prompt to guide the AI.
 * @param {string} userPrompt - The user's query.
 * @param {boolean} useJsonOutput - Whether to ask the AI for a JSON response.
 * @returns {Promise<string|object>} The AI's response content.
 */
export async function queryAI(systemPrompt, userPrompt, useJsonOutput = false, retries = 2, maxTokensOverride = null) {
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.includes('REPLACE_WITH')) {
        throw new Error("Invalid or missing OpenRouter API key in templates/js/config.js.");
    }

    let lastError;
    const modelsToTry = [...OPENROUTER_MODELS]; // Create a mutable copy

    for (let i = 0; i < modelsToTry.length; i++) { // Use index-based loop to handle array modification
        const model = modelsToTry[i];
        console.log(`[Oracle] Attempting to use model: ${model} (${i + 1}/${modelsToTry.length})`);

        const requestBody = {
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: maxTokensOverride || OPENROUTER_MAX_TOKENS || 4096,
        };

        if (useJsonOutput) {
            requestBody.response_format = { type: "json_object" };
        }

        try {
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Sawah Digital Archive'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData?.error?.message || `HTTP status ${response.status}`;

                // Intelligent retry based on OpenRouter suggestion
                const suggestionMatch = errorMessage.match(/Use(?: this slug instead)?: ([^\s]+)/i);
                if (suggestionMatch) {
                    const suggestedModel = suggestionMatch[1];
                    if (!modelsToTry.includes(suggestedModel)) {
                        console.log(`[Oracle] OpenRouter suggested using '${suggestedModel}'. Adding to retry queue.`);
                        modelsToTry.push(suggestedModel); // Add to the end to try after others
                    }
                }

                throw new Error(`API Error with model ${model}: ${errorMessage}`);
            }

            const data = await response.json();
            const content = data?.choices?.[0]?.message?.content;

            if (!content) {
                throw new Error("AI returned an empty response.");
            }

            console.log(`[Oracle] Successfully received response from model: ${model}`);

            if (useJsonOutput) {
                // AI models sometimes wrap JSON in markdown fences or add extra text.
                // This function extracts the JSON object robustly.
                const jsonStart = content.indexOf('{');
                const jsonEnd = content.lastIndexOf('}');
                if (jsonStart === -1 || jsonEnd === -1) {
                    throw new Error("No JSON object found in AI response.");
                }
                const jsonString = content.slice(jsonStart, jsonEnd + 1);
                try {
                    return JSON.parse(jsonString);
                } catch (e) {
                    throw new Error(`AI returned a malformed JSON string: ${e.message}`);
                }
            }

            return content;

        } catch (e) {
            lastError = e;
            const errorMessage = e.message || '';
            // If the model is fundamentally unavailable, don't log a scary error, just skip it.
            if (errorMessage.includes("not a valid model ID") || errorMessage.includes("No endpoints found")) {
                console.warn(`[Oracle] Skipping unavailable model: ${model}`);
                continue; // Explicitly continue to the next model
            }
            // For other errors (like network issues or timeouts), log it as a failure.
            console.warn(`[Oracle] Model failed: ${model}. Error: ${errorMessage}.`);
        }
    }

    console.error("[Oracle] All models failed.");
    throw lastError; // Throw the last error if all models fail
}