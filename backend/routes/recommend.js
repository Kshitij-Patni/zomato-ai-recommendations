/**
 * recommend.js — POST /api/recommend route handler
 *
 * Flow: Validate → Filter → LLM rank (Groq) → Respond
 * Falls back to filtered-only results if Groq is unavailable.
 */

const express = require("express");
const router = express.Router();
const { validateRecommendRequest } = require("../utils/validators");
const {
  filterRestaurants,
  getAvailableLocations,
} = require("../services/filterEngine");
const { getRecommendations } = require("../services/llmClient");

/**
 * POST /api/recommend
 *
 * Request body:
 *   { location, budget, cuisine, min_rating?, additional_preferences? }
 *
 * Response (success):
 *   { success: true, count, ai_powered, recommendations: [...], filters: {...} }
 *
 * Response (error):
 *   { success: false, error: string, errors?: string[] }
 */
router.post("/", async (req, res) => {
  try {
    // Step 1: Validate input
    const { valid, errors, cleaned } = validateRecommendRequest(req.body);

    if (!valid) {
      return res.status(400).json({
        success: false,
        error: errors.length === 1 ? errors[0] : "Validation failed",
        errors,
      });
    }

    // Step 2: Filter dataset
    const { results, totalMatches, appliedFilters } = filterRestaurants(cleaned);

    // Edge case F-1: No matching restaurants
    if (results.length === 0) {
      const suggestedLocations = getAvailableLocations();
      return res.status(400).json({
        success: false,
        error:
          "No restaurants match your criteria. Try a different location, broader budget, or different cuisine.",
        suggestions: {
          available_locations: suggestedLocations,
        },
        filters: appliedFilters,
      });
    }

    // Step 3: Get AI-powered recommendations (or fallback)
    const { recommendations, ai_powered } = await getRecommendations(
      cleaned,
      results
    );

    return res.json({
      success: true,
      count: recommendations.length,
      total_matches: totalMatches,
      ai_powered,
      recommendations,
      filters: appliedFilters,
    });
  } catch (err) {
    console.error("Route error:", err.message);
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred. Please try again.",
    });
  }
});

module.exports = router;
