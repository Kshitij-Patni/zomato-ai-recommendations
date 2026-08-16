/**
 * generateParquet.js — Convert zomato.json to zomato.parquet
 *
 * Outputs a Parquet file of the cleaned restaurant dataset
 * for analytics, data science, or BI tool consumption.
 */

const fs = require("fs");
const path = require("path");
const parquet = require("parquetjs-lite");

const DATA_DIR = path.join(__dirname, "..", "data");
const JSON_FILE = path.join(DATA_DIR, "zomato.json");
const PARQUET_FILE = path.join(DATA_DIR, "zomato.parquet");

// Define the Parquet schema matching our cleaned data
const schema = new parquet.ParquetSchema({
  name:            { type: "UTF8" },
  city:            { type: "UTF8" },
  area:            { type: "UTF8" },
  zone:            { type: "UTF8" },
  address:         { type: "UTF8" },
  cuisines_string: { type: "UTF8" },
  cost:            { type: "INT32" },
  budget_tier:     { type: "UTF8" },
  rating:          { type: "DOUBLE" },
  votes:           { type: "INT32" },
  online_order:    { type: "BOOLEAN" },
  book_table:      { type: "BOOLEAN" },
  rest_type:       { type: "UTF8" },
  dish_liked:      { type: "UTF8" },
  url:             { type: "UTF8" },
});

async function generateParquet() {
  console.log("📂 Reading zomato.json...");

  if (!fs.existsSync(JSON_FILE)) {
    console.error("❌ zomato.json not found. Run the data loader first: npm run load-data");
    process.exit(1);
  }

  const records = JSON.parse(fs.readFileSync(JSON_FILE, "utf-8"));
  console.log(`   Loaded ${records.length} records`);

  console.log("📝 Writing Parquet file...");
  const writer = await parquet.ParquetWriter.openFile(schema, PARQUET_FILE);

  let written = 0;
  for (const record of records) {
    await writer.appendRow({
      name:            record.name || "",
      city:            "Bangalore",
      area:            record.location || "",
      zone:            record.listed_in_city || "",
      address:         record.address || "",
      cuisines_string: record.cuisines_string || "",
      cost:            record.cost || 0,
      budget_tier:     record.budget_tier || "Low",
      rating:          record.rating || 0,
      votes:           record.votes || 0,
      online_order:    !!record.online_order,
      book_table:      !!record.book_table,
      rest_type:       record.rest_type || "",
      dish_liked:      record.dish_liked || "",
      url:             record.url || "",
    });
    written++;

    if (written % 5000 === 0) {
      console.log(`   📥 Written ${written} / ${records.length} rows...`);
    }
  }

  await writer.close();

  const sizeMB = (fs.statSync(PARQUET_FILE).size / (1024 * 1024)).toFixed(2);
  console.log(`\n✅ Parquet file generated: ${PARQUET_FILE}`);
  console.log(`   Records: ${written}`);
  console.log(`   Size: ${sizeMB} MB`);
}

generateParquet().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
