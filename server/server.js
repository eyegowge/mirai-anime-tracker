require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const MAL_CLIENT_ID = process.env.MAL_CLIENT_ID;
const MAL_API = "https://api.myanimelist.net/v2";

if (!MAL_CLIENT_ID) {
    console.error("ERROR: MAL_CLIENT_ID is missing from .env!");
}

app.use(cors());
app.use(express.json());

// Reusable Fetch Function
async function malRequest(endpoint) {
    const response = await fetch(`${MAL_API}${endpoint}`, {
        headers: { "X-MAL-CLIENT-ID": MAL_CLIENT_ID }
    });
    if (!response.ok) throw new Error(`MAL API error ${response.status}`);
    return await response.json();
}

// Added "trailer" to fields so the frontend slideshow can play videos!
const fields = "id,title,main_picture,synopsis,mean,num_episodes,start_date,status,broadcast,trailer";

app.get("/", (req, res) => res.json({ success: true, message: "MIRAI server is running." }));

app.get("/anime/search", async (req, res) => {
    try {
        const data = await malRequest(`/anime?q=${encodeURIComponent(req.query.name)}&limit=12&fields=${fields}`);
        res.json({ success: true, data: data.data.map(i => i.node) });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get("/anime/top", async (req, res) => {
    try {
        const type = req.query.type || "all";
        const limit = req.query.limit || 15;
        const data = await malRequest(`/anime/ranking?ranking_type=${type}&limit=${limit}&fields=${fields}`);
        res.json({ success: true, data: data.data.map(i => i.node) });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get("/anime/seasonal", async (req, res) => {
    try {
        const year = req.query.year || new Date().getFullYear();
        const season = req.query.season || "fall";
        const limit = req.query.limit || 20;
        const data = await malRequest(`/anime/season/${year}/${season}?limit=${limit}&fields=${fields}`);
        res.json({ success: true, data: data.data.map(i => i.node) });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// NEW: Schedule endpoint to serve the Schedule UI correctly
app.get("/anime/schedule", async (req, res) => {
    try {
        const day = req.query.day || "monday";
        // Get current seasonal anime
        const data = await malRequest(`/anime/season/${new Date().getFullYear()}/fall?limit=100&fields=${fields}`);
        
        // Filter by day of the week
        let dailyAnime = data.data.map(i => i.node).filter(anime => {
            return anime.broadcast && anime.broadcast.day_of_the_week === day;
        });
        
        // Fallback if empty (e.g. out of season testing) to keep UI working
        if(dailyAnime.length === 0) {
            dailyAnime = data.data.map(i => i.node).slice(0, 5); 
        }
        
        res.json({ success: true, data: dailyAnime });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.listen(PORT, () => {
    console.log(`MIRAI server running at http://localhost:${PORT}`);
});