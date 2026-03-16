import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import db from "@/lib/db";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set in the environment variables." },
        { status: 500 }
      );
    }

    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // 1. Prompt Gemini to generate SQL and chart configuration
    const prompt = `
You are a sophisticated data analyst assistant. 
We have a SQLite database table named \`youtube_analytics\` with the following schema:
- id INTEGER PRIMARY KEY
- timestamp TEXT (ISO 8601 format like YYYY-MM-DDTHH:MM:SSZ)
- video_id TEXT
- category TEXT (e.g. Education, Gaming, Vlog, Tech, Comedy)
- language TEXT (e.g. English, Spanish, Hindi, French, German, Japanese, Chinese)
- region TEXT (e.g. US, UK, ES, IN, FR, DE, JP, CN)
- duration_sec INTEGER
- views INTEGER
- likes INTEGER
- comments INTEGER
- shares INTEGER
- sentiment_score REAL (0.0 to 1.0)
- ads_enabled BOOLEAN (1 or 0)

The user asked: "${query}"

Based on the user's natural language request, generate a SQLite query to answer the question.

CRITICAL INSTRUCTION FOR CHART TYPE SELECTION:
You MUST choose the most appropriate Chart.js chart type from this list: 'line', 'bar', 'pie', 'scatter', 'doughnut'.
Do NOT just default to 'bar'. You must choose based on these strict rules:
1. 'line': Use ONLY for Time-series data (e.g., trend over time where X is 'timestamp' or 'date').
2. 'pie' or 'doughnut': Use for proportions, market share, or distribution of parts of a whole (e.g., Views by language, or distribution of video categories).
3. 'scatter': Use ONLY for comparing two numerical/engagement metrics (e.g., likes vs duration, views vs shares) to see correlation.
4. 'bar': Use for comparing distinct categories side-by-side (e.g., average views by category, total likes by region), EXCEPT if 'pie' makes more sense for a percentage breakdown.

Return the result STRICTLY as a JSON object (and nothing else, no markdown) in the following format. Ensure that the JSON is valid and contains NO COMMENTS:
{
  "sql": "SELECT ...",
  "chartType": "<INSERT_CHART_TYPE_HERE>",
  "xAxisLabel": "<Name of the X-axis column>",
  "yAxisLabel": "<Name of the Y-axis column>"
}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    
    // Clean the result text if it contains markdown formatting
    let responseText = result.response.text().trim();
    if (responseText.startsWith("\`\`\`json")) {
      responseText = responseText.replace(/^\`\`\`json/, "").replace(/\`\`\`$/, "").trim();
    } else if (responseText.startsWith("\`\`\`")) {
      responseText = responseText.replace(/^\`\`\`/, "").replace(/\`\`\`$/, "").trim();
    }

    const aiResponse = JSON.parse(responseText);

    // 2. Execute SQL Query
    const stmt = db.prepare(aiResponse.sql);
    let dbData = [];
    try {
        dbData = stmt.all();
    } catch(e: any) {
        return NextResponse.json({ error: "Failed to execute generated SQL: " + e.message, generatedSql: aiResponse.sql }, { status: 400 });
    }

    // 3. Return results
    return NextResponse.json({
      data: dbData,
      sql: aiResponse.sql,
      chartType: aiResponse.chartType,
      xAxisLabel: aiResponse.xAxisLabel,
      yAxisLabel: aiResponse.yAxisLabel,
    });
  } catch (error: any) {
    console.error("Query Error:", error);
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 });
  }
}
