// ============================================================
// MIRAI ANIME TRACKER - BACKEND SERVER
// MyAnimeList API
// ============================================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();


// ============================================================
// SETTINGS
// ============================================================

const PORT = process.env.PORT || 3000;

const MAL_CLIENT_ID = process.env.MAL_CLIENT_ID;

const MAL_API = "https://api.myanimelist.net/v2";


// ============================================================
// CHECK MAL API KEY
// ============================================================

if (!MAL_CLIENT_ID) {
    console.error("");
    console.error("==========================================");
    console.error("ERROR: MAL_CLIENT_ID is missing!");
    console.error("==========================================");
    console.error("");
    console.error("Make sure your .env file contains:");
    console.error("");
    console.error("MAL_CLIENT_ID=your_client_id_here");
    console.error("");
}


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());

app.use(express.json());

// Serve the frontend (index.html, style.css, script.js) from /public
app.use(express.static(path.join(__dirname, "..", "public")));


// ============================================================
// MAL API HELPER
// ============================================================

async function malRequest(endpoint) {

    if (!MAL_CLIENT_ID) {
        throw new Error("MAL_CLIENT_ID is missing from .env");
    }

    const response = await fetch(
        `${MAL_API}${endpoint}`,
        {
            headers: {
                "X-MAL-CLIENT-ID": MAL_CLIENT_ID
            }
        }
    );

    const text = await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(
            `MAL returned an invalid response. Status: ${response.status}`
        );
    }

    if (!response.ok) {

        console.error("MAL API error:");
        console.error(data);

        throw new Error(
            data.message ||
            `MAL API returned status ${response.status}`
        );
    }

    return data;
}


// ============================================================
// HEALTH CHECK (moved off "/" so it doesn't block the frontend)
// ============================================================

app.get("/health", function (req, res) {

    res.json({
        success: true,
        message: "MIRAI server is running.",
        api: "MyAnimeList"
    });

});


// ============================================================
// SEARCH ANIME
// ============================================================
//
// Example:
// http://localhost:3000/anime/search?name=naruto
//
// ============================================================

app.get("/anime/search", async function (req, res) {

    const animeName = req.query.name;

    if (!animeName) {

        return res.status(400).json({
            success: false,
            error: "Please provide an anime name."
        });

    }

    try {

        console.log(
            `Searching MAL for: ${animeName}`
        );

        const query =
            encodeURIComponent(animeName);

        const fields =
            [
                "id",
                "title",
                "main_picture",
                "alternative_titles",
                "synopsis",
                "mean",
                "rank",
                "popularity",
                "num_episodes",
                "start_date",
                "end_date",
                "status",
                "genres",
                "media_type",
                "broadcast"
            ].join(",");

        const data = await malRequest(
            `/anime?q=${query}&limit=12&fields=${fields}`
        );

        res.json({
            success: true,
            ...data
        });

    } catch (error) {

        console.error(
            "Search error:",
            error.message
        );

        res.status(500).json({
            success: false,
            error: "Failed to search anime.",
            details: error.message
        });

    }

});


// ============================================================
// TOP ANIME
// ============================================================
//
// Example:
// http://localhost:3000/anime/top
//
// Or:
// http://localhost:3000/anime/top?type=airing&limit=10
//
// ============================================================

app.get("/anime/top", async function (req, res) {

    const type =
        req.query.type || "all";

    const limit =
        Number(req.query.limit) || 10;

    const allowedTypes = [
        "all",
        "airing",
        "upcoming",
        "bypopularity",
        "favorite"
    ];

    if (!allowedTypes.includes(type)) {

        return res.status(400).json({
            success: false,
            error: "Invalid ranking type.",
            allowedTypes: allowedTypes
        });

    }

    try {

        console.log(
            `Getting top anime: ${type}`
        );

        const fields =
            [
                "id",
                "title",
                "main_picture",
                "synopsis",
                "mean",
                "rank",
                "popularity",
                "num_episodes",
                "start_date",
                "end_date",
                "status",
                "genres",
                "media_type",
                "broadcast"
            ].join(",");

        const data = await malRequest(
            `/anime/ranking?ranking_type=${type}&limit=${limit}&fields=${fields}`
        );

        res.json({
            success: true,
            ...data
        });

    } catch (error) {

        console.error(
            "Top anime error:",
            error.message
        );

        res.status(500).json({
            success: false,
            error: "Failed to fetch top anime.",
            details: error.message
        });

    }

});


// ============================================================
// SEASONAL ANIME
// ============================================================
//
// Example:
// http://localhost:3000/anime/seasonal
//
// Example:
// http://localhost:3000/anime/seasonal?year=2026&season=summer
//
// ============================================================

app.get(
    "/anime/seasonal",
    async function (req, res) {

        const currentDate =
            new Date();

        const year =
            Number(req.query.year) ||
            currentDate.getFullYear();

        const season =
            req.query.season?.toLowerCase() ||
            getCurrentSeason();

        const limit =
            Number(req.query.limit) || 10;

        const allowedSeasons = [
            "winter",
            "spring",
            "summer",
            "fall"
        ];

        if (!allowedSeasons.includes(season)) {

            return res.status(400).json({
                success: false,
                error: "Invalid season.",
                allowedSeasons: allowedSeasons
            });

        }

        try {

            console.log(
                `Getting seasonal anime: ${year} ${season}`
            );

            const fields =
                [
                    "id",
                    "title",
                    "main_picture",
                    "synopsis",
                    "mean",
                    "rank",
                    "popularity",
                    "num_episodes",
                    "start_date",
                    "end_date",
                    "status",
                    "genres",
                    "media_type",
                    "broadcast"
                ].join(",");

            const data = await malRequest(
                `/anime/season/${year}/${season}?limit=${limit}&fields=${fields}`
            );

            res.json({
                success: true,
                year: year,
                season: season,
                ...data
            });

        } catch (error) {

            console.error(
                "Seasonal anime error:",
                error.message
            );

            res.status(500).json({
                success: false,
                error: "Failed to fetch seasonal anime.",
                details: error.message
            });

        }

    }
);


// ============================================================
// CURRENT SEASON HELPER
// ============================================================

function getCurrentSeason() {

    const month =
        new Date().getMonth() + 1;

    if (month >= 1 && month <= 3) {
        return "winter";
    }

    if (month >= 4 && month <= 6) {
        return "spring";
    }

    if (month >= 7 && month <= 9) {
        return "summer";
    }

    return "fall";
}


// ============================================================
// CATCH-ALL — send index.html for any route Express
// hasn't already matched (keeps refresh/deep-links working
// for a single-page app). Must be registered AFTER every
// API route above.
// ============================================================

app.get("*", function (req, res) {
    res.sendFile(
        path.join(__dirname, "..", "public", "index.html")
    );
});


// ============================================================
// ERROR HANDLER
// ============================================================

app.use(function (err, req, res, next) {

    console.error(err);

    res.status(500).json({
        success: false,
        error: "Something went wrong on the MIRAI server."
    });

});


// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, function () {

    console.log("");
    console.log("==========================================");
    console.log("        MIRAI ANIME TRACKER");
    console.log("==========================================");
    console.log("");
    console.log(
        `MIRAI server running at http://localhost:${PORT}`
    );
    console.log("");
    console.log("Available endpoints:");
    console.log("");
    console.log(
        `Search:   http://localhost:${PORT}/anime/search?name=naruto`
    );
    console.log(
        `Top:      http://localhost:${PORT}/anime/top`
    );
    console.log(
        `Seasonal: http://localhost:${PORT}/anime/seasonal`
    );
    console.log("");
    console.log("==========================================");
    console.log("");

});