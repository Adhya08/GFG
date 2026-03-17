# DashTalk — Conversational YouTube Analytics & AI BI Platform

DashTalk is an AI-powered Business Intelligence platform that enables users to generate dashboards, analytics, and insights through natural language conversation.

Built for non-technical users, DashTalk transforms plain English queries into SQL, visualizations, predictive analytics, and business-ready reports — instantly.

---

# 🚀 Overview

Traditional BI tools require SQL knowledge, dashboard design expertise, and significant time to generate insights.

DashTalk solves this by enabling:

* Conversational analytics through text or voice
* Automatic SQL generation using Gemini API
* Instant chart creation
* AI-generated insights
* Root cause exploration
* Predictive analytics
* Exportable reports

The goal is simple:

**Ask questions like you speak. Get dashboards instantly.**

---

# 🌟 Core Features

## 🗣️ Conversational Analytics

* Natural language querying using plain English
* Voice-enabled interaction using speech-to-text
* Gemini-powered query interpretation
* SQL generated automatically from user intent

### Example Queries

* Show views growth in last 30 days
* Compare monetized vs non-monetized videos
* Which upload time gives highest engagement?
* Why did watch time drop last week?

---

## 📊 Intelligent Dashboard Generation

DashTalk automatically chooses the best visualization depending on returned data.

Supported chart types:

* Line Charts
* Bar Charts
* Pie Charts
* Scatter Plots
* Heatmaps

### Automatic Chart Selection Logic

| Data Pattern        | Visualization |
| ------------------- | ------------- |
| Time series         | Line Chart    |
| Category comparison | Bar Chart     |
| Percentage split    | Pie Chart     |
| Correlation         | Scatter Plot  |
| Density trends      | Heatmap       |

---

## 🧠 AI Exploration Engine

After each dashboard result, DashTalk suggests intelligent follow-up questions.

Examples:

* Want to compare with previous month?
* Break this down by video category?
* Detect anomaly causes?

This creates a **chat-with-your-dashboard experience**.

---

## 🔍 Root Cause Analysis

Users can investigate trends through:

* Drill-down filters
* Segment comparison
* Time slicing
* Category-level analysis

---

## 📂 Dataset Intelligence

When CSV is uploaded, DashTalk automatically profiles:

* Total rows
* Total columns
* Missing values
* Duplicate records
* Data type distribution
* Suggested business questions

---

## ⚡ Data Quality Validation

Built-in checks include:

* Null detection
* Duplicate row detection
* Invalid schema warning
* Outlier indication

---

## 📈 Predictive Analytics

Forecast future trends such as:

* Views growth
* Revenue trend
* Subscriber movement
* Watch time projections

---

## 🧾 AI Insights Engine

Narrative summaries generated automatically:

Example:

> Revenue increased by 18% due to improved CTR in monetized videos uploaded during evening hours.

---

## 📤 Export Features

* Export dashboard as PDF
* Export filtered data as CSV
* Share business-ready reports

---

# 🛠️ Tech Stack

| Layer     | Technology                    |
| --------- | ----------------------------- |
| Frontend  | React.js, Next.js, TypeScript |
| Backend   | Node.js / Go                  |
| AI Engine | Gemini API                    |
| Database  | MySql                         |
| Charts    | Plotly.js, Chart.js           |
| Security  | JWT, RBAC, Encryption         |

---

# 🏗️ System Architecture

```plaintext
User Query
   ↓
Gemini API (Intent → SQL)
   ↓
Backend Query Engine
   ↓
PostgreSQL
   ↓
Chart Generator
   ↓
AI Insight Layer
   ↓
Dashboard Response
```

---

# 📂 Project Structure

```plaintext
dashtalk/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI components
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # API clients and helpers
│   ├── pages/               # Routes
│   ├── styles/              # Global styles
│   └── types/               # TypeScript types
├── .env.example
├── package.json
└── README.md
```

---

# ⚙️ Installation

## Prerequisites

* Node.js v18+
* PostgreSQL
* Gemini API Key

---

## Clone Repository

```bash
git clone https://github.com/your-username/dashtalk.git
cd dashtalk
```

---

## Install Dependencies

```bash
npm install
```

---

## Environment Variables

Create `.env.local`

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/dashtalk
JWT_SECRET=your_secret_here
```

---

## Database Setup

```bash
npm run db:setup
```

---

## Run Development Server

```bash
npm run dev
```

Open:

```plaintext
http://localhost:3000
```

---

# 🧪 Supported Dataset Scale

Optimized for:

* 10 lakh+ rows
* Fast aggregation
* Indexed querying
* Cached dashboard rendering

---

# 🎯 Success Metrics

| Metric               | Target        |
| -------------------- | ------------- |
| Dashboard Generation | < 5 sec       |
| SQL Accuracy         | 90%+          |
| Scale                | 10 lakh+ rows |
| AI Response Latency  | < 2 sec       |

---

# 🔐 Security

* JWT Authentication
* Role-Based Access Control
* Query validation
* SQL injection prevention
* Encrypted credentials

---

# 🚀 Future Roadmap

* Multi-dataset joins
* Voice dashboard assistant
* Real-time YouTube API sync
* Team collaboration
* Scheduled reports
* Alert engine

---

# 💡 Ideal Use Cases

* YouTube creators
* Marketing teams
* Business analysts
* Non-technical decision makers

---

# 🏆 Why DashTalk Matters

DashTalk removes the technical barrier between data and decisions.

Instead of learning SQL, users simply ask questions.

---

# 🤝 Contribution

Contributions are welcome.

Steps:

1. Fork repo
2. Create feature branch
3. Commit changes
4. Open pull request

---

# 📄 License

MIT License

---

# 👨‍💻 Built For

AI-first analytics
Conversational dashboards
Modern business intelligence
