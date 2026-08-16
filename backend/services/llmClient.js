/**
 * llmClient.js — Groq API client for AI-powered recommendations.
 *
 * Sends structured prompts to Groq's OpenAI-compatible API,
 * parses JSON responses, and handles retries + fallback.
 *
 * Model: llama-3.3-70b-versatile
 * Endpoint: https://api.groq.com/openai/v1/chat/completions
 */

const { buildPrompt } = require("./promptBuilder");

// ── Constants ──────────────────────────────────────────────────────────
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
const TEMPERATURE = 0.3; // Low for consistent recommendations
const MAX_TOKENS = 2000;
const REQUEST_TIMEOUT_MS = 30000; // 30 second timeout (edge case L-5)
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

/**
 * Check if the Groq API key is configured.
 */
function isConfigured() {
  return !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "your_key_here");
}

/**
 * Extract JSON array from LLM response text.
 * Handles common LLM quirks:
 *   - JSON wrapped in markdown code fences (edge case L-8)
 *   - Conversational text before/after JSON (edge case L-17)
 *   - Direct JSON array
 *
 * @param {string} text - Raw response text from the LLM
 * @returns {Array} Parsed JSON array
 */
function extractJSON(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Empty or invalid LLM response");
  }

  let cleaned = text.trim();

  // Strip markdown code fences (edge case L-8)
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
  cleaned = cleaned.trim();

  // Try direct JSON parse first
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    // If it's an object with a recommendations array, extract it
    if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
      return parsed.recommendations;
    }
    throw new Error("Response is not a JSON array");
  } catch (e) {
    // Fall through to regex extraction
  }

  // Extract JSON array using regex (edge case L-17)
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // Fall through
    }
  }

  throw new Error("Could not extract valid JSON array from LLM response");
}

/**
 * Validate and normalize a single recommendation object.
 * Fills missing fields with defaults (edge case L-10).
 *
 * @param {object} rec - Raw recommendation from LLM
 * @param {Array} filteredRestaurants - Original filtered list for cross-reference
 * @returns {object|null} Normalized recommendation or null if invalid
 */
function validateRecommendation(rec, filteredRestaurants) {
  if (!rec || typeof rec !== "object") return null;
  if (!rec.name || typeof rec.name !== "string") return null;

  // Cross-reference with filtered list (edge case L-13: hallucination check)
  const matchedRestaurant = filteredRestaurants.find(
    (r) => r.name.toLowerCase() === rec.name.toLowerCase()
  );

  if (!matchedRestaurant) {
    console.warn(`   ⚠️ LLM hallucinated restaurant: "${rec.name}" — skipping`);
    return null;
  }

  return {
    rank: parseInt(rec.rank, 10) || 0,
    name: rec.name,
    cuisine: rec.cuisine || matchedRestaurant.cuisines_string,
    rating: parseFloat(rec.rating) || matchedRestaurant.rating,
    estimated_cost: parseInt(rec.estimated_cost, 10) || matchedRestaurant.cost,
    explanation: typeof rec.explanation === "string"
      ? rec.explanation.substring(0, 500) // cap length (edge case L-14)
      : "Great match for your preferences.",
    // Enrich with data from our dataset
    location: matchedRestaurant.location,
    address: matchedRestaurant.address,
    online_order: matchedRestaurant.online_order,
    book_table: matchedRestaurant.book_table,
    rest_type: matchedRestaurant.rest_type,
    votes: matchedRestaurant.votes,
  };
}

/**
 * Sleep helper for retry backoff.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call the Groq API with retry logic.
 *
 * @param {string} systemMessage
 * @param {string} userMessage
 * @param {number} attempt - Current retry attempt (0-indexed)
 * @returns {string} Raw response text
 */
async function callGroqAPI(systemMessage, userMessage, attempt = 0) {
  const apiKey = process.env.GROQ_API_KEY;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Handle rate limiting (edge case L-3)
    if (response.status === 429) {
      if (attempt < MAX_RETRIES) {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`   ⚠️ Rate limited (429). Retrying in ${delay}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        return callGroqAPI(systemMessage, userMessage, attempt + 1);
      }
      throw new Error("Groq API rate limit exceeded after max retries");
    }

    // Handle auth errors (edge case L-2)
    if (response.status === 401) {
      throw new Error("Invalid GROQ_API_KEY — check your .env file");
    }

    // Handle server errors (edge case L-4)
    if (response.status >= 500) {
      if (attempt < 1) {
        console.warn(`   ⚠️ Groq server error (${response.status}). Retrying in 2s...`);
        await sleep(2000);
        return callGroqAPI(systemMessage, userMessage, attempt + 1);
      }
      throw new Error(`Groq API server error: ${response.status}`);
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error(`   ❌ Groq API error ${response.status}: ${errorBody.substring(0, 300)}`);
      throw new Error(`Groq API error ${response.status}: ${errorBody.substring(0, 200)}`);
    }

    const data = await response.json();

    // Extract content (edge case L-6: empty body)
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Groq API returned empty response");
    }

    return content;
  } catch (err) {
    clearTimeout(timeout);

    // Handle timeout (edge case L-5)
    if (err.name === "AbortError") {
      throw new Error("Groq API request timed out (15s)");
    }

    // Handle network errors (edge case L-7)
    if (err.cause?.code === "ENOTFOUND" || err.cause?.code === "ECONNREFUSED") {
      throw new Error("Cannot reach Groq API — check your internet connection");
    }

    throw err;
  }
}

/**
 * Get AI-powered recommendations from Groq.
 *
 * @param {object} preferences - Cleaned user preferences
 * @param {Array} filteredRestaurants - Pre-filtered restaurant list
 * @returns {{ recommendations: Array, ai_powered: boolean }}
 */
async function getRecommendations(preferences, filteredRestaurants) {
  // Check if API key is configured (edge case L-1)
  if (!isConfigured()) {
    console.warn("   ⚠️ GROQ_API_KEY not configured — returning filtered results without AI");
    return {
      recommendations: buildFallbackRecommendations(filteredRestaurants),
      ai_powered: false,
    };
  }

  try {
    console.log("   🤖 Calling Groq API for AI recommendations...");

    // Build prompt
    const { systemMessage, userMessage } = buildPrompt(
      preferences,
      filteredRestaurants
    );

    // Call Groq API
    const responseText = await callGroqAPI(systemMessage, userMessage);

    // Parse response
    let rawRecommendations;
    try {
      rawRecommendations = extractJSON(responseText);
    } catch (parseErr) {
      // Retry once on parse failure (edge case L-9)
      console.warn(`   ⚠️ JSON parse failed: ${parseErr.message}. Retrying...`);
      const retryText = await callGroqAPI(systemMessage, userMessage, 1);
      rawRecommendations = extractJSON(retryText);
    }

    // Handle empty array (edge case L-18)
    if (!Array.isArray(rawRecommendations) || rawRecommendations.length === 0) {
      console.warn("   ⚠️ LLM returned empty recommendations — using fallback");
      return {
        recommendations: buildFallbackRecommendations(filteredRestaurants),
        ai_powered: false,
      };
    }

    // Validate and normalize each recommendation
    let recommendations = rawRecommendations
      .map((rec) => validateRecommendation(rec, filteredRestaurants))
      .filter((rec) => rec !== null);

    // Deduplicate (edge case L-15)
    const seen = new Set();
    recommendations = recommendations.filter((rec) => {
      const key = rec.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Cap at 5 (edge case L-12)
    recommendations = recommendations.slice(0, 5);

    // Re-number ranks
    recommendations = recommendations.map((rec, idx) => ({
      ...rec,
      rank: idx + 1,
    }));

    if (recommendations.length === 0) {
      console.warn("   ⚠️ All LLM recommendations were invalid — using fallback");
      return {
        recommendations: buildFallbackRecommendations(filteredRestaurants),
        ai_powered: false,
      };
    }

    console.log(`   ✅ Received ${recommendations.length} AI-ranked recommendations`);

    return {
      recommendations,
      ai_powered: true,
    };
  } catch (err) {
    // Fallback on any error (edge cases L-2 through L-7)
    console.error(`   ❌ Groq API error: ${err.message} — using fallback`);
    return {
      recommendations: buildFallbackRecommendations(filteredRestaurants),
      ai_powered: false,
    };
  }
}

/**
 * Build fallback recommendations from filtered data (no AI explanations).
 * Used when Groq API is unavailable or returns invalid data.
 *
 * @param {Array} filteredRestaurants - Pre-filtered restaurant list
 * @returns {Array} Formatted recommendations (max 5)
 */
function buildFallbackRecommendations(filteredRestaurants) {
  return filteredRestaurants.slice(0, 5).map((r, idx) => ({
    rank: idx + 1,
    name: r.name,
    cuisine: r.cuisines_string,
    rating: r.rating,
    estimated_cost: r.cost,
    explanation: `Rated ${r.rating}/5 with ${r.votes} votes. ${r.rest_type || "Restaurant"} offering ${r.cuisines_string}.`,
    location: r.location,
    address: r.address,
    online_order: r.online_order,
    book_table: r.book_table,
    rest_type: r.rest_type,
    votes: r.votes,
  }));
}

module.exports = { getRecommendations, isConfigured };
