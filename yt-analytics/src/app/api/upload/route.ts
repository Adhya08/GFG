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

      // Dataset Summary Logic
      const rowCount = records.length;
      const columns = Object.keys(records[0]);
      const columnCount = columns.length;

      // Heuristic Column Type Detection
      const columnTypes = columns.map(col => {
        const values = records.slice(0, Math.min(100, rowCount)).map(r => r[col]);
        const sampleValue = values.find(v => v !== null && v !== undefined && v !== "");
        
        let type = "text";
        if (sampleValue === undefined) type = "text";
        else if (sampleValue === "true" || sampleValue === "false" || sampleValue === "0" || sampleValue === "1") {
          // Check if all are boolean-like
          const isBool = values.every(v => v === "true" || v === "false" || v === "0" || v === "1" || v === "" || v === null);
          if (isBool) type = "boolean";
        }
        
        if (type === "text" && !isNaN(Number(sampleValue)) && sampleValue !== "") {
          type = "numeric";
        } else if (type === "text" && !isNaN(Date.parse(sampleValue)) && String(sampleValue).length > 5) {
          type = "date";
        }
        
        // Categorical check
        if (type === "text" || type === "numeric") {
          const uniqueValues = new Set(values).size;
          if (uniqueValues < rowCount * 0.2 && uniqueValues < 20) {
            type = "categorical";
          }
        }

        return { name: col, type };
      });

      // Suggested Questions Logic
      const suggestions = [];
      const dates = columnTypes.filter(c => c.type === "date").map(c => c.name);
      const categoricals = columnTypes.filter(c => c.type === "categorical").map(c => c.name);
      const numerics = columnTypes.filter(c => c.type === "numeric").map(c => c.name);

      if (dates.length > 0 && numerics.length > 0) suggestions.push(`Show ${numerics[0]} trend over time`);
      if (numerics.length >= 2) suggestions.push(`Compare ${numerics[0]} vs ${numerics[1]}`);
      if (categoricals.length > 0 && numerics.length > 0) suggestions.push(`Show total ${numerics[0]} by ${categoricals[0]}`);
      if (numerics.length > 0 && categoricals.length > 0) suggestions.push(`Which ${categoricals[0]} has the highest average ${numerics[0]}?`);
      if (numerics.includes("sentiment_score")) suggestions.push("What is the overall sentiment distribution?");
      else if (numerics.length > 0) suggestions.push(`Show distribution of ${numerics[0]}`);

      if (suggestions.length < 5) {
          suggestions.push("Show summary statistics for the dataset");
          suggestions.push("Compare performance across different regions");
      }

      // --- Data Quality Module ---
      const qualityWarnings: { type: string; column?: string; message: string; severity: 'warning' | 'info' | 'critical' }[] = [];
      let totalIssues = 0;

      // 1. Missing Values & Type Consistency
      columnTypes.forEach(col => {
        const values = records.map(r => r[col.name]);
        const missingCount = values.filter(v => v === null || v === undefined || v === "").length;
        if (missingCount > 0) {
          const percentVal = (missingCount / rowCount) * 100;
          qualityWarnings.push({
            type: 'missing',
            column: col.name,
            message: `${missingCount} missing values (${percentVal.toFixed(1)}%)`,
            severity: percentVal > 20 ? 'critical' : 'warning'
          });
          totalIssues += missingCount;
        }

        if (col.type === 'numeric') {
          const nonNumericCount = values.filter(v => v !== "" && v !== null && isNaN(Number(v))).length;
          if (nonNumericCount > 0) {
            qualityWarnings.push({
              type: 'type',
              column: col.name,
              message: `Contains ${nonNumericCount} non-numeric values`,
              severity: 'critical'
            });
            totalIssues += nonNumericCount;
          }
        }
      });

      // 2. Outlier Detection (IQR Method)
      columnTypes.filter(c => c.type === 'numeric').forEach(col => {
        const values = records.map(r => Number(r[col.name])).filter(v => !isNaN(v)).sort((a, b) => a - b);
        if (values.length > 4) {
          const q1 = values[Math.floor(values.length * 0.25)];
          const q3 = values[Math.floor(values.length * 0.75)];
          const iqr = q3 - q1;
          const lowerBound = q1 - 1.5 * iqr;
          const upperBound = q3 + 1.5 * iqr;
          const outliers = values.filter(v => v < lowerBound || v > upperBound);
          if (outliers.length > 0) {
            qualityWarnings.push({
              type: 'outlier',
              column: col.name,
              message: `Detected ${outliers.length} potential outliers`,
              severity: 'info'
            });
            totalIssues += outliers.length;
          }
        }
      });

      // 3. Duplicate Records
      const stringifiedRows = records.map(r => JSON.stringify(r));
      const uniqueRows = new Set(stringifiedRows);
      const duplicateCount = stringifiedRows.length - uniqueRows.size;
      if (duplicateCount > 0) {
        qualityWarnings.push({
          type: 'duplicate',
          message: `${duplicateCount} duplicate rows detected`,
          severity: 'warning'
        });
        totalIssues += duplicateCount;
      }

      // 4. Health Score Calculation
      const maxPossibleIssues = rowCount * columnCount;
      const penalty = (totalIssues / maxPossibleIssues) * 100;
      const healthScore = Math.max(0, Math.min(100, Math.round(100 - penalty - (duplicateCount > 0 ? 5 : 0))));

      return NextResponse.json({
        success: true,
        message: `Successfully loaded ${records.length} analytics records.`,
        summary: {
            rowCount,
            columnCount,
            columnNames: columns
        },
        columnTypes,
        suggestions: suggestions.slice(0, 5),
        dataQuality: {
          score: healthScore,
          warnings: qualityWarnings,
          status: healthScore > 85 ? 'good' : healthScore > 60 ? 'moderate' : 'critical'
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `The uploaded CSV was empty or has no records.`,
    });
  } catch (err: any) {
    console.error("Upload Error:", err);
    return NextResponse.json({ error: "Upload failed: " + err.message }, { status: 500 });
  }
}

