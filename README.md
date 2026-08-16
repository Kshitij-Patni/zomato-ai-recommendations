# 🍽️ AI-Powered Restaurant Recommendation System

An intelligent restaurant recommendation service inspired by Zomato. It combines a real-world restaurant dataset with an LLM (via Groq) to deliver personalized, AI-explained recommendations.

## Features

- 🔍 **Smart Filtering** — Filter by location, budget, cuisine, and minimum rating
- 🤖 **AI-Powered Rankings** — Groq's LLM ranks and explains why each restaurant is a great match
- 🎨 **Premium UI** — Dark-themed glassmorphism design with smooth animations
- ⚡ **Fast** — Pre-filtered data keeps LLM prompts lean; Groq provides ultra-fast inference

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML + Vanilla CSS + JavaScript |
| Backend | Node.js + Express |
| Dataset | [Zomato Restaurant Recommendation (Hugging Face)](https://huggingface.co/datasets/ManikaSaini/zomato-restaurant-recommendation) |
| LLM | Groq API (`llama-3.3-70b-versatile`) |

## Quick Start

### Prerequisites

- **Node.js** v18+
- **Groq API Key** — get one at [console.groq.com](https://console.groq.com)

### Setup

```bash
# 1. Clone and enter the project
cd "Zomato Project"

# 2. Install backend dependencies
cd backend
npm install

# 3. Add your Groq API key
#    Edit backend/.env and replace the placeholder:
#    GROQ_API_KEY=your_actual_key_here

# 4. Download and cache the dataset (first run only)
node services/dataLoader.js

# 5. Start the server
npm start
```

The app will be available at **http://localhost:3000**.

## Project Structure

```
Zomato Project/
├── context.md                  # Project context
├── architecture.md             # System architecture
├── implementation-plan.md      # Phase-wise build plan
├── edge-cases.md               # Corner scenario documentation
├── frontend/
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── app.js
│       ├── ui.js
│       └── api.js
├── backend/
│   ├── server.js
│   ├── routes/recommend.js
│   ├── services/
│   │   ├── dataLoader.js
│   │   ├── filterEngine.js
│   │   ├── promptBuilder.js
│   │   └── llmClient.js
│   ├── utils/validators.js
│   ├── data/zomato.json        # Auto-generated dataset cache
│   ├── .env                    # API keys (not committed)
│   └── package.json
└── README.md
```

## API

### `POST /api/recommend`

**Request:**

```json
{
  "location": "Banashankari",
  "budget": "medium",
  "cuisine": "Italian",
  "min_rating": 3.5,
  "additional_preferences": "family-friendly"
}
```

**Response:**

```json
{
  "success": true,
  "count": 5,
  "recommendations": [
    {
      "rank": 1,
      "name": "Onesta",
      "cuisine": "Pizza, Cafe, Italian",
      "rating": 4.6,
      "estimated_cost": 600,
      "explanation": "Excellent fit — highly rated Italian/pizza cafe with outdoor rooftop seating, perfect for families."
    }
  ]
}
```

## Documentation

- [context.md](context.md) — Problem statement and objectives
- [architecture.md](architecture.md) — System design and data flow
- [implementation-plan.md](implementation-plan.md) — Phase-wise build plan
- [edge-cases.md](edge-cases.md) — 104 documented corner scenarios

---

> Built with ❤️ using Node.js, Groq, and the Zomato dataset from Hugging Face.
