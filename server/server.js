// ======================================================
// MIRAI ANIME TRACKER
// BACKEND SERVER
// ======================================================

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;
const MAL_CLIENT_ID = process.env.MAL_CLIENT_ID;


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());
app.use(express.json());


// ======================================================
// MAL HELPER
// ======================================================

async function malFetch(url) {

    const response = await fetch(url, {
        headers: {
            "X-MAL-CLIENT-ID": MAL_CLIENT_ID
        }
    });

    console.log("MAL STATUS:", response.status);

    const text = await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(
            "MyAnimeList returned invalid JSON."
        );
    }

    if (!response.ok) {

        console.error("MAL ERROR:", data);

        throw new Error(
            data?.message ||
            "MyAnimeList request failed."
        );
    }

    return data;
}


// ======================================================
// SERVER STATUS
// ======================================================

app.get("/api/status", (req, res) => {

    res.json({
        success: true,
        message: "MIRAI server is running."
    });

});


// ======================================================
// SEARCH ANIME
// ======================================================

app.get("/anime/search", async (req, res) => {

    try {

        const name =
            String(req.query.name || "").trim();

        if (!name) {

            return res.status(400).json({
                success: false,
                error: "Anime name is required."
            });

        }

        const url =
            "https://api.myanimelist.net/v2/anime" +
            `?q=${encodeURIComponent(name)}` +
            "&limit=20" +
            "&fields=id,title,main_picture," +
            "start_date,end_date,synopsis,mean," +
            "num_episodes,status,genres,media_type," +
            "broadcast,source";

        const data =
            await malFetch(url);

        res.json(data);

    } catch (error) {

        console.error(
            "SEARCH ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            error: "Search failed.",
            details: error.message
        });

    }

});


// ======================================================
// TOP ANIME
// ======================================================

app.get("/anime/top", async (req, res) => {

    try {

        const limit =
            Math.min(
                Number(req.query.limit) || 50,
                100
            );

        const url =
            "https://api.myanimelist.net/v2/anime/ranking" +
            `?ranking_type=all&limit=${limit}` +
            "&fields=id,title,main_picture," +
            "start_date,end_date,synopsis,mean," +
            "num_episodes,status,genres,media_type," +
            "broadcast,source";

        const data =
            await malFetch(url);

        res.json(data);

    } catch (error) {

        console.error(
            "TOP ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            error: "Could not load top anime.",
            details: error.message
        });

    }

});


// ======================================================
// TRENDING
// ======================================================

app.get("/anime/trending", async (req, res) => {

    try {

        const limit =
            Math.min(
                Number(req.query.limit) || 20,
                100
            );

        const url =
            "https://api.myanimelist.net/v2/anime/ranking" +
            `?ranking_type=bypopularity&limit=${limit}` +
            "&fields=id,title,main_picture," +
            "start_date,end_date,synopsis,mean," +
            "num_episodes,status,genres,media_type," +
            "broadcast,source";

        const data =
            await malFetch(url);

        res.json(data);

    } catch (error) {

        console.error(
            "TRENDING ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            error: "Could not load trending anime.",
            details: error.message
        });

    }

});


// ======================================================
// RANDOM ANIME
// ======================================================

app.get("/anime/random", async (req, res) => {

    try {

        const url =
            "https://api.myanimelist.net/v2/anime/ranking" +
            "?ranking_type=all" +
            "&limit=100" +
            "&fields=id,title,main_picture," +
            "start_date,end_date,synopsis,mean," +
            "num_episodes,status,genres,media_type," +
            "broadcast,source";

        const data =
            await malFetch(url);

        if (
            !data.data ||
            !data.data.length
        ) {

            throw new Error(
                "No anime were returned."
            );

        }

        const anime =
            data.data[
                Math.floor(
                    Math.random() *
                    data.data.length
                )
            ];

        res.json({
            success: true,
            data: anime
        });

    } catch (error) {

        console.error(
            "RANDOM ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            error: "Could not find a random anime.",
            details: error.message
        });

    }

});


// ======================================================
// SCHEDULE
// ======================================================

app.get("/anime/schedule", async (req, res) => {

    try {

        const now =
            new Date();

        const year =
            now.getFullYear();

        const month =
            now.getMonth();

        let season;

        if (month <= 2) {
            season = "winter";
        } else if (month <= 5) {
            season = "spring";
        } else if (month <= 8) {
            season = "summer";
        } else {
            season = "fall";
        }

        const url =
            "https://api.myanimelist.net/v2/anime/season" +
            `/${year}/${season}` +
            "?limit=100" +
            "&fields=id,title,main_picture," +
            "start_date,end_date,synopsis,mean," +
            "num_episodes,status,genres,media_type," +
            "broadcast,source";

        const data =
            await malFetch(url);

        const anime =
            (data.data || [])
                .map(item =>
                    item.node || item
                )
                .filter(item =>
                    item.broadcast
                );

        res.json({
            success: true,
            data: anime
        });

    } catch (error) {

        console.error(
            "SCHEDULE ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            error: "Could not load schedule.",
            details: error.message
        });

    }

});


// ======================================================
// SERVE WEBSITE
// ======================================================

app.use(
    express.static(__dirname)
);


// ======================================================
// START SERVER
// ======================================================

app.listen(
    PORT,
    () => {

        console.log(
            `MIRAI server running on port ${PORT}`
        );

    }
);