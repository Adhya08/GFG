import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileContent = buffer.toString("utf-8");
    
    // Save locally
    const csvPath = path.join(process.cwd(), "..", "youtube.csv");
    fs.writeFileSync(csvPath, fileContent);

    // Refresh DB
    const records: any[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    if (records.length > 0) {
      db.exec("DELETE FROM youtube_analytics;");

      const insert = db.prepare(`
        INSERT INTO youtube_analytics (timestamp, video_id, category, language, region, duration_sec, views, likes, comments, shares, sentiment_score, ads_enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      db.transaction(() => {
        for (const row of records) {
          const timestamp = row.timestamp || new Date().toISOString();
          const video_id = row.video_id || "vid_" + Math.random().toString(36).substring(7);
          const category = row.category || 'Unknown';
          const language = row.language || 'Unknown';
          const region = row.region || 'Unknown';
          const duration_sec = parseInt(row.duration_sec || '0', 10);
          const views = parseInt(row.views || '0', 10);
          const likes = parseInt(row.likes || '0', 10);
          const comments = parseInt(row.comments || '0', 10);
          const shares = parseInt(row.shares || '0', 10);
          const sentiment_score = parseFloat(row.sentiment_score || '0');
          const ads_enabled = row.ads_enabled === 'true' || row.ads_enabled === '1' ? 1 : 0;

          insert.run(
            timestamp, video_id, category, language, region, 
            duration_sec, views, likes, comments, shares, 
            sentiment_score, ads_enabled
          );
        }
      })();
    }

    return NextResponse.json({
      success: true,
      message: `Successfully loaded ${records.length} analytics records from the uploaded CSV.`,
    });
  } catch (err: any) {
    console.error("Upload Error:", err);
    return NextResponse.json({ error: "Upload failed: " + err.message }, { status: 500 });
  }
}
