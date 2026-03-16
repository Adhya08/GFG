import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import db from "@/lib/db";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is missing." }, { status: 500 });
    }

    const { history } = await req.json();

    // 1. Compute Key Statistics using SQLite
    // Using a robust query to count records, avg views/likes, top video, peak date.
    let totalVideos = 0;
    let avgLikes = 0;
    let avgViews = 0;
    let topVideo = "N/A";
    let peakDate = "N/A";

    try {
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as totalVideos,
          ROUND(AVG(likes)) as avgLikes,
          ROUND(AVG(views)) as avgViews,
          (SELECT video_id FROM youtube_analytics ORDER BY likes + views DESC LIMIT 1) as topVideo,
          (SELECT timestamp FROM youtube_analytics ORDER BY likes + views DESC LIMIT 1) as peakDate
        FROM youtube_analytics
      `).get() as any;

      if (stats) {
        totalVideos = stats.totalVideos || 0;
        avgLikes = stats.avgLikes || 0;
        avgViews = stats.avgViews || 0;
        topVideo = stats.topVideo || "N/A";
        peakDate = stats.peakDate ? new Date(stats.peakDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "N/A";
      }
    } catch(e) {
      console.error("DB Stats Error", e);
    }

    // 2. Generate Summary and Recommendations using Gemini
    const userQueries = history && history.length > 0 ? history.map((h: any) => h.question).join(", ") : "No queries asked yet.";
    const userInsights = history && history.length > 0 ? history.map((h: any) => (h.insights || []).join(" ")).join(" ") : "No insights generated yet.";

    const prompt = `
You are a senior Business Intelligence Analyst summarizing a YouTube analytics dataset. 

Key Data Stats:
Total Videos Context: ${totalVideos}
Average Views: ${avgViews}
Average Likes: ${avgLikes}
Top Performing Video: ${topVideo}
Peak Engagement Date: ${peakDate}

User Queries Asked: ${userQueries}
Generated Insights from queries: ${userInsights}

Please generate a professional Executive Summary and actionable Recommendations based on these facts.
Do NOT use markdown. Return the response STRICTLY as a JSON object with this exact structure:
{
  "summary": [
    "string summary point 1",
    "string summary point 2",
    "string summary point 3"
  ],
  "recommendations": [
    "string recommendation 1",
    "string recommendation 2",
    "string recommendation 3"
  ]
}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    
    let responseText = result.response.text().trim();
    if (responseText.startsWith("\`\`\`json")) responseText = responseText.replace(/^\`\`\`json/, "");
    if (responseText.startsWith("\`\`\`")) responseText = responseText.replace(/^\`\`\`/, "");
    responseText = responseText.replace(/\`\`\`$/, "").trim();

    let aiData = { summary: ["Insufficient data for summary."], recommendations: ["Insufficient data for recommendations."] };
    try {
      aiData = JSON.parse(responseText);
    } catch(e) {
      console.error("Failed to parse AI report JSON", responseText);
    }

    return NextResponse.json({
      stats: {
        totalVideos,
        avgLikes,
        avgViews,
        topVideo,
        peakDate
      },
      summary: aiData.summary,
      recommendations: aiData.recommendations
    });

  } catch (error: any) {
    console.error("Report Error:", error);
    return NextResponse.json({ error: error.message || "An error occurred" }, { status: 500 });
  }
}
