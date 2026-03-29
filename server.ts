import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("⚡ VoltSense Server: Initializing...");

  app.use(express.json());

  const HISTORY_FILE = path.join(process.cwd(), "history.json");

  // Initialise history with 90 days of Indian Standard data if it doesn't exist
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      console.log("⚡ VoltSense Server: Creating initial history dataset...");
      const initialHistory = [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
      
      // Festival spikes from Python code
      const festivalSpikes: { [key: number]: number } = {
        12: 8.2,   // Day 13 - Bhogi
        13: 11.5,  // Day 14 - Pongal (festival peak)
        14: 10.8,  // Day 15 - Kanu Pongal
        25: 9.2,   // Day 26 - Republic Day
        43: 10.5,  // Day 44 - Maha Shivaratri
        57: 8.8,   // Day 58 - Holi
        72: 11.0,  // Day 73 - Tamil New Year eve
        73: 12.1,  // Day 74 - Tamil New Year (highest spike)
        86: 9.5,   // Day 87 - Weekend before April
      };

      let currentReading = 10000.0;
      for (let i = 0; i <= 90; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        let units = 0;
        if (festivalSpikes[i]) {
          units = festivalSpikes[i];
        } else if (isWeekend) {
          units = 5.8 + Math.random() * 1.8; // Weekend: 5.8 - 7.6
        } else if (i >= 59) {
          units = 5.5 + Math.random() * 1.5; // March (Summer): 5.5 - 7.0
        } else if (i >= 31) {
          units = 4.0 + Math.random() * 1.5; // February: 4.0 - 5.5
        } else {
          units = 3.6 + Math.random() * 1.6; // January: 3.6 - 5.2
        }
        
        units = Math.round(units * 10) / 10;
        currentReading += units;
        
        initialHistory.push({
          day: i + 1,
          date: date.toISOString().split('T')[0],
          reading_kwh: Math.round(currentReading * 10) / 10,
          units_used: units,
          month: date.toLocaleString('en-US', { month: 'long' }),
          weekday: date.toLocaleString('en-US', { weekday: 'long' }),
          is_weekend: isWeekend ? 1 : 0,
          timestamp: date.getTime()
        });
      }
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(initialHistory, null, 2));
      console.log("⚡ VoltSense Server: History dataset created successfully.");
    }
  } catch (err) {
    console.error("❌ VoltSense Server: Failed to initialize history file:", err);
  }

  // API Routes
  app.get("/api/history", (req, res) => {
    console.log("GET /api/history");
    try {
      if (!fs.existsSync(HISTORY_FILE)) {
        return res.json([]);
      }
      const data = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
      res.json(data);
    } catch (error) {
      console.error("Error reading history:", error);
      res.status(500).json({ error: "Failed to read history" });
    }
  });

  app.post("/api/history", (req, res) => {
    console.log("POST /api/history", req.body);
    try {
      const { reading_kwh, date } = req.body;
      if (reading_kwh === undefined) {
        return res.status(400).json({ error: "reading_kwh is required" });
      }

      let history = [];
      if (fs.existsSync(HISTORY_FILE)) {
        history = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
      }
      
      const lastEntry = history.length > 0 ? history[history.length - 1] : null;
      const units_used = lastEntry ? Math.round((reading_kwh - lastEntry.reading_kwh) * 10) / 10 : 0;
      
      const entryDate = new Date(date || Date.now());
      const newEntry = {
        day: (lastEntry?.day || 0) + 1,
        date: date || new Date().toISOString().split('T')[0],
        reading_kwh: Number(reading_kwh),
        units_used: Math.max(0, units_used),
        month: entryDate.toLocaleString('en-US', { month: 'long' }),
        weekday: entryDate.toLocaleString('en-US', { weekday: 'long' }),
        is_weekend: (entryDate.getDay() === 0 || entryDate.getDay() === 6) ? 1 : 0,
        timestamp: entryDate.getTime()
      };
      
      history.push(newEntry);
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
      res.json(newEntry);
    } catch (error) {
      console.error("Error saving reading:", error);
      res.status(500).json({ error: "Failed to save reading" });
    }
  });

  app.delete("/api/history", (req, res) => {
    console.log("DELETE /api/history");
    try {
      if (fs.existsSync(HISTORY_FILE)) {
        fs.unlinkSync(HISTORY_FILE);
      }
      res.json({ message: "History cleared successfully" });
    } catch (error) {
      console.error("Error clearing history:", error);
      res.status(500).json({ error: "Failed to clear history" });
    }
  });

  app.get("/api/history/csv", (req, res) => {
    console.log("GET /api/history/csv");
    try {
      if (!fs.existsSync(HISTORY_FILE)) {
        return res.status(404).send("No history found");
      }
      const data = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
      let csv = "Day,Date,Weekday,Month,Reading (kWh),Units Used,Is Weekend,Timestamp\n";
      data.forEach((entry: any) => {
        csv += `${entry.day},${entry.date},${entry.weekday},${entry.month},${entry.reading_kwh},${entry.units_used},${entry.is_weekend},${entry.timestamp}\n`;
      });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=voltsense_history.csv");
      res.status(200).send(csv);
    } catch (error) {
      console.error("Error generating CSV:", error);
      res.status(500).send("Failed to generate CSV");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("⚡ VoltSense Server: Starting Vite in middleware mode...");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error("❌ VoltSense Server: Failed to start Vite:", err);
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 VoltSense Server: Running on http://localhost:${PORT}`);
  });
}

startServer();
