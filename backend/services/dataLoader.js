/**
 * dataLoader.js — Fetches, cleans, and caches the Zomato restaurant dataset.
 *
 * Data source: https://huggingface.co/datasets/ManikaSaini/zomato-restaurant-recommendation
 *
 * Processing pipeline:
 *   1. Download rows from Hugging Face Datasets Server API
 *   2. Clean & normalize fields (trim, lowercase locations, parse ratings)
 *   3. Map cost to budget tiers: Low (≤₹500), Medium (₹500–₹1500), High (>₹1500)
 *   4. Parse cuisines from comma-separated string to array
 *   5. Deduplicate by name + location
 *   6. Write to backend/data/zomato.json
 *   7. Expose in-memory store indexed by location
 */

const fs = require("fs");
const path = require("path");

// ── Constants ──────────────────────────────────────────────────────────
const DATASET_ID = "ManikaSaini/zomato-restaurant-recommendation";
const HF_API_BASE = "https://datasets-server.huggingface.co";
const DATA_DIR = path.join(__dirname, "..", "data");
const CACHE_FILE = path.join(DATA_DIR, "zomato.json");
const BATCH_SIZE = 1000; // rows per API request
const BUDGET_TIERS = {
  LOW: { label: "Low", max: 500 },
  MEDIUM: { label: "Medium", max: 1500 },
  HIGH: { label: "High", max: Infinity },
};

// City aliases for common alternate spellings
const CITY_ALIASES = {
  bengaluru: "bangalore",
  bombay: "mumbai",
  madras: "chennai",
  calcutta: "kolkata",
};

// ── In-memory store ────────────────────────────────────────────────────
let restaurantStore = {
  allRecords: [],
  byLocation: {},       // keyed by lowercase location
  locations: [],         // unique location list
  cuisines: [],          // unique cuisine list
  totalRecords: 0,
};

// ── Helper: Parse rating string ────────────────────────────────────────
function parseRating(rateStr) {
  if (!rateStr || typeof rateStr !== "string") return 0;

  // Handle formats like "4.1/5", "4.1", "NEW", "-"
  const cleaned = rateStr.trim().toLowerCase();
  if (cleaned === "new" || cleaned === "-" || cleaned === "") return 0;

  const match = cleaned.match(/([\d.]+)/);
  if (match) {
    const rating = parseFloat(match[1]);
    return isNaN(rating) ? 0 : Math.min(rating, 5);
  }
  return 0;
}

// ── Helper: Parse cost string ──────────────────────────────────────────
function parseCost(costStr) {
  if (costStr === null || costStr === undefined) return 0;

  const cleaned = String(costStr).replace(/[₹,\s]/g, "").trim();
  const cost = parseInt(cleaned, 10);
  return isNaN(cost) || cost < 0 ? 0 : cost;
}

// ── Helper: Get budget tier ────────────────────────────────────────────
function getBudgetTier(cost) {
  if (cost <= BUDGET_TIERS.LOW.max) return "Low";
  if (cost <= BUDGET_TIERS.MEDIUM.max) return "Medium";
  return "High";
}

// ── Helper: Parse cuisines string ──────────────────────────────────────
function parseCuisines(cuisineStr) {
  if (!cuisineStr || typeof cuisineStr !== "string") return ["Unknown"];

  // Normalize delimiters: ; / & → ,
  const normalized = cuisineStr.replace(/[;/]|\s&\s/g, ",");

  const cuisines = normalized
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  return cuisines.length > 0 ? cuisines : ["Unknown"];
}

// ── Helper: Normalize location ─────────────────────────────────────────
function normalizeLocation(location) {
  if (!location || typeof location !== "string") return "unknown";
  const lower = location.trim().toLowerCase();
  return CITY_ALIASES[lower] || lower;
}

// ── Helper: Clean a single raw record ──────────────────────────────────
function cleanRecord(raw) {
  const name = (raw.name || "").trim();
  if (!name) return null; // Skip records with no name (edge case D-6)

  const location = normalizeLocation(raw.location);
  const listedInCity = (raw["listed_in(city)"] || "").trim().toLowerCase();
  const cost = parseCost(raw["approx_cost(for two people)"]);
  const rating = parseRating(raw.rate);
  const votes = Math.max(0, parseInt(raw.votes, 10) || 0);

  return {
    name,
    location,
    listed_in_city: listedInCity,
    address: (raw.address || "").trim(),
    cuisines: parseCuisines(raw.cuisines),
    cuisines_string: (raw.cuisines || "Unknown").trim(),
    cost,
    budget_tier: getBudgetTier(cost),
    rating,
    votes,
    online_order: (raw.online_order || "").trim().toLowerCase() === "yes",
    book_table: (raw.book_table || "").trim().toLowerCase() === "yes",
    rest_type: (raw.rest_type || "").trim(),
    dish_liked: (raw.dish_liked || "").trim(),
    url: (raw.url || "").trim(),
  };
}

// ── Helper: Deduplicate records ────────────────────────────────────────
function deduplicateRecords(records) {
  const seen = new Set();
  return records.filter((r) => {
    const key = `${r.name.toLowerCase()}__${r.location}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Simple CSV line parser (handles quoted fields with commas) ──────────
function parseCSVLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote inside quoted field
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

// ── Fetch dataset from Hugging Face (direct CSV download) ──────────────
async function fetchFromHuggingFace() {
  console.log("📡 Downloading CSV from Hugging Face...");

  const csvUrl = `https://huggingface.co/datasets/${DATASET_ID}/resolve/main/zomato.csv`;
  const res = await fetch(csvUrl, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Failed to download CSV: ${res.status} ${res.statusText}`);
  }

  console.log("   ⬇️  Download started — streaming and parsing...");

  // Stream the response body and parse line by line
  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let buffer = "";
  let headers = null;
  const allRows = [];
  let lineCount = 0;

  // Columns we care about (skip reviews_list and menu_item — they're huge)
  const KEEP_COLUMNS = new Set([
    "name", "address", "online_order", "book_table", "rate",
    "votes", "location", "rest_type", "dish_liked", "cuisines",
    "approx_cost(for two people)", "listed_in(type)", "listed_in(city)", "url"
  ]);

  // Track quote state across chunks — reviews_list contains newlines inside quotes
  let pendingRecord = "";

  function countQuotes(str) {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '"') count++;
    }
    return count;
  }

  function processCompleteRecord(record) {
    const trimmed = record.replace(/\r$/, "");
    if (!trimmed) return;

    if (!headers) {
      headers = parseCSVLine(trimmed);
      console.log(`   📋 CSV columns: ${headers.length} (${headers.slice(0, 5).join(", ")}...)`);
      return;
    }

    const fields = parseCSVLine(trimmed);
    if (fields.length !== headers.length) return; // skip malformed

    const row = {};
    for (let i = 0; i < headers.length; i++) {
      if (KEEP_COLUMNS.has(headers[i])) {
        row[headers[i]] = fields[i];
      }
    }
    allRows.push(row);
    lineCount++;

    if (lineCount % 10000 === 0) {
      console.log(`   📥 Parsed ${lineCount} rows...`);
    }
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep incomplete last line

    for (const line of lines) {
      pendingRecord += (pendingRecord ? "\n" : "") + line;

      // A complete CSV record has an even number of unescaped quotes
      if (countQuotes(pendingRecord) % 2 === 0) {
        processCompleteRecord(pendingRecord);
        pendingRecord = "";
      }
    }
  }

  // Handle remaining buffer
  if (buffer) {
    pendingRecord += (pendingRecord ? "\n" : "") + buffer;
  }
  if (pendingRecord.trim()) {
    processCompleteRecord(pendingRecord);
  }

  console.log(`   ✅ Downloaded and parsed ${allRows.length} raw records`);
  return allRows;
}

// ── Process raw records ────────────────────────────────────────────────
function processRecords(rawRecords) {
  console.log("🧹 Cleaning and normalizing records...");

  // Clean each record
  let records = rawRecords
    .map(cleanRecord)
    .filter((r) => r !== null);

  console.log(`   Records after cleaning: ${records.length}`);

  // Deduplicate
  records = deduplicateRecords(records);
  console.log(`   Records after deduplication: ${records.length}`);

  return records;
}

// ── Build in-memory index ──────────────────────────────────────────────
function buildIndex(records) {
  console.log("📇 Building in-memory index...");

  const byLocation = {};
  const locationSet = new Set();
  const cuisineSet = new Set();

  for (const record of records) {
    // Index by location
    const loc = record.location;
    if (!byLocation[loc]) {
      byLocation[loc] = [];
    }
    byLocation[loc].push(record);
    locationSet.add(loc);

    // Also index by listed_in_city if different
    if (record.listed_in_city && record.listed_in_city !== loc) {
      const city = record.listed_in_city;
      if (!byLocation[city]) {
        byLocation[city] = [];
      }
      byLocation[city].push(record);
      locationSet.add(city);
    }

    // Collect unique cuisines
    for (const cuisine of record.cuisines) {
      cuisineSet.add(cuisine);
    }
  }

  const locations = Array.from(locationSet).sort();
  const cuisines = Array.from(cuisineSet).sort();

  console.log(`   Indexed ${locations.length} unique locations`);
  console.log(`   Found ${cuisines.length} unique cuisines`);

  return { allRecords: records, byLocation, locations, cuisines, totalRecords: records.length };
}

// ── Save to cache file ─────────────────────────────────────────────────
function saveToCache(records) {
  // Ensure data directory exists (edge case E-4)
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify(records, null, 2), "utf-8");
  const sizeMB = (fs.statSync(CACHE_FILE).size / (1024 * 1024)).toFixed(2);
  console.log(`💾 Saved ${records.length} records to ${CACHE_FILE} (${sizeMB} MB)`);
}

// ── Load from cache file ───────────────────────────────────────────────
function loadFromCache() {
  if (!fs.existsSync(CACHE_FILE)) {
    return null;
  }

  console.log("📂 Loading from cached file...");
  const raw = fs.readFileSync(CACHE_FILE, "utf-8");
  const records = JSON.parse(raw);

  if (!Array.isArray(records) || records.length === 0) {
    console.warn("⚠️  Cache file is empty or invalid. Will re-download.");
    return null;
  }

  console.log(`   Loaded ${records.length} records from cache`);
  return records;
}

// ── Main: Load data (fetch or cache) ───────────────────────────────────
async function loadData() {
  // Try loading from cache first
  let records = loadFromCache();

  if (!records) {
    try {
      const rawRecords = await fetchFromHuggingFace();
      records = processRecords(rawRecords);
      saveToCache(records);
    } catch (err) {
      console.error("❌ Failed to fetch dataset from Hugging Face:", err.message);

      // If cache exists but was invalid, we already returned null above
      // No recovery possible — throw
      throw new Error(
        "Dataset unavailable — cannot start server. " +
        "Check your internet connection or provide a cached zomato.json file."
      );
    }
  }

  // Validate minimum data (edge case D-4)
  if (records.length === 0) {
    throw new Error("Dataset loaded but contains 0 records. Cannot start server.");
  }

  // Build in-memory index
  restaurantStore = buildIndex(records);

  // Log a sample record
  console.log("\n📋 Sample record:");
  console.log(JSON.stringify(records[0], null, 2));

  console.log(`\n✅ Data layer ready — ${restaurantStore.totalRecords} restaurants loaded\n`);

  return restaurantStore;
}

// ── Getters for other modules ──────────────────────────────────────────
function getStore() {
  return restaurantStore;
}

function getLocations() {
  return restaurantStore.locations;
}

function getCuisines() {
  return restaurantStore.cuisines;
}

// ── Run directly for testing ───────────────────────────────────────────
if (require.main === module) {
  console.log("=".repeat(60));
  console.log("  Zomato Dataset Loader — Standalone Test Run");
  console.log("=".repeat(60));
  console.log();

  loadData()
    .then((store) => {
      console.log("─".repeat(60));
      console.log(`Total records:      ${store.totalRecords}`);
      console.log(`Unique locations:   ${store.locations.length}`);
      console.log(`Unique cuisines:    ${store.cuisines.length}`);
      console.log("─".repeat(60));
      console.log("\nTop 5 locations by restaurant count:");
      const sorted = Object.entries(store.byLocation)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 5);
      for (const [loc, recs] of sorted) {
        console.log(`  ${loc}: ${recs.length} restaurants`);
      }
      console.log("\nFirst 10 cuisines:", store.cuisines.slice(0, 10).join(", "));
    })
    .catch((err) => {
      console.error("\n❌ Fatal error:", err.message);
      process.exit(1);
    });
}

module.exports = { loadData, getStore, getLocations, getCuisines };
