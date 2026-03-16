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

If the user's query asks to "predict", "forecast", or estimate future values, set "isPredictive" to true and extract the requested number of periods (default is 7) into "predictionHorizon".

Return the result STRICTLY as a JSON object (and nothing else, no markdown) in the following format. Ensure that the JSON is valid and contains NO COMMENTS:
{
  "sql": "SELECT ...",
  "chartType": "<INSERT_CHART_TYPE_HERE>",
  "xAxisLabel": "<Name of the X-axis column>",
  "yAxisLabel": "<Name of the Y-axis column>",
  "isPredictive": false,
  "predictionHorizon": 7
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
    let dbData: any[] = [];
    try {
        dbData = stmt.all();
    } catch(e: any) {
        return NextResponse.json({ error: "Failed to execute generated SQL: " + e.message, generatedSql: aiResponse.sql }, { status: 400 });
    }

    let isPredictive = aiResponse.isPredictive;
    let horizon = aiResponse.predictionHorizon || 7;
    let forecastError = null;

    if (isPredictive) {
        if (dbData.length < 5) {
            forecastError = "Insufficient data for reliable forecasting. Please upload more historical data.";
            isPredictive = false;
        } else {
            const keys = Object.keys(dbData[0]);
            let dateKey = aiResponse.xAxisLabel;
            let numericKey = aiResponse.yAxisLabel;
            if (!keys.includes(dateKey)) dateKey = keys[0];
            if (!keys.includes(numericKey)) numericKey = keys[1] || keys[0];

            const n = dbData.length;
            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
            dbData.forEach((row: any, i: number) => {
                const x = i;
                const y = Number(row[numericKey]) || 0;
                sumX += x;
                sumY += y;
                sumXY += x * y;
                sumX2 += x * x;
            });

            const denominator = (n * sumX2 - sumX * sumX);
            let m = 0, b = 0;
            if (denominator !== 0) {
                m = (n * sumXY - sumX * sumY) / denominator;
                b = (sumY - m * sumX) / n;
            } else {
                b = sumY / n;
            }

            const lastDateRaw = String(dbData[n - 1][dateKey]);
            let lastDate = new Date(lastDateRaw);
            if (isNaN(lastDate.getTime())) lastDate = new Date();

            let newData = dbData.map((d: any) => ({
                [dateKey]: String(d[dateKey] || ''),
                Actual: Number(d[numericKey]) as number | null,
                Predicted: null as number | null
            }));

            // Overlap point to connect the lines visually
            newData[n-1].Predicted = newData[n-1].Actual;

            for (let step = 1; step <= horizon; step++) {
                const x = n - 1 + step;
                const yPred = Math.max(0, Math.round(m * x + b)); // Ensure non-negative predictions if appropriate
                const nextDate = new Date(lastDate);
                nextDate.setDate(nextDate.getDate() + step);
                
                const formattedDate = nextDate.toISOString().split('T')[0];

                newData.push({
                   [dateKey]: formattedDate,
                   Actual: null,
                   Predicted: yPred
                });
            }

            dbData = newData;
            aiResponse.xAxisLabel = dateKey;
            aiResponse.chartType = 'line'; // Enforce line chart for predictions
        }
    }

    // 3. Prompt Gemini to generate insights based on the data
    const insightPrompt = `
You are a senior data analyst.
Your job is to analyze query results and generate clear insights.

Focus on:
- trends
- peaks
- drops
- averages
- anomalies

Do NOT describe the chart visually.
Instead, explain the key insights in business language.
Keep the insights short, precise, and data-driven.
Return 3-5 bullet point insights based on the following data data.

User's original question: "${query}"

${isPredictive ? "CRITICAL: The data includes a 'Predicted' column for the next " + horizon + " periods. You MUST include Forecast Insights about the expected future trends, peaks, or drops based on this predicted data." : ""}

Data:
${JSON.stringify(dbData.slice(0, 50))}

Return your response ONLY as a JSON array of strings (e.g. ["insight 1", "insight 2"]). No markdown blocks outside the JSON array.
`;
    
    let insights: string[] = [];
    try {
        const insightResult = await model.generateContent(insightPrompt);
        let insightText = insightResult.response.text().trim();
        if (insightText.startsWith("\`\`\`json")) {
            insightText = insightText.replace(/^\`\`\`json/, "").replace(/\`\`\`$/, "").trim();
        } else if (insightText.startsWith("\`\`\`")) {
            insightText = insightText.replace(/^\`\`\`/, "").replace(/\`\`\`$/, "").trim();
        }
        insights = JSON.parse(insightText);
    } catch(e) {
        console.error("Failed to generate insights", e);
    }

    // 4. Return results
    return NextResponse.json({
      data: dbData,
      sql: aiResponse.sql,
      chartType: aiResponse.chartType,
      xAxisLabel: aiResponse.xAxisLabel,
      yAxisLabel: aiResponse.yAxisLabel,
      insights: insights,
      isPredictive: isPredictive,
      forecastError: forecastError
    });
  } catch (error: any) {
    console.error("Query Error:", error);
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 });
  }
}
