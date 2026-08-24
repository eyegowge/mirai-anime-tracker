/* =========================================================
   MIRAI — ANIME TRACKER
   COMPLETE UPDATED SCRIPT
========================================================= */

const API_BASE = "";


/* =========================================================
   STATE
========================================================= */

let currentUser = null;
let currentAnime = null;
let currentRating = 0;

let myList = [];
let scheduleData = {};
let popularAnime = [];

let homeListIndex = 0;

const HOME_LIST_SIZE = 6;


/* =========================================================
   DOM
========================================================= */

const pages = {
    home: document.getElementById("homePage"),
    search: document.getElementById("searchPage"),
    trending: document.getElementById("trendingPage"),
    schedule: document.getElementById("schedulePage"),
    "my-list": document.getElementById("myListPage"),
    discover: document.getElementById("discoverPage"),
    random: document.getElementById("randomPage")
};

const navItems = document.querySelectorAll(".nav-item");

const accountModal = document.getElementById("accountModal");
const animeModal = document.getElementById("animeModal");
const ratingModal = document.getElementById("ratingModal");

const loginContainer = document.getElementById("loginContainer");
const registerContainer = document.getElementById("registerContainer");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginError = document.getElementById("loginError");
const registerError = document.getElementById("registerError");

const loggedOutAccount = document.getElementById("loggedOutAccount");
const loggedInAccount = document.getElementById("loggedInAccount");

const sidebarUsername = document.getElementById("sidebarUsername");
const userAvatar = document.getElementById("userAvatar");


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageName) {

    Object.values(pages).forEach(page => {
        if (page) {
            page.classList.remove("active-page");
        }
    });

    if (pages[pageName]) {
        pages[pageName].classList.add("active-page");
    }

    navItems.forEach(item => {
        item.classList.toggle(
            "active",
            item.dataset.page === pageName
        );
    });

    const sidebar = document.getElementById("sidebar");

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (pageName === "my-list") {
        renderMyList();
    }

    if (pageName === "trending") {
        loadTrending();
    }

    if (pageName === "schedule") {

        const activeTab =
            document.querySelector(".schedule-tab.active");

        loadSchedule(
            activeTab?.dataset.day || "monday"
        );
    }

    if (pageName === "discover") {
        loadDiscover();
    }
}


/* =========================================================
   SIDEBAR NAVIGATION
========================================================= */

navItems.forEach(item => {

    item.addEventListener("click", () => {

        showPage(item.dataset.page);

    });

});


/* =========================================================
   MOBILE MENU
========================================================= */

const mobileMenuBtn =
    document.getElementById("mobileMenuBtn");

if (mobileMenuBtn) {

    mobileMenuBtn.addEventListener("click", () => {

        const sidebar =
            document.getElementById("sidebar");

        if (sidebar) {
            sidebar.classList.toggle("open");
        }

    });

}


/* =========================================================
   MOBILE ACCOUNT
========================================================= */

const mobileAccountBtn =
    document.getElementById("mobileAccountBtn");

if (mobileAccountBtn) {

    mobileAccountBtn.addEventListener("click", () => {

        if (currentUser) {
            showPage("my-list");
        } else {
            openLogin();
        }

    });

}


/* =========================================================
   HERO BUTTONS
========================================================= */

function goToSearch() {

    showPage("search");

    const input =
        document.getElementById("searchInput");

    if (input) {

        setTimeout(() => {
            input.focus();
        }, 100);

    }

}


document
    .getElementById("heroSearchBtn")
    ?.addEventListener(
        "click",
        goToSearch
    );


document
    .getElementById("homeSearchBtn")
    ?.addEventListener(
        "click",
        goToSearch
    );


document
    .getElementById("heroListBtn")
    ?.addEventListener(
        "click",
        () => showPage("my-list")
    );


document
    .getElementById("listLoginBtn")
    ?.addEventListener(
        "click",
        openLogin
    );


/* =========================================================
   ACCOUNT MODAL
========================================================= */

function openAccountModal() {

    if (!accountModal) {
        return;
    }

    accountModal.classList.add("open");

    document.body.style.overflow = "hidden";
}


function closeAccountModal() {

    if (!accountModal) {
        return;
    }

    accountModal.classList.remove("open");

    restoreBodyScroll();
}


function openLogin() {

    clearAccountErrors();

    loginContainer?.classList.remove("hidden");
    registerContainer?.classList.add("hidden");

    openAccountModal();
}


function openRegister() {

    clearAccountErrors();

    loginContainer?.classList.add("hidden");
    registerContainer?.classList.remove("hidden");

    openAccountModal();
}


document
    .getElementById("sidebarLoginBtn")
    ?.addEventListener(
        "click",
        openLogin
    );


document
    .getElementById("sidebarSignupBtn")
    ?.addEventListener(
        "click",
        openRegister
    );


document
    .getElementById("showRegisterBtn")
    ?.addEventListener(
        "click",
        openRegister
    );


document
    .getElementById("showLoginBtn")
    ?.addEventListener(
        "click",
        openLogin
    );


document
    .getElementById("accountModalClose")
    ?.addEventListener(
        "click",
        closeAccountModal
    );


accountModal?.addEventListener(
    "click",
    event => {

        if (event.target === accountModal) {
            closeAccountModal();
        }

    }
);


/* =========================================================
   ACCOUNT ERRORS
========================================================= */

function showError(element, message) {

    if (!element) {
        return;
    }

    element.textContent = message;

    element.classList.add("show");
}


function clearAccountErrors() {

    loginError?.classList.remove("show");
    registerError?.classList.remove("show");

    if (loginError) {
        loginError.textContent = "";
    }

    if (registerError) {
        registerError.textContent = "";
    }
}


/* =========================================================
   LOGIN
========================================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            clearAccountErrors();

            const identifier =
                document
                    .getElementById("loginEmail")
                    ?.value
                    .trim();

            const password =
                document
                    .getElementById("loginPassword")
                    ?.value || "";

            if (!identifier || !password) {

                showError(
                    loginError,
                    "Please enter your username/email and password."
                );

                return;
            }

            const button =
                loginForm.querySelector("button");

            const originalText =
                button?.textContent || "Log In";

            if (button) {

                button.disabled = true;
                button.textContent = "Logging in...";

            }

            try {

                const response =
                    await fetch(
                        `${API_BASE}/auth/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials: "include",

                            body: JSON.stringify({
                                identifier,
                                password
                            })
                        }
                    );

                const data =
                    await response
                        .json()
                        .catch(() => ({}));

                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        data.message ||
                        "Incorrect username/email or password."
                    );
                }

                currentUser =
                    data.user || null;

                if (!currentUser) {

                    throw new Error(
                        "Login succeeded but no user account was returned."
                    );
                }

                homeListIndex = 0;

                updateAccountUI();

                await loadMyListFromServer();

                closeAccountModal();

                loginForm.reset();

                showToast(
                    `Welcome back, ${
                        currentUser.username ||
                        "User"
                    }!`,
                    "success"
                );

            } catch (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );

                showError(
                    loginError,
                    error.message ||
                    "Unable to log in."
                );

            } finally {

                if (button) {

                    button.disabled = false;
                    button.textContent = originalText;

                }

            }

        }
    );

}


/* =========================================================
   REGISTER
========================================================= */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            clearAccountErrors();

            const username =
                document
                    .getElementById("registerUsername")
                    ?.value
                    .trim() || "";

            const email =
                document
                    .getElementById("registerEmail")
                    ?.value
                    .trim() || "";

            const password =
                document
                    .getElementById("registerPassword")
                    ?.value || "";

            const confirmPassword =
                document
                    .getElementById(
                        "registerConfirmPassword"
                    )
                    ?.value || "";

            if (username.length < 3) {

                showError(
                    registerError,
                    "Username must contain at least 3 characters."
                );

                return;
            }

            if (username.length > 30) {

                showError(
                    registerError,
                    "Username must be 30 characters or fewer."
                );

                return;
            }

            if (!email.includes("@")) {

                showError(
                    registerError,
                    "Please enter a valid email address."
                );

                return;
            }

            if (password.length < 6) {

                showError(
                    registerError,
                    "Password must contain at least 6 characters."
                );

                return;
            }

            if (password !== confirmPassword) {

                showError(
                    registerError,
                    "Passwords do not match."
                );

                return;
            }

            const button =
                registerForm.querySelector("button");

            const originalText =
                button?.textContent ||
                "Create Account";

            if (button) {

                button.disabled = true;
                button.textContent = "Creating account...";

            }

            try {

                const response =
                    await fetch(
                        `${API_BASE}/auth/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials: "include",

                            body: JSON.stringify({
                                username,
                                email,
                                password
                            })
                        }
                    );

                const data =
                    await response
                        .json()
                        .catch(() => ({}));

                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        data.message ||
                        "Unable to create account."
                    );
                }

                currentUser =
                    data.user || null;

                if (!currentUser) {

                    throw new Error(
                        "Account was created but no user account was returned."
                    );
                }

                myList = [];
                homeListIndex = 0;

                updateAccountUI();

                await loadMyListFromServer();

                closeAccountModal();

                registerForm.reset();

                showToast(
                    "Your MIRAI account has been created!",
                    "success"
                );

            } catch (error) {

                console.error(
                    "REGISTER ERROR:",
                    error
                );

                showError(
                    registerError,
                    error.message ||
                    "Unable to create account."
                );

            } finally {

                if (button) {

                    button.disabled = false;
                    button.textContent = originalText;

                }

            }

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

const logoutBtn =
    document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await fetch(
                    `${API_BASE}/auth/logout`,
                    {
                        method: "POST",
                        credentials: "include"
                    }
                );

            } catch (error) {

                console.error(
                    "Logout request failed:",
                    error
                );

            }

            currentUser = null;
            myList = [];
            homeListIndex = 0;

            updateAccountUI();

            showToast(
                "You have been logged out."
            );

            showPage("home");

        }
    );

}


/* =========================================================
   SESSION CHECK
========================================================= */

async function checkSession() {

    try {

        const response =
            await fetch(
                `${API_BASE}/auth/me`,
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store"
                }
            );

        if (!response.ok) {

            currentUser = null;
            myList = [];

            updateAccountUI();

            return;
        }

        const data =
            await response.json();

        if (data.loggedIn && data.user) {

            currentUser = data.user;

            updateAccountUI();

            await loadMyListFromServer();

        } else {

            currentUser = null;
            myList = [];

            updateAccountUI();

        }

    } catch (error) {

        console.error(
            "Session check failed:",
            error
        );

        currentUser = null;
        myList = [];

        updateAccountUI();

    }

}


/* =========================================================
   ACCOUNT UI
========================================================= */

function updateAccountUI() {

    if (currentUser) {

        loggedOutAccount?.classList.add("hidden");
        loggedInAccount?.classList.remove("hidden");

        const username =
            currentUser.username ||
            currentUser.name ||
            currentUser.email
                ?.split("@")[0] ||
            "User";

        if (sidebarUsername) {
            sidebarUsername.textContent = username;
        }

        if (userAvatar) {
            userAvatar.textContent =
                username
                    .charAt(0)
                    .toUpperCase();
        }

        const listSubtitle =
            document.getElementById("listSubtitle");

        if (listSubtitle) {

            listSubtitle.textContent =
                `Your personal collection, ${username}.`;

        }

    } else {

        loggedOutAccount?.classList.remove("hidden");
        loggedInAccount?.classList.add("hidden");

        const listSubtitle =
            document.getElementById("listSubtitle");

        if (listSubtitle) {

            listSubtitle.textContent =
                "Log in to access your personal anime collection.";

        }

    }

    renderMyList();
    renderHomeList();
}


/* =========================================================
   LOAD USER LIST
========================================================= */

async function loadMyListFromServer() {

    if (!currentUser) {

        myList = [];

        renderMyList();
        renderHomeList();

        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/api/my-list`,
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store"
                }
            );

        const data =
            await response
                .json()
                .catch(() => ({}));

        if (!response.ok) {

            if (response.status === 401) {

                currentUser = null;
                myList = [];

                updateAccountUI();

                return;
            }

            throw new Error(
                data.error ||
                data.message ||
                "Could not load your list."
            );
        }

        myList =
            normalizeAnimeList(
                data.data || []
            );

        myList.sort(
            (a, b) =>
                new Date(b.savedAt || 0) -
                new Date(a.savedAt || 0)
        );

        homeListIndex = 0;

        renderMyList();
        renderHomeList();

    } catch (error) {

        console.error(
            "LOAD MY LIST ERROR:",
            error
        );

        myList = [];

        renderMyList();
        renderHomeList();

        showToast(
            "Could not load your anime list.",
            "error"
        );

    }

}


/* =========================================================
   ANIME API
========================================================= */

async function fetchAnime(url) {

    const response =
        await fetch(url);

    const data =
        await response
            .json()
            .catch(() => ({}));

    if (!response.ok) {

        throw new Error(
            data.error ||
            data.message ||
            "Anime API request failed."
        );
    }

    return data;
}


/* =========================================================
   ANIME NORMALIZER
========================================================= */

function normalizeAnime(anime) {

    if (!anime) {
        return null;
    }

    const node =
        anime.node ||
        anime;

    const id =
        node.id ||
        anime.id ||
        anime.mal_id ||
        anime.anime_id;

    return {

        ...anime,

        id,

        mal_id:
            node.id ||
            anime.mal_id ||
            anime.anime_id ||
            anime.id,

        title:
            node.title ||
            anime.title ||
            anime.name ||
            "Unknown Anime",

        image_url:
            node.main_picture?.large ||
            node.main_picture?.medium ||
            anime.image_url ||
            anime.image ||
            anime.images?.jpg?.large_image_url ||
            anime.images?.jpg?.image_url ||
            "",

        image:
            node.main_picture?.large ||
            node.main_picture?.medium ||
            anime.image ||
            anime.image_url ||
            anime.images?.jpg?.large_image_url ||
            anime.images?.jpg?.image_url ||
            "",

        score:
            node.mean ??
            anime.score ??
            anime.mal_score ??
            null,

        mal_score:
            node.mean ??
            anime.mal_score ??
            anime.score ??
            null,

        episodes:
            node.num_episodes ??
            anime.episodes ??
            anime.episode_count ??
            anime.num_episodes ??
            null,

        episode_count:
            node.num_episodes ??
            anime.episode_count ??
            anime.episodes ??
            null,

        type:
            node.media_type ||
            anime.type ||
            "Anime",

        synopsis:
            node.synopsis ||
            anime.synopsis ||
            anime.description ||
            "No synopsis available.",

        status:
            node.status ||
            anime.status ||
            "",

        start_date:
            node.start_date ||
            anime.start_date ||
            null,

        end_date:
            node.end_date ||
            anime.end_date ||
            null,

        rank:
            node.rank ??
            anime.rank ??
            null,

        popularity:
            node.popularity ??
            anime.popularity ??
            null,

        genres:
            node.genres ||
            anime.genres ||
            [],

        broadcast:
            node.broadcast ||
            anime.broadcast ||
            null,

        source:
            node.source ||
            anime.source ||
            null,

        alternative_titles:
            node.alternative_titles ||
            anime.alternative_titles ||
            null

    };
}


function normalizeAnimeList(list) {

    if (!Array.isArray(list)) {
        return [];
    }

    return list
        .map(normalizeAnime)
        .filter(Boolean);
}


/* =========================================================
   POPULAR
========================================================= */

async function loadPopularAnime() {

    const grid =
        document.getElementById("popularGrid");

    if (!grid) {
        return;
    }

    try {

        const data =
            await fetchAnime(
                "/anime/top?limit=50"
            );

        popularAnime =
            normalizeAnimeList(
                data.data || []
            );

        renderAnimeGrid(
            grid,
            popularAnime.slice(0, 12)
        );

    } catch (error) {

        grid.innerHTML = `
            <div class="loading">
                <span>
                    Unable to load anime.
                </span>
            </div>
        `;

        console.error(
            "Popular anime error:",
            error
        );

    }

}


/* =========================================================
   TRENDING
========================================================= */

async function loadTrending() {

    const grid =
        document.getElementById("trendingGrid");

    if (!grid) {
        return;
    }

    grid.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>

            <span>
                Loading trending anime...
            </span>
        </div>
    `;

    try {

        const data =
            await fetchAnime(
                "/anime/trending"
            );

        const anime =
            normalizeAnimeList(
                data.data || []
            );

        renderAnimeGrid(
            grid,
            anime.slice(0, 24)
        );

    } catch (error) {

        grid.innerHTML = `
            <div class="loading">
                <span>
                    Unable to load trending anime.
                </span>
            </div>
        `;

        console.error(
            "Trending anime error:",
            error
        );

    }

}


/* =========================================================
   SEARCH
========================================================= */

const searchForm =
    document.getElementById("searchForm");

if (searchForm) {

    searchForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const input =
                document.getElementById(
                    "searchInput"
                );

            const grid =
                document.getElementById(
                    "searchGrid"
                );

            const status =
                document.getElementById(
                    "searchStatus"
                );

            const query =
                input?.value.trim() || "";

            if (!query) {

                if (status) {
                    status.textContent =
                        "Enter an anime name to search.";
                }

                return;
            }

            if (status) {
                status.textContent = "Searching...";
            }

            if (grid) {

                grid.innerHTML = `
                    <div class="loading">
                        <div class="spinner"></div>

                        <span>
                            Searching anime...
                        </span>
                    </div>
                `;

            }

            try {

                const data =
                    await fetchAnime(
                        `/anime/search?name=${encodeURIComponent(
                            query
                        )}`
                    );

                const anime =
                    normalizeAnimeList(
                        data.data || []
                    );

                if (!anime.length) {

                    if (status) {
                        status.textContent =
                            "No anime found.";
                    }

                    if (grid) {
                        grid.innerHTML = "";
                    }

                    return;
                }

                if (status) {

                    status.textContent =
                        `${anime.length} result${
                            anime.length === 1
                                ? ""
                                : "s"
                        } found.`;

                }

                renderAnimeGrid(
                    grid,
                    anime
                );

            } catch (error) {

                if (status) {

                    status.textContent =
                        "Search failed. Please try again.";

                }

                if (grid) {
                    grid.innerHTML = "";
                }

                console.error(
                    "Search error:",
                    error
                );

            }

        }
    );

}


/* =========================================================
   ANIME GRID
========================================================= */

function renderAnimeGrid(grid, animeList) {

    if (!grid) {
        return;
    }

    if (!animeList || !animeList.length) {

        grid.innerHTML = `
            <div class="loading">
                <span>
                    No anime available.
                </span>
            </div>
        `;

        return;
    }

    grid.innerHTML =
        animeList
            .map(
                (anime, index) =>
                    animeCard(
                        anime,
                        index
                    )
            )
            .join("");

    grid
        .querySelectorAll(".anime-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            card.dataset.index
                        );

                    const anime =
                        animeList[index];

                    openAnimeModal(anime);

                }
            );

        });
}


/* =========================================================
   ANIME CARD
========================================================= */

function animeCard(anime, index) {

    anime =
        normalizeAnime(anime);

    const image =
        anime?.image_url || "";

    const title =
        anime?.title ||
        "Unknown Anime";

    const score =
        anime?.score ??
        "N/A";

    const episodes =
        anime?.episodes ??
        "?";

    const listRating =
        Number(
            anime?.rating || 0
        );

    return `
        <article
            class="anime-card"
            data-index="${index}"
        >

            <div class="anime-image-wrapper">

                ${
                    image
                        ? `
                            <img
                                class="anime-image"
                                src="${escapeHTML(image)}"
                                alt="${escapeHTML(title)}"
                                loading="lazy"
                                onerror="this.style.display='none'"
                            >
                        `
                        : `
                            <div class="anime-image-placeholder">
                                ◒
                            </div>
                        `
                }

                <div class="score-badge">
                    ★ ${escapeHTML(
                        String(score)
                    )}
                </div>

                ${
                    listRating > 0
                        ? `
                            <div class="list-rating-badge">
                                ♥ ${escapeHTML(
                                    String(listRating)
                                )}/5
                            </div>
                        `
                        : ""
                }

            </div>

            <div class="anime-card-info">

                <div class="anime-card-title">
                    ${escapeHTML(title)}
                </div>

                <div class="anime-card-meta">

                    ${
                        episodes === "?"
                            ? "Episodes unknown"
                            : `${escapeHTML(
                                String(
                                    episodes
                                )
                            )} episodes`
                    }

                </div>

            </div>

        </article>
    `;
}


/* =========================================================
   ANIME MODAL
========================================================= */

function openAnimeModal(anime) {

    currentAnime =
        normalizeAnime(anime);

    if (!currentAnime) {

        showToast(
            "Unable to open this anime.",
            "error"
        );

        return;
    }

    const image =
        currentAnime.image_url || "";

    const title =
        currentAnime.title ||
        "Unknown Anime";

    const score =
        currentAnime.score ?? "N/A";

    const episodes =
        currentAnime.episodes ?? "?";

    const type =
        currentAnime.type || "Anime";

    const synopsis =
        currentAnime.synopsis ||
        "No synopsis available.";

    const imageElement =
        document.getElementById(
            "modalAnimeImage"
        );

    if (imageElement) {

        imageElement.src = image;
        imageElement.alt = title;

        imageElement.style.display =
            image ? "" : "none";

    }

    const titleElement =
        document.getElementById(
            "modalAnimeTitle"
        );

    if (titleElement) {
        titleElement.textContent = title;
    }

    const typeElement =
        document.getElementById(
            "modalAnimeType"
        );

    if (typeElement) {

        typeElement.textContent =
            String(type).toUpperCase();

    }

    const metaElement =
        document.getElementById(
            "modalAnimeMeta"
        );

    if (metaElement) {

        metaElement.textContent =
            `★ ${score}  •  ${episodes} episodes`;

    }

    const synopsisElement =
        document.getElementById(
            "modalAnimeSynopsis"
        );

    if (synopsisElement) {
        synopsisElement.textContent =
            synopsis;
    }

    updateModalListButton();

    animeModal?.classList.add("open");

    document.body.style.overflow = "hidden";
}


function closeAnimeModal() {

    if (!animeModal) {
        return;
    }

    animeModal.classList.remove("open");

    restoreBodyScroll();
}


document
    .getElementById("animeModalClose")
    ?.addEventListener(
        "click",
        closeAnimeModal
    );


animeModal?.addEventListener(
    "click",
    event => {

        if (event.target === animeModal) {
            closeAnimeModal();
        }

    }
);


/* =========================================================
   MY LIST HELPERS
========================================================= */

function getAnimeId(anime) {

    const normalized =
        normalizeAnime(anime);

    return (
        normalized?.mal_id ||
        normalized?.id ||
        null
    );
}


function isInList(anime) {

    const id =
        getAnimeId(anime);

    if (!id) {
        return false;
    }

    return myList.some(
        item =>
            Number(
                getAnimeId(item)
            ) === Number(id)
    );
}


function getListAnime(anime) {

    const id =
        getAnimeId(anime);

    if (!id) {
        return null;
    }

    return myList.find(
        item =>
            Number(
                getAnimeId(item)
            ) === Number(id)
    );
}


function updateModalListButton() {

    const button =
        document.getElementById(
            "modalListButton"
        );

    if (!button || !currentAnime) {
        return;
    }

    if (isInList(currentAnime)) {

        button.textContent =
            "✓ In My List";

        button.classList.add(
            "in-list"
        );

    } else {

        button.textContent =
            "+ Add to My List";

        button.classList.remove(
            "in-list"
        );

    }
}


/* =========================================================
   ADD / REMOVE FROM MY LIST
========================================================= */

const modalListButton =
    document.getElementById(
        "modalListButton"
    );

if (modalListButton) {

    modalListButton.addEventListener(
        "click",
        async () => {

            if (!currentUser) {

                closeAnimeModal();
                openLogin();

                showToast(
                    "Log in to add anime to your list.",
                    "error"
                );

                return;
            }

            if (!currentAnime) {
                return;
            }

            const animeId =
                getAnimeId(currentAnime);

            if (!animeId) {

                showToast(
                    "This anime has an invalid MAL ID.",
                    "error"
                );

                return;
            }

            const alreadyInList =
                isInList(currentAnime);

            modalListButton.disabled = true;

            try {

                if (alreadyInList) {

                    const response =
                        await fetch(
                            `${API_BASE}/api/my-list/${animeId}`,
                            {
                                method: "DELETE",
                                credentials: "include"
                            }
                        );

                    const data =
                        await response
                            .json()
                            .catch(() => ({}));

                    if (!response.ok) {

                        throw new Error(
                            data.error ||
                            data.message ||
                            "Could not remove anime."
                        );

                    }

                    myList =
                        myList.filter(
                            item =>
                                Number(
                                    getAnimeId(item)
                                ) !==
                                Number(animeId)
                        );

                    showToast(
                        "Removed from My List."
                    );

                } else {

                    const response =
                        await fetch(
                            `${API_BASE}/api/my-list`,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                credentials: "include",

                                body: JSON.stringify({

                                    anime:
                                        currentAnime,

                                    status:
                                        "plan",

                                    episode:
                                        0,

                                    rating:
                                        0

                                })
                            }
                        );

                    const data =
                        await response
                            .json()
                            .catch(() => ({}));

                    if (!response.ok) {

                        throw new Error(
                            data.error ||
                            data.message ||
                            "Could not save anime."
                        );

                    }

                    const savedAnime =
                        normalizeAnime(
                            currentAnime
                        );

                    savedAnime.savedAt =
                        new Date().toISOString();

                    savedAnime.rating = 0;

                    myList.unshift(
                        savedAnime
                    );

                    homeListIndex = 0;

                    showToast(
                        "Added to My List!",
                        "success"
                    );

                }

                updateModalListButton();

                renderMyList();
                renderHomeList();

            } catch (error) {

                console.error(
                    "MY LIST ERROR:",
                    error
                );

                showToast(
                    error.message ||
                    "Could not update your list.",
                    "error"
                );

            } finally {

                modalListButton.disabled =
                    false;

            }

        }
    );

}


/* =========================================================
   MY LIST RENDER
========================================================= */

function renderMyList() {

    const container =
        document.getElementById(
            "myListContent"
        );

    const loginBox =
        document.getElementById(
            "myListLogin"
        );

    if (!container || !loginBox) {
        return;
    }

    if (!currentUser) {

        loginBox.classList.remove("hidden");

        container.innerHTML = "";

        return;
    }

    loginBox.classList.add("hidden");

    if (!myList.length) {

        container.innerHTML = `
            <div class="empty-list">

                <div class="empty-list-icon">
                    ◒
                </div>

                <h3>
                    Your list is empty
                </h3>

                <p>
                    Search for an anime and
                    add it to your collection.
                </p>

                <button
                    class="primary-button"
                    id="findAnimeButton"
                    type="button"
                >
                    Find Anime
                </button>

            </div>
        `;

        document
            .getElementById("findAnimeButton")
            ?.addEventListener(
                "click",
                () => showPage("search")
            );

        return;
    }

    myList.sort(
        (a, b) =>
            new Date(b.savedAt || 0) -
            new Date(a.savedAt || 0)
    );

    container.innerHTML = `
        <div class="anime-grid">
            ${
                myList
                    .map(
                        (anime, index) =>
                            animeCard(
                                anime,
                                index
                            )
                    )
                    .join("")
            }
        </div>
    `;

    container
        .querySelectorAll(".anime-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const anime =
                        myList[
                            Number(
                                card.dataset.index
                            )
                        ];

                    openAnimeModal(anime);

                }
            );

        });
}


/* =========================================================
   HOME LIST
========================================================= */

function getHomeListGrid() {

    return document.getElementById(
        "homeListGrid"
    );
}


function renderHomeList() {

    const grid =
        getHomeListGrid();

    if (!grid) {
        return;
    }

    if (!currentUser) {

        grid.innerHTML = `
            <div class="home-list-empty">
                <div class="home-list-empty-icon">
                    ◒
                </div>

                <h3>
                    Your list lives here
                </h3>

                <p>
                    Log in to see your recently
                    added anime on the home page.
                </p>

                <button
                    class="primary-button"
                    id="homeListLoginButton"
                    type="button"
                >
                    Log In
                </button>
            </div>
        `;

        document
            .getElementById(
                "homeListLoginButton"
            )
            ?.addEventListener(
                "click",
                openLogin
            );

        updateHomeListControls();

        return;
    }

    if (!myList.length) {

        grid.innerHTML = `
            <div class="home-list-empty">
                <div class="home-list-empty-icon">
                    ◒
                </div>

                <h3>
                    Your list is empty
                </h3>

                <p>
                    Add some anime and they'll
                    appear here, newest first.
                </p>

                <button
                    class="primary-button"
                    id="homeFindAnimeButton"
                    type="button"
                >
                    Find Anime
                </button>
            </div>
        `;

        document
            .getElementById(
                "homeFindAnimeButton"
            )
            ?.addEventListener(
                "click",
                goToSearch
            );

        updateHomeListControls();

        return;
    }

    myList.sort(
        (a, b) =>
            new Date(b.savedAt || 0) -
            new Date(a.savedAt || 0)
    );

    if (
        homeListIndex >=
        myList.length
    ) {

        homeListIndex =
            Math.max(
                0,
                Math.floor(
                    (myList.length - 1) /
                    HOME_LIST_SIZE
                ) *
                HOME_LIST_SIZE
            );

    }

    const visible =
        myList.slice(
            homeListIndex,
            homeListIndex +
                HOME_LIST_SIZE
        );

    grid.innerHTML =
        visible
            .map(
                (anime, index) =>
                    animeCard(
                        anime,
                        homeListIndex +
                        index
                    )
            )
            .join("");

    grid
        .querySelectorAll(".anime-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            card.dataset.index
                        );

                    openAnimeModal(
                        myList[index]
                    );

                }
            );

        });

    updateHomeListControls();
}


/* =========================================================
   HOME LIST CONTROLS
========================================================= */

function updateHomeListControls() {

    const previous =
        document.getElementById(
            "homeListPrevious"
        );

    const next =
        document.getElementById(
            "homeListNext"
        );

    const counter =
        document.getElementById(
            "homeListCounter"
        );

    const total =
        myList.length;

    const start =
        total
            ? homeListIndex + 1
            : 0;

    const end =
        total
            ? Math.min(
                homeListIndex +
                HOME_LIST_SIZE,
                total
            )
            : 0;

    if (previous) {

        previous.disabled =
            homeListIndex <= 0;

    }

    if (next) {

        next.disabled =
            homeListIndex +
            HOME_LIST_SIZE >=
            total;

    }

    if (counter) {

        counter.textContent =
            total
                ? `${start}-${end} of ${total}`
                : "0 anime";

    }
}


document
    .getElementById(
        "homeListPrevious"
    )
    ?.addEventListener(
        "click",
        () => {

            homeListIndex =
                Math.max(
                    0,
                    homeListIndex -
                    HOME_LIST_SIZE
                );

            renderHomeList();

        }
    );


document
    .getElementById(
        "homeListNext"
    )
    ?.addEventListener(
        "click",
        () => {

            if (
                homeListIndex +
                HOME_LIST_SIZE <
                myList.length
            ) {

                homeListIndex +=
                    HOME_LIST_SIZE;

            }

            renderHomeList();

        }
    );


/* =========================================================
   RATING
========================================================= */

const modalRateButton =
    document.getElementById(
        "modalRateButton"
    );

if (modalRateButton) {

    modalRateButton.addEventListener(
        "click",
        () => {

            if (!currentUser) {

                closeAnimeModal();
                openLogin();

                showToast(
                    "Log in to rate anime.",
                    "error"
                );

                return;
            }

            if (!currentAnime) {
                return;
            }

            const existing =
                getListAnime(
                    currentAnime
                );

            const existingRating =
                Number(
                    existing?.rating || 0
                );

            const title =
                document.getElementById(
                    "ratingAnimeTitle"
                );

            if (title) {

                title.textContent =
                    currentAnime.title ||
                    "Anime";

            }

            currentRating =
                existingRating;

            updateStars();

            closeAnimeModal();

            ratingModal?.classList.add("open");

            document.body.style.overflow =
                "hidden";

        }
    );

}


/* =========================================================
   STAR BUTTONS
========================================================= */

function updateStars() {

    document
        .querySelectorAll(".stars button")
        .forEach(star => {

            star.classList.toggle(
                "selected",
                Number(
                    star.dataset.rating
                ) <= currentRating
            );

        });

    const ratingValue =
        document.getElementById(
            "ratingValue"
        );

    if (ratingValue) {

        ratingValue.textContent =
            currentRating
                ? `${currentRating} / 5`
                : "Select a rating";

    }
}


document
    .querySelectorAll(".stars button")
    .forEach(star => {

        star.addEventListener(
            "click",
            () => {

                currentRating =
                    Number(
                        star.dataset.rating
                    );

                updateStars();

            }
        );

    });


/* =========================================================
   SUBMIT RATING
========================================================= */

const submitRating =
    document.getElementById(
        "submitRating"
    );

if (submitRating) {

    submitRating.addEventListener(
        "click",
        async () => {

            if (!currentRating) {

                showToast(
                    "Please select a rating.",
                    "error"
                );

                return;
            }

            if (
                !currentUser ||
                !currentAnime
            ) {
                return;
            }

            const animeId =
                getAnimeId(
                    currentAnime
                );

            if (!animeId) {

                showToast(
                    "Invalid anime ID.",
                    "error"
                );

                return;
            }

            if (
                !isInList(
                    currentAnime
                )
            ) {

                showToast(
                    "Add the anime to My List before rating it.",
                    "error"
                );

                closeRatingModal();

                return;
            }

            submitRating.disabled = true;

            const originalText =
                submitRating.textContent;

            submitRating.textContent =
                "Saving...";

            try {

                const response =
                    await fetch(
                        `${API_BASE}/api/my-list/${animeId}/rating`,
                        {
                            method: "PATCH",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials: "include",

                            body: JSON.stringify({
                                rating:
                                    currentRating
                            })
                        }
                    );

                const data =
                    await response
                        .json()
                        .catch(() => ({}));

                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        data.message ||
                        "Could not save rating."
                    );
                }

                const item =
                    getListAnime(
                        currentAnime
                    );

                if (item) {

                    item.rating =
                        currentRating;

                }

                currentAnime.rating =
                    currentRating;

                renderMyList();
                renderHomeList();

                showToast(
                    `Rated ${currentRating}/5!`,
                    "success"
                );

                closeRatingModal();

            } catch (error) {

                console.error(
                    "RATING ERROR:",
                    error
                );

                showToast(
                    error.message ||
                    "Could not save rating.",
                    "error"
                );

            } finally {

                submitRating.disabled =
                    false;

                submitRating.textContent =
                    originalText;

            }

        }
    );

}


/* =========================================================
   CLOSE RATING MODAL
========================================================= */

function closeRatingModal() {

    if (!ratingModal) {
        return;
    }

    ratingModal.classList.remove("open");

    restoreBodyScroll();
}


document
    .getElementById("ratingModalClose")
    ?.addEventListener(
        "click",
        closeRatingModal
    );


ratingModal?.addEventListener(
    "click",
    event => {

        if (event.target === ratingModal) {
            closeRatingModal();
        }

    }
);


/* =========================================================
   SCHEDULE
========================================================= */

async function loadSchedule(day = "monday") {

    const grid =
        document.getElementById(
            "scheduleGrid"
        );

    if (!grid) {
        return;
    }

    const safeDay =
        String(day).toLowerCase();

    grid.innerHTML = `
        <div class="loading">

            <div class="spinner"></div>

            <span>
                Loading ${escapeHTML(
                    safeDay
                )} schedule...
            </span>

        </div>
    `;

    try {

        if (!scheduleData[safeDay]) {

            const data =
                await fetchAnime(
                    `/anime/schedule?day=${encodeURIComponent(
                        safeDay
                    )}`
                );

            scheduleData[safeDay] =
                normalizeAnimeList(
                    data.data || []
                );

        }

        renderAnimeGrid(
            grid,
            scheduleData[safeDay]
        );

    } catch (error) {

        grid.innerHTML = `
            <div class="loading">
                <span>
                    Unable to load the schedule.
                </span>
            </div>
        `;

        console.error(
            "Schedule error:",
            error
        );

    }
}


/* =========================================================
   SCHEDULE TABS
========================================================= */

document
    .querySelectorAll(".schedule-tab")
    .forEach(tab => {

        tab.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".schedule-tab"
                    )
                    .forEach(item => {

                        item.classList.remove(
                            "active"
                        );

                    });

                tab.classList.add("active");

                loadSchedule(
                    tab.dataset.day ||
                    "monday"
                );

            }
        );

    });


/* =========================================================
   DISCOVER
========================================================= */

async function loadDiscover() {

    const grid =
        document.getElementById(
            "discoverGrid"
        );

    if (!grid) {
        return;
    }

    grid.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>

            <span>
                Finding something new...
            </span>
        </div>
    `;

    try {

        if (
            popularAnime &&
            popularAnime.length
        ) {

            const shuffled =
                [...popularAnime]
                    .sort(
                        () =>
                            Math.random() -
                            0.5
                    );

            renderAnimeGrid(
                grid,
                shuffled.slice(0, 24)
            );

            return;
        }

        const data =
            await fetchAnime(
                "/anime/top?limit=50"
            );

        const anime =
            normalizeAnimeList(
                data.data || []
            );

        renderAnimeGrid(
            grid,
            anime
                .sort(
                    () =>
                        Math.random() -
                        0.5
                )
                .slice(0, 24)
        );

    } catch (error) {

        grid.innerHTML = `
            <div class="loading">
                <span>
                    Unable to load Discover.
                </span>
            </div>
        `;

        console.error(
            "Discover error:",
            error
        );

    }
}


/* =========================================================
   RANDOM
========================================================= */

const randomButton =
    document.getElementById(
        "randomButton"
    );

if (randomButton) {

    randomButton.addEventListener(
        "click",
        async () => {

            const result =
                document.getElementById(
                    "randomResult"
                );

            if (result) {

                result.innerHTML = `
                    <div class="loading">

                        <div class="spinner"></div>

                        <span>
                            Finding an anime...
                        </span>

                    </div>
                `;

            }

            try {

                const data =
                    await fetchAnime(
                        "/anime/random"
                    );

                const anime =
                    normalizeAnime(
                        data.data
                    );

                if (!anime) {

                    throw new Error(
                        "No anime returned."
                    );

                }

                if (result) {
                    result.innerHTML = "";
                }

                openAnimeModal(anime);

            } catch (error) {

                if (result) {
                    result.innerHTML = "";
                }

                showToast(
                    "Unable to find a random anime.",
                    "error"
                );

                console.error(
                    "Random anime error:",
                    error
                );

            }

        }
    );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimeout;

function showToast(
    message,
    type = ""
) {

    const toast =
        document.getElementById(
            "toast"
        );

    if (!toast) {
        return;
    }

    toast.textContent =
        message;

    toast.className =
        "toast";

    if (type) {
        toast.classList.add(type);
    }

    requestAnimationFrame(() => {

        toast.classList.add("show");

    });

    clearTimeout(
        toastTimeout
    );

    toastTimeout =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   BODY SCROLL
========================================================= */

function restoreBodyScroll() {

    const anyModalOpen =
        document.querySelector(
            ".modal-overlay.open"
        );

    if (!anyModalOpen) {
        document.body.style.overflow = "";
    }
}


/* =========================================================
   ESCAPE / CLOSE MODALS
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }

        closeAccountModal();
        closeAnimeModal();
        closeRatingModal();

    }
);


/* =========================================================
   IMAGE ERROR HANDLING
========================================================= */

document.addEventListener(
    "error",
    event => {

        if (
            event.target &&
            event.target.matches &&
            event.target.matches(
                ".anime-image"
            )
        ) {

            event.target.style.display =
                "none";

        }

    },
    true
);


/* =========================================================
   STARTUP
========================================================= */

async function initializeMIRAI() {

    updateAccountUI();

    await checkSession();

    loadPopularAnime();

    const activeScheduleTab =
        document.querySelector(
            ".schedule-tab.active"
        );

    loadSchedule(
        activeScheduleTab?.dataset.day ||
        "monday"
    );

}


initializeMIRAI();