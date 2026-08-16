/**
 * validators.js — Input sanitization & validation for /api/recommend
 *
 * Validates user preferences against the rules defined in
 * implementation-plan.md §2.2 and edge-cases.md §2.
 */

// Allowed budget values (lowercased)
const VALID_BUDGETS = ["low", "medium", "high"];

// Limits
const MAX_LOCATION_LENGTH = 100;
const MAX_CUISINE_LENGTH = 100;
const MAX_PREFERENCES_LENGTH = 300;

/**
 * Strip HTML tags from a string (defense against XSS — edge case I-17)
 */
function stripHTML(str) {
  return str.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize a string field: trim, strip HTML, remove control characters.
 */
function sanitize(str) {
  if (typeof str !== "string") return str;
  return stripHTML(str)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "") // strip control chars (edge case S-6)
    .replace(/\r\n/g, " ")
    .replace(/\r/g, " ")
    .trim();
}

/**
 * Validate the recommendation request body.
 *
 * @param {object} body - The parsed JSON body from the request
 * @returns {{ valid: boolean, errors: string[], cleaned: object }}
 */
function validateRecommendRequest(body) {
  const errors = [];

  // Guard: body must be an object (edge case I-6, I-7)
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      valid: false,
      errors: ["Request body must be a valid JSON object"],
      cleaned: null,
    };
  }

  // ── Location (required) ──────────────────────────────────────────
  let location = body.location;
  if (location === undefined || location === null || String(location).trim() === "") {
    errors.push("Location is required");
  } else if (typeof location !== "string") {
    errors.push("Location must be a string"); // edge case I-12
  } else {
    location = sanitize(location);
    if (location.length > MAX_LOCATION_LENGTH) {
      errors.push(`Location must be ${MAX_LOCATION_LENGTH} characters or fewer`); // edge case I-15
    }
  }

  // ── Budget (required) ────────────────────────────────────────────
  let budget = body.budget;
  if (budget === undefined || budget === null || String(budget).trim() === "") {
    errors.push("Budget is required");
  } else if (typeof budget !== "string") {
    errors.push("Budget must be a string");
  } else {
    budget = sanitize(budget).toLowerCase();
    if (!VALID_BUDGETS.includes(budget)) {
      errors.push(`Budget must be one of: ${VALID_BUDGETS.join(", ")}`); // edge case I-8
    }
  }

  // ── Cuisine (optional — empty means "all cuisines") ─────────────
  let cuisine = body.cuisine;
  if (cuisine === undefined || cuisine === null || String(cuisine).trim() === "") {
    cuisine = ""; // all cuisines
  } else if (typeof cuisine !== "string") {
    errors.push("Cuisine must be a string");
  } else {
    cuisine = sanitize(cuisine);
    if (cuisine.length > MAX_CUISINE_LENGTH) {
      errors.push(`Cuisine must be ${MAX_CUISINE_LENGTH} characters or fewer`);
    }
  }

  // ── Min Rating (optional, default 0) ────────────────────────────
  let min_rating = body.min_rating;
  if (min_rating === undefined || min_rating === null || min_rating === "") {
    min_rating = 0; // edge case I-4
  } else {
    min_rating = parseFloat(min_rating); // handles string numbers (edge case I-11)
    if (isNaN(min_rating)) {
      errors.push("Min rating must be a number"); // edge case I-11
    } else if (min_rating < 0) {
      errors.push("Min rating must be between 0 and 5"); // edge case I-9
    } else if (min_rating > 5) {
      errors.push("Min rating must be between 0 and 5"); // edge case I-10
    }
  }

  // ── Additional Preferences (optional, default "") ───────────────
  let additional_preferences = body.additional_preferences;
  if (
    additional_preferences === undefined ||
    additional_preferences === null
  ) {
    additional_preferences = ""; // edge case I-5
  } else if (typeof additional_preferences !== "string") {
    errors.push("Additional preferences must be a string");
  } else {
    additional_preferences = sanitize(additional_preferences);
    if (additional_preferences.length > MAX_PREFERENCES_LENGTH) {
      errors.push(
        `Additional preferences must be ${MAX_PREFERENCES_LENGTH} characters or fewer`
      ); // edge case I-16
    }
  }

  // ── Build cleaned object ─────────────────────────────────────────
  if (errors.length > 0) {
    return { valid: false, errors, cleaned: null };
  }

  return {
    valid: true,
    errors: [],
    cleaned: {
      location: location.toLowerCase(),
      budget: budget.toLowerCase(),
      cuisine,
      min_rating,
      additional_preferences,
    },
  };
}

module.exports = { validateRecommendRequest, sanitize, stripHTML };
