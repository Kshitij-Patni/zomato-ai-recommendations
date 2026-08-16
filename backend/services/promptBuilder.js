/**
 * promptBuilder.js — Constructs structured prompts for the LLM.
 *
 * Takes user preferences + filtered restaurant data and assembles
 * a prompt that instructs the LLM to rank and explain recommendations.
 *
 * Template based on architecture.md §2.5.
 */

/**
 * Format a single restaurant into a concise summary for the prompt.
 */
function formatRestaurant(restaurant, index) {
  return [
    `${index + 1}. ${restaurant.name}`,
    `   Cuisine: ${restaurant.cuisines_string}`,
    `   Rating: ${restaurant.rating}/5 (${restaurant.votes} votes)`,
    `   Cost for two: ₹${restaurant.cost}`,
    `   Location: ${restaurant.location}`,
    `   Type: ${restaurant.rest_type || "N/A"}`,
    `   Online Order: ${restaurant.online_order ? "Yes" : "No"}`,
    `   Table Booking: ${restaurant.book_table ? "Yes" : "No"}`,
    restaurant.dish_liked ? `   Popular Dishes: ${restaurant.dish_liked}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Format the full restaurant list for embedding in the prompt.
 */
function formatRestaurantList(restaurants) {
  return restaurants.map((r, i) => formatRestaurant(r, i)).join("\n\n");
}

/**
 * Build the system message for the LLM.
 */
function buildSystemMessage() {
  return `You are an expert restaurant recommendation assistant. You analyze restaurant data and user preferences to provide personalized, well-reasoned dining recommendations.

Your responses must ALWAYS be valid JSON arrays. Do not include any text before or after the JSON array. Do not wrap it in markdown code fences.`;
}

/**
 * Build the user message with preferences and restaurant data.
 *
 * @param {object} preferences - Cleaned user preferences
 * @param {Array} restaurants - Filtered restaurant list (max 15)
 * @returns {string} The assembled prompt string
 */
function buildUserMessage(preferences, restaurants) {
  const { location, budget, cuisine, min_rating, additional_preferences } =
    preferences;

  const formattedList = formatRestaurantList(restaurants);

  let prompt = `A user is looking for restaurants with the following preferences:
- Location: ${location}
- Budget: ${budget}
- Cuisine: ${cuisine}
- Minimum Rating: ${min_rating}/5`;

  if (additional_preferences && additional_preferences.trim()) {
    // Wrap user input in delimiters to mitigate prompt injection (edge case S-1)
    prompt += `\n- Additional Preferences: """${additional_preferences}"""`;
  }

  prompt += `

Here are the top ${restaurants.length} candidate restaurants that match their criteria:

${formattedList}

Based on the user's preferences, please:
1. You MUST rank ALL ${Math.min(restaurants.length, 5)} restaurants from best to worst fit. Do NOT skip any candidate.
2. For each restaurant, explain WHY it is a good match in 1-2 sentences.
3. Mention any trade-offs (e.g., higher cost but exceptional rating).

IMPORTANT: Include every candidate restaurant in your ranking (up to 5). Do not omit any.

Respond with ONLY a valid JSON array in this exact format:
[
  {
    "rank": 1,
    "name": "Restaurant Name",
    "cuisine": "Cuisine Types",
    "rating": 4.5,
    "estimated_cost": 800,
    "explanation": "Why this restaurant is recommended..."
  }
]`;

  return prompt;
}

/**
 * Build the complete prompt (system + user messages) for the Groq API.
 *
 * @param {object} preferences - Cleaned user preferences
 * @param {Array} restaurants - Filtered restaurant list
 * @returns {{ systemMessage: string, userMessage: string }}
 */
function buildPrompt(preferences, restaurants) {
  return {
    systemMessage: buildSystemMessage(),
    userMessage: buildUserMessage(preferences, restaurants),
  };
}

module.exports = { buildPrompt, buildSystemMessage, buildUserMessage };
