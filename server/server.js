// ======================================================
// MIRAI ANIME TRACKER
// PRODUCTION-READY BACKEND SERVER
// ======================================================

const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");

// ======================================================
// ENVIRONMENT
// ======================================================

dotenv.config({
    path: path.join(__dirname, "..", ".env")
});

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

const MAL_CLIENT_ID = process.env.MAL_CLIENT_ID || "";
const DATABASE_URL = process.env.DATABASE_URL || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "";

// ======================================================
// STARTUP VALIDATION
// ======================================================

if (!DATABASE_URL) {
    console.error("ERROR: DATABASE_URL was not found.");
    process.exitCode = 1;
}

if (!SESSION_SECRET && NODE_ENV === "production") {
    console.error("ERROR: SESSION_SECRET must be configured in production.");
    process.exitCode = 1;
}

if (!MAL_CLIENT_ID) {
    console.warn("WARN: MAL_CLIENT_ID is missing. MAL-backed routes will fail.");
}

// ======================================================
// DATABASE
// ======================================================

const pool = new Pool({
    connectionString: DATABASE_URL,
    max: Number(process.env.DB_POOL_MAX) || 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl:
        NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false
});

pool.on("error", error => {
    console.error("POSTGRES POOL ERROR:", error);
});

// ======================================================
// APP / MIDDLEWARE
// ======================================================

app.disable("x-powered-by");

app.set("trust proxy", 1);

if (FRONTEND_ORIGIN) {
    app.use(
        cors({
            origin: FRONTEND_ORIGIN,
            credentials: true
        })
    );
} else {
    // Same-origin deployment does not need CORS.
    app.use(
        cors({
            origin: false,
            credentials: true
        })
    );
}

app.use(
    express.json({
        limit: "2mb"
    })
);

app.use(
    express.urlencoded({
        extended: false,
        limit: "100kb"
    })
);

// ======================================================
// SESSION
// ======================================================

const sessionCookie = {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 30
};

app.use(
    session({
        name: "mirai.sid",

        store: new pgSession({
            pool,
            tableName: "user_sessions",
            createTableIfMissing: true
        }),

        secret:
            SESSION_SECRET ||
            "development-only-change-this-secret",

        resave: false,
        saveUninitialized: false,
        rolling: true,
        proxy: NODE_ENV === "production",

        cookie: sessionCookie
    })
);

// ======================================================
// SMALL UTILITIES
// ======================================================

function jsonError(res, status, message, extra = {}) {
    return res.status(status).json({
        success: false,
        error: message,
        ...extra
    });
}

function isPositiveInteger(value) {
    return Number.isInteger(value) && value > 0;
}

function clampInteger(value, min, max) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return min;
    }

    return Math.min(
        max,
        Math.max(
            min,
            Math.floor(number)
        )
    );
}

function clampNumber(value, min, max, decimals = 1) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return min;
    }

    const multiplier = 10 ** decimals;

    return (
        Math.round(
            Math.min(
                max,
                Math.max(min, number)
            ) * multiplier
        ) / multiplier
    );
}

function normalizeStatus(status) {
    return String(status || "")
        .trim()
        .toLowerCase();
}

function sanitizeUser(user) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
    };
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ======================================================
// PROMISE HELPERS
// ======================================================

function regenerateSession(req) {
    return new Promise((resolve, reject) => {
        req.session.regenerate(error => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}

function saveSession(req) {
    return new Promise((resolve, reject) => {
        req.session.save(error => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}

function destroySession(req) {
    return new Promise((resolve, reject) => {
        req.session.destroy(error => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}

// ======================================================
// AUTH
// ======================================================

function requireAuth(req, res, next) {
    if (!req.session?.userId) {
        return jsonError(
            res,
            401,
            "You must be logged in."
        );
    }

    next();
}

// ======================================================
// DATABASE SETUP
// ======================================================

async function setupDatabase() {
    if (!DATABASE_URL) {
        throw new Error("DATABASE_URL is missing.");
    }

    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(30) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS anime_list (
            id SERIAL PRIMARY KEY,

            user_id INTEGER NOT NULL
                REFERENCES users(id)
                ON DELETE CASCADE,

            anime_id INTEGER NOT NULL,

            anime_data JSONB NOT NULL,

            status VARCHAR(20) NOT NULL DEFAULT 'plan',

            episode INTEGER NOT NULL DEFAULT 0,

            rating NUMERIC(4,1) NOT NULL DEFAULT 0,

            saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            UNIQUE(user_id, anime_id)
        );
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS anime_list_user_id_idx
        ON anime_list(user_id);
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS anime_list_saved_at_idx
        ON anime_list(saved_at DESC);
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS users_email_lower_idx
        ON users(LOWER(email));
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS users_username_lower_idx
        ON users(LOWER(username));
    `);

    console.log("MIRAI database ready.");
}

// ======================================================
// CACHE
// ======================================================

const cache = new Map();

function cacheGet(key) {
    const entry = cache.get(key);

    if (!entry) {
        return null;
    }

    if (entry.expiresAt <= Date.now()) {
        cache.delete(key);
        return null;
    }

    return entry.value;
}

function cacheSet(key, value, ttlMs) {
    cache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs
    });

    return value;
}

function cacheDelete(key) {
    cache.delete(key);
}

// ======================================================
// EXTERNAL API HELPERS
// ======================================================

async function fetchJson(
    url,
    options = {},
    timeoutMs = 12_000
) {
    const controller = new AbortController();

    const timeout = setTimeout(
        () => controller.abort(),
        timeoutMs
    );

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        const text = await response.text();

        let data = null;

        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = null;
        }

        if (!response.ok) {
            const error = new Error(
                data?.message ||
                data?.error ||
                `Request failed with status ${response.status}.`
            );

            error.status = response.status;
            error.data = data;

            throw error;
        }

        return data;
    } finally {
        clearTimeout(timeout);
    }
}

async function malFetch(url) {
    if (!MAL_CLIENT_ID) {
        throw new Error(
            "MAL_CLIENT_ID is not configured."
        );
    }

    return fetchJson(
        url,
        {
            headers: {
                Accept: "application/json",
                "X-MAL-CLIENT-ID": MAL_CLIENT_ID
            }
        }
    );
}

async function jikanFetch(url) {
    return fetchJson(
        url,
        {
            headers: {
                Accept: "application/json",
                "User-Agent": "MIRAI-Anime-Tracker/1.0"
            }
        }
    );
}

// ======================================================
// MAL / ANIME NORMALIZATION
// ======================================================

const ANIME_FIELDS = [
    "id",
    "title",
    "main_picture",
    "alternative_titles",
    "start_date",
    "end_date",
    "synopsis",
    "mean",
    "rank",
    "popularity",
    "num_list_users",
    "num_episodes",
    "status",
    "genres",
    "media_type",
    "broadcast",
    "source"
].join(",");

function normalizeAnime(item) {
    const anime =
        item?.node ||
        item;

    if (!anime?.id) {
        return null;
    }

    const picture =
        anime.main_picture ||
        {};

    const id =
        Number(anime.id);

    return {
        id,

        mal_id: id,

        title:
            anime.title ||
            "Unknown Anime",

        image:
            picture.large ||
            picture.medium ||
            "",

        image_url:
            picture.large ||
            picture.medium ||
            "",

        synopsis:
            anime.synopsis ||
            "No synopsis available.",

        score:
            anime.mean ??
            null,

        mal_score:
            anime.mean ??
            null,

        episodes:
            anime.num_episodes ??
            null,

        episode_count:
            anime.num_episodes ??
            null,

        type:
            anime.media_type ||
            "Anime",

        status:
            anime.status ||
            "",

        start_date:
            anime.start_date ||
            null,

        end_date:
            anime.end_date ||
            null,

        rank:
            anime.rank ??
            null,

        popularity:
            anime.popularity ??
            null,

        num_list_users:
            anime.num_list_users ??
            null,

        genres:
            Array.isArray(anime.genres)
                ? anime.genres
                : [],

        broadcast:
            anime.broadcast ||
            null,

        source:
            anime.source ||
            null,

        alternative_titles:
            anime.alternative_titles ||
            null
    };
}

function normalizeAnimeList(data) {
    return (
        Array.isArray(data?.data)
            ? data.data
            : []
    )
        .map(normalizeAnime)
        .filter(Boolean);
}

// ======================================================
// LIST HELPERS
// ======================================================

const VALID_LIST_STATUSES = [
    "plan",
    "watching",
    "completed",
    "on_hold",
    "dropped"
];

function validateListStatus(status) {
    return VALID_LIST_STATUSES.includes(
        normalizeStatus(status)
    );
}

function cleanEpisodeNumber(
    episode,
    animeData
) {
    const maxEpisodes =
        Number(
            animeData?.episodes
        ) ||
        Number(
            animeData?.episode_count
        ) ||
        Number(
            animeData?.num_episodes
        ) ||
        0;

    const max =
        maxEpisodes > 0
            ? maxEpisodes
            : 100_000;

    return clampInteger(
        episode,
        0,
        max
    );
}

function cleanRating(rating) {
    // MIRAI's UI uses a 1–5 slider.
    // 0 means "not rated yet".
    return clampNumber(
        rating,
        0,
        5,
        1
    );
}

function completedEpisodeCount(animeData) {
    return (
        Number(
            animeData?.episodes
        ) ||
        Number(
            animeData?.episode_count
        ) ||
        Number(
            animeData?.num_episodes
        ) ||
        0
    );
}

function rowToAnime(row) {
    const data =
        row.anime_data ||
        {};

    return {
        ...data,

        id:
            Number(row.anime_id),

        mal_id:
            Number(row.anime_id),

        listStatus:
            row.status,

        status:
            row.status,

        episode:
            Number(row.episode),

        rating:
            Number(row.rating),

        savedAt:
            row.saved_at
    };
}

// ======================================================
// SERVER STATUS
// ======================================================

app.get(
    "/api/status",
    async (req, res) => {
        let database = "unknown";

        try {
            await pool.query("SELECT 1");
            database = "ok";
        } catch {
            database = "error";
        }

        res.json({
            success: true,
            message: "MIRAI server is running.",
            environment: NODE_ENV,
            loggedIn: Boolean(
                req.session?.userId
            ),
            database,
            timestamp: new Date().toISOString()
        });
    }
);

// ======================================================
// REGISTER
// ======================================================

async function registerUser(req, res) {
    try {
        const username = String(
            req.body.username || ""
        ).trim();

        const email = String(
            req.body.email || ""
        )
            .trim()
            .toLowerCase();

        const password = String(
            req.body.password || ""
        );

        if (!username || !email || !password) {
            return jsonError(
                res,
                400,
                "Username, email, and password are required."
            );
        }

        if (
            !/^[a-zA-Z0-9_-]{3,30}$/.test(username)
        ) {
            return jsonError(
                res,
                400,
                "Username must be 3–30 characters and use only letters, numbers, underscores, or hyphens."
            );
        }

        if (
            email.length > 255 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            return jsonError(
                res,
                400,
                "Please enter a valid email address."
            );
        }

        if (password.length < 6) {
            return jsonError(
                res,
                400,
                "Password must be at least 6 characters."
            );
        }

        if (password.length > 200) {
            return jsonError(
                res,
                400,
                "Password is too long."
            );
        }

        const existing =
            await pool.query(
                `
                    SELECT id
                    FROM users
                    WHERE
                        LOWER(username) = LOWER($1)
                    OR
                        LOWER(email) = LOWER($2)
                    LIMIT 1
                `,
                [
                    username,
                    email
                ]
            );

        if (existing.rows.length) {
            return jsonError(
                res,
                409,
                "A user with that username or email already exists."
            );
        }

        const passwordHash =
            await bcrypt.hash(
                password,
                12
            );

        const result =
            await pool.query(
                `
                    INSERT INTO users
                    (
                        username,
                        email,
                        password_hash
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3
                    )
                    RETURNING
                        id,
                        username,
                        email,
                        created_at
                `,
                [
                    username,
                    email,
                    passwordHash
                ]
            );

        const user =
            result.rows[0];

        // Prevent session fixation on account creation.
        await regenerateSession(req);

        req.session.userId =
            user.id;

        await saveSession(req);

        return res.status(201).json({
            success: true,
            user: sanitizeUser(user)
        });
    } catch (error) {
        console.error(
            "REGISTER ERROR:",
            error
        );

        if (error.code === "23505") {
            return jsonError(
                res,
                409,
                "That username or email is already in use."
            );
        }

        return jsonError(
            res,
            500,
            "Could not create account."
        );
    }
}

// ======================================================
// LOGIN
// ======================================================

async function loginUser(req, res) {
    try {
        const identifier =
            String(
                req.body.identifier ||
                req.body.email ||
                req.body.username ||
                ""
            ).trim();

        const password =
            String(
                req.body.password ||
                ""
            );

        if (!identifier || !password) {
            return jsonError(
                res,
                400,
                "Username/email and password are required."
            );
        }

        const result =
            await pool.query(
                `
                    SELECT
                        id,
                        username,
                        email,
                        password_hash,
                        created_at
                    FROM users
                    WHERE
                        LOWER(username) = LOWER($1)
                    OR
                        LOWER(email) = LOWER($1)
                    LIMIT 1
                `,
                [identifier]
            );

        if (!result.rows.length) {
            return jsonError(
                res,
                401,
                "Invalid username/email or password."
            );
        }

        const user =
            result.rows[0];

        const valid =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!valid) {
            return jsonError(
                res,
                401,
                "Invalid username/email or password."
            );
        }

        // Regenerate the session after login.
        await regenerateSession(req);

        req.session.userId =
            user.id;

        await saveSession(req);

        return res.json({
            success: true,
            user: sanitizeUser(user)
        });
    } catch (error) {
        console.error(
            "LOGIN ERROR:",
            error
        );

        return jsonError(
            res,
            500,
            "Could not log in."
        );
    }
}

// ======================================================
// AUTH ROUTES
// ======================================================

app.post(
    "/auth/register",
    registerUser
);

app.post(
    "/api/auth/register",
    registerUser
);

app.post(
    "/auth/login",
    loginUser
);

app.post(
    "/api/auth/login",
    loginUser
);

// ======================================================
// LOGOUT
// ======================================================

async function logoutUser(req, res) {
    try {
        if (req.session) {
            await destroySession(req);
        }

        res.clearCookie(
            "mirai.sid",
            sessionCookie
        );

        return res.json({
            success: true
        });
    } catch (error) {
        console.error(
            "LOGOUT ERROR:",
            error
        );

        return jsonError(
            res,
            500,
            "Could not log out."
        );
    }
}

app.post(
    "/auth/logout",
    logoutUser
);

app.post(
    "/api/auth/logout",
    logoutUser
);

// ======================================================
// CURRENT USER
// ======================================================

async function currentUser(req, res) {
    try {
        if (!req.session?.userId) {
            return res.json({
                success: true,
                loggedIn: false,
                user: null
            });
        }

        const result =
            await pool.query(
                `
                    SELECT
                        id,
                        username,
                        email,
                        created_at
                    FROM users
                    WHERE id = $1
                    LIMIT 1
                `,
                [
                    req.session.userId
                ]
            );

        if (!result.rows.length) {
            await destroySession(req).catch(() => {});

            return res.json({
                success: true,
                loggedIn: false,
                user: null
            });
        }

        return res.json({
            success: true,
            loggedIn: true,
            user:
                sanitizeUser(
                    result.rows[0]
                )
        });
    } catch (error) {
        console.error(
            "ME ERROR:",
            error
        );

        return jsonError(
            res,
            500,
            "Could not check login status."
        );
    }
}

app.get(
    "/auth/me",
    currentUser
);

app.get(
    "/api/auth/me",
    currentUser
);

// ======================================================
// MY LIST — GET
// ======================================================

app.get(
    "/api/my-list",
    requireAuth,
    async (req, res) => {
        try {
            const result =
                await pool.query(
                    `
                        SELECT
                            anime_id,
                            anime_data,
                            status,
                            episode,
                            rating,
                            saved_at
                        FROM anime_list
                        WHERE user_id = $1
                        ORDER BY saved_at DESC
                    `,
                    [
                        req.session.userId
                    ]
                );

            return res.json({
                success: true,
                data:
                    result.rows.map(
                        rowToAnime
                    )
            });
        } catch (error) {
            console.error(
                "MY LIST GET ERROR:",
                error
            );

            return jsonError(
                res,
                500,
                "Could not load your list."
            );
        }
    }
);

// ======================================================
// MY LIST — ADD / UPSERT
// ======================================================

app.post(
    "/api/my-list",
    requireAuth,
    async (req, res) => {
        try {
            const anime =
                req.body?.anime;

            const animeId =
                Number(
                    anime?.id ||
                    anime?.mal_id
                );

            if (
                !anime ||
                !isPositiveInteger(animeId)
            ) {
                return jsonError(
                    res,
                    400,
                    "Anime information is required."
                );
            }

            const status =
                normalizeStatus(
                    req.body.status ||
                    "plan"
                );

            if (
                !validateListStatus(status)
            ) {
                return jsonError(
                    res,
                    400,
                    "Invalid anime status."
                );
            }

            const episode =
                cleanEpisodeNumber(
                    req.body.episode,
                    anime
                );

            const rating =
                cleanRating(
                    req.body.rating
                );

            const totalEpisodes =
                completedEpisodeCount(
                    anime
                );

            const finalEpisode =
                status === "completed" &&
                totalEpisodes > 0
                    ? totalEpisodes
                    : episode;

            await pool.query(
                `
                    INSERT INTO anime_list
                    (
                        user_id,
                        anime_id,
                        anime_data,
                        status,
                        episode,
                        rating,
                        saved_at
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3::jsonb,
                        $4,
                        $5,
                        $6,
                        NOW()
                    )
                    ON CONFLICT (user_id, anime_id)
                    DO UPDATE SET
                        anime_data = EXCLUDED.anime_data,
                        status = EXCLUDED.status,
                        episode = EXCLUDED.episode,
                        rating = EXCLUDED.rating,
                        saved_at = NOW()
                `,
                [
                    req.session.userId,
                    animeId,
                    JSON.stringify(anime),
                    status,
                    finalEpisode,
                    rating
                ]
            );

            cacheDelete(
                `my-list:${req.session.userId}`
            );

            return res.json({
                success: true,
                message: "Anime saved."
            });
        } catch (error) {
            console.error(
                "MY LIST SAVE ERROR:",
                error
            );

            return jsonError(
                res,
                500,
                "Could not save anime."
            );
        }
    }
);

// ======================================================
// MY LIST — UPDATE STATUS / EPISODE
// ======================================================

app.patch(
    "/api/my-list/:animeId",
    requireAuth,
    async (req, res) => {
        try {
            const animeId =
                Number(
                    req.params.animeId
                );

            if (!isPositiveInteger(animeId)) {
                return jsonError(
                    res,
                    400,
                    "Invalid anime ID."
                );
            }

            const existing =
                await pool.query(
                    `
                        SELECT
                            anime_data,
                            status,
                            episode,
                            rating
                        FROM anime_list
                        WHERE
                            user_id = $1
                        AND
                            anime_id = $2
                        LIMIT 1
                    `,
                    [
                        req.session.userId,
                        animeId
                    ]
                );

            if (!existing.rows.length) {
                return jsonError(
                    res,
                    404,
                    "Anime is not in your list."
                );
            }

            const current =
                existing.rows[0];

            const status =
                req.body.status !== undefined
                    ? normalizeStatus(
                        req.body.status
                    )
                    : current.status;

            if (
                !validateListStatus(status)
            ) {
                return jsonError(
                    res,
                    400,
                    "Invalid anime status."
                );
            }

            const episode =
                cleanEpisodeNumber(
                    req.body.episode !== undefined
                        ? req.body.episode
                        : current.episode,
                    current.anime_data
                );

            const totalEpisodes =
                completedEpisodeCount(
                    current.anime_data
                );

            const finalEpisode =
                status === "completed" &&
                totalEpisodes > 0
                    ? totalEpisodes
                    : episode;

            const updated =
                await pool.query(
                    `
                        UPDATE anime_list
                        SET
                            status = $1,
                            episode = $2,
                            saved_at = NOW()
                        WHERE
                            user_id = $3
                        AND
                            anime_id = $4
                        RETURNING
                            anime_id,
                            status,
                            episode,
                            rating,
                            saved_at
                    `,
                    [
                        status,
                        finalEpisode,
                        req.session.userId,
                        animeId
                    ]
                );

            cacheDelete(
                `my-list:${req.session.userId}`
            );

            return res.json({
                success: true,
                data: {
                    animeId:
                        Number(
                            updated.rows[0]
                                .anime_id
                        ),

                    status:
                        updated.rows[0]
                            .status,

                    episode:
                        Number(
                            updated.rows[0]
                                .episode
                        ),

                    rating:
                        Number(
                            updated.rows[0]
                                .rating
                        ),

                    savedAt:
                        updated.rows[0]
                            .saved_at
                }
            });
        } catch (error) {
            console.error(
                "MY LIST UPDATE ERROR:",
                error
            );

            return jsonError(
                res,
                500,
                "Could not update anime."
            );
        }
    }
);

// ======================================================
// MY LIST — UPDATE RATING
// ======================================================

app.patch(
    "/api/my-list/:animeId/rating",
    requireAuth,
    async (req, res) => {
        try {
            const animeId =
                Number(
                    req.params.animeId
                );

            if (!isPositiveInteger(animeId)) {
                return jsonError(
                    res,
                    400,
                    "Invalid anime ID."
                );
            }

            const rating =
                cleanRating(
                    req.body.rating
                );

            const result =
                await pool.query(
                    `
                        UPDATE anime_list
                        SET
                            rating = $1,
                            saved_at = NOW()
                        WHERE
                            user_id = $2
                        AND
                            anime_id = $3
                        RETURNING
                            anime_id,
                            rating,
                            saved_at
                    `,
                    [
                        rating,
                        req.session.userId,
                        animeId
                    ]
                );

            if (!result.rows.length) {
                return jsonError(
                    res,
                    404,
                    "Anime is not in your list."
                );
            }

            cacheDelete(
                `my-list:${req.session.userId}`
            );

            return res.json({
                success: true,

                rating:
                    Number(
                        result.rows[0]
                            .rating
                    ),

                savedAt:
                    result.rows[0]
                        .saved_at
            });
        } catch (error) {
            console.error(
                "RATING UPDATE ERROR:",
                error
            );

            return jsonError(
                res,
                500,
                "Could not save rating."
            );
        }
    }
);

// ======================================================
// MY LIST — DELETE
// ======================================================

app.delete(
    "/api/my-list/:animeId",
    requireAuth,
    async (req, res) => {
        try {
            const animeId =
                Number(
                    req.params.animeId
                );

            if (!isPositiveInteger(animeId)) {
                return jsonError(
                    res,
                    400,
                    "Invalid anime ID."
                );
            }

            const result =
                await pool.query(
                    `
                        DELETE FROM anime_list
                        WHERE
                            user_id = $1
                        AND
                            anime_id = $2
                        RETURNING anime_id
                    `,
                    [
                        req.session.userId,
                        animeId
                    ]
                );

            if (!result.rows.length) {
                return jsonError(
                    res,
                    404,
                    "Anime is not in your list."
                );
            }

            cacheDelete(
                `my-list:${req.session.userId}`
            );

            return res.json({
                success: true,
                message: "Anime removed."
            });
        } catch (error) {
            console.error(
                "MY LIST DELETE ERROR:",
                error
            );

            return jsonError(
                res,
                500,
                "Could not remove anime."
            );
        }
    }
);

// ======================================================
// SEARCH
// ======================================================

app.get(
    "/anime/search",
    async (req, res) => {
        try {
            const name =
                String(
                    req.query.name ||
                    ""
                ).trim();

            if (!name) {
                return jsonError(
                    res,
                    400,
                    "Anime name is required."
                );
            }

            if (name.length > 100) {
                return jsonError(
                    res,
                    400,
                    "Search query is too long."
                );
            }

            const limit =
                clampInteger(
                    req.query.limit || 20,
                    1,
                    20
                );

            const cacheKey =
                `search:${name.toLowerCase()}:${limit}`;

            const cached =
                cacheGet(cacheKey);

            if (cached) {
                return res.json(cached);
            }

            const url =
                "https://api.myanimelist.net/v2/anime" +
                `?q=${encodeURIComponent(name)}` +
                `&limit=${limit}` +
                `&fields=${ANIME_FIELDS}`;

            const data =
                await malFetch(url);

            const payload = {
                success: true,
                data:
                    normalizeAnimeList(
                        data
                    )
            };

            cacheSet(
                cacheKey,
                payload,
                45_000
            );

            return res.json(payload);
        } catch (error) {
            console.error(
                "SEARCH ERROR:",
                error
            );

            return jsonError(
                res,
                error.status === 429
                    ? 429
                    : 502,
                "Search service is temporarily unavailable."
            );
        }
    }
);

// ======================================================
// TOP ANIME
// ======================================================

app.get(
    "/anime/top",
    async (req, res) => {
        try {
            const limit =
                clampInteger(
                    req.query.limit || 50,
                    1,
                    100
                );

            const cacheKey =
                `top:${limit}`;

            const cached =
                cacheGet(cacheKey);

            if (cached) {
                return res.json(cached);
            }

            const url =
                "https://api.myanimelist.net/v2/anime/ranking" +
                `?ranking_type=all&limit=${limit}` +
                `&fields=${ANIME_FIELDS}`;

            const data =
                await malFetch(url);

            const payload = {
                success: true,
                data:
                    normalizeAnimeList(
                        data
                    )
            };

            cacheSet(
                cacheKey,
                payload,
                60_000
            );

            return res.json(payload);
        } catch (error) {
            console.error(
                "TOP ERROR:",
                error
            );

            return jsonError(
                res,
                error.status === 429
                    ? 429
                    : 502,
                "Could not load top anime right now."
            );
        }
    }
);

// ======================================================
// TRENDING / POPULAR
// ======================================================

app.get(
    "/anime/trending",
    async (req, res) => {
        try {
            const limit =
                clampInteger(
                    req.query.limit || 20,
                    1,
                    100
                );

            const cacheKey =
                `trending:${limit}`;

            const cached =
                cacheGet(cacheKey);

            if (cached) {
                return res.json(cached);
            }

            const url =
                "https://api.myanimelist.net/v2/anime/ranking" +
                `?ranking_type=bypopularity&limit=${limit}` +
                `&fields=${ANIME_FIELDS}`;

            const data =
                await malFetch(url);

            const payload = {
                success: true,
                data:
                    normalizeAnimeList(
                        data
                    )
            };

            cacheSet(
                cacheKey,
                payload,
                60_000
            );

            return res.json(payload);
        } catch (error) {
            console.error(
                "TRENDING ERROR:",
                error
            );

            return jsonError(
                res,
                error.status === 429
                    ? 429
                    : 502,
                "Could not load trending anime right now."
            );
        }
    }
);

// ======================================================
// RANDOM
// ======================================================

app.get(
    "/anime/random",
    async (req, res) => {
        try {
            const cacheKey =
                "random-pool";

            let animeList =
                cacheGet(cacheKey);

            if (!animeList) {
                const url =
                    "https://api.myanimelist.net/v2/anime/ranking" +
                    "?ranking_type=all" +
                    "&limit=100" +
                    `&fields=${ANIME_FIELDS}`;

                const data =
                    await malFetch(url);

                animeList =
                    normalizeAnimeList(
                        data
                    );

                cacheSet(
                    cacheKey,
                    animeList,
                    10 * 60 * 1000
                );
            }

            if (!animeList.length) {
                throw new Error(
                    "No anime were returned."
                );
            }

            const anime =
                animeList[
                    Math.floor(
                        Math.random() *
                        animeList.length
                    )
                ];

            return res.json({
                success: true,
                data: anime
            });
        } catch (error) {
            console.error(
                "RANDOM ERROR:",
                error
            );

            return jsonError(
                res,
                502,
                "Could not find a random anime."
            );
        }
    }
);

// ======================================================
// OFFICIAL TRAILER / PROMO VIDEO
// ======================================================

app.get(
    "/anime/trailer/:id",
    async (req, res) => {
        try {
            const id =
                Number(
                    req.params.id
                );

            if (!isPositiveInteger(id)) {
                return jsonError(
                    res,
                    400,
                    "Invalid anime ID."
                );
            }

            const cacheKey =
                `trailer:${id}`;

            const cached =
                cacheGet(cacheKey);

            if (cached) {
                return res.json(cached);
            }

            // Jikan exposes MAL-linked promo videos.
            // We prefer an actual YouTube embed when available.
            const result =
                await jikanFetch(
                    `https://api.jikan.moe/v4/anime/${id}/videos`
                );

            const promos =
                Array.isArray(
                    result?.data?.promo
                )
                    ? result.data.promo
                    : [];

            const preferred =
                promos.find(
                    item =>
                        item?.trailer?.embed_url
                ) ||
                promos.find(
                    item =>
                        item?.trailer?.youtube_id
                ) ||
                null;

            let data = null;

            if (preferred?.trailer) {
                const youtubeId =
                    preferred.trailer.youtube_id ||
                    null;

                const embedUrl =
                    preferred.trailer.embed_url ||
                    (
                        youtubeId
                            ? `https://www.youtube.com/embed/${youtubeId}`
                            : null
                    );

                if (embedUrl) {
                    data = {
                        embed_url:
                            embedUrl,

                        youtube_id:
                            youtubeId,

                        url:
                            preferred.trailer.url ||
                            null,

                        title:
                            preferred.title ||
                            "Official Trailer"
                    };
                }
            }

            const payload = {
                success: true,
                data
            };

            // Don't repeatedly hammer Jikan for anime without trailers.
            cacheSet(
                cacheKey,
                payload,
                data
                    ? 24 * 60 * 60 * 1000
                    : 30 * 60 * 1000
            );

            return res.json(payload);
        } catch (error) {
            console.error(
                "TRAILER ERROR:",
                error
            );

            // A missing trailer is not a server failure.
            return res.json({
                success: true,
                data: null
            });
        }
    }
);

// ======================================================
// SCHEDULE
// ======================================================

const VALID_DAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
];

function normalizeBroadcastTime(
    broadcast
) {
    const time =
        broadcast?.time ||
        "";

    const day =
        String(
            broadcast?.day ||
            ""
        ).trim();

    if (!time) {
        return {
            day:
                day || null,
            time: null,
            display: "Time TBA"
        };
    }

    const match =
        /^(\d{1,2}):(\d{2})$/.exec(
            time
        );

    if (!match) {
        return {
            day:
                day || null,
            time,
            display: time
        };
    }

    const hour =
        Number(match[1]);

    const minute =
        match[2];

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";

    const twelveHour =
        hour % 12 || 12;

    return {
        day:
            day || null,

        time,

        display:
            `${twelveHour}:${minute} ${suffix}`
    };
}

async function getJikanSchedule(
    day
) {
    const cacheKey =
        `schedule:${day || "all"}`;

    const cached =
        cacheGet(cacheKey);

    if (cached) {
        return cached;
    }

    const dayPath =
        day
            ? `/${day}`
            : "";

    const url =
        `https://api.jikan.moe/v4/schedules${dayPath}`;

    const result =
        await jikanFetch(url);

    const list =
        Array.isArray(result?.data)
            ? result.data
            : [];

    const normalized =
        list
            .map(normalizeAnime)
            .filter(Boolean)
            .map(anime => ({
                ...anime,
                airing:
                    normalizeBroadcastTime(
                        anime.broadcast
                    )
            }))
            .sort((a, b) => {
                const aTime =
                    a.airing?.time ||
                    "99:99";

                const bTime =
                    b.airing?.time ||
                    "99:99";

                return aTime.localeCompare(
                    bTime
                );
            });

    const payload = {
        success: true,
        day: day || null,
        data: normalized
    };

    cacheSet(
        cacheKey,
        payload,
        5 * 60 * 1000
    );

    return payload;
}

app.get(
    "/anime/schedule",
    async (req, res) => {
        try {
            const requestedDay =
                String(
                    req.query.day ||
                    ""
                )
                    .trim()
                    .toLowerCase();

            if (
                requestedDay &&
                !VALID_DAYS.includes(
                    requestedDay
                )
            ) {
                return jsonError(
                    res,
                    400,
                    "Invalid schedule day."
                );
            }

            const payload =
                await getJikanSchedule(
                    requestedDay ||
                    null
                );

            return res.json(payload);
        } catch (error) {
            console.error(
                "SCHEDULE ERROR:",
                error
            );

            return jsonError(
                res,
                error.status === 429
                    ? 429
                    : 502,
                "Could not load the anime schedule right now."
            );
        }
    }
);

// ======================================================
// OPTIONAL: SCHEDULE DAY GROUPS
// Handy for clients that want every day at once.
// ======================================================

app.get(
    "/anime/schedule/week",
    async (req, res) => {
        try {
            const results = {};

            for (const day of VALID_DAYS) {
                const payload =
                    await getJikanSchedule(
                        day
                    );

                results[day] =
                    payload.data;
            }

            return res.json({
                success: true,
                data: results
            });
        } catch (error) {
            console.error(
                "SCHEDULE WEEK ERROR:",
                error
            );

            return jsonError(
                res,
                502,
                "Could not load the weekly schedule."
            );
        }
    }
);

// ======================================================
// OPTIONAL: ANIME DETAILS / TRAILER-FRIENDLY DATA
// ======================================================

app.get(
    "/anime/:id",
    async (req, res) => {
        try {
            const id =
                Number(
                    req.params.id
                );

            if (!isPositiveInteger(id)) {
                return jsonError(
                    res,
                    400,
                    "Invalid anime ID."
                );
            }

            const cacheKey =
                `anime:${id}`;

            const cached =
                cacheGet(cacheKey);

            if (cached) {
                return res.json(cached);
            }

            const result =
                await jikanFetch(
                    `https://api.jikan.moe/v4/anime/${id}/full`
                );

            const normalized =
                normalizeAnime(
                    result?.data
                );

            const payload = {
                success: true,
                data: normalized
            };

            cacheSet(
                cacheKey,
                payload,
                15 * 60 * 1000
            );

            return res.json(payload);
        } catch (error) {
            console.error(
                "ANIME DETAILS ERROR:",
                error
            );

            return jsonError(
                res,
                404,
                "Could not load anime details."
            );
        }
    }
);

// ======================================================
// HEALTH CHECK
// ======================================================

app.get(
    "/health",
    (req, res) => {
        res.status(200).json({
            ok: true,
            service: "mirai",
            timestamp:
                new Date().toISOString()
        });
    }
);

// ======================================================
// SERVE FRONTEND
// ======================================================

const websitePath =
    path.join(
        __dirname,
        ".."
    );

app.use(
    express.static(
        websitePath,
        {
            extensions: [
                "html"
            ],
            maxAge:
                NODE_ENV === "production"
                    ? "1h"
                    : 0
        }
    )
);

app.get(
    "/",
    (req, res) => {
        res.sendFile(
            path.join(
                websitePath,
                "index.html"
            )
        );
    }
);

// ======================================================
// API 404
// ======================================================

app.use(
    "/api",
    (req, res) => {
        jsonError(
            res,
            404,
            "API route not found."
        );
    }
);

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use(
    (
        err,
        req,
        res,
        next
    ) => {
        console.error(
            "SERVER ERROR:",
            err
        );

        if (res.headersSent) {
            return next(err);
        }

        return jsonError(
            res,
            500,
            NODE_ENV === "development"
                ? (
                    err.message ||
                    "Internal server error."
                )
                : "Internal server error."
        );
    }
);

// ======================================================
// SHUTDOWN
// ======================================================

async function shutdown(signal) {
    console.log(
        `${signal} received. Shutting MIRAI down...`
    );

    try {
        await pool.end();
    } catch (error) {
        console.error(
            "POOL SHUTDOWN ERROR:",
            error
        );
    }

    process.exit(0);
}

process.on(
    "SIGINT",
    () => shutdown("SIGINT")
);

process.on(
    "SIGTERM",
    () => shutdown("SIGTERM")
);

// ======================================================
// START SERVER
// ======================================================

async function startServer() {
    try {
        await setupDatabase();

        app.listen(
            PORT,
            () => {
                console.log(
                    `MIRAI server running on port ${PORT}`
                );

                console.log(
                    `Environment: ${NODE_ENV}`
                );
            }
        );
    } catch (error) {
        console.error(
            "MIRAI STARTUP ERROR:",
            error
        );

        process.exit(1);
    }
}

startServer();