/* =========================================================
   MIRAI ANIME TRACKER
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

const navItems =
    document.querySelectorAll(".nav-item");

const accountModal =
    document.getElementById("accountModal");

const animeModal =
    document.getElementById("animeModal");

const ratingModal =
    document.getElementById("ratingModal");

const loginContainer =
    document.getElementById("loginContainer");

const registerContainer =
    document.getElementById("registerContainer");

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const loginError =
    document.getElementById("loginError");

const registerError =
    document.getElementById("registerError");

const loggedOutAccount =
    document.getElementById("loggedOutAccount");

const loggedInAccount =
    document.getElementById("loggedInAccount");

const sidebarUsername =
    document.getElementById("sidebarUsername");

const userAvatar =
    document.getElementById("userAvatar");


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

    const sidebar =
        document.getElementById("sidebar");

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
        loadSchedule("monday");
    }

}


/* =========================================================
   NAVIGATION
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
   HERO
========================================================= */

const heroSearchBtn =
    document.getElementById("heroSearchBtn");

if (heroSearchBtn) {

    heroSearchBtn.addEventListener("click", () => {

        showPage("search");

        const input =
            document.getElementById("searchInput");

        if (input) {
            input.focus();
        }

    });

}


const homeSearchBtn =
    document.getElementById("homeSearchBtn");

if (homeSearchBtn) {

    homeSearchBtn.addEventListener("click", () => {

        showPage("search");

        const input =
            document.getElementById("searchInput");

        if (input) {
            input.focus();
        }

    });

}


const heroListBtn =
    document.getElementById("heroListBtn");

if (heroListBtn) {

    heroListBtn.addEventListener("click", () => {

        showPage("my-list");

    });

}


const listLoginBtn =
    document.getElementById("listLoginBtn");

if (listLoginBtn) {

    listLoginBtn.addEventListener(
        "click",
        openLogin
    );

}


/* =========================================================
   ACCOUNT MODAL
========================================================= */

function openAccountModal() {

    if (!accountModal) return;

    accountModal.classList.add("open");

    document.body.style.overflow = "hidden";

}


function closeAccountModal() {

    if (!accountModal) return;

    accountModal.classList.remove("open");

    document.body.style.overflow = "";

}


function openLogin() {

    clearAccountErrors();

    if (loginContainer) {
        loginContainer.classList.remove("hidden");
    }

    if (registerContainer) {
        registerContainer.classList.add("hidden");
    }

    openAccountModal();

}


function openRegister() {

    clearAccountErrors();

    if (loginContainer) {
        loginContainer.classList.add("hidden");
    }

    if (registerContainer) {
        registerContainer.classList.remove("hidden");
    }

    openAccountModal();

}


const sidebarLoginBtn =
    document.getElementById("sidebarLoginBtn");

if (sidebarLoginBtn) {

    sidebarLoginBtn.addEventListener(
        "click",
        openLogin
    );

}


const sidebarSignupBtn =
    document.getElementById("sidebarSignupBtn");

if (sidebarSignupBtn) {

    sidebarSignupBtn.addEventListener(
        "click",
        openRegister
    );

}


const showRegisterBtn =
    document.getElementById("showRegisterBtn");

if (showRegisterBtn) {

    showRegisterBtn.addEventListener(
        "click",
        openRegister
    );

}


const showLoginBtn =
    document.getElementById("showLoginBtn");

if (showLoginBtn) {

    showLoginBtn.addEventListener(
        "click",
        openLogin
    );

}


const accountModalClose =
    document.getElementById("accountModalClose");

if (accountModalClose) {

    accountModalClose.addEventListener(
        "click",
        closeAccountModal
    );

}


if (accountModal) {

    accountModal.addEventListener("click", event => {

        if (event.target === accountModal) {
            closeAccountModal();
        }

    });

}


/* =========================================================
   ACCOUNT ERRORS
========================================================= */

function showError(element, message) {

    if (!element) return;

    element.textContent = message;

    element.classList.add("show");

}


function clearAccountErrors() {

    if (loginError) {

        loginError.textContent = "";

        loginError.classList.remove("show");

    }

    if (registerError) {

        registerError.textContent = "";

        registerError.classList.remove("show");

    }

}


/* =========================================================
   LOGIN
========================================================= */

if (loginForm) {

    loginForm.addEventListener("submit", async event => {

        event.preventDefault();

        clearAccountErrors();

        const identifier =
            document
                .getElementById("loginEmail")
                .value
                .trim();

        const password =
            document
                .getElementById("loginPassword")
                .value;

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
            button.textContent;

        button.disabled = true;
        button.textContent = "Logging in...";

        try {

            const response =
                await fetch(
                    `${API_BASE}/auth/login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
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
                    data.message ||
                    data.error ||
                    "Incorrect username/email or password."
                );

            }

            currentUser =
                data.user ||
                data.account ||
                null;

            if (!currentUser) {

                throw new Error(
                    "Login succeeded but no user account was returned."
                );

            }

            updateAccountUI();

            await loadMyListFromServer();

            closeAccountModal();

            loginForm.reset();

            showToast(
                `Welcome back, ${
                    currentUser.username || "User"
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

            button.disabled = false;
            button.textContent = originalText;

        }

    });

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
                    .value
                    .trim();

            const email =
                document
                    .getElementById("registerEmail")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("registerPassword")
                    .value;

            const confirmPassword =
                document
                    .getElementById(
                        "registerConfirmPassword"
                    )
                    .value;

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
                button.textContent;

            button.disabled = true;
            button.textContent = "Creating account...";

            try {

                const response =
                    await fetch(
                        `${API_BASE}/auth/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json"
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
                        data.message ||
                        data.error ||
                        "Unable to create account."
                    );

                }

                currentUser =
                    data.user ||
                    data.account ||
                    null;

                if (!currentUser) {

                    throw new Error(
                        "Account was created but no user account was returned."
                    );

                }

                myList = [];

                updateAccountUI();

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

                button.disabled = false;
                button.textContent = originalText;

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

    logoutBtn.addEventListener("click", async () => {

        try {

            const response =
                await fetch(
                    `${API_BASE}/auth/logout`,
                    {
                        method: "POST",
                        credentials: "include"
                    }
                );

            if (!response.ok) {

                console.warn(
                    "Logout returned:",
                    response.status
                );

            }

        } catch (error) {

            console.error(
                "Logout request failed:",
                error
            );

        }

        currentUser = null;

        myList = [];

        updateAccountUI();

        showToast(
            "You have been logged out."
        );

        showPage("home");

    });

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

        if (
            data.loggedIn &&
            data.user
        ) {

            currentUser =
                data.user;

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

        if (loggedOutAccount) {

            loggedOutAccount
                .classList
                .add("hidden");

        }

        if (loggedInAccount) {

            loggedInAccount
                .classList
                .remove("hidden");

        }

        const username =
            currentUser.username ||
            currentUser.name ||
            currentUser.email?.split("@")[0] ||
            "User";

        if (sidebarUsername) {

            sidebarUsername.textContent =
                username;

        }

        if (userAvatar) {

            userAvatar.textContent =
                username
                    .charAt(0)
                    .toUpperCase();

        }

        const listSubtitle =
            document.getElementById(
                "listSubtitle"
            );

        if (listSubtitle) {

            listSubtitle.textContent =
                `Your personal collection, ${username}.`;

        }

    } else {

        if (loggedOutAccount) {

            loggedOutAccount
                .classList
                .remove("hidden");

        }

        if (loggedInAccount) {

            loggedInAccount
                .classList
                .add("hidden");

        }

        const listSubtitle =
            document.getElementById(
                "listSubtitle"
            );

        if (listSubtitle) {

            listSubtitle.textContent =
                "Log in to access your personal anime collection.";

        }

    }

    renderMyList();

}


/* =========================================================
   LOAD USER'S LIST FROM DATABASE
========================================================= */

async function loadMyListFromServer() {

    if (!currentUser) {

        myList = [];

        renderMyList();

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

            throw new Error(
                data.error ||
                data.message ||
                "Could not load your list."
            );

        }

        myList =
            normalizeAnimeList(
                data.data ||
                []
            );

        renderMyList();

    } catch (error) {

        console.error(
            "LOAD MY LIST ERROR:",
            error
        );

        myList = [];

        renderMyList();

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
   MAL ANIME NORMALIZER
========================================================= */

function normalizeAnime(anime) {

    if (!anime) {
        return null;
    }

    const node =
        anime.node ||
        anime;

    return {

        ...anime,

        id:
            node.id ||
            anime.id ||
            anime.mal_id ||
            anime.anime_id,

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
            "",

        score:
            node.mean ??
            anime.score ??
            anime.mal_score ??
            null,

        episodes:
            node.num_episodes ??
            anime.episodes ??
            anime.episode_count ??
            null,

        type:
            node.media_type ||
            anime.type ||
            "Anime",

        synopsis:
            node.synopsis ||
            anime.synopsis ||
            anime.description ||
            "No synopsis available."

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

    if (!grid) return;

    try {

        const data =
            await fetchAnime("/anime/top");

        const anime =
            normalizeAnimeList(
                data.data ||
                data.results ||
                data.anime ||
                []
            );

        renderAnimeGrid(
            grid,
            anime.slice(0, 12)
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

    if (!grid) return;

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
            await fetchAnime("/anime/trending");

        const anime =
            normalizeAnimeList(
                data.data ||
                data.results ||
                data.anime ||
                []
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
                input.value.trim();

            if (!query) {

                status.textContent =
                    "Enter an anime name to search.";

                return;

            }

            status.textContent =
                "Searching...";

            grid.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>

                    <span>
                        Searching anime...
                    </span>
                </div>
            `;

            try {

                const data =
                    await fetchAnime(
                        `/anime/search?name=${encodeURIComponent(query)}`
                    );

                const anime =
                    normalizeAnimeList(
                        data.data ||
                        data.results ||
                        data.anime ||
                        []
                    );

                if (!anime.length) {

                    status.textContent =
                        "No anime found.";

                    grid.innerHTML = "";

                    return;

                }

                status.textContent =
                    `${anime.length} result${
                        anime.length === 1
                            ? ""
                            : "s"
                    } found.`;

                renderAnimeGrid(
                    grid,
                    anime
                );

            } catch (error) {

                status.textContent =
                    "Search failed. Please try again.";

                grid.innerHTML = "";

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

function renderAnimeGrid(
    grid,
    animeList
) {

    if (!grid) return;

    if (!animeList.length) {

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
            .map(animeCard)
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

function animeCard(
    anime,
    index
) {

    anime =
        normalizeAnime(anime);

    const image =
        anime.image_url ||
        "";

    const title =
        anime.title ||
        "Unknown Anime";

    const score =
        anime.score ??
        "N/A";

    const episodes =
        anime.episodes ??
        "?";

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
                        : ""
                }

                <div class="score-badge">
                    ★ ${escapeHTML(String(score))}
                </div>

            </div>

            <div class="anime-card-info">

                <div class="anime-card-title">
                    ${escapeHTML(title)}
                </div>

                <div class="anime-card-meta">

                    ${
                        episodes === "?"
                            ? "Episodes unknown"
                            : `${escapeHTML(String(episodes))} episodes`
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
        currentAnime.image_url ||
        "";

    const title =
        currentAnime.title ||
        "Unknown Anime";

    const score =
        currentAnime.score ??
        "N/A";

    const episodes =
        currentAnime.episodes ??
        "?";

    const type =
        currentAnime.type ||
        "Anime";

    const synopsis =
        currentAnime.synopsis ||
        "No synopsis available.";

    const imageElement =
        document.getElementById(
            "modalAnimeImage"
        );

    if (imageElement) {

        imageElement.src =
            image;

        imageElement.alt =
            title;

    }

    document.getElementById(
        "modalAnimeTitle"
    ).textContent =
        title;

    document.getElementById(
        "modalAnimeType"
    ).textContent =
        String(type).toUpperCase();

    document.getElementById(
        "modalAnimeMeta"
    ).textContent =
        `★ ${score}  •  ${episodes} episodes`;

    document.getElementById(
        "modalAnimeSynopsis"
    ).textContent =
        synopsis;

    updateModalListButton();

    animeModal.classList.add("open");

    document.body.style.overflow =
        "hidden";

}


function closeAnimeModal() {

    if (!animeModal) return;

    animeModal.classList.remove("open");

    document.body.style.overflow = "";

}


const animeModalClose =
    document.getElementById(
        "animeModalClose"
    );

if (animeModalClose) {

    animeModalClose.addEventListener(
        "click",
        closeAnimeModal
    );

}


if (animeModal) {

    animeModal.addEventListener(
        "click",
        event => {

            if (event.target === animeModal) {
                closeAnimeModal();
            }

        }
    );

}


/* =========================================================
   MY LIST
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
            Number(getAnimeId(item)) ===
            Number(id)
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

    } else {

        button.textContent =
            "+ Add to My List";

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

            if (!currentAnime) return;

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
                            "Could not remove anime."
                        );

                    }

                    myList =
                        myList.filter(
                            item =>
                                Number(
                                    getAnimeId(item)
                                ) !== Number(animeId)
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

                                body:
                                    JSON.stringify({
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
                            "Could not save anime."
                        );

                    }

                    myList.push(
                        normalizeAnime(
                            currentAnime
                        )
                    );

                    showToast(
                        "Added to My List!",
                        "success"
                    );

                }

                updateModalListButton();

                renderMyList();

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

                modalListButton.disabled = false;

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

        loginBox.classList.remove(
            "hidden"
        );

        container.innerHTML = "";

        return;

    }

    loginBox.classList.add(
        "hidden"
    );

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

        const button =
            document.getElementById(
                "findAnimeButton"
            );

        if (button) {

            button.addEventListener(
                "click",
                () => showPage("search")
            );

        }

        return;

    }

    container.innerHTML = `
        <div class="anime-grid">
            ${myList.map(animeCard).join("")}
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

            if (!currentAnime) return;

            document.getElementById(
                "ratingAnimeTitle"
            ).textContent =
                currentAnime.title ||
                "Anime";

            currentRating = 0;

            document
                .querySelectorAll(".stars button")
                .forEach(star => {

                    star.classList.remove(
                        "selected"
                    );

                });

            document.getElementById(
                "ratingValue"
            ).textContent =
                "Select a rating";

            closeAnimeModal();

            ratingModal.classList.add(
                "open"
            );

            document.body.style.overflow =
                "hidden";

        }
    );

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

                document
                    .querySelectorAll(
                        ".stars button"
                    )
                    .forEach(item => {

                        item.classList.toggle(
                            "selected",
                            Number(
                                item.dataset.rating
                            ) <= currentRating
                        );

                    });

                document.getElementById(
                    "ratingValue"
                ).textContent =
                    `${currentRating} / 5`;

            }
        );

    });


const submitRating =
    document.getElementById(
        "submitRating"
    );

if (submitRating) {

    submitRating.addEventListener(
        "click",
        () => {

            if (!currentRating) {

                showToast(
                    "Please select a rating.",
                    "error"
                );

                return;

            }

            showToast(
                `Rated ${currentRating}/5!`,
                "success"
            );

            closeRatingModal();

        }
    );

}


function closeRatingModal() {

    if (!ratingModal) return;

    ratingModal.classList.remove(
        "open"
    );

    document.body.style.overflow = "";

}


const ratingModalClose =
    document.getElementById(
        "ratingModalClose"
    );

if (ratingModalClose) {

    ratingModalClose.addEventListener(
        "click",
        closeRatingModal
    );

}


if (ratingModal) {

    ratingModal.addEventListener(
        "click",
        event => {

            if (event.target === ratingModal) {
                closeRatingModal();
            }

        }
    );

}


/* =========================================================
   SCHEDULE
========================================================= */

async function loadSchedule(
    day = "monday"
) {

    const grid =
        document.getElementById(
            "scheduleGrid"
        );

    if (!grid) return;

    grid.innerHTML = `
        <div class="loading">

            <div class="spinner"></div>

            <span>
                Loading ${escapeHTML(day)} schedule...
            </span>

        </div>
    `;

    try {

        if (!scheduleData[day]) {

            const data =
                await fetchAnime(
                    `/anime/schedule?day=${encodeURIComponent(day)}`
                );

            scheduleData[day] =
                normalizeAnimeList(
                    data.data ||
                    data.results ||
                    data.anime ||
                    []
                );

        }

        renderAnimeGrid(
            grid,
            scheduleData[day]
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

                tab.classList.add(
                    "active"
                );

                loadSchedule(
                    tab.dataset.day
                );

            }
        );

    });


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

            result.innerHTML = `
                <div class="loading">

                    <div class="spinner"></div>

                    <span>
                        Finding an anime...
                    </span>

                </div>
            `;

            try {

                const data =
                    await fetchAnime(
                        "/anime/random"
                    );

                const anime =
                    normalizeAnime(
                        data.data ||
                        data.anime ||
                        data.node ||
                        data
                    );

                if (!anime) {

                    throw new Error(
                        "No anime returned."
                    );

                }

                result.innerHTML = "";

                openAnimeModal(anime);

            } catch (error) {

                result.innerHTML = "";

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

    if (!toast) return;

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

    clearTimeout(toastTimeout);

    toastTimeout =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 3000);

}


/* =========================================================
   ESCAPE HTML
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
   ESCAPE MODALS
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
   STARTUP
========================================================= */

async function initializeMIRAI() {

    /*
        We check the server FIRST.

        The database now controls the user's
        login and anime list.

        Nothing important relies on localStorage.
    */

    updateAccountUI();

    await checkSession();

    loadPopularAnime();

    loadSchedule("monday");

}


initializeMIRAI();