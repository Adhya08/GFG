import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Initialize in-memory SQLite database
const db = new Database(':memory:');

// Create table based on FRD schema
db.exec(`
  CREATE TABLE youtube_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    video_id TEXT,
    category TEXT,
    language TEXT,
    region TEXT,
    duration_sec INTEGER,
    views INTEGER,
    likes INTEGER,
    comments INTEGER,
    shares INTEGER,
    sentiment_score REAL,
    ads_enabled BOOLEAN
  );
`);

const insert = db.prepare(`
  INSERT INTO youtube_analytics (timestamp, video_id, category, language, region, duration_sec, views, likes, comments, shares, sentiment_score, ads_enabled)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Try to load from youtube.csv
const csvPath = path.join(process.cwd(), '..', 'youtube.csv');

let loadedFromCsv = false;

if (fs.existsSync(csvPath)) {
  try {
    const fileContent = fs.readFileSync(csvPath, 'utf8');
    if (fileContent.trim().length > 0) {
      const records: any[] = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });

      if (records.length > 0) {
        db.transaction(() => {
          for (const row of records) {
            // Extract fields safely, handling possible missing columns in the user's CSV
            // by falling back to standard values.
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
        console.log("Successfully loaded " + records.length + " rows from " + csvPath);
        loadedFromCsv = true;
      }
    }
  } catch (error) {
    console.error("Error parsing CSV:", error);
  }
}

// Fallback to dummy data if CSV is empty or not found
if (!loadedFromCsv) {
  console.log("CSV missing or empty, falling back to dummy data.");
  const dummyData = [
    ['2023-10-01T10:00:00Z', 'vid_001', 'Education', 'English', 'US', 600, 150000, 15000, 500, 1200, 0.85, 1],
    ['2023-10-02T12:30:00Z', 'vid_002', 'Gaming', 'English', 'UK', 1200, 300000, 45000, 1200, 3000, 0.90, 1],
    ['2023-10-03T15:45:00Z', 'vid_003', 'Vlog', 'Spanish', 'ES', 450, 80000, 5000, 200, 400, 0.70, 0],
    ['2023-10-04T08:15:00Z', 'vid_004', 'Tech', 'Hindi', 'IN', 900, 500000, 60000, 2500, 8000, 0.95, 1],
    ['2023-10-05T19:20:00Z', 'vid_005', 'Education', 'English', 'US', 720, 120000, 10000, 300, 900, 0.82, 1],
    ['2023-10-06T11:10:00Z', 'vid_006', 'Gaming', 'French', 'FR', 1500, 200000, 25000, 800, 1500, 0.75, 1],
    ['2023-10-07T14:40:00Z', 'vid_007', 'Vlog', 'English', 'US', 300, 50000, 3000, 100, 200, 0.65, 0],
    ['2023-10-08T09:55:00Z', 'vid_008', 'Tech', 'English', 'UK', 1050, 400000, 48000, 1800, 5000, 0.88, 1],
    ['2023-10-09T16:05:00Z', 'vid_009', 'Comedy', 'Hindi', 'IN', 240, 800000, 95000, 4000, 12000, 0.92, 1],
    ['2023-10-10T13:25:00Z', 'vid_010', 'Education', 'German', 'DE', 660, 90000, 8000, 250, 600, 0.78, 1],
    ['2023-10-11T18:50:00Z', 'vid_011', 'Gaming', 'English', 'US', 1800, 450000, 60000, 2000, 4500, 0.89, 1],
    ['2023-10-12T07:30:00Z', 'vid_012', 'Vlog', 'Japanese', 'JP', 540, 110000, 12000, 400, 800, 0.81, 0],
    ['2023-10-13T21:15:00Z', 'vid_013', 'Tech', 'Chinese', 'CN', 840, 350000, 40000, 1500, 3500, 0.84, 1],
    ['2023-10-14T10:45:00Z', 'vid_014', 'Comedy', 'English', 'US', 360, 600000, 75000, 3000, 9000, 0.91, 1],
    ['2023-10-15T15:10:00Z', 'vid_015', 'Education', 'Hindi', 'IN', 780, 250000, 20000, 800, 2000, 0.86, 1],
  ];

  db.transaction(() => {
    for (const row of dummyData) {
      insert.run(...row);
    }
  })();
}

export default db;
