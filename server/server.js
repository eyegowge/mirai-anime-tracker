// ======================================================
// MIRAI ANIME TRACKER
// BACKEND SERVER
// ======================================================

const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");

dotenv.config({
    path: path.join(__dirname, "..", ".env")
});

const app = express();

const PORT = process.env.PORT || 3000;

const MAL_CLIENT_ID = process.env.MAL_CLIENT_ID;
const DATABASE_URL = process.env.DATABASE_URL;
const SESSION_SECRET = process.env.SESSION_SECRET;


// ======================================================
// ENVIRONMENT CHECK
// ======================================================

if (!MAL_CLIENT_ID) {
    console.error("ERROR: MAL_CLIENT_ID was not found.");
}

if (!DATABASE_URL) {
    console.error("ERROR: DATABASE_URL was not found.");
}

if (!SESSION_SECRET) {
    console.error("ERROR: SESSION_SECRET was not found.");
}


// ======================================================
// DATABASE
// ======================================================

const pool = new Pool({
    connectionString: DATABASE_URL,

    ssl:
        process.env.NODE_ENV === "production"
            ? {
                rejectUnauthorized: false
            }
            : false
});


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

            username VARCHAR(30)
                NOT NULL
                UNIQUE,

            email VARCHAR(255)
                NOT NULL
                UNIQUE,

            password_hash TEXT
                NOT NULL,

            created_at TIMESTAMPTZ
                NOT NULL
                DEFAULT NOW()

        );
    `);


    await pool.query(`
        CREATE TABLE IF NOT EXISTS anime_list (

            id SERIAL PRIMARY KEY,

            user_id INTEGER
                NOT NULL
                REFERENCES users(id)
                ON DELETE CASCADE,

            anime_id INTEGER
                NOT NULL,

            anime_data JSONB
                NOT NULL,

            status VARCHAR(20)
                NOT NULL
                DEFAULT 'plan',

            episode INTEGER
                NOT NULL
                DEFAULT 0,

            rating NUMERIC(3,1)
                NOT NULL
                DEFAULT 0,

            saved_at TIMESTAMPTZ
                NOT NULL
                DEFAULT NOW(),

            UNIQUE(user_id, anime_id)

        );
    `);

    console.log("MIRAI database ready.");
}


// ======================================================
// MIDDLEWARE
// ======================================================

app.set("trust proxy", 1);


app.use(
    cors({
        origin: true,
        credentials: true
    })
);


app.use(
    express.json({
        limit: "2mb"
    })
);


// ======================================================
// SESSIONS
// ======================================================

app.use(
    session({

        store:
            new pgSession({
                pool,
                tableName: "user_sessions",
                createTableIfMissing: true
            }),

        secret:
            SESSION_SECRET || "development-secret-change-me",

        resave: false,

        saveUninitialized: false,

        proxy: true,

        cookie: {

            httpOnly: true,

            secure:
                process.env.NODE_ENV === "production",

            sameSite: "lax",

            maxAge:
                1000 *
                60 *
                60 *
                24 *
                30

        }

    })
);


// ======================================================
// MAL API
// ======================================================

async function malFetch(url) {

    if (!MAL_CLIENT_ID) {
        throw new Error(
            "MAL_CLIENT_ID is not configured."
        );
    }

    const response =
        await fetch(
            url,
            {
                headers: {
                    "X-MAL-CLIENT-ID":
                        MAL_CLIENT_ID
                }
            }
        );


    console.log(
        "MAL STATUS:",
        response.status
    );


    const text =
        await response.text();


    let data;


    try {

        data =
            JSON.parse(text);

    } catch {

        throw new Error(
            "MyAnimeList returned invalid JSON."
        );

    }


    if (!response.ok) {

        console.error(
            "MAL ERROR:",
            data
        );

        throw new Error(
            data?.message ||
            "MyAnimeList request failed."
        );

    }


    return data;
}


// ======================================================
// NORMALIZE MAL ANIME
// ======================================================

function normalizeAnime(item) {

    const anime =
        item?.node ||
        item;


    if (!anime) {
        return null;
    }


    const picture =
        anime.main_picture ||
        {};


    return {

        id:
            anime.id,

        mal_id:
            anime.id,

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

        genres:
            anime.genres ||
            [],

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
        data?.data ||
        []
    )
        .map(normalizeAnime)
        .filter(Boolean);

}


// ======================================================
// AUTH HELPERS
// ======================================================

function requireAuth(
    req,
    res,
    next
) {

    if (
        !req.session ||
        !req.session.userId
    ) {

        return res.status(401).json({

            success: false,

            error:
                "You must be logged in."

        });

    }

    next();
}


function sanitizeUser(user) {

    return {

        id:
            user.id,

        username:
            user.username,

        email:
            user.email,

        created_at:
            user.created_at

    };
}


// ======================================================
// SERVER STATUS
// ======================================================

app.get(
    "/api/status",
    (req, res) => {

        res.json({

            success: true,

            message:
                "MIRAI server is running.",

            loggedIn:
                Boolean(
                    req.session?.userId
                )

        });

    }
);


// ======================================================
// REGISTER
// ======================================================

async function registerUser(
    req,
    res
) {

    try {

        const username =
            String(
                req.body.username ||
                ""
            ).trim();


        const email =
            String(
                req.body.email ||
                ""
            )
                .trim()
                .toLowerCase();


        const password =
            String(
                req.body.password ||
                ""
            );


        if (
            !username ||
            !email ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Username, email, and password are required."

            });

        }


        if (
            username.length < 3 ||
            username.length > 30
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Username must be between 3 and 30 characters."

            });

        }


        if (password.length < 6) {

            return res.status(400).json({

                success: false,

                error:
                    "Password must be at least 6 characters."

            });

        }


        const existing =
            await pool.query(
                `
                    SELECT id
                    FROM users

                    WHERE LOWER(username) =
                          LOWER($1)

                       OR LOWER(email) =
                          LOWER($2)

                    LIMIT 1
                `,
                [
                    username,
                    email
                ]
            );


        if (existing.rows.length) {

            return res.status(409).json({

                success: false,

                error:
                    "A user with that username or email already exists."

            });

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
                    ($1, $2, $3)

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


        req.session.userId =
            user.id;


        await new Promise(
            (resolve, reject) => {

                req.session.save(
                    error => {

                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }

                    }
                );

            }
        );


        res.status(201).json({

            success: true,

            user:
                sanitizeUser(user)

        });


    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                "Could not create account."

        });

    }

}


// ======================================================
// LOGIN
// ======================================================

async function loginUser(
    req,
    res
) {

    try {

        const identifier =
            String(
                req.body.identifier ||
                req.body.email ||
                ""
            ).trim();


        const password =
            String(
                req.body.password ||
                ""
            );


        if (
            !identifier ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Username/email and password are required."

            });

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

                    WHERE LOWER(username) =
                          LOWER($1)

                       OR LOWER(email) =
                          LOWER($1)

                    LIMIT 1
                `,
                [
                    identifier
                ]
            );


        if (!result.rows.length) {

            return res.status(401).json({

                success: false,

                error:
                    "Invalid username/email or password."

            });

        }


        const user =
            result.rows[0];


        const valid =
            await bcrypt.compare(
                password,
                user.password_hash
            );


        if (!valid) {

            return res.status(401).json({

                success: false,

                error:
                    "Invalid username/email or password."

            });

        }


        await new Promise(
            (resolve, reject) => {

                req.session.regenerate(
                    error => {

                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }

                    }
                );

            }
        );


        req.session.userId =
            user.id;


        await new Promise(
            (resolve, reject) => {

                req.session.save(
                    error => {

                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }

                    }
                );

            }
        );


        res.json({

            success: true,

            user:
                sanitizeUser(user)

        });


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                "Could not log in."

        });

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

function logoutUser(
    req,
    res
) {

    req.session.destroy(
        error => {

            if (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );


                return res.status(500).json({

                    success: false,

                    error:
                        "Could not log out."

                });

            }


            res.clearCookie(
                "connect.sid",
                {
                    httpOnly: true,

                    secure:
                        process.env.NODE_ENV === "production",

                    sameSite: "lax"
                }
            );


            res.json({

                success: true

            });

        }
    );

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

async function currentUser(
    req,
    res
) {

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

            req.session.destroy(
                () => {}
            );


            return res.json({

                success: true,

                loggedIn: false,

                user: null

            });

        }


        res.json({

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


        res.status(500).json({

            success: false,

            error:
                "Could not check login status."

        });

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
    async (
        req,
        res
    ) => {

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


            const list =
                result.rows.map(
                    row => ({

                        ...row.anime_data,

                        id:
                            row.anime_id,

                        mal_id:
                            row.anime_id,

                        listStatus:
                            row.status,

                        status:
                            row.status,

                        episode:
                            row.episode,

                        rating:
                            Number(
                                row.rating
                            ),

                        savedAt:
                            row.saved_at

                    })
                );


            res.json({

                success: true,

                data:
                    list

            });


        } catch (error) {

            console.error(
                "MY LIST GET ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    "Could not load your list."

            });

        }

    }
);


// ======================================================
// MY LIST — ADD / UPDATE
// ======================================================

app.post(
    "/api/my-list",
    requireAuth,
    async (
        req,
        res
    ) => {

        try {

            const anime =
                req.body.anime;


            const animeId =
                Number(
                    anime?.id ||
                    anime?.mal_id
                );


            if (
                !anime ||
                !Number.isInteger(animeId) ||
                animeId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Anime information is required."

                });

            }


            const status =
                String(
                    req.body.status ||
                    "plan"
                );


            let episode =
                Number(
                    req.body.episode
                );


            if (
                !Number.isFinite(episode) ||
                episode < 0
            ) {

                episode = 0;

            }


            episode =
                Math.floor(episode);


            let rating =
                Number(
                    req.body.rating
                );


            if (
                !Number.isFinite(rating) ||
                rating < 0
            ) {

                rating = 0;

            }


            rating =
                Math.min(
                    5,
                    rating
                );


            if (
                ![
                    "plan",
                    "watching",
                    "completed"
                ].includes(status)
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid anime status."

                });

            }


            const totalEpisodes =
                Number(
                    anime.episodes
                ) ||
                Number(
                    anime.num_episodes
                ) ||
                0;


            if (
                totalEpisodes > 0
            ) {

                episode =
                    Math.min(
                        episode,
                        totalEpisodes
                    );

            }


            if (
                status === "completed" &&
                totalEpisodes > 0
            ) {

                episode =
                    totalEpisodes;

            }


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
                        $3,
                        $4,
                        $5,
                        $6,
                        NOW()
                    )

                    ON CONFLICT
                    (
                        user_id,
                        anime_id
                    )

                    DO UPDATE SET

                        anime_data =
                            EXCLUDED.anime_data,

                        status =
                            EXCLUDED.status,

                        episode =
                            EXCLUDED.episode,

                        rating =
                            EXCLUDED.rating,

                        saved_at =
                            NOW()
                `,
                [
                    req.session.userId,
                    animeId,
                    anime,
                    status,
                    episode,
                    rating
                ]
            );


            res.json({

                success: true,

                message:
                    "Anime saved."

            });


        } catch (error) {

            console.error(
                "MY LIST SAVE ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    "Could not save anime."

            });

        }

    }
);


// ======================================================
// MY LIST — UPDATE RATING
// ======================================================

app.patch(
    "/api/my-list/:animeId/rating",
    requireAuth,
    async (
        req,
        res
    ) => {

        try {

            const animeId =
                Number(
                    req.params.animeId
                );


            const rating =
                Number(
                    req.body.rating
                );


            if (
                !Number.isInteger(animeId) ||
                animeId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid anime ID."

                });

            }


            if (
                !Number.isFinite(rating) ||
                rating < 0 ||
                rating > 5
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Rating must be between 0 and 5."

                });

            }


            const result =
                await pool.query(
                    `
                        UPDATE anime_list

                        SET rating = $1

                        WHERE user_id = $2

                        AND anime_id = $3

                        RETURNING
                            anime_id,
                            rating
                    `,
                    [
                        rating,
                        req.session.userId,
                        animeId
                    ]
                );


            if (!result.rows.length) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Anime is not in your list."

                });

            }


            res.json({

                success: true,

                rating:
                    Number(
                        result.rows[0].rating
                    )

            });


        } catch (error) {

            console.error(
                "RATING UPDATE ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    "Could not save rating."

            });

        }

    }
);


// ======================================================
// MY LIST — DELETE
// ======================================================

app.delete(
    "/api/my-list/:animeId",
    requireAuth,
    async (
        req,
        res
    ) => {

        try {

            const animeId =
                Number(
                    req.params.animeId
                );


            if (
                !Number.isInteger(animeId) ||
                animeId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid anime ID."

                });

            }


            await pool.query(
                `
                    DELETE FROM anime_list

                    WHERE user_id = $1

                    AND anime_id = $2
                `,
                [
                    req.session.userId,
                    animeId
                ]
            );


            res.json({

                success: true,

                message:
                    "Anime removed."

            });


        } catch (error) {

            console.error(
                "MY LIST DELETE ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    "Could not remove anime."

            });

        }

    }
);


// ======================================================
// SEARCH
// ======================================================

app.get(
    "/anime/search",
    async (
        req,
        res
    ) => {

        try {

            const name =
                String(
                    req.query.name ||
                    ""
                ).trim();


            if (!name) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Anime name is required."

                });

            }


            const url =
                "https://api.myanimelist.net/v2/anime" +

                `?q=${encodeURIComponent(name)}` +

                "&limit=20" +

                "&fields=" +

                "id," +
                "title," +
                "main_picture," +
                "alternative_titles," +
                "start_date," +
                "end_date," +
                "synopsis," +
                "mean," +
                "rank," +
                "popularity," +
                "num_list_users," +
                "num_episodes," +
                "status," +
                "genres," +
                "media_type," +
                "broadcast," +
                "source";


            const data =
                await malFetch(url);


            res.json({

                success: true,

                data:
                    normalizeAnimeList(
                        data
                    )

            });


        } catch (error) {

            console.error(
                "SEARCH ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    "Search failed."

            });

        }

    }
);


// ======================================================
// TOP ANIME
// ======================================================

app.get(
    "/anime/top",
    async (
        req,
        res
    ) => {

        try {

            const limit =
                Math.min(
                    Math.max(
                        Number(
                            req.query.limit
                        ) || 50,
                        1
                    ),
                    100
                );


            const url =
                "https://api.myanimelist.net/v2/anime/ranking" +

                `?ranking_type=all&limit=${limit}` +

                "&fields=" +

                "id," +
                "title," +
                "main_picture," +
                "alternative_titles," +
                "start_date," +
                "end_date," +
                "synopsis," +
                "mean," +
                "rank," +
                "popularity," +
                "num_list_users," +
                "num_episodes," +
                "status," +
                "genres," +
                "media_type," +
                "broadcast," +
                "source";


            const data =
                await malFetch(url);


            res.json({

                success: true,

                data:
                    normalizeAnimeList(
                        data
                    )

            });


        } catch (error) {

            console.error(
                "TOP ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    "Could not load top anime."

            });

        }

    }
);


// ======================================================
// TRENDING
// ======================================================

app.get(
    "/anime/trending",
    async (
        req,
        res
    ) => {

        try {

            const limit =
                Math.min(
                    Math.max(
                        Number(
                            req.query.limit
                        ) || 20,
                        1
                    ),
                    100
                );


            const url =
                "https://api.myanimelist.net/v2/anime/ranking" +

                `?ranking_type=bypopularity&limit=${limit}` +

                "&fields=" +

                "id," +
                "title," +
                "main_picture," +
                "alternative_titles," +
                "start_date," +
                "end_date," +
                "synopsis," +
                "mean," +
                "rank," +
                "popularity," +
                "num_list_users," +
                "num_episodes," +
                "status," +
                "genres," +
                "media_type," +
                "broadcast," +
                "source";


            const data =
                await malFetch(url);


            res.json({

                success: true,

                data:
                    normalizeAnimeList(
                        data
                    )

            });


        } catch (error) {

            console.error(
                "TRENDING ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    "Could not load trending anime."

            });

        }

    }
);


// ======================================================
// RANDOM
// ======================================================

app.get(
    "/anime/random",
    async (
        req,
        res
    ) => {

        try {

            const url =
                "https://api.myanimelist.net/v2/anime/ranking" +

                "?ranking_type=all" +

                "&limit=100" +

                "&fields=" +

                "id," +
                "title," +
                "main_picture," +
                "alternative_titles," +
                "start_date," +
                "end_date," +
                "synopsis," +
                "mean," +
                "rank," +
                "popularity," +
                "num_list_users," +
                "num_episodes," +
                "status," +
                "genres," +
                "media_type," +
                "broadcast," +
                "source";


            const data =
                await malFetch(url);


            const animeList =
                normalizeAnimeList(
                    data
                );


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


            res.json({

                success: true,

                data:
                    anime

            });


        } catch (error) {

            console.error(
                "RANDOM ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    "Could not find a random anime."

            });

        }

    }
);


// ======================================================
// SCHEDULE
// ======================================================

app.get(
    "/anime/schedule",
    async (
        req,
        res
    ) => {

        try {

            const now =
                new Date();


            const year =
                now.getFullYear();


            const month =
                now.getMonth();


            let season;


            if (month <= 2) {

                season =
                    "winter";

            } else if (month <= 5) {

                season =
                    "spring";

            } else if (month <= 8) {

                season =
                    "summer";

            } else {

                season =
                    "fall";

            }


            const requestedDay =
                String(
                    req.query.day ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            const validDays = [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday"
            ];


            const url =
                "https://api.myanimelist.net/v2/anime/season" +

                `/${year}/${season}` +

                "?limit=100" +

                "&fields=" +

                "id," +
                "title," +
                "main_picture," +
                "alternative_titles," +
                "start_date," +
                "end_date," +
                "synopsis," +
                "mean," +
                "rank," +
                "popularity," +
                "num_list_users," +
                "num_episodes," +
                "status," +
                "genres," +
                "media_type," +
                "broadcast," +
                "source";


            const data =
                await malFetch(url);


            let anime =
                normalizeAnimeList(
                    data
                )
                .filter(
                    item =>
                        item.broadcast
                );


            if (
                validDays.includes(
                    requestedDay
                )
            ) {

                anime =
                    anime.filter(
                        item => {

                            const malDay =
                                String(
                                    item.broadcast?.day ||
                                    ""
                                )
                                    .toLowerCase();


                            return (
                                malDay ===
                                requestedDay
                            );

                        }
                    );

            }


            res.json({

                success: true,

                season,

                year,

                day:
                    requestedDay || null,

                data:
                    anime

            });


        } catch (error) {

            console.error(
                "SCHEDULE ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    "Could not load schedule."

            });

        }

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
        websitePath
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
// ERROR HANDLER
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


        res.status(500).json({

            success: false,

            error:
                "Internal server error."

        });

    }
);


// ======================================================
// START
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