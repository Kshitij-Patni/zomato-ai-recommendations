/**
 * filterEngine.js — Filters the in-memory restaurant dataset by user preferences.
 *
 * Implements the chained filter pipeline from architecture.md §2.4:
 *   Location → Budget → Cuisine → Min Rating → Sort by Rating → Cap at 15
 *
 * All filtering happens BEFORE sending to the LLM to keep prompts concise.
 */

const { getStore } = require("./dataLoader");

// Budget tier cost ranges (matching dataLoader.js tiers)
const BUDGET_RANGES = {
  low: { min: 0, max: 500 },
  medium: { min: 501, max: 1500 },
  high: { min: 1501, max: Infinity },
};

// Maximum results to send to LLM (keeps prompt under token limits)
const MAX_RESULTS = 15;

/**
 * Filter restaurants by user preferences.
 *
 * @param {object} preferences - Cleaned/validated user input
 * @param {string} preferences.location - Lowercase location name
 * @param {string} preferences.budget - "low" | "medium" | "high"
 * @param {string} preferences.cuisine - Cuisine search term
 * @param {number} preferences.min_rating - Minimum rating (0–5)
 * @returns {{ results: Array, totalMatches: number, appliedFilters: object }}
 */
function filterRestaurants(preferences) {
  const { location, budget, cuisine, min_rating } = preferences;
  const store = getStore();

  // Step 1: Filter by location (case-insensitive — already lowercase)
  // Special case: "bangalore" means search the entire city
  let candidates;
  if (location === "bangalore" || location === "bengaluru") {
    candidates = [...store.allRecords];
  } else {
    candidates = store.byLocation[location] || [];
  }

  // If no exact location match, try matching by listed_in_city (entire city search)
  if (candidates.length === 0) {
    const cityMatches = store.allRecords.filter(
      (r) => r.listed_in_city === location
    );
    if (cityMatches.length > 0) {
      candidates = cityMatches;
    }
  }

  // If still no match, try partial matching on location
  if (candidates.length === 0) {
    const partialMatches = [];
    for (const [loc, restaurants] of Object.entries(store.byLocation)) {
      if (loc.includes(location) || location.includes(loc)) {
        partialMatches.push(...restaurants);
      }
    }
    candidates = partialMatches;
  }

  const afterLocation = candidates.length;

  // Step 2: Filter by budget tier
  const budgetRange = BUDGET_RANGES[budget];
  if (budgetRange) {
    candidates = candidates.filter(
      (r) => r.cost >= budgetRange.min && r.cost <= budgetRange.max
    );
  }
  const afterBudget = candidates.length;

  // Step 3: Filter by cuisine (partial match — any cuisine in the restaurant's array)
  const cuisineSearch = cuisine.toLowerCase();
  candidates = candidates.filter((r) =>
    r.cuisines.some((c) => c.toLowerCase().includes(cuisineSearch))
  );
  const afterCuisine = candidates.length;

  // Step 4: Filter by minimum rating
  if (min_rating > 0) {
    candidates = candidates.filter((r) => r.rating >= min_rating);
  }
  const afterRating = candidates.length;

  // Step 5: Sort by rating (descending), then by votes for tie-breaking (edge case F-5)
  candidates.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.votes - a.votes; // secondary sort: more votes wins
  });

  // Step 6: Cap at MAX_RESULTS
  const totalMatches = candidates.length;
  const results = candidates.slice(0, MAX_RESULTS);

  return {
    results,
    totalMatches,
    appliedFilters: {
      location: { matched: afterLocation },
      budget: { matched: afterBudget },
      cuisine: { matched: afterCuisine },
      rating: { matched: afterRating },
      capped: totalMatches > MAX_RESULTS,
    },
  };
}

/**
 * Get available locations for suggestion when user's location has no matches.
 * Returns top 10 locations by restaurant count.
 */
function getAvailableLocations() {
  const store = getStore();
  return Object.entries(store.byLocation)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10)
    .map(([loc]) => loc);
}

/**
 * Get available cuisines for suggestion.
 */
function getAvailableCuisines() {
  const store = getStore();
  return store.cuisines.slice(0, 20);
}

module.exports = { filterRestaurants, getAvailableLocations, getAvailableCuisines };
