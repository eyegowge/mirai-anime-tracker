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
let featuredIndex = 0;

let currentScheduleDay = "monday";

const HOME_LIST_SIZE = 6;


/* =========================================================
   DOM
========================================================= */

const pages = {
    home:
        document.getElementById("homePage"),

    search:
        document.getElementById("searchPage"),

    trending:
        document.getElementById("trendingPage"),

    schedule:
        document.getElementById("schedulePage"),

    "my-list":
        document.getElementById("myListPage"),

    discover:
        document.getElementById("discoverPage"),

    random:
        document.getElementById("randomPage")
};


const navItems =
    document.querySelectorAll(
        ".nav-item"
    );


const accountModal =
    document.getElementById(
        "accountModal"
    );


const animeModal =
    document.getElementById(
        "animeModal"
    );


const ratingModal =
    document.getElementById(
        "ratingModal"
    );


const loginContainer =
    document.getElementById(
        "loginContainer"
    );


const registerContainer =
    document.getElementById(
        "registerContainer"
    );


const loginForm =
    document.getElementById(
        "loginForm"
    );


const registerForm =
    document.getElementById(
        "registerForm"
    );


const loginError =
    document.getElementById(
        "loginError"
    );


const registerError =
    document.getElementById(
        "registerError"
    );


const loggedOutAccount =
    document.getElementById(
        "loggedOutAccount"
    );


const loggedInAccount =
    document.getElementById(
        "loggedInAccount"
    );


const sidebarUsername =
    document.getElementById(
        "sidebarUsername"
    );


const userAvatar =
    document.getElementById(
        "userAvatar"
    );


/* =========================================================
   SAFE ELEMENT HELPERS
========================================================= */

function getElement(id) {
    return document.getElementById(id);
}


function query(selector) {
    return document.querySelector(selector);
}


function queryAll(selector) {
    return document.querySelectorAll(selector);
}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageName) {

    Object.values(pages)
        .forEach(page => {

            if (page) {
                page.classList.remove(
                    "active-page"
                );
            }

        });


    if (pages[pageName]) {

        pages[pageName]
            .classList
            .add("active-page");

    }


    navItems.forEach(item => {

        item.classList.toggle(
            "active",
            item.dataset.page === pageName
        );

    });


    /*
       Support the mobile navigation too.
       The class names are kept separate so the
       desktop sidebar and mobile bottom bar
       both work together.
    */

    queryAll(
        ".mobile-nav-item"
    ).forEach(item => {

        item.classList.toggle(
            "active",
            item.dataset.page === pageName
        );

    });


    const sidebar =
        getElement("sidebar");


    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

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
            query(
                ".schedule-tab.active"
            );


        loadSchedule(
            activeTab?.dataset.day ||
            currentScheduleDay ||
            "monday"
        );

    }


    if (pageName === "discover") {

        loadDiscover();

    }

}


/* =========================================================
   DESKTOP NAVIGATION
========================================================= */

navItems.forEach(item => {

    item.addEventListener(
        "click",
        () => {

            showPage(
                item.dataset.page
            );

        }
    );

});


/* =========================================================
   MOBILE NAVIGATION
========================================================= */

queryAll(
    ".mobile-nav-item"
).forEach(item => {

    item.addEventListener(
        "click",
        () => {

            showPage(
                item.dataset.page
            );

        }
    );

});


/* =========================================================
   MOBILE MENU
========================================================= */

const mobileMenuBtn =
    getElement(
        "mobileMenuBtn"
    );


if (mobileMenuBtn) {

    mobileMenuBtn.addEventListener(
        "click",
        () => {

            const sidebar =
                getElement(
                    "sidebar"
                );


            if (sidebar) {

                sidebar.classList.toggle(
                    "open"
                );

            }

        }
    );

}


/* =========================================================
   MOBILE ACCOUNT
========================================================= */

const mobileAccountBtn =
    getElement(
        "mobileAccountBtn"
    );


if (mobileAccountBtn) {

    mobileAccountBtn.addEventListener(
        "click",
        () => {

            if (currentUser) {

                showPage(
                    "my-list"
                );

            } else {

                openLogin();

            }

        }
    );

}


/* =========================================================
   SIDEBAR OVERLAY BEHAVIOUR
========================================================= */

document.addEventListener(
    "click",
    event => {

        const sidebar =
            getElement("sidebar");


        if (!sidebar) {
            return;
        }


        if (
            !sidebar.classList.contains(
                "open"
            )
        ) {
            return;
        }


        const clickedInside =
            sidebar.contains(
                event.target
            );


        const clickedMenu =
            mobileMenuBtn &&
            mobileMenuBtn.contains(
                event.target
            );


        if (
            !clickedInside &&
            !clickedMenu
        ) {

            sidebar.classList.remove(
                "open"
            );

        }

    }
);


/* =========================================================
   HERO BUTTONS
========================================================= */

function goToSearch() {

    showPage(
        "search"
    );


    const input =
        getElement(
            "searchInput"
        );


    if (input) {

        setTimeout(
            () => input.focus(),
            100
        );

    }

}


getElement(
    "heroSearchBtn"
)?.addEventListener(
    "click",
    goToSearch
);


getElement(
    "homeSearchBtn"
)?.addEventListener(
    "click",
    goToSearch
);


getElement(
    "heroListBtn"
)?.addEventListener(
    "click",
    () => {

        showPage(
            "my-list"
        );

    }
);


getElement(
    "listLoginBtn"
)?.addEventListener(
    "click",
    openLogin
);


/* =========================================================
   BACK TO HOME
========================================================= */

queryAll(
    ".back-home-button"
).forEach(button => {

    button.addEventListener(
        "click",
        () => {

            showPage(
                "home"
            );

        }
    );

});


/* =========================================================
   GLOBAL SEARCH
========================================================= */

async function performGlobalSearch() {

    const input =
        getElement(
            "globalSearchInput"
        );


    const legacyInput =
        getElement(
            "globalSearch"
        );


    const searchInput =
        input ||
        legacyInput;


    if (!searchInput) {
        goToSearch();
        return;
    }


    const queryText =
        searchInput.value.trim();


    if (!queryText) {

        goToSearch();

        return;

    }


    const searchPageInput =
        getElement(
            "searchInput"
        );


    if (searchPageInput) {

        searchPageInput.value =
            queryText;

    }


    showPage(
        "search"
    );


    const form =
        getElement(
            "searchForm"
        );


    if (form) {

        form.dispatchEvent(
            new Event(
                "submit",
                {
                    bubbles: true,
                    cancelable: true
                }
            )
        );

        return;

    }


    await performSearch(
        queryText
    );

}


/* Search button */

getElement(
    "globalSearchButton"
)?.addEventListener(
    "click",
    performGlobalSearch
);


getElement(
    "searchButton"
)?.addEventListener(
    "click",
    performGlobalSearch
);


/* Enter key in global search */

[
    getElement(
        "globalSearchInput"
    ),

    getElement(
        "globalSearch"
    )
]
    .filter(Boolean)
    .forEach(input => {

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    performGlobalSearch();

                }

            }
        );

    });


/* =========================================================
   ACCOUNT MODAL
========================================================= */

function openAccountModal() {

    if (!accountModal) {
        return;
    }


    accountModal.classList.add(
        "open"
    );


    document.body.style.overflow =
        "hidden";

}


function closeAccountModal() {

    if (!accountModal) {
        return;
    }


    accountModal.classList.remove(
        "open"
    );


    restoreBodyScroll();

}


function openLogin() {

    clearAccountErrors();


    loginContainer
        ?.classList
        .remove("hidden");


    registerContainer
        ?.classList
        .add("hidden");


    openAccountModal();

}


function openRegister() {

    clearAccountErrors();


    loginContainer
        ?.classList
        .add("hidden");


    registerContainer
        ?.classList
        .remove("hidden");


    openAccountModal();

}


getElement(
    "sidebarLoginBtn"
)?.addEventListener(
    "click",
    openLogin
);


getElement(
    "sidebarSignupBtn"
)?.addEventListener(
    "click",
    openRegister
);


getElement(
    "showRegisterBtn"
)?.addEventListener(
    "click",
    openRegister
);


getElement(
    "showLoginBtn"
)?.addEventListener(
    "click",
    openLogin
);


getElement(
    "accountModalClose"
)?.addEventListener(
    "click",
    closeAccountModal
);


accountModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            accountModal
        ) {

            closeAccountModal();

        }

    }
);


/* =========================================================
   ACCOUNT ERRORS
========================================================= */

function showError(
    element,
    message
) {

    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.classList.add(
        "show"
    );

}


function clearAccountErrors() {

    loginError
        ?.classList
        .remove("show");


    registerError
        ?.classList
        .remove("show");


    if (loginError) {

        loginError.textContent =
            "";

    }


    if (registerError) {

        registerError.textContent =
            "";

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
                getElement(
                    "loginEmail"
                )
                ?.value
                .trim();


            const password =
                getElement(
                    "loginPassword"
                )
                ?.value ||
                "";


            if (
                !identifier ||
                !password
            ) {

                showError(
                    loginError,
                    "Please enter your username/email and password."
                );

                return;

            }


            const button =
                loginForm.querySelector(
                    "button"
                );


            const originalText =
                button?.textContent ||
                "Log In";


            if (button) {

                button.disabled =
                    true;

                button.textContent =
                    "Logging in...";

            }


            try {

                const response =
                    await fetch(
                        `${API_BASE}/auth/login`,
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials:
                                "include",

                            body:
                                JSON.stringify({
                                    identifier,
                                    password
                                })
                        }
                    );


                const data =
                    await response
                        .json()
                        .catch(
                            () => ({})
                        );


                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        data.message ||
                        "Incorrect username/email or password."
                    );

                }


                currentUser =
                    data.user ||
                    null;


                if (!currentUser) {

                    throw new Error(
                        "Login succeeded but no user account was returned."
                    );

                }


                homeListIndex =
                    0;


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

                    button.disabled =
                        false;

                    button.textContent =
                        originalText;

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
                getElement(
                    "registerUsername"
                )
                ?.value
                .trim() ||
                "";


            const email =
                getElement(
                    "registerEmail"
                )
                ?.value
                .trim() ||
                "";


            const password =
                getElement(
                    "registerPassword"
                )
                ?.value ||
                "";


            const confirmPassword =
                getElement(
                    "registerConfirmPassword"
                )
                ?.value ||
                "";


            if (
                username.length <
                3
            ) {

                showError(
                    registerError,
                    "Username must contain at least 3 characters."
                );

                return;

            }


            if (
                username.length >
                30
            ) {

                showError(
                    registerError,
                    "Username must be 30 characters or fewer."
                );

                return;

            }


            if (
                !email.includes("@")
            ) {

                showError(
                    registerError,
                    "Please enter a valid email address."
                );

                return;

            }


            if (
                password.length <
                6
            ) {

                showError(
                    registerError,
                    "Password must contain at least 6 characters."
                );

                return;

            }


            if (
                password !==
                confirmPassword
            ) {

                showError(
                    registerError,
                    "Passwords do not match."
                );

                return;

            }


            const button =
                registerForm.querySelector(
                    "button"
                );


            const originalText =
                button?.textContent ||
                "Create Account";


            if (button) {

                button.disabled =
                    true;

                button.textContent =
                    "Creating account...";

            }


            try {

                const response =
                    await fetch(
                        `${API_BASE}/auth/register`,
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials:
                                "include",

                            body:
                                JSON.stringify({
                                    username,
                                    email,
                                    password
                                })
                        }
                    );


                const data =
                    await response
                        .json()
                        .catch(
                            () => ({})
                        );


                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        data.message ||
                        "Unable to create account."
                    );

                }


                currentUser =
                    data.user ||
                    null;


                if (!currentUser) {

                    throw new Error(
                        "Account was created but no user account was returned."
                    );

                }


                myList = [];

                homeListIndex =
                    0;


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

                    button.disabled =
                        false;

                    button.textContent =
                        originalText;

                }

            }

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

const logoutBtn =
    getElement(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await fetch(
                    `${API_BASE}/auth/logout`,
                    {
                        method:
                            "POST",

                        credentials:
                            "include"
                    }
                );


            } catch (error) {

                console.error(
                    "Logout request failed:",
                    error
                );

            }


            currentUser =
                null;

            myList =
                [];

            homeListIndex =
                0;


            updateAccountUI();


            showToast(
                "You have been logged out."
            );


            showPage(
                "home"
            );

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
                    method:
                        "GET",

                    credentials:
                        "include",

                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            currentUser =
                null;

            myList =
                [];

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

            currentUser =
                null;

            myList =
                [];

            updateAccountUI();

        }


    } catch (error) {

        console.error(
            "Session check failed:",
            error
        );


        currentUser =
            null;

        myList =
            [];

        updateAccountUI();

    }

}


/* =========================================================
   ACCOUNT UI
========================================================= */

function updateAccountUI() {

    if (currentUser) {

        loggedOutAccount
            ?.classList
            .add("hidden");


        loggedInAccount
            ?.classList
            .remove("hidden");


        const username =
            currentUser.username ||
            currentUser.name ||
            currentUser.email
                ?.split("@")[0] ||
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
            getElement(
                "listSubtitle"
            );


        if (listSubtitle) {

            listSubtitle.textContent =
                `Your personal collection, ${username}.`;

        }

    } else {

        loggedOutAccount
            ?.classList
            .remove("hidden");


        loggedInAccount
            ?.classList
            .add("hidden");


        const listSubtitle =
            getElement(
                "listSubtitle"
            );


        if (listSubtitle) {

            listSubtitle.textContent =
                "Log in to access your personal anime collection.";

        }

    }


    renderMyList();

    renderHomeList();

}


/* =========================================================
   LOAD USER LIST FROM DATABASE
========================================================= */

async function loadMyListFromServer() {

    if (!currentUser) {

        myList =
            [];

        renderMyList();

        renderHomeList();

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/api/my-list`,
                {
                    method:
                        "GET",

                    credentials:
                        "include",

                    cache:
                        "no-store"
                }
            );


        const data =
            await response
                .json()
                .catch(
                    () => ({})
                );


        if (!response.ok) {

            if (
                response.status ===
                401
            ) {

                currentUser =
                    null;

                myList =
                    [];

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


        /*
           PostgreSQL already returns newest first,
           but sorting again protects the frontend
           when savedAt is present.
        */

        myList.sort(
            (a, b) =>
                new Date(
                    b.savedAt ||
                    0
                ) -
                new Date(
                    a.savedAt ||
                    0
                )
        );


        homeListIndex =
            0;


        renderMyList();

        renderHomeList();


    } catch (error) {

        console.error(
            "LOAD MY LIST ERROR:",
            error
        );


        myList =
            [];


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

async function fetchAnime(
    url
) {

    const response =
        await fetch(url);


    const data =
        await response
            .json()
            .catch(
                () => ({})
            );


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

function normalizeAnime(
    anime
) {

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
            anime.num_episodes ??
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


function normalizeAnimeList(
    list
) {

    if (!Array.isArray(list)) {
        return [];
    }


    return list
        .map(
            normalizeAnime
        )
        .filter(Boolean);

}


/* =========================================================
   POPULAR ANIME
========================================================= */

async function loadPopularAnime() {

    const grid =
        getElement(
            "popularGrid"
        );


    /*
       Your original page uses a normal grid.
       Your newer design can use featured-carousel.
       We support BOTH.
    */

    const featured =
        getElement(
            "featuredCarousel"
        );


    if (
        !grid &&
        !featured
    ) {
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


        featuredIndex =
            0;


        if (featured) {

            renderFeaturedCarousel();

        }


        if (grid) {

            renderAnimeGrid(
                grid,
                popularAnime.slice(
                    0,
                    12
                )
            );

        }


    } catch (error) {

        if (grid) {

            grid.innerHTML = `
                <div class="loading">
                    <span>
                        Unable to load anime.
                    </span>
                </div>
            `;

        }


        if (featured) {

            featured.innerHTML = `
                <div class="loading">
                    Unable to load featured anime.
                </div>
            `;

        }


        console.error(
            "Popular anime error:",
            error
        );

    }

}


/* =========================================================
   FEATURED CAROUSEL
========================================================= */

function renderFeaturedCarousel() {

    const container =
        getElement(
            "featuredCarousel"
        );


    if (
        !container
    ) {
        return;
    }


    if (
        !popularAnime.length
    ) {

        container.innerHTML = `
            <div class="loading">
                No featured anime available.
            </div>
        `;

        return;

    }


    if (
        featuredIndex >=
        popularAnime.length
    ) {

        featuredIndex =
            0;

    }


    const anime =
        popularAnime[
            featuredIndex
        ];


    const image =
        anime.image ||
        anime.image_url ||
        "";


    const score =
        anime.score ??
        "N/A";


    /*
       MAL does not provide an official trailer URL
       through the fields currently requested by your
       backend.

       Therefore the trailer container is only shown
       when your stored anime data already contains
       a legitimate embed/trailer URL.
    */

    let trailerHTML =
        "";


    const trailerURL =
        anime.trailer_url ||
        anime.trailerUrl ||
        anime.trailer?.embed_url ||
        anime.trailer?.url ||
        "";


    if (
        trailerURL &&
        /^https?:\/\//i.test(
            trailerURL
        )
    ) {

        trailerHTML = `
            <div class="trailer-container">

                <iframe
                    src="${escapeHTML(
                        trailerURL
                    )}"
                    title="${escapeHTML(
                        anime.title
                    )} trailer"
                    loading="lazy"
                    allow="
                        autoplay;
                        encrypted-media;
                        picture-in-picture
                    "
                    allowfullscreen
                ></iframe>

            </div>
        `;

    }


    container.innerHTML = `

        <article class="featured-slide">

            ${
                image
                    ? `
                        <img
                            class="featured-slide-image"
                            src="${escapeHTML(
                                image
                            )}"
                            alt="${escapeHTML(
                                anime.title
                            )}"
                        >
                    `
                    : ""
            }


            <div class="featured-slide-overlay"></div>


            <div class="featured-slide-info">

                <p class="section-kicker">
                    #${featuredIndex + 1}
                    POPULAR NOW
                </p>


                <h2>
                    ${escapeHTML(
                        anime.title
                    )}
                </h2>


                <div class="anime-meta">
                    ★ ${
                        typeof score === "number"
                            ? score.toFixed(1)
                            : escapeHTML(
                                String(score)
                            )
                    }

                    ${
                        anime.type
                            ? ` • ${escapeHTML(
                                String(
                                    anime.type
                                )
                            )}`
                            : ""
                    }

                    ${
                        anime.episodes
                            ? ` • ${escapeHTML(
                                String(
                                    anime.episodes
                                )
                            )} episodes`
                            : ""
                    }
                </div>


                <p>
                    ${escapeHTML(
                        anime.synopsis ||
                        "No synopsis available."
                    )}
                </p>


                <div class="hero-buttons">

                    <button
                        class="primary-button"
                        id="featuredOpenButton"
                        type="button"
                    >
                        View Details
                    </button>

                    <button
                        class="secondary-button"
                        id="featuredListButton"
                        type="button"
                    >
                        ${
                            isInList(anime)
                                ? "✓ In My List"
                                : "+ My List"
                        }
                    </button>

                </div>


                ${trailerHTML}

            </div>

        </article>

    `;


    getElement(
        "featuredOpenButton"
    )?.addEventListener(
        "click",
        () => {

            openAnimeModal(
                anime
            );

        }
    );


    getElement(
        "featuredListButton"
    )?.addEventListener(
        "click",
        () => {

            currentAnime =
                normalizeAnime(
                    anime
                );


            handleFeaturedListAction();

        }
    );

}


/* =========================================================
   FEATURED NEXT / PREVIOUS
========================================================= */

function nextFeaturedAnime() {

    if (
        !popularAnime.length
    ) {
        return;
    }


    featuredIndex =
        (
            featuredIndex + 1
        ) %
        popularAnime.length;


    renderFeaturedCarousel();

}


function previousFeaturedAnime() {

    if (
        !popularAnime.length
    ) {
        return;
    }


    featuredIndex =
        (
            featuredIndex -
            1 +
            popularAnime.length
        ) %
        popularAnime.length;


    renderFeaturedCarousel();

}


getElement(
    "featuredNext"
)?.addEventListener(
    "click",
    nextFeaturedAnime
);


getElement(
    "featuredPrevious"
)?.addEventListener(
    "click",
    previousFeaturedAnime
);


/*
   Also support alternate IDs from earlier versions.
*/

getElement(
    "popularNext"
)?.addEventListener(
    "click",
    nextFeaturedAnime
);


getElement(
    "popularPrev"
)?.addEventListener(
    "click",
    previousFeaturedAnime
);


/* =========================================================
   FEATURED LIST ACTION
========================================================= */

async function handleFeaturedListAction() {

    if (!currentAnime) {
        return;
    }


    if (!currentUser) {

        openLogin();

        showToast(
            "Log in to add anime to your list.",
            "error"
        );

        return;

    }


    if (
        isInList(
            currentAnime
        )
    ) {

        showPage(
            "my-list"
        );

        return;

    }


    await addAnimeToList(
        currentAnime
    );

}


/* =========================================================
   TRENDING
========================================================= */

async function loadTrending() {

    const grid =
        getElement(
            "trendingGrid"
        );


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
            anime.slice(
                0,
                24
            )
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
   SEARCH FORM
========================================================= */

const searchForm =
    getElement(
        "searchForm"
    );


if (searchForm) {

    searchForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const input =
                getElement(
                    "searchInput"
                );


            const queryText =
                input
                    ?.value
                    .trim() ||
                "";


            if (!queryText) {

                const status =
                    getElement(
                        "searchStatus"
                    );


                if (status) {

                    status.textContent =
                        "Enter an anime name to search.";

                }

                return;

            }


            await performSearch(
                queryText
            );

        }
    );

}


async function performSearch(
    queryText
) {

    const grid =
        getElement(
            "searchGrid"
        );


    const status =
        getElement(
            "searchStatus"
        );


    if (status) {

        status.textContent =
            `Searching for "${queryText}"...`;

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
                    queryText
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

                grid.innerHTML = `
                    <div class="loading">
                        No anime found.
                    </div>
                `;

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


        if (grid) {

            renderAnimeGrid(
                grid,
                anime
            );

        }


    } catch (error) {

        if (status) {

            status.textContent =
                "Search failed. Please try again.";

        }


        if (grid) {

            grid.innerHTML = `
                <div class="loading">
                    Search failed.
                </div>
            `;

        }


        console.error(
            "Search error:",
            error
        );

    }

}


/* =========================================================
   ANIME GRID
========================================================= */

function renderAnimeGrid(
    grid,
    animeList
) {

    if (!grid) {
        return;
    }


    if (
        !animeList ||
        !animeList.length
    ) {

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
        .querySelectorAll(
            ".anime-card"
        )
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


                    openAnimeModal(
                        anime
                    );

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
        normalizeAnime(
            anime
        );


    const image =
        anime?.image_url ||
        anime?.image ||
        "";


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
            anime?.rating ||
            0
        );


    const listStatus =
        anime?.listStatus ||
        anime?.status ||
        "";


    let statusText =
        "";


    if (
        listStatus ===
        "watching"
    ) {

        statusText =
            "Watching";

    } else if (
        listStatus ===
        "completed"
    ) {

        statusText =
            "Completed";

    } else if (
        listStatus ===
        "plan"
    ) {

        statusText =
            "Plan to Watch";

    }


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
                                src="${escapeHTML(
                                    image
                                )}"
                                alt="${escapeHTML(
                                    title
                                )}"
                                loading="lazy"
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
                                    String(
                                        listRating
                                    )
                                )}/5
                            </div>
                        `
                        : ""
                }

            </div>


            <div class="anime-card-info">

                <div class="anime-card-title">
                    ${escapeHTML(
                        title
                    )}
                </div>


                <div class="anime-card-meta">

                    ${
                        statusText
                            ? `${escapeHTML(
                                statusText
                            )} · `
                            : ""
                    }

                    ${
                        episodes ===
                        "?"
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

function openAnimeModal(
    anime
) {

    currentAnime =
        normalizeAnime(
            anime
        );


    if (!currentAnime) {

        showToast(
            "Unable to open this anime.",
            "error"
        );

        return;

    }


    const image =
        currentAnime.image_url ||
        currentAnime.image ||
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
        getElement(
            "modalAnimeImage"
        );


    if (imageElement) {

        imageElement.src =
            image;

        imageElement.alt =
            title;

        imageElement.style.display =
            image
                ? ""
                : "none";

    }


    const titleElement =
        getElement(
            "modalAnimeTitle"
        );


    if (titleElement) {

        titleElement.textContent =
            title;

    }


    const typeElement =
        getElement(
            "modalAnimeType"
        );


    if (typeElement) {

        typeElement.textContent =
            String(
                type
            ).toUpperCase();

    }


    const metaElement =
        getElement(
            "modalAnimeMeta"
        );


    if (metaElement) {

        metaElement.textContent =
            `★ ${score} • ${episodes} episodes`;

    }


    const synopsisElement =
        getElement(
            "modalAnimeSynopsis"
        );


    if (synopsisElement) {

        synopsisElement.textContent =
            synopsis;

    }


    /*
       Populate additional details when those fields
       exist in your HTML.
    */

    const modalStatus =
        getElement(
            "modalAnimeStatus"
        );


    if (modalStatus) {

        modalStatus.textContent =
            currentAnime.status ||
            "Unknown";

    }


    updateModalListButton();


    animeModal
        ?.classList
        .add("open");


    document.body.style.overflow =
        "hidden";

}


function closeAnimeModal() {

    if (!animeModal) {
        return;
    }


    animeModal
        .classList
        .remove("open");


    restoreBodyScroll();

}


getElement(
    "animeModalClose"
)?.addEventListener(
    "click",
    closeAnimeModal
);


animeModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            animeModal
        ) {

            closeAnimeModal();

        }

    }
);


/* =========================================================
   MY LIST HELPERS
========================================================= */

function getAnimeId(
    anime
) {

    const normalized =
        normalizeAnime(
            anime
        );


    return (
        normalized?.mal_id ||
        normalized?.id ||
        null
    );

}


function isInList(
    anime
) {

    const id =
        getAnimeId(
            anime
        );


    if (!id) {
        return false;
    }


    return myList.some(
        item =>
            Number(
                getAnimeId(
                    item
                )
            ) ===
            Number(id)
    );

}


function getListAnime(
    anime
) {

    const id =
        getAnimeId(
            anime
        );


    if (!id) {
        return null;
    }


    return myList.find(
        item =>
            Number(
                getAnimeId(
                    item
                )
            ) ===
            Number(id)
    );

}


function updateModalListButton() {

    const button =
        getElement(
            "modalListButton"
        );


    if (
        !button ||
        !currentAnime
    ) {

        return;

    }


    if (
        isInList(
            currentAnime
        )
    ) {

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
   ADD ANIME HELPER
========================================================= */

async function addAnimeToList(
    anime,
    status = "plan",
    episode = 0,
    rating = 0
) {

    if (!currentUser) {

        openLogin();

        return false;

    }


    const normalized =
        normalizeAnime(
            anime
        );


    const animeId =
        getAnimeId(
            normalized
        );


    if (!animeId) {

        showToast(
            "This anime has an invalid MAL ID.",
            "error"
        );

        return false;

    }


    try {

        const response =
            await fetch(
                `${API_BASE}/api/my-list`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials:
                        "include",

                    body:
                        JSON.stringify({
                            anime:
                                normalized,

                            status,

                            episode,

                            rating
                        })
                }
            );


        const data =
            await response
                .json()
                .catch(
                    () => ({})
                );


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.message ||
                "Could not save anime."
            );

        }


        await loadMyListFromServer();


        showToast(
            "Added to My List!",
            "success"
        );


        updateModalListButton();


        if (
            getElement(
                "featuredListButton"
            )
        ) {

            renderFeaturedCarousel();

        }


        return true;


    } catch (error) {

        console.error(
            "ADD ANIME ERROR:",
            error
        );


        showToast(
            error.message ||
            "Could not add anime.",
            "error"
        );


        return false;

    }

}


/* =========================================================
   REMOVE ANIME
========================================================= */

async function removeAnimeFromList(
    anime
) {

    if (!currentUser) {
        return false;
    }


    const animeId =
        getAnimeId(
            anime
        );


    if (!animeId) {
        return false;
    }


    try {

        const response =
            await fetch(
                `${API_BASE}/api/my-list/${animeId}`,
                {
                    method:
                        "DELETE",

                    credentials:
                        "include"
                }
            );


        const data =
            await response
                .json()
                .catch(
                    () => ({})
                );


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
                        getAnimeId(
                            item
                        )
                    ) !==
                    Number(
                        animeId
                    )
            );


        renderMyList();

        renderHomeList();

        updateModalListButton();


        showToast(
            "Removed from My List."
        );


        return true;


    } catch (error) {

        console.error(
            "REMOVE ANIME ERROR:",
            error
        );


        showToast(
            error.message ||
            "Could not remove anime.",
            "error"
        );


        return false;

    }

}


/* =========================================================
   ADD / REMOVE BUTTON
========================================================= */

const modalListButton =
    getElement(
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


            modalListButton.disabled =
                true;


            try {

                if (
                    isInList(
                        currentAnime
                    )
                ) {

                    await removeAnimeFromList(
                        currentAnime
                    );


                } else {

                    await addAnimeToList(
                        currentAnime
                    );

                }


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
        getElement(
            "myListContent"
        );


    const loginBox =
        getElement(
            "myListLogin"
        );


    if (
        !container ||
        !loginBox
    ) {

        return;

    }


    if (!currentUser) {

        loginBox
            .classList
            .remove("hidden");


        container.innerHTML =
            "";


        return;

    }


    loginBox
        .classList
        .add("hidden");


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


        getElement(
            "findAnimeButton"
        )?.addEventListener(
            "click",
            goToSearch
        );


        return;

    }


    myList.sort(
        (a, b) =>
            new Date(
                b.savedAt || 0
            ) -
            new Date(
                a.savedAt || 0
            )
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
        .querySelectorAll(
            ".anime-card"
        )
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

}


/* =========================================================
   HOME LIST
========================================================= */

function getHomeListGrid() {

    return getElement(
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


        getElement(
            "homeListLoginButton"
        )?.addEventListener(
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


        getElement(
            "homeFindAnimeButton"
        )?.addEventListener(
            "click",
            goToSearch
        );


        updateHomeListControls();


        return;

    }


    myList.sort(
        (a, b) =>
            new Date(
                b.savedAt || 0
            ) -
            new Date(
                a.savedAt || 0
            )
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
        .querySelectorAll(
            ".anime-card"
        )
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
        getElement(
            "homeListPrevious"
        );


    const next =
        getElement(
            "homeListNext"
        );


    const counter =
        getElement(
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


/* Home previous */

getElement(
    "homeListPrevious"
)?.addEventListener(
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


/* Home next */

getElement(
    "homeListNext"
)?.addEventListener(
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
   RATING MODAL
========================================================= */

const modalRateButton =
    getElement(
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


            if (
                !isInList(
                    currentAnime
                )
            ) {

                showToast(
                    "Add the anime to My List before rating it.",
                    "error"
                );


                return;

            }


            const existing =
                getListAnime(
                    currentAnime
                );


            const existingRating =
                Number(
                    existing?.rating ||
                    0
                );


            const title =
                getElement(
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


            ratingModal
                ?.classList
                .add("open");


            document.body.style.overflow =
                "hidden";

        }
    );

}


/* =========================================================
   STAR BUTTONS
========================================================= */

function updateStars() {

    queryAll(
        ".stars button"
    ).forEach(star => {

        star.classList.toggle(
            "selected",
            Number(
                star.dataset.rating
            ) <=
            currentRating
        );

    });


    const ratingValue =
        getElement(
            "ratingValue"
        );


    if (ratingValue) {

        ratingValue.textContent =
            currentRating
                ? `${currentRating} / 5`
                : "Select a rating";

    }

}


queryAll(
    ".stars button"
).forEach(star => {

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
    getElement(
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


            submitRating.disabled =
                true;


            const originalText =
                submitRating.textContent;


            submitRating.textContent =
                "Saving...";


            try {

                const response =
                    await fetch(
                        `${API_BASE}/api/my-list/${animeId}/rating`,
                        {
                            method:
                                "PATCH",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            credentials:
                                "include",

                            body:
                                JSON.stringify({
                                    rating:
                                        currentRating
                                })
                        }
                    );


                const data =
                    await response
                        .json()
                        .catch(
                            () => ({})
                        );


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


    ratingModal
        .classList
        .remove("open");


    restoreBodyScroll();

}


getElement(
    "ratingModalClose"
)?.addEventListener(
    "click",
    closeRatingModal
);


ratingModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            ratingModal
        ) {

            closeRatingModal();

        }

    }
);


/* =========================================================
   SCHEDULE
========================================================= */

/*
   MAL's broadcast data has:
       broadcast.day
       broadcast.start_time / time

   The backend currently forwards broadcast directly,
   so this frontend supports both forms.
*/


function parseBroadcastTime(
    anime
) {

    const broadcast =
        anime?.broadcast;


    if (!broadcast) {
        return null;
    }


    const raw =
        broadcast.start_time ||
        broadcast.time ||
        "";


    if (!raw) {
        return null;
    }


    const match =
        String(
            raw
        ).match(
            /^(\d{1,2}):(\d{2})/
        );


    if (!match) {
        return null;
    }


    const hour =
        Number(
            match[1]
        );


    const minute =
        Number(
            match[2]
        );


    if (
        hour < 0 ||
        hour > 23 ||
        minute < 0 ||
        minute > 59
    ) {

        return null;

    }


    return {
        hour,
        minute
    };

}


function formatHourLabel(
    hour,
    minute = 0
) {

    const period =
        hour >= 12
            ? "PM"
            : "AM";


    const twelveHour =
        hour % 12 ||
        12;


    return `${twelveHour}:${String(
        minute
    ).padStart(
        2,
        "0"
    )} ${period}`;

}


function getScheduleSortValue(
    anime
) {

    const time =
        parseBroadcastTime(
            anime
        );


    if (!time) {
        return Infinity;
    }


    return (
        time.hour *
        60 +
        time.minute
    );

}


async function loadSchedule(
    day = "monday"
) {

    const grid =
        getElement(
            "scheduleGrid"
        );


    if (!grid) {
        return;
    }


    currentScheduleDay =
        String(
            day
        ).toLowerCase();


    grid.innerHTML = `
        <div class="loading">

            <div class="spinner"></div>

            <span>
                Loading ${escapeHTML(
                    currentScheduleDay
                )} schedule...
            </span>

        </div>
    `;


    updateScheduleTabState(
        currentScheduleDay
    );


    try {

        if (
            !scheduleData[
                currentScheduleDay
            ]
        ) {

            const data =
                await fetchAnime(
                    `/anime/schedule?day=${encodeURIComponent(
                        currentScheduleDay
                    )}`
                );


            scheduleData[
                currentScheduleDay
            ] =
                normalizeAnimeList(
                    data.data || []
                );

        }


        renderScheduleGrid(
            grid,
            scheduleData[
                currentScheduleDay
            ]
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
   SCHEDULE TAB STATE
========================================================= */

function updateScheduleTabState(
    activeDay
) {

    queryAll(
        ".schedule-tab"
    ).forEach(tab => {

        tab.classList.toggle(
            "active",
            String(
                tab.dataset.day
            ).toLowerCase() ===
            activeDay
        );

    });

}


/* =========================================================
   SCHEDULE RENDER
========================================================= */

function renderScheduleGrid(
    grid,
    animeList
) {

    if (
        !animeList ||
        !animeList.length
    ) {

        grid.innerHTML = `
            <div class="loading">
                <span>
                    No anime found airing on this day.
                </span>
            </div>
        `;

        return;

    }


    const sorted =
        [...animeList].sort(
            (
                a,
                b
            ) =>
                getScheduleSortValue(
                    a
                ) -
                getScheduleSortValue(
                    b
                )
        );


    const grouped =
        new Map();


    sorted.forEach(
        anime => {

            const time =
                parseBroadcastTime(
                    anime
                );


            const key =
                time
                    ? `${time.hour}:${time.minute}`
                    : "unknown";


            if (
                !grouped.has(
                    key
                )
            ) {

                grouped.set(
                    key,
                    []
                );

            }


            grouped
                .get(key)
                .push(anime);

        }
    );


    const groups =
        [...grouped.entries()]
            .sort(
                (
                    a,
                    b
                ) => {

                    if (
                        a[0] ===
                        "unknown"
                    ) {
                        return 1;
                    }


                    if (
                        b[0] ===
                        "unknown"
                    ) {
                        return -1;
                    }


                    const [
                        ah,
                        am
                    ] =
                        a[0]
                            .split(":")
                            .map(Number);


                    const [
                        bh,
                        bm
                    ] =
                        b[0]
                            .split(":")
                            .map(Number);


                    return (
                        ah * 60 +
                        am
                    ) -
                    (
                        bh * 60 +
                        bm
                    );

                }
            );


    grid.innerHTML = `
        <div class="schedule-list">

            ${
                groups
                    .map(
                        ([key, animeItems]) => {

                            const timeLabel =
                                key ===
                                "unknown"

                                    ? "Time unknown"

                                    : formatHourLabel(
                                        Number(
                                            key.split(
                                                ":"
                                            )[0]
                                        ),
                                        Number(
                                            key.split(
                                                ":"
                                            )[1]
                                        )
                                    );


                            return `
                                <section
                                    class="schedule-hour"
                                >

                                    <div
                                        class="schedule-time"
                                    >
                                        ${escapeHTML(
                                            timeLabel
                                        )}
                                    </div>


                                    <div>

                                        ${
                                            animeItems
                                                .map(
                                                    anime =>
                                                        `
                                                            <article
                                                                class="schedule-anime"
                                                                data-anime-id="${escapeHTML(
                                                                    String(
                                                                        getAnimeId(
                                                                            anime
                                                                        )
                                                                    )
                                                                )}"
                                                            >

                                                                ${
                                                                    anime.image
                                                                        ? `
                                                                            <img
                                                                                src="${escapeHTML(
                                                                                    anime.image
                                                                                )}"
                                                                                alt="${escapeHTML(
                                                                                    anime.title
                                                                                )}"
                                                                                loading="lazy"
                                                                            >
                                                                        `
                                                                        : ""
                                                                }


                                                                <div>

                                                                    <strong>
                                                                        ${escapeHTML(
                                                                            anime.title
                                                                        )}
                                                                    </strong>


                                                                    <div class="anime-card-meta">
                                                                        ${
                                                                            anime.broadcast?.day
                                                                                ? escapeHTML(
                                                                                    String(
                                                                                        anime.broadcast.day
                                                                                    )
                                                                                )
                                                                                : ""
                                                                        }

                                                                        ${
                                                                            anime.episodes
                                                                                ? ` • ${escapeHTML(
                                                                                    String(
                                                                                        anime.episodes
                                                                                    )
                                                                                )} episodes`
                                                                                : ""
                                                                        }
                                                                    </div>

                                                                </div>

                                                            </article>
                                                        `
                                                )
                                                .join("")
                                        }

                                    </div>

                                </section>
                            `;

                        }
                    )
                    .join("")
            }

        </div>
    `;


    grid
        .querySelectorAll(
            ".schedule-anime"
        )
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    const id =
                        Number(
                            item.dataset.animeId
                        );


                    const anime =
                        animeList.find(
                            entry =>
                                Number(
                                    getAnimeId(
                                        entry
                                    )
                                ) ===
                                id
                        );


                    if (anime) {

                        openAnimeModal(
                            anime
                        );

                    }

                }
            );

        });

}


/* =========================================================
   SCHEDULE TABS
========================================================= */

queryAll(
    ".schedule-tab"
).forEach(tab => {

    tab.addEventListener(
        "click",
        () => {

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
        getElement(
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

        let anime =
            [];


        if (
            popularAnime &&
            popularAnime.length
        ) {

            anime =
                [...popularAnime]
                    .sort(
                        () =>
                            Math.random() -
                            0.5
                    );


        } else {

            const data =
                await fetchAnime(
                    "/anime/top?limit=50"
                );


            anime =
                normalizeAnimeList(
                    data.data || []
                );


        }


        renderAnimeGrid(
            grid,
            anime.slice(
                0,
                24
            )
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
    getElement(
        "randomButton"
    );


if (randomButton) {

    randomButton.addEventListener(
        "click",
        async () => {

            const result =
                getElement(
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

                    result.innerHTML =
                        "";

                }


                openAnimeModal(
                    anime
                );


            } catch (error) {

                if (result) {

                    result.innerHTML =
                        "";

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
        getElement(
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

        toast.classList.add(
            type
        );

    }


    requestAnimationFrame(
        () => {

            toast.classList.add(
                "show"
            );

        }
    );


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

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   BODY SCROLL
========================================================= */

function restoreBodyScroll() {

    const anyModalOpen =
        query(
            ".modal-overlay.open"
        );


    if (!anyModalOpen) {

        document.body.style.overflow =
            "";

    }

}


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

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

        const target =
            event.target;


        if (
            target &&
            target.matches &&
            target.matches(
                ".anime-image, .modal-anime-image, .featured-slide-image"
            )
        ) {

            target.style.display =
                "none";

        }

    },
    true
);


/* =========================================================
   KEYBOARD CAROUSEL SUPPORT
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "ArrowRight"
        ) {

            const tag =
                document.activeElement
                    ?.tagName
                    ?.toLowerCase();


            if (
                tag ===
                "input" ||
                tag ===
                "textarea" ||
                tag ===
                "select"
            ) {

                return;

            }


            if (
                statePageIsHome()
            ) {

                nextFeaturedAnime();

            }

        }


        if (
            event.key ===
            "ArrowLeft"
        ) {

            const tag =
                document.activeElement
                    ?.tagName
                    ?.toLowerCase();


            if (
                tag ===
                "input" ||
                tag ===
                "textarea" ||
                tag ===
                "select"
            ) {

                return;

            }


            if (
                statePageIsHome()
            ) {

                previousFeaturedAnime();

            }

        }

    }
);


function statePageIsHome() {

    const homePage =
        pages.home;


    return (
        homePage &&
        homePage.classList.contains(
            "active-page"
        )
    );

}


/* =========================================================
   TOUCH SWIPE FOR FEATURED CAROUSEL
========================================================= */

let touchStartX = null;


document.addEventListener(
    "touchstart",
    event => {

        if (
            !statePageIsHome()
        ) {
            return;
        }


        if (
            event.touches.length !==
            1
        ) {

            return;

        }


        touchStartX =
            event.touches[0].clientX;

    },
    {
        passive: true
    }
);


document.addEventListener(
    "touchend",
    event => {

        if (
            touchStartX ===
            null
        ) {

            return;

        }


        const touchEndX =
            event.changedTouches[0]
                ?.clientX;


        if (
            typeof touchEndX !==
            "number"
        ) {

            touchStartX =
                null;

            return;

        }


        const difference =
            touchStartX -
            touchEndX;


        if (
            Math.abs(
                difference
            ) >
            55
        ) {

            if (
                difference >
                0
            ) {

                nextFeaturedAnime();

            } else {

                previousFeaturedAnime();

            }

        }


        touchStartX =
            null;

    },
    {
        passive: true
    }
);


/* =========================================================
   STARTUP
========================================================= */

async function initializeMIRAI() {

    /*
       Important:
       We do NOT use localStorage for My List.

       PostgreSQL + the user's session remain the
       source of truth, which allows the same list
       to appear on different devices.
    */


    updateAccountUI();


    await checkSession();


    await loadPopularAnime();


    const activeScheduleTab =
        query(
            ".schedule-tab.active"
        );


    currentScheduleDay =
        activeScheduleTab
            ?.dataset
            .day ||
        "monday";


    loadSchedule(
        currentScheduleDay
    );

}


initializeMIRAI();
/* =========================================================
   MIRAI MOBILE NAVIGATION FIX
   ========================================================= */

(() => {

    const mobileMenu =
        document.getElementById("mobileMenuBtn");

    /*
       The old mobile hamburger opened the desktop
       sidebar. MIRAI now uses the bottom navigation,
       so the hamburger is intentionally disabled.
    */

    if (mobileMenu) {

        mobileMenu.style.display = "none";

        mobileMenu.onclick = null;

    }


    /*
       Mobile search button opens the existing global
       search instead of creating another search system.
    */

    const mobileSearch =
        document.getElementById(
            "mobileSearchButton"
        );

    if (mobileSearch) {

        mobileSearch.addEventListener(
            "click",
            () => {

                const input =
                    document.getElementById(
                        "globalSearchInput"
                    );

                if (input) {

                    input.focus();

                    input.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                } else {

                    if (
                        typeof goToSearch ===
                        "function"
                    ) {
                        goToSearch();
                    }

                }

            }
        );

    }


    /*
       Make the Lelouch brand image return to Home.
    */

    const mobileBrand =
        document.getElementById(
            "mobileHomeButton"
        );

    if (mobileBrand) {

        mobileBrand.addEventListener(
            "click",
            () => {

                if (
                    typeof showPage ===
                    "function"
                ) {
                    showPage("home");
                }

            }
        );

    }

})();
/* =========================================================
   MIRAI — ENHANCEMENT LAYER
   ADD THIS TO THE VERY END OF YOUR ORIGINAL SCRIPT
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       SAFE HELPERS
    ===================================================== */

    const el = id => document.getElementById(id);

    const all = selector =>
        document.querySelectorAll(selector);

    const safeNumber = value => {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    };

    const escapeValue = value => {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    };

    /* =====================================================
       API HELPER
    ===================================================== */

    async function miraiRequest(
        url,
        options = {}
    ) {
        const response = await fetch(
            url,
            {
                credentials: "include",
                ...options
            }
        );

        const data =
            await response
                .json()
                .catch(() => ({}));

        if (!response.ok) {
            const error = new Error(
                data.error ||
                data.message ||
                "Request failed."
            );

            error.status =
                response.status;

            throw error;
        }

        return data;
    }

    /* =====================================================
       NORMALIZE CURRENT LIST
    ===================================================== */

    function refreshLocalAnimeList(
        updatedAnime
    ) {
        if (
            typeof myList ===
            "undefined"
        ) {
            return;
        }

        const id =
            Number(
                updatedAnime?.mal_id ||
                updatedAnime?.id
            );

        if (!id) {
            return;
        }

        const existingIndex =
            myList.findIndex(
                anime =>
                    Number(
                        anime?.mal_id ||
                        anime?.id
                    ) === id
            );

        if (
            existingIndex >= 0
        ) {
            myList[
                existingIndex
            ] = {
                ...myList[
                    existingIndex
                ],
                ...updatedAnime,
                id,
                mal_id: id
            };
        } else {
            myList.unshift({
                ...updatedAnime,
                id,
                mal_id: id
            });
        }

        myList.sort(
            (a, b) =>
                new Date(
                    b.savedAt || 0
                ) -
                new Date(
                    a.savedAt || 0
                )
        );

        if (
            typeof renderMyList ===
            "function"
        ) {
            renderMyList();
        }

        if (
            typeof renderHomeList ===
            "function"
        ) {
            renderHomeList();
        }
    }

    /* =====================================================
       HERO CAROUSEL
    ===================================================== */

    function enhancementHeroNext() {
        if (
            typeof popularAnime ===
            "undefined" ||
            !popularAnime.length
        ) {
            return;
        }

        if (
            typeof featuredIndex ===
            "undefined"
        ) {
            featuredIndex = 0;
        }

        featuredIndex =
            (
                featuredIndex + 1
            ) %
            popularAnime.length;

        if (
            typeof renderFeaturedCarousel ===
            "function"
        ) {
            renderFeaturedCarousel();
            return;
        }

        enhancementRenderHero();
    }

    function enhancementHeroPrevious() {
        if (
            typeof popularAnime ===
            "undefined" ||
            !popularAnime.length
        ) {
            return;
        }

        if (
            typeof featuredIndex ===
            "undefined"
        ) {
            featuredIndex = 0;
        }

        featuredIndex =
            (
                featuredIndex -
                1 +
                popularAnime.length
            ) %
            popularAnime.length;

        if (
            typeof renderFeaturedCarousel ===
            "function"
        ) {
            renderFeaturedCarousel();
            return;
        }

        enhancementRenderHero();
    }

    el(
        "heroNext"
    )?.addEventListener(
        "click",
        enhancementHeroNext
    );

    el(
        "heroPrevious"
    )?.addEventListener(
        "click",
        enhancementHeroPrevious
    );

    /* =====================================================
       HERO RENDERING
    ===================================================== */

    function enhancementRenderHero() {
        if (
            typeof popularAnime ===
            "undefined" ||
            !popularAnime.length
        ) {
            return;
        }

        const index =
            typeof featuredIndex ===
            "number"
                ? featuredIndex
                : 0;

        const anime =
            popularAnime[
                (
                    index +
                    popularAnime.length
                ) %
                popularAnime.length
            ];

        if (!anime) {
            return;
        }

        const image =
            anime.image ||
            anime.image_url ||
            "";

        const heroImage =
            el(
                "heroImage"
            );

        const heroTitle =
            el(
                "heroTitle"
            );

        const heroSynopsis =
            el(
                "heroSynopsis"
            );

        const heroMeta =
            el(
                "heroMeta"
            );

        if (heroImage) {
            heroImage.src =
                image;

            heroImage.alt =
                anime.title ||
                "Featured anime";
        }

        if (heroTitle) {
            heroTitle.textContent =
                anime.title ||
                "Welcome to MIRAI.";
        }

        if (heroSynopsis) {
            heroSynopsis.textContent =
                anime.synopsis ||
                "Discover your next favourite anime.";
        }

        if (heroMeta) {
            const score =
                anime.score ??
                "N/A";

            const episodes =
                anime.episodes ??
                "?";

            heroMeta.textContent =
                `★ ${score} • ${
                    anime.type ||
                    "Anime"
                } • ${
                    episodes
                } episodes`;
        }

        const hero =
            el(
                "homeHero"
            );

        if (
            hero &&
            image
        ) {
            hero.style.backgroundImage =
                `
                    linear-gradient(
                        90deg,
                        rgba(7,8,13,.98) 0%,
                        rgba(7,8,13,.88) 35%,
                        rgba(7,8,13,.45) 68%,
                        rgba(7,8,13,.12) 100%
                    ),
                    url("${image.replaceAll(
                        '"',
                        '\\"'
                    )}")
                `;
        }

        const viewButton =
            el(
                "heroViewButton"
            );

        if (viewButton) {
            viewButton.onclick =
                () => {

                    if (
                        typeof openAnimeModal ===
                        "function"
                    ) {
                        openAnimeModal(
                            anime
                        );
                    }
                };
        }

        const trailerButton =
            el(
                "heroTrailerButton"
            );

        if (trailerButton) {
            trailerButton.onclick =
                () => {

                    enhancementOpenTrailer(
                        anime
                    );
                };
        }

        enhancementRenderHeroDots();
    }

    /* =====================================================
       HERO DOTS
    ===================================================== */

    function enhancementRenderHeroDots() {
        const dots =
            el(
                "heroDots"
            );

        if (
            !dots ||
            typeof popularAnime ===
            "undefined" ||
            !popularAnime.length
        ) {
            return;
        }

        const count =
            Math.min(
                popularAnime.length,
                8
            );

        const current =
            typeof featuredIndex ===
            "number"
                ? featuredIndex
                : 0;

        dots.innerHTML =
            Array.from(
                {
                    length:
                        count
                },
                (_, index) =>
                    `
                        <button
                            class="carousel-dot ${
                                index === current
                                    ? "active"
                                    : ""
                            }"
                            type="button"
                            data-hero-index="${index}"
                            aria-label="Show featured anime ${index + 1}"
                        ></button>
                    `
            ).join("");

        dots
            .querySelectorAll(
                "[data-hero-index]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            if (
                                typeof featuredIndex !==
                                "undefined"
                            ) {
                                featuredIndex =
                                    Number(
                                        button.dataset
                                            .heroIndex
                                    );
                            }

                            enhancementRenderHero();

                        }
                    );

                }
            );
    }

    /* =====================================================
       HERO KEYBOARD NAVIGATION
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            const tag =
                document.activeElement
                    ?.tagName;

            if (
                tag ===
                "INPUT" ||
                tag ===
                "TEXTAREA" ||
                tag ===
                "SELECT"
            ) {
                return;
            }

            const home =
                el(
                    "homePage"
                );

            if (
                !home ||
                !home.classList.contains(
                    "active-page"
                )
            ) {
                return;
            }

            if (
                event.key ===
                "ArrowRight"
            ) {
                enhancementHeroNext();
            }

            if (
                event.key ===
                "ArrowLeft"
            ) {
                enhancementHeroPrevious();
            }

        }
    );

    /* =====================================================
       HERO TOUCH SWIPE
    ===================================================== */

    let heroTouchStart = null;

    document.addEventListener(
        "touchstart",
        event => {

            const home =
                el(
                    "homePage"
                );

            if (
                !home ||
                !home.classList.contains(
                    "active-page"
                )
            ) {
                return;
            }

            if (
                event.touches.length !==
                1
            ) {
                return;
            }

            heroTouchStart =
                event.touches[0]
                    .clientX;

        },
        {
            passive: true
        }
    );

    document.addEventListener(
        "touchend",
        event => {

            if (
                heroTouchStart ===
                null
            ) {
                return;
            }

            const end =
                event.changedTouches[0]
                    ?.clientX;

            if (
                typeof end !==
                "number"
            ) {
                heroTouchStart =
                    null;

                return;
            }

            const distance =
                heroTouchStart -
                end;

            if (
                Math.abs(distance) >
                55
            ) {

                if (
                    distance >
                    0
                ) {
                    enhancementHeroNext();
                } else {
                    enhancementHeroPrevious();
                }

            }

            heroTouchStart =
                null;

        },
        {
            passive: true
        }
    );

    /* =====================================================
       RATING SLIDER
    ===================================================== */

    function enhancementUpdateRating(
        value
    ) {

        const rating =
            Math.max(
                1,
                Math.min(
                    5,
                    Number(value) ||
                    1
                )
            );

        currentRating =
            rating;

        const big =
            el(
                "ratingBigNumber"
            );

        const valueElement =
            el(
                "ratingValue"
            );

        if (big) {
            big.textContent =
                String(
                    rating
                );
        }

        if (valueElement) {
            valueElement.textContent =
                `${rating} / 5`;
        }
    }

    const ratingSlider =
        el(
            "ratingSlider"
        );

    if (ratingSlider) {

        ratingSlider.addEventListener(
            "input",
            event => {

                enhancementUpdateRating(
                    event.target.value
                );

            }
        );

        ratingSlider.addEventListener(
            "change",
            event => {

                enhancementUpdateRating(
                    event.target.value
                );

            }
        );

    }

    /* =====================================================
       OPEN RATING MODAL
    ===================================================== */

    el(
        "modalRateButton"
    )?.addEventListener(
        "click",
        () => {

            if (!currentUser) {

                if (
                    typeof closeAnimeModal ===
                    "function"
                ) {
                    closeAnimeModal();
                }

                if (
                    typeof openLogin ===
                    "function"
                ) {
                    openLogin();
                }

                return;
            }

            if (!currentAnime) {
                return;
            }

            const existing =
                typeof getListAnime ===
                "function"
                    ? getListAnime(
                        currentAnime
                    )
                    : null;

            if (!existing) {

                if (
                    typeof showToast ===
                    "function"
                ) {
                    showToast(
                        "Add this anime to My List before rating it.",
                        "error"
                    );
                }

                return;
            }

            currentRating =
                Number(
                    existing.rating ||
                    0
                );

            const slider =
                el(
                    "ratingSlider"
                );

            if (slider) {

                slider.value =
                    currentRating ||
                    1;

                enhancementUpdateRating(
                    slider.value
                );

            }

            const title =
                el(
                    "ratingAnimeTitle"
                );

            if (title) {
                title.textContent =
                    currentAnime.title ||
                    "Anime";
            }

            el(
                "ratingModal"
            )?.classList.add(
                "open"
            );

            document.body.style.overflow =
                "hidden";

        }
    );

    /* =====================================================
       SAVE RATING
    ===================================================== */

    el(
        "submitRating"
    )?.addEventListener(
        "click",
        async () => {

            if (
                !currentUser ||
                !currentAnime
            ) {
                return;
            }

            const animeId =
                Number(
                    currentAnime.mal_id ||
                    currentAnime.id
                );

            if (!animeId) {
                return;
            }

            const rating =
                Math.max(
                    1,
                    Math.min(
                        5,
                        Number(
                            currentRating
                        ) ||
                        1
                    )
                );

            const button =
                el(
                    "submitRating"
                );

            const originalText =
                button?.textContent ||
                "Save Rating";

            if (button) {
                button.disabled =
                    true;

                button.textContent =
                    "Saving...";
            }

            try {

                const data =
                    await miraiRequest(
                        `/api/my-list/${animeId}/rating`,
                        {
                            method:
                                "PATCH",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    rating
                                })
                        }
                    );

                const item =
                    typeof getListAnime ===
                    "function"
                        ? getListAnime(
                            currentAnime
                        )
                        : null;

                if (item) {
                    item.rating =
                        rating;
                }

                currentAnime.rating =
                    rating;

                if (
                    typeof renderMyList ===
                    "function"
                ) {
                    renderMyList();
                }

                if (
                    typeof renderHomeList ===
                    "function"
                ) {
                    renderHomeList();
                }

                el(
                    "ratingModal"
                )?.classList.remove(
                    "open"
                );

                document.body.style.overflow =
                    "";

                if (
                    typeof showToast ===
                    "function"
                ) {
                    showToast(
                        `Rated ${rating}/5.`,
                        "success"
                    );
                }

            } catch (error) {

                console.error(
                    "MIRAI RATING ERROR:",
                    error
                );

                if (
                    typeof showToast ===
                    "function"
                ) {
                    showToast(
                        error.message ||
                        "Could not save rating.",
                        "error"
                    );
                }

            } finally {

                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        originalText;

                }

            }

        }
    );

    /* =====================================================
       MODAL LIST MANAGEMENT
    ===================================================== */

    function enhancementUpdateModalControls() {

        const management =
            el(
                "listManagement"
            );

        if (
            !management ||
            !currentAnime
        ) {
            return;
        }

        const existing =
            typeof getListAnime ===
            "function"
                ? getListAnime(
                    currentAnime
                )
                : null;

        if (!existing) {

            management.classList.add(
                "hidden"
            );

            return;
        }

        management.classList.remove(
            "hidden"
        );

        const status =
            el(
                "animeStatusSelect"
            );

        const episode =
            el(
                "episodeInput"
            );

        if (status) {
            status.value =
                existing.listStatus ||
                "plan";
        }

        if (episode) {
            episode.value =
                Number(
                    existing.episode ||
                    0
                );
        }

        const currentStatus =
            el(
                "modalCurrentStatus"
            );

        if (currentStatus) {

            const labels = {
                plan:
                    "Plan to Watch",

                watching:
                    "Watching",

                completed:
                    "Completed",

                on_hold:
                    "On Hold",

                dropped:
                    "Dropped"
            };

            currentStatus.textContent =
                `${
                    labels[
                        existing.listStatus
                    ] ||
                    existing.listStatus ||
                    "Unknown"
                } • Episode ${
                    Number(
                        existing.episode ||
                        0
                    )
                }`;

        }

    }

    el(
        "saveListChanges"
    )?.addEventListener(
        "click",
        async () => {

            if (
                !currentUser ||
                !currentAnime
            ) {
                return;
            }

            const animeId =
                Number(
                    currentAnime.mal_id ||
                    currentAnime.id
                );

            if (!animeId) {
                return;
            }

            const status =
                el(
                    "animeStatusSelect"
                )?.value ||
                "plan";

            const episode =
                Math.max(
                    0,
                    Math.floor(
                        Number(
                            el(
                                "episodeInput"
                            )?.value ||
                            0
                        )
                    )
                );

            const button =
                el(
                    "saveListChanges"
                );

            const original =
                button?.textContent ||
                "Save Changes";

            if (button) {

                button.disabled =
                    true;

                button.textContent =
                    "Saving...";

            }

            try {

                const data =
                    await miraiRequest(
                        `/api/my-list/${animeId}`,
                        {
                            method:
                                "PATCH",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    status,
                                    episode
                                })
                        }
                    );

                const local =
                    typeof getListAnime ===
                    "function"
                        ? getListAnime(
                            currentAnime
                        )
                        : null;

                if (local) {

                    local.listStatus =
                        data.data?.status ||
                        status;

                    local.status =
                        local.listStatus;

                    local.episode =
                        Number(
                            data.data?.episode ??
                            episode
                        );

                    local.savedAt =
                        data.data?.savedAt ||
                        new Date()
                            .toISOString();

                }

                if (
                    typeof renderMyList ===
                    "function"
                ) {
                    renderMyList();
                }

                if (
                    typeof renderHomeList ===
                    "function"
                ) {
                    renderHomeList();
                }

                enhancementUpdateModalControls();

                if (
                    typeof showToast ===
                    "function"
                ) {
                    showToast(
                        "Anime updated.",
                        "success"
                    );
                }

            } catch (error) {

                console.error(
                    "MIRAI LIST UPDATE ERROR:",
                    error
                );

                if (
                    typeof showToast ===
                    "function"
                ) {
                    showToast(
                        error.message ||
                        "Could not update the anime.",
                        "error"
                    );
                }

            } finally {

                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        original;

                }

            }

        }
    );

    /* =====================================================
       EPISODE BUTTONS
    ===================================================== */

    el(
        "episodePlus"
    )?.addEventListener(
        "click",
        () => {

            const input =
                el(
                    "episodeInput"
                );

            if (!input) {
                return;
            }

            const current =
                Math.max(
                    0,
                    Number(
                        input.value ||
                        0
                    )
                );

            const maximum =
                Number(
                    currentAnime?.episodes ||
                    currentAnime?.episode_count ||
                    999999
                );

            input.value =
                Math.min(
                    current + 1,
                    maximum
                );

        }
    );

    el(
        "episodeMinus"
    )?.addEventListener(
        "click",
        () => {

            const input =
                el(
                    "episodeInput"
                );

            if (!input) {
                return;
            }

            const current =
                Math.max(
                    0,
                    Number(
                        input.value ||
                        0
                    )
                );

            input.value =
                Math.max(
                    0,
                    current - 1
                );

        }
    );

    /* =====================================================
       SCHEDULE TIME FORMAT
    ===================================================== */

    function enhancementParseTime(
        anime
    ) {

        const broadcast =
            anime?.broadcast ||
            {};

        const airing =
            anime?.airing ||
            {};

        const raw =
            airing.time ||
            airing.display ||
            broadcast.start_time ||
            broadcast.time ||
            "";

        if (!raw) {
            return null;
        }

        const match =
            String(
                raw
            ).match(
                /(\d{1,2}):(\d{2})/
            );

        if (!match) {
            return null;
        }

        const hour =
            Number(
                match[1]
            );

        const minute =
            Number(
                match[2]
            );

        if (
            hour < 0 ||
            hour > 23 ||
            minute < 0 ||
            minute > 59
        ) {
            return null;
        }

        return {
            hour,
            minute,
            total:
                hour * 60 +
                minute
        };

    }

    function enhancementFormatTime(
        hour,
        minute
    ) {

        const period =
            hour >= 12
                ? "PM"
                : "AM";

        const twelve =
            hour % 12 ||
            12;

        return (
            `${twelve}:` +
            `${String(
                minute
            ).padStart(
                2,
                "0"
            )} ${period}`
        );

    }

    /* =====================================================
       SCHEDULE HOURS BAR
    ===================================================== */

    function enhancementRenderScheduleHours(
        animeList
    ) {

        const hours =
            el(
                "scheduleHours"
            );

        if (
            !hours
        ) {
            return;
        }

        const present =
            new Set();

        (
            Array.isArray(
                animeList
            )
                ? animeList
                : []
        )
            .forEach(
                anime => {

                    const time =
                        enhancementParseTime(
                            anime
                        );

                    if (time) {
                        present.add(
                            time.hour
                        );
                    }

                }
            );

        hours.innerHTML =
            Array.from(
                {
                    length:
                        24
                },
                (_, hour) =>
                    `
                        <button
                            type="button"
                            class="schedule-hour-chip ${
                                present.has(hour)
                                    ? "has-anime"
                                    : ""
                            }"
                            data-hour="${hour}"
                        >
                            ${escapeValue(
                                enhancementFormatTime(
                                    hour,
                                    0
                                )
                            )}
                        </button>
                    `
            ).join("");

        hours
            .querySelectorAll(
                "[data-hour]"
            )
            .forEach(
                chip => {

                    chip.addEventListener(
                        "click",
                        () => {

                            const hour =
                                Number(
                                    chip.dataset
                                        .hour
                                );

                            const list =
                                Array.isArray(
                                    animeList
                                )
                                    ? animeList
                                    : [];

                            const matching =
                                list.filter(
                                    anime => {

                                        const time =
                                            enhancementParseTime(
                                                anime
                                            );

                                        return (
                                            time &&
                                            time.hour ===
                                            hour
                                        );

                                    }
                                );

                            if (
                                matching.length &&
                                typeof renderScheduleGrid ===
                                "function"
                            ) {

                                const grid =
                                    el(
                                        "scheduleGrid"
                                    );

                                renderScheduleGrid(
                                    grid,
                                    matching
                                );

                            }

                        }
                    );

                }
            );

    }

    /* =====================================================
       TRAILER MODAL
    ===================================================== */

    async function enhancementGetTrailer(
        anime
    ) {

        const id =
            Number(
                anime?.mal_id ||
                anime?.id
            );

        if (!id) {
            return null;
        }

        try {

            const data =
                await miraiRequest(
                    `/anime/trailer/${id}`
                );

            return (
                data?.data ||
                null
            );

        } catch (
            error
        ) {

            console.warn(
                "Trailer unavailable:",
                error
            );

            return null;

        }

    }

    async function enhancementOpenTrailer(
        anime
    ) {

        const trailer =
            await enhancementGetTrailer(
                anime
            );

        if (
            !trailer?.embed_url
        ) {

            if (
                typeof showToast ===
                "function"
            ) {
                showToast(
                    "No official trailer is available for this anime.",
                    "error"
                );
            }

            return;

        }

        const frame =
            el(
                "trailerFrame"
            );

        const modal =
            el(
                "trailerModal"
            );

        if (
            !frame ||
            !modal
        ) {
            return;
        }

        frame.src =
            trailer.embed_url;

        modal.classList.add(
            "open"
        );

        document.body.style.overflow =
            "hidden";

    }

    el(
        "heroTrailerButton"
    )?.addEventListener(
        "click",
        () => {

            if (
                currentAnime
            ) {
                enhancementOpenTrailer(
                    currentAnime
                );
                return;
            }

            if (
                typeof popularAnime !==
                "undefined" &&
                popularAnime.length
            ) {

                const anime =
                    popularAnime[
                        typeof featuredIndex ===
                        "number"
                            ? featuredIndex
                            : 0
                    ];

                enhancementOpenTrailer(
                    anime
                );

            }

        }
    );

    el(
        "modalTrailerButton"
    )?.addEventListener(
        "click",
        () => {

            if (
                currentAnime
            ) {
                enhancementOpenTrailer(
                    currentAnime
                );
            }

        }
    );

    el(
        "trailerModalClose"
    )?.addEventListener(
        "click",
        () => {

            const modal =
                el(
                    "trailerModal"
                );

            const frame =
                el(
                    "trailerFrame"
                );

            if (frame) {
                frame.src =
                    "";
            }

            modal?.classList.remove(
                "open"
            );

            document.body.style.overflow =
                "";

        }
    );

    el(
        "trailerModal"
    )?.addEventListener(
        "click",
        event => {

            const modal =
                el(
                    "trailerModal"
                );

            if (
                event.target ===
                modal
            ) {

                const frame =
                    el(
                        "trailerFrame"
                    );

                if (frame) {
                    frame.src =
                        "";
                }

                modal.classList.remove(
                    "open"
                );

                document.body.style.overflow =
                    "";

            }

        }
    );

    /* =====================================================
       MOBILE NAV IMPROVEMENTS
    ===================================================== */

    all(
        ".mobile-nav-item"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const page =
                        button.dataset.page;

                    if (
                        page &&
                        typeof showPage ===
                        "function"
                    ) {
                        showPage(
                            page
                        );
                    }

                }
            );

        }
    );

    /* =====================================================
       MOBILE BRAND -> HOME
    ===================================================== */

    el(
        "mobileHomeButton"
    )?.addEventListener(
        "click",
        () => {

            if (
                typeof showPage ===
                "function"
            ) {
                showPage(
                    "home"
                );
            }

        }
    );

    /* =====================================================
       ACCOUNT BUTTON
    ===================================================== */

    el(
        "mobileAccountBtn"
    )?.addEventListener(
        "click",
        () => {

            if (
                currentUser
            ) {

                if (
                    typeof showPage ===
                    "function"
                ) {
                    showPage(
                        "my-list"
                    );
                }

            } else if (
                typeof openLogin ===
                "function"
            ) {

                openLogin();

            }

        }
    );

    /* =====================================================
       BACK TO HOME ON ALL PAGES
    ===================================================== */

    all(
        "[data-home]"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        typeof showPage ===
                        "function"
                    ) {
                        showPage(
                            "home"
                        );
                    }

                }
            );

        }
    );

    /* =====================================================
       KEYBOARD SEARCH
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "/"
            ) {
                return;
            }

            const tag =
                document.activeElement
                    ?.tagName;

            if (
                tag ===
                "INPUT" ||
                tag ===
                "TEXTAREA" ||
                tag ===
                "SELECT"
            ) {
                return;
            }

            event.preventDefault();

            const input =
                el(
                    "globalSearchInput"
                );

            if (input) {

                input.focus();

                input.select();

            }

        }
    );

    /* =====================================================
       ESCAPE MODALS
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {
                return;
            }

            all(
                ".modal-overlay.open"
            ).forEach(
                modal => {

                    modal.classList.remove(
                        "open"
                    );

                }
            );

            document.body.style.overflow =
                "";

            const frame =
                el(
                    "trailerFrame"
                );

            if (frame) {
                frame.src =
                    "";
            }

        }
    );

    /* =====================================================
       REFRESH LIST WHEN TAB BECOMES VISIBLE
    ===================================================== */

    document.addEventListener(
        "visibilitychange",
        async () => {

            if (
                document.visibilityState !==
                "visible"
            ) {
                return;
            }

            if (
                !currentUser
            ) {
                return;
            }

            if (
                typeof loadMyListFromServer ===
                "function"
            ) {

                try {

                    await loadMyListFromServer();

                } catch (
                    error
                ) {

                    console.warn(
                        "Could not refresh MIRAI list:",
                        error
                    );

                }

            }

        }
    );

    /* =====================================================
       OPTIONAL PERIODIC SYNC
       Keeps multiple open tabs/devices reasonably fresh.
    ===================================================== */

    setInterval(
        async () => {

            if (
                !currentUser ||
                document.visibilityState !==
                "visible"
            ) {
                return;
            }

            if (
                typeof loadMyListFromServer !==
                "function"
            ) {
                return;
            }

            try {

                await loadMyListFromServer();

            } catch (
                error
            ) {

                console.debug(
                    "MIRAI background sync failed:",
                    error
                );

            }

        },
        60_000
    );

    /* =====================================================
       PATCH RENDERERS WHEN THEY ARE AVAILABLE
    ===================================================== */

    const originalOpenAnimeModal =
        typeof openAnimeModal ===
        "function"
            ? openAnimeModal
            : null;

    if (originalOpenAnimeModal) {

        window.openAnimeModal =
            function(
                anime
            ) {

                originalOpenAnimeModal(
                    anime
                );

                setTimeout(
                    () => {

                        enhancementUpdateModalControls();

                    },
                    0
                );

            };

    }

    /* =====================================================
       INITIAL ENHANCEMENT REFRESH
    ===================================================== */

    setTimeout(
        () => {

            if (
                typeof popularAnime !==
                "undefined" &&
                popularAnime.length
            ) {

                enhancementRenderHero();

            }

            if (
                typeof scheduleData !==
                "undefined" &&
                currentScheduleDay &&
                scheduleData[
                    currentScheduleDay
                ]
            ) {

                enhancementRenderScheduleHours(
                    scheduleData[
                        currentScheduleDay
                    ]
                );

            }

        },
        500
    );

})();