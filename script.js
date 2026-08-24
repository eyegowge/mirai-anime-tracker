/* =========================================================
   MIRAI — ANIME TRACKER
   COMPLETE FRONTEND SCRIPT
   =========================================================

   Features:
   - Responsive desktop/mobile navigation
   - Mobile bottom navigation
   - Global search
   - Sidebar search
   - My List
   - Plan / Watching / Completed / On Hold / Dropped
   - Episode tracking
   - 0.5-step personal ratings
   - Cross-device PostgreSQL syncing
   - Popular anime
   - Trending anime
   - Discover
   - Random anime
   - Weekly schedule
   - Hour-by-hour schedule navigation
   - Featured anime carousel
   - Keyboard carousel controls
   - Touch swipe carousel
   - Official trailer loading
   - Anime details modal
   - Account registration/login/logout
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const API_BASE = "";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;

let currentAnime = null;

let currentRating = 0;

let myList = [];

let popularAnime = [];

let scheduleData = {};

let featuredIndex = 0;

let homeListIndex = 0;

let currentScheduleDay = "monday";

let currentDiscoverMode = "popular";

let toastTimeout = null;

let heroAutoplayTimer = null;

let isLoadingSchedule = false;

let isLoadingList = false;

let isLoadingPopular = false;

const HOME_LIST_SIZE = 6;

const RATING_MIN = 0.5;

const RATING_MAX = 5;

const RATING_STEP = 0.5;


/* =========================================================
   DOM REFERENCES
========================================================= */

const pages = {

    home:
        document.getElementById(
            "homePage"
        ),

    search:
        document.getElementById(
            "searchPage"
        ),

    trending:
        document.getElementById(
            "trendingPage"
        ),

    schedule:
        document.getElementById(
            "schedulePage"
        ),

    "my-list":
        document.getElementById(
            "myListPage"
        ),

    discover:
        document.getElementById(
            "discoverPage"
        ),

    random:
        document.getElementById(
            "randomPage"
        )

};


const navItems =
    document.querySelectorAll(
        ".nav-item"
    );


const mobileNavItems =
    document.querySelectorAll(
        ".mobile-nav-item"
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


const trailerModal =
    document.getElementById(
        "trailerModal"
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
   HELPERS
========================================================= */

function getElement(id) {

    return document.getElementById(
        id
    );

}


function query(selector) {

    return document.querySelector(
        selector
    );

}


function queryAll(selector) {

    return document.querySelectorAll(
        selector
    );

}


function escapeHTML(value) {

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


function clamp(
    value,
    min,
    max
) {

    return Math.min(
        max,
        Math.max(
            min,
            value
        )
    );

}


function roundRating(
    value
) {

    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return 0;

    }


    return (
        Math.round(
            number /
            RATING_STEP
        ) *
        RATING_STEP
    );

}


function normalizeRating(
    value
) {

    const number =
        roundRating(
            value
        );


    if (
        number <=
        0
    ) {

        return 0;

    }


    return Number(
        clamp(
            number,
            RATING_MIN,
            RATING_MAX
        ).toFixed(
            1
        )
    );

}


function restoreBodyScroll() {

    const modalOpen =
        document.querySelector(
            ".modal-overlay.open"
        );


    if (
        !modalOpen
    ) {

        document.body.style.overflow =
            "";

    }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = ""
) {

    const toast =
        getElement(
            "toast"
        );


    if (
        !toast
    ) {

        return;

    }


    toast.textContent =
        message;


    toast.className =
        "toast";


    if (
        type
    ) {

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
            3200
        );

}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
    url,
    options = {}
) {

    const response =
        await fetch(
            `${API_BASE}${url}`,
            {
                credentials:
                    "include",

                ...options
            }
        );


    const data =
        await response
            .json()
            .catch(
                () => ({})
            );


    if (
        !response.ok
    ) {

        const error =
            new Error(
                data.error ||
                data.message ||
                `Request failed with status ${response.status}.`
            );


        error.status =
            response.status;


        error.data =
            data;


        throw error;

    }


    return data;

}


/* =========================================================
   NORMALIZE ANIME
========================================================= */

function normalizeAnime(
    anime
) {

    if (
        !anime
    ) {

        return null;

    }


    const node =
        anime.node ||
        anime;


    const id =
        Number(
            node.id ||
            anime.mal_id ||
            anime.anime_id ||
            anime.id
        );


    if (
        !Number.isInteger(
            id
        ) ||
        id <=
        0
    ) {

        return null;

    }


    const picture =
        node.main_picture ||
        {};


    const image =
        picture.large ||
        picture.medium ||
        anime.image ||
        anime.image_url ||
        anime.images?.jpg?.large_image_url ||
        anime.images?.jpg?.image_url ||
        "";


    const episodes =
        node.num_episodes ??
        anime.episodes ??
        anime.episode_count ??
        anime.num_episodes ??
        null;


    const storedStatus =
        anime.listStatus ||
        anime.list_status ||
        "";


    const validStatuses = [
        "plan",
        "watching",
        "completed",
        "on_hold",
        "dropped"
    ];


    const listStatus =
        validStatuses.includes(
            storedStatus
        )
            ? storedStatus
            : "";


    const storedRating =
        normalizeRating(
            anime.rating
        );


    return {

        ...anime,

        id,

        mal_id:
            id,

        title:
            node.title ||
            anime.title ||
            anime.name ||
            "Unknown Anime",

        image,

        image_url:
            image,

        synopsis:
            node.synopsis ||
            anime.synopsis ||
            anime.description ||
            "No synopsis available.",

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

        episodes,

        episode_count:
            episodes,

        type:
            node.media_type ||
            anime.type ||
            "Anime",

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
            Array.isArray(
                node.genres
            )
                ? node.genres
                : (
                    Array.isArray(
                        anime.genres
                    )
                        ? anime.genres
                        : []
                ),

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
            null,

        listStatus,

        rating:
            storedRating,

        episode:
            Math.max(
                0,
                Math.floor(
                    Number(
                        anime.episode ||
                        0
                    )
                )
            ),

        savedAt:
            anime.savedAt ||
            anime.saved_at ||
            null

    };

}


function normalizeAnimeList(
    list
) {

    if (
        !Array.isArray(
            list
        )
    ) {

        return [];

    }


    return list
        .map(
            normalizeAnime
        )
        .filter(
            Boolean
        );

}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(
    pageName
) {

    Object.values(
        pages
    )
        .forEach(
            page => {

                if (
                    page
                ) {

                    page.classList.remove(
                        "active-page"
                    );

                }

            }
        );


    if (
        pages[
            pageName
        ]
    ) {

        pages[
            pageName
        ]
            .classList
            .add(
                "active-page"
            );

    }


    navItems.forEach(
        item => {

            item.classList.toggle(
                "active",
                item.dataset.page ===
                pageName
            );

        }
    );


    mobileNavItems.forEach(
        item => {

            item.classList.toggle(
                "active",
                item.dataset.page ===
                pageName
            );

        }
    );


    const sidebar =
        getElement(
            "sidebar"
        );


    if (
        sidebar
    ) {

        sidebar.classList.remove(
            "open"
        );

    }


    const backdrop =
        getElement(
            "mobileBackdrop"
        );


    if (
        backdrop
    ) {

        backdrop.classList.remove(
            "open"
        );

    }


    window.scrollTo(
        {
            top:
                0,

            behavior:
                "smooth"
        }
    );


    if (
        pageName ===
        "home"
    ) {

        startHeroAutoplay();

    }


    if (
        pageName ===
        "my-list"
    ) {

        renderMyList();

    }


    if (
        pageName ===
        "trending"
    ) {

        loadTrending();

    }


    if (
        pageName ===
        "schedule"
    ) {

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


    if (
        pageName ===
        "discover"
    ) {

        loadDiscover(
            currentDiscoverMode
        );

    }

}


/* =========================================================
   DESKTOP NAVIGATION
========================================================= */

navItems.forEach(
    item => {

        item.addEventListener(
            "click",
            () => {

                showPage(
                    item.dataset.page
                );

            }
        );

    }
);


/* =========================================================
   MOBILE NAVIGATION
========================================================= */

mobileNavItems.forEach(
    item => {

        item.addEventListener(
            "click",
            () => {

                showPage(
                    item.dataset.page
                );

            }
        );

    }
);


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

const mobileMenuBtn =
    getElement(
        "mobileMenuBtn"
    );


if (
    mobileMenuBtn
) {

    mobileMenuBtn.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            const sidebar =
                getElement(
                    "sidebar"
                );


            const backdrop =
                getElement(
                    "mobileBackdrop"
                );


            if (
                sidebar
            ) {

                sidebar.classList.toggle(
                    "open"
                );

            }


            if (
                backdrop
            ) {

                backdrop.classList.toggle(
                    "open"
                );

            }

        }
    );

}


const mobileBackdrop =
    getElement(
        "mobileBackdrop"
    );


mobileBackdrop?.addEventListener(
    "click",
    () => {

        getElement(
            "sidebar"
        )?.classList.remove(
            "open"
        );


        mobileBackdrop.classList.remove(
            "open"
        );

    }
);


document.addEventListener(
    "click",
    event => {

        const sidebar =
            getElement(
                "sidebar"
            );


        if (
            !sidebar ||
            !sidebar.classList.contains(
                "open"
            )
        ) {

            return;

        }


        if (
            sidebar.contains(
                event.target
            ) ||
            mobileMenuBtn?.contains(
                event.target
            )
        ) {

            return;

        }


        sidebar.classList.remove(
            "open"
        );


        mobileBackdrop?.classList.remove(
            "open"
        );

    }
);


/* =========================================================
   MOBILE SEARCH
========================================================= */

getElement(
    "mobileSearchButton"
)?.addEventListener(
    "click",
    () => {

        showPage(
            "search"
        );


        setTimeout(
            () => {

                getElement(
                    "searchInput"
                )?.focus();

            },
            150
        );

    }
);


/* =========================================================
   MOBILE ACCOUNT
========================================================= */

getElement(
    "mobileAccountBtn"
)?.addEventListener(
    "click",
    () => {

        if (
            currentUser
        ) {

            showPage(
                "my-list"
            );

        } else {

            openLogin();

        }

    }
);


/* =========================================================
   MOBILE BRAND / HOME
========================================================= */

getElement(
    "mobileHomeButton"
)?.addEventListener(
    "click",
    () => {

        showPage(
            "home"
        );

    }
);


/* =========================================================
   BACK HOME BUTTONS
========================================================= */

queryAll(
    "[data-home]"
)
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showPage(
                        "home"
                    );

                }
            );

        }
    );


queryAll(
    ".back-home-button"
)
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showPage(
                        "home"
                    );

                }
            );

        }
    );


getElement(
    "globalHomeButton"
)?.addEventListener(
    "click",
    () => {

        showPage(
            "home"
        );

    }
);


/* =========================================================
   SEARCH NAVIGATION
========================================================= */

function goToSearch() {

    showPage(
        "search"
    );


    setTimeout(
        () => {

            getElement(
                "searchInput"
            )?.focus();

        },
        120
    );

}


getElement(
    "homeSearchBtn"
)?.addEventListener(
    "click",
    goToSearch
);


getElement(
    "heroSearchBtn"
)?.addEventListener(
    "click",
    goToSearch
);


getElement(
    "homeListButton"
)?.addEventListener(
    "click",
    () => {

        showPage(
            "my-list"
        );

    }
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


/* =========================================================
   GLOBAL SEARCH
========================================================= */

async function performGlobalSearch() {

    const input =
        getElement(
            "globalSearchInput"
        ) ||
        getElement(
            "globalSearch"
        );


    if (
        !input
    ) {

        goToSearch();

        return;

    }


    const text =
        input.value.trim();


    if (
        !text
    ) {

        goToSearch();

        return;

    }


    const pageInput =
        getElement(
            "searchInput"
        );


    if (
        pageInput
    ) {

        pageInput.value =
            text;

    }


    showPage(
        "search"
    );


    await performSearch(
        text
    );

}


getElement(
    "globalSearchForm"
)?.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        performGlobalSearch();

    }
);


getElement(
    "globalSearchButton"
)?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        performGlobalSearch();

    }
);


/* =========================================================
   SIDEBAR SEARCH
========================================================= */

getElement(
    "sidebarSearchButton"
)?.addEventListener(
    "click",
    goToSearch
);


/* =========================================================
   "/" SEARCH SHORTCUT
========================================================= */

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


        if (
            event.key ===
            "/"
        ) {

            event.preventDefault();


            const input =
                getElement(
                    "globalSearchInput"
                );


            if (
                input
            ) {

                input.focus();

                input.select();

            }

        }

    }
);


/* =========================================================
   ENTER SEARCH
========================================================= */

[
    getElement(
        "globalSearchInput"
    ),

    getElement(
        "globalSearch"
    )
]
    .filter(
        Boolean
    )
    .forEach(
        input => {

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

        }
    );


/* =========================================================
   ACCOUNT MODAL
========================================================= */

function openAccountModal() {

    if (
        accountModal
    ) {

        accountModal.classList.add(
            "open"
        );

    }


    document.body.style.overflow =
        "hidden";

}


function closeAccountModal() {

    if (
        accountModal
    ) {

        accountModal.classList.remove(
            "open"
        );

    }


    restoreBodyScroll();

}


function openLogin() {

    clearAccountErrors();


    loginContainer?.classList.remove(
        "hidden"
    );


    registerContainer?.classList.add(
        "hidden"
    );


    openAccountModal();

}


function openRegister() {

    clearAccountErrors();


    loginContainer?.classList.add(
        "hidden"
    );


    registerContainer?.classList.remove(
        "hidden"
    );


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
    "listLoginBtn"
)?.addEventListener(
    "click",
    openLogin
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

function clearAccountErrors() {

    [
        loginError,
        registerError
    ]
        .forEach(
            element => {

                if (
                    !element
                ) {

                    return;

                }


                element.textContent =
                    "";


                element.classList.remove(
                    "show"
                );

            }
        );

}


function showAccountError(
    element,
    message
) {

    if (
        !element
    ) {

        return;

    }


    element.textContent =
        message;


    element.classList.add(
        "show"
    );

}


/* =========================================================
   REGISTER
========================================================= */

registerForm?.addEventListener(
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
            !/^[a-zA-Z0-9_-]{3,30}$/
                .test(
                    username
                )
        ) {

            showAccountError(
                registerError,
                "Username must be 3–30 characters and use letters, numbers, underscores, or hyphens."
            );

            return;

        }


        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(
                    email
                )
        ) {

            showAccountError(
                registerError,
                "Please enter a valid email address."
            );

            return;

        }


        if (
            password.length <
            6
        ) {

            showAccountError(
                registerError,
                "Password must be at least 6 characters."
            );

            return;

        }


        if (
            password !==
            confirmPassword
        ) {

            showAccountError(
                registerError,
                "Passwords do not match."
            );

            return;

        }


        const button =
            registerForm.querySelector(
                "button[type='submit']"
            );


        const oldText =
            button?.textContent ||
            "Create Account";


        if (
            button
        ) {

            button.disabled =
                true;

            button.textContent =
                "Creating account...";

        }


        try {

            const data =
                await apiRequest(
                    "/auth/register",
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                {
                                    username,
                                    email,
                                    password
                                }
                            )
                    }
                );


            currentUser =
                data.user ||
                null;


            if (
                !currentUser
            ) {

                throw new Error(
                    "Account created but no user account was returned."
                );

            }


            myList =
                [];


            closeAccountModal();


            registerForm.reset();


            updateAccountUI();


            await loadMyListFromServer();


            showToast(
                "Your MIRAI account has been created.",
                "success"
            );


        } catch (
            error
        ) {

            console.error(
                "REGISTER ERROR:",
                error
            );


            showAccountError(
                registerError,
                error.message ||
                "Could not create account."
            );


        } finally {

            if (
                button
            ) {

                button.disabled =
                    false;

                button.textContent =
                    oldText;

            }

        }

    }
);


/* =========================================================
   LOGIN
========================================================= */

loginForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        clearAccountErrors();


        const identifier =
            getElement(
                "loginEmail"
            )
            ?.value
            .trim() ||
            "";


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

            showAccountError(
                loginError,
                "Enter your username/email and password."
            );

            return;

        }


        const button =
            loginForm.querySelector(
                "button[type='submit']"
            );


        const oldText =
            button?.textContent ||
            "Log In";


        if (
            button
        ) {

            button.disabled =
                true;

            button.textContent =
                "Logging in...";

        }


        try {

            const data =
                await apiRequest(
                    "/auth/login",
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                {
                                    identifier,
                                    password
                                }
                            )
                    }
                );


            currentUser =
                data.user ||
                null;


            if (
                !currentUser
            ) {

                throw new Error(
                    "Login succeeded but no user was returned."
                );

            }


            closeAccountModal();


            loginForm.reset();


            updateAccountUI();


            await loadMyListFromServer();


            showToast(
                `Welcome back, ${currentUser.username || "User"}!`,
                "success"
            );


        } catch (
            error
        ) {

            console.error(
                "LOGIN ERROR:",
                error
            );


            showAccountError(
                loginError,
                error.message ||
                "Could not log in."
            );


        } finally {

            if (
                button
            ) {

                button.disabled =
                    false;

                button.textContent =
                    oldText;

            }

        }

    }
);


/* =========================================================
   LOGOUT
========================================================= */

getElement(
    "logoutBtn"
)?.addEventListener(
    "click",
    async () => {

        try {

            await apiRequest(
                "/auth/logout",
                {
                    method:
                        "POST"
                }
            );

        } catch (
            error
        ) {

            console.error(
                "LOGOUT ERROR:",
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


        showPage(
            "home"
        );


        showToast(
            "You have been logged out."
        );

    }
);


/* =========================================================
   ACCOUNT UI
========================================================= */

function updateAccountUI() {

    if (
        currentUser
    ) {

        loggedOutAccount?.classList.add(
            "hidden"
        );


        loggedInAccount?.classList.remove(
            "hidden"
        );


        const username =
            currentUser.username ||
            currentUser.email
                ?.split("@")[0] ||
            "User";


        if (
            sidebarUsername
        ) {

            sidebarUsername.textContent =
                username;

        }


        if (
            userAvatar
        ) {

            userAvatar.textContent =
                username
                    .charAt(0)
                    .toUpperCase();

        }


        const subtitle =
            getElement(
                "listSubtitle"
            );


        if (
            subtitle
        ) {

            subtitle.textContent =
                `Your personal collection, ${username}.`;

        }


        const toolbar =
            getElement(
                "listToolbar"
            );


        if (
            toolbar
        ) {

            toolbar.classList.remove(
                "hidden"
            );

        }

    } else {

        loggedOutAccount?.classList.remove(
            "hidden"
        );


        loggedInAccount?.classList.add(
            "hidden"
        );


        const subtitle =
            getElement(
                "listSubtitle"
            );


        if (
            subtitle
        ) {

            subtitle.textContent =
                "Log in to access your personal anime collection.";

        }


        const toolbar =
            getElement(
                "listToolbar"
            );


        if (
            toolbar
        ) {

            toolbar.classList.add(
                "hidden"
            );

        }

    }


    renderMyList();


    renderHomeList();

}


/* =========================================================
   SESSION CHECK
========================================================= */

async function checkSession() {

    try {

        const data =
            await apiRequest(
                "/auth/me",
                {
                    cache:
                        "no-store"
                }
            );


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

    } catch (
        error
    ) {

        console.error(
            "SESSION ERROR:",
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
   MY LIST
========================================================= */

async function loadMyListFromServer() {

    if (
        !currentUser
    ) {

        myList =
            [];


        renderMyList();


        renderHomeList();


        return;

    }


    if (
        isLoadingList
    ) {

        return;

    }


    isLoadingList =
        true;


    try {

        const data =
            await apiRequest(
                "/api/my-list",
                {
                    cache:
                        "no-store"
                }
            );


        myList =
            normalizeAnimeList(
                data.data ||
                []
            );


        myList.sort(
            (
                a,
                b
            ) =>
                new Date(
                    b.savedAt ||
                    0
                ) -
                new Date(
                    a.savedAt ||
                    0
                )
        );


        myList =
            myList.map(
                anime => ({

                    ...anime,

                    rating:
                        normalizeRating(
                            anime.rating
                        )

                })
            );


        homeListIndex =
            0;


        renderMyList();


        renderHomeList();


    } catch (
        error
    ) {

        console.error(
            "MY LIST LOAD ERROR:",
            error
        );


        if (
            error.status ===
            401
        ) {

            currentUser =
                null;


            myList =
                [];


            updateAccountUI();


            return;

        }


        showToast(
            "Could not load your anime list.",
            "error"
        );

    } finally {

        isLoadingList =
            false;

    }

}


/* =========================================================
   LIST HELPERS
========================================================= */

function getAnimeId(
    anime
) {

    if (
        !anime
    ) {

        return null;

    }


    return Number(
        anime.mal_id ||
        anime.id ||
        anime.anime_id ||
        0
    ) || null;

}


function isInList(
    anime
) {

    const id =
        getAnimeId(
            anime
        );


    if (
        !id
    ) {

        return false;

    }


    return myList.some(
        item =>
            Number(
                getAnimeId(
                    item
                )
            ) ===
            Number(
                id
            )
    );

}


function getListAnime(
    anime
) {

    const id =
        getAnimeId(
            anime
        );


    if (
        !id
    ) {

        return null;

    }


    return myList.find(
        item =>
            Number(
                getAnimeId(
                    item
                )
            ) ===
            Number(
                id
            )
    ) || null;

}


/* =========================================================
   ADD ANIME
========================================================= */

async function addAnimeToList(
    anime,
    status = "plan",
    episode = 0,
    rating = 0
) {

    if (
        !currentUser
    ) {

        openLogin();

        return false;

    }


    const normalized =
        normalizeAnime(
            anime
        );


    if (
        !normalized
    ) {

        showToast(
            "Unable to identify this anime.",
            "error"
        );


        return false;

    }


    const animeId =
        getAnimeId(
            normalized
        );


    if (
        !animeId
    ) {

        showToast(
            "This anime has an invalid ID.",
            "error"
        );


        return false;

    }


    const cleanRating =
        normalizeRating(
            rating
        );


    try {

        await apiRequest(
            "/api/my-list",
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        {
                            anime:
                                normalized,

                            status,

                            episode:
                                Math.max(
                                    0,
                                    Math.floor(
                                        Number(
                                            episode
                                        ) ||
                                        0
                                    )
                                ),

                            rating:
                                cleanRating

                        }
                    )
            }
        );


        await loadMyListFromServer();


        updateModalListButton();


        updateModalListControls();


        showToast(
            "Added to My List.",
            "success"
        );


        return true;

    } catch (
        error
    ) {

        console.error(
            "ADD LIST ERROR:",
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

    if (
        !currentUser
    ) {

        return false;

    }


    const id =
        getAnimeId(
            anime
        );


    if (
        !id
    ) {

        return false;

    }


    try {

        await apiRequest(
            `/api/my-list/${id}`,
            {
                method:
                    "DELETE"
            }
        );


        myList =
            myList.filter(
                item =>
                    Number(
                        getAnimeId(
                            item
                        )
                    ) !==
                    Number(
                        id
                    )
            );


        renderMyList();


        renderHomeList();


        updateModalListButton();


        updateModalListControls();


        showToast(
            "Removed from My List."
        );


        return true;

    } catch (
        error
    ) {

        console.error(
            "REMOVE LIST ERROR:",
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
   UPDATE STATUS / EPISODE
========================================================= */

async function updateAnimeListEntry(
    anime,
    status,
    episode
) {

    if (
        !currentUser
    ) {

        return false;

    }


    const id =
        getAnimeId(
            anime
        );


    if (
        !id
    ) {

        return false;

    }


    let safeEpisode =
        Math.max(
            0,
            Math.floor(
                Number(
                    episode
                ) ||
                0
            )
        );


    const total =
        Number(
            anime.episodes ||
            anime.episode_count ||
            0
        );


    if (
        total >
        0
    ) {

        safeEpisode =
            Math.min(
                safeEpisode,
                total
            );

    }


    if (
        status ===
        "completed" &&
        total >
        0
    ) {

        safeEpisode =
            total;

    }


    try {

        const data =
            await apiRequest(
                `/api/my-list/${id}`,
                {
                    method:
                        "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            {
                                status,
                                episode:
                                    safeEpisode
                            }
                        )
                }
            );


        const existing =
            getListAnime(
                anime
            );


        if (
            existing
        ) {

            existing.listStatus =
                data.data?.status ||
                status;


            existing.status =
                existing.listStatus;


            existing.episode =
                Number(
                    data.data?.episode ??
                    safeEpisode
                );


            existing.savedAt =
                data.data?.savedAt ||
                new Date()
                    .toISOString();

        }


        renderMyList();


        renderHomeList();


        updateModalListControls();


        return true;

    } catch (
        error
    ) {

        console.error(
            "UPDATE LIST ERROR:",
            error
        );


        showToast(
            error.message ||
            "Could not update anime.",
            "error"
        );


        return false;

    }

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


    if (
        !currentUser
    ) {

        loginBox.classList.remove(
            "hidden"
        );


        container.innerHTML =
            "";


        return;

    }


    loginBox.classList.add(
        "hidden"
    );


    if (
        !myList.length
    ) {

        container.innerHTML = `
            <div class="empty-list">

                <div class="empty-list-icon">

                    <img
                        src="https://avatarfiles.alphacoders.com/352/thumb-1920-352391.jpeg"
                        alt="MIRAI"
                    >

                </div>

                <h3>
                    Your list is empty
                </h3>

                <p>
                    Search for an anime and start
                    building your collection.
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


    const activeTab =
        query(
            ".status-tab.active"
        );


    const status =
        activeTab?.dataset.status ||
        "all";


    const filtered =
        status ===
        "all"
            ? myList
            : myList.filter(
                anime =>
                    anime.listStatus ===
                    status
            );


    if (
        !filtered.length
    ) {

        container.innerHTML = `
            <div class="empty-list">

                <h3>
                    Nothing here yet
                </h3>

                <p>
                    You do not have any anime in
                    this category.
                </p>

            </div>
        `;


        return;

    }


    container.innerHTML = `
        <div class="anime-grid">
            ${
                filtered
                    .map(
                        (
                            anime,
                            index
                        ) =>
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
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                card.dataset.index
                            );


                        const anime =
                            filtered[
                                index
                            ];


                        openAnimeModal(
                            anime
                        );

                    }
                );

            }
        );

}


/* =========================================================
   MY LIST STATUS TABS
========================================================= */

queryAll(
    ".status-tab"
)
    .forEach(
        tab => {

            tab.addEventListener(
                "click",
                () => {

                    queryAll(
                        ".status-tab"
                    )
                        .forEach(
                            other => {

                                other.classList.remove(
                                    "active"
                                );

                            }
                        );


                    tab.classList.add(
                        "active"
                    );


                    renderMyList();

                }
            );

        }
    );


/* =========================================================
   HOME LIST
========================================================= */

function renderHomeList() {

    const grid =
        getElement(
            "homeListGrid"
        );


    if (
        !grid
    ) {

        return;

    }


    if (
        !currentUser
    ) {

        grid.innerHTML = `
            <div class="home-list-empty">

                <div class="home-list-empty-icon">

                    <img
                        src="https://avatarfiles.alphacoders.com/352/thumb-1920-352391.jpeg"
                        alt="MIRAI"
                    >

                </div>

                <h3>
                    Your list lives here
                </h3>

                <p>
                    Log in to see the anime you
                    have recently added.
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


    if (
        !myList.length
    ) {

        grid.innerHTML = `
            <div class="home-list-empty">

                <div class="home-list-empty-icon">
                    +
                </div>

                <h3>
                    Your list is empty
                </h3>

                <p>
                    Search for anime and add them
                    to see them here.
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
        (
            a,
            b
        ) =>
            new Date(
                b.savedAt ||
                0
            ) -
            new Date(
                a.savedAt ||
                0
            )
    );


    const maxStart =
        Math.max(
            0,
            Math.floor(
                (
                    myList.length -
                    1
                ) /
                HOME_LIST_SIZE
            ) *
            HOME_LIST_SIZE
        );


    homeListIndex =
        Math.min(
            homeListIndex,
            maxStart
        );


    const visible =
        myList.slice(
            homeListIndex,
            homeListIndex +
            HOME_LIST_SIZE
        );


    grid.innerHTML =
        visible
            .map(
                (
                    anime,
                    index
                ) =>
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
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                card.dataset.index
                            );


                        openAnimeModal(
                            visible[
                                index
                            ]
                        );

                    }
                );

            }
        );


    updateHomeListControls();

}


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


    if (
        previous
    ) {

        previous.disabled =
            homeListIndex <=
            0;

    }


    if (
        next
    ) {

        next.disabled =
            homeListIndex +
            HOME_LIST_SIZE >=
            total;

    }


    if (
        counter
    ) {

        if (
            !total
        ) {

            counter.textContent =
                "0 anime";

        } else {

            const start =
                homeListIndex +
                1;


            const end =
                Math.min(
                    homeListIndex +
                    HOME_LIST_SIZE,
                    total
                );


            counter.textContent =
                `${start}-${end} of ${total}`;

        }

    }

}


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
   ANIME CARD
========================================================= */

function animeCard(
    anime,
    index
) {

    const normalized =
        normalizeAnime(
            anime
        );


    if (
        !normalized
    ) {

        return "";

    }


    const image =
        normalized.image ||
        normalized.image_url ||
        "";


    const title =
        normalized.title ||
        "Unknown Anime";


    const score =
        normalized.score;


    const episodes =
        normalized.episodes;


    const rating =
        normalizeRating(
            normalized.rating
        );


    let statusText =
        "";


    switch (
        normalized.listStatus
    ) {

        case "watching":

            statusText =
                "Watching";

            break;


        case "completed":

            statusText =
                "Completed";

            break;


        case "plan":

            statusText =
                "Plan to Watch";

            break;


        case "on_hold":

            statusText =
                "On Hold";

            break;


        case "dropped":

            statusText =
                "Dropped";

            break;

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


                ${
                    score !== null &&
                    score !== undefined
                        ? `
                            <div class="score-badge">
                                ★ ${
                                    escapeHTML(
                                        Number(
                                            score
                                        )
                                            .toFixed(
                                                1
                                            )
                                    )
                                }
                            </div>
                        `
                        : ""
                }


                ${
                    rating >
                    0
                        ? `
                            <div class="list-rating-badge">
                                ★ ${
                                    escapeHTML(
                                        rating.toFixed(
                                            1
                                        )
                                    )
                                }/5
                            </div>
                        `
                        : ""
                }

            </div>


            <div class="anime-card-info">

                <div class="anime-card-title">
                    ${
                        escapeHTML(
                            title
                        )
                    }
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
                        episodes
                            ? `${escapeHTML(
                                String(
                                    episodes
                                )
                            )} episodes`
                            : "Episodes unknown"
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


    if (
        !currentAnime
    ) {

        showToast(
            "Unable to open this anime.",
            "error"
        );


        return;

    }


    const image =
        currentAnime.image ||
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
        "Unknown";


    const type =
        currentAnime.type ||
        "Anime";


    const imageElement =
        getElement(
            "modalAnimeImage"
        );


    if (
        imageElement
    ) {

        imageElement.src =
            image;


        imageElement.alt =
            title;


        imageElement.style.display =
            image
                ? ""
                : "none";

    }


    const typeElement =
        getElement(
            "modalAnimeType"
        );


    if (
        typeElement
    ) {

        typeElement.textContent =
            String(
                type
            ).toUpperCase();

    }


    const titleElement =
        getElement(
            "modalAnimeTitle"
        );


    if (
        titleElement
    ) {

        titleElement.textContent =
            title;

    }


    const meta =
        getElement(
            "modalAnimeMeta"
        );


    if (
        meta
    ) {

        meta.textContent =
            `★ ${
                score === null
                    ? "N/A"
                    : score
            } • ${
                episodes ||
                "?"
            } episodes`;

    }


    const synopsis =
        getElement(
            "modalAnimeSynopsis"
        );


    if (
        synopsis
    ) {

        synopsis.textContent =
            currentAnime.synopsis ||
            "No synopsis available.";

    }


    updateModalListButton();


    updateModalListControls();


    loadAnimeTrailerButton(
        currentAnime
    );


    animeModal?.classList.add(
        "open"
    );


    document.body.style.overflow =
        "hidden";

}


function closeAnimeModal() {

    animeModal?.classList.remove(
        "open"
    );


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
   MODAL LIST BUTTON
========================================================= */

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


getElement(
    "modalListButton"
)?.addEventListener(
    "click",
    async () => {

        if (
            !currentAnime
        ) {

            return;

        }


        if (
            !currentUser
        ) {

            closeAnimeModal();


            openLogin();


            showToast(
                "Log in to manage your list.",
                "error"
            );


            return;

        }


        const button =
            getElement(
                "modalListButton"
            );


        if (
            button
        ) {

            button.disabled =
                true;

        }


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


            updateModalListButton();


            updateModalListControls();

        } finally {

            if (
                button
            ) {

                button.disabled =
                    false;

            }

        }

    }
);


/* =========================================================
   MODAL LIST MANAGEMENT
========================================================= */

function updateModalListControls() {

    const management =
        getElement(
            "listManagement"
        );


    if (
        !management
    ) {

        return;

    }


    if (
        !currentAnime ||
        !isInList(
            currentAnime
        )
    ) {

        management.classList.add(
            "hidden"
        );


        return;

    }


    management.classList.remove(
        "hidden"
    );


    const existing =
        getListAnime(
            currentAnime
        );


    if (
        !existing
    ) {

        return;

    }


    const status =
        getElement(
            "animeStatusSelect"
        );


    const episode =
        getElement(
            "episodeInput"
        );


    if (
        status
    ) {

        status.value =
            existing.listStatus ||
            "plan";

    }


    if (
        episode
    ) {

        episode.value =
            Number(
                existing.episode ||
                0
            );

    }


    const currentStatus =
        getElement(
            "modalCurrentStatus"
        );


    if (
        currentStatus
    ) {

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
            `${labels[
                existing.listStatus
            ] ||
            existing.listStatus ||
            "Unknown"} • Episode ${
                Number(
                    existing.episode ||
                    0
                )
            }`;

    }

}


/* =========================================================
   EPISODE BUTTONS
========================================================= */

getElement(
    "episodePlus"
)?.addEventListener(
    "click",
    () => {

        const input =
            getElement(
                "episodeInput"
            );


        if (
            !input ||
            !currentAnime
        ) {

            return;

        }


        const current =
            Math.max(
                0,
                Math.floor(
                    Number(
                        input.value ||
                        0
                    )
                )
            );


        const maximum =
            Number(
                currentAnime.episodes ||
                currentAnime.episode_count ||
                999999
            );


        input.value =
            Math.min(
                current + 1,
                maximum
            );

    }
);


getElement(
    "episodeMinus"
)?.addEventListener(
    "click",
    () => {

        const input =
            getElement(
                "episodeInput"
            );


        if (
            !input
        ) {

            return;

        }


        const current =
            Math.max(
                0,
                Math.floor(
                    Number(
                        input.value ||
                        0
                    )
                )
            );


        input.value =
            Math.max(
                0,
                current - 1
            );

    }
);


/* =========================================================
   SAVE LIST CHANGES
========================================================= */

getElement(
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


        const status =
            getElement(
                "animeStatusSelect"
            )
            ?.value ||
            "plan";


        const episode =
            Number(
                getElement(
                    "episodeInput"
                )
                ?.value ||
                0
            );


        const button =
            getElement(
                "saveListChanges"
            );


        const oldText =
            button?.textContent ||
            "Save Changes";


        if (
            button
        ) {

            button.disabled =
                true;

            button.textContent =
                "Saving...";

        }


        try {

            await updateAnimeListEntry(
                currentAnime,
                status,
                episode
            );


            showToast(
                "Anime updated.",
                "success"
            );


        } finally {

            if (
                button
            ) {

                button.disabled =
                    false;

                button.textContent =
                    oldText;

            }

        }

    }
);


/* =========================================================
   RATING MODAL
========================================================= */

function updateRatingDisplay(
    value
) {

    let rating =
        roundRating(
            value
        );


    rating =
        clamp(
            rating,
            RATING_MIN,
            RATING_MAX
        );


    currentRating =
        Number(
            rating.toFixed(
                1
            )
        );


    const big =
        getElement(
            "ratingBigNumber"
        );


    const label =
        getElement(
            "ratingValue"
        );


    if (
        big
    ) {

        big.textContent =
            currentRating.toFixed(
                1
            );

    }


    if (
        label
    ) {

        label.textContent =
            `${currentRating.toFixed(
                1
            )} / 5`;

    }

}


function openRatingModal() {

    if (
        !currentUser
    ) {

        closeAnimeModal();


        openLogin();


        showToast(
            "Log in to rate anime.",
            "error"
        );


        return;

    }


    if (
        !currentAnime
    ) {

        return;

    }


    if (
        !isInList(
            currentAnime
        )
    ) {

        showToast(
            "Add this anime to My List before rating it.",
            "error"
        );


        return;

    }


    const existing =
        getListAnime(
            currentAnime
        );


    currentRating =
        normalizeRating(
            existing?.rating
        );


    const title =
        getElement(
            "ratingAnimeTitle"
        );


    if (
        title
    ) {

        title.textContent =
            currentAnime.title ||
            "Anime";

    }


    const slider =
        getElement(
            "ratingSlider"
        );


    if (
        slider
    ) {

        slider.min =
            String(
                RATING_MIN
            );


        slider.max =
            String(
                RATING_MAX
            );


        slider.step =
            String(
                RATING_STEP
            );


        slider.value =
            currentRating ||
            RATING_MIN;


        updateRatingDisplay(
            slider.value
        );

    }


    ratingModal?.classList.add(
        "open"
    );


    document.body.style.overflow =
        "hidden";

}


function closeRatingModal() {

    ratingModal?.classList.remove(
        "open"
    );


    restoreBodyScroll();

}


getElement(
    "modalRateButton"
)?.addEventListener(
    "click",
    openRatingModal
);


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
   RATING SLIDER
========================================================= */

const ratingSlider =
    getElement(
        "ratingSlider"
    );


if (
    ratingSlider
) {

    ratingSlider.min =
        String(
            RATING_MIN
        );


    ratingSlider.max =
        String(
            RATING_MAX
        );


    ratingSlider.step =
        String(
            RATING_STEP
        );


    ratingSlider.addEventListener(
        "input",
        event => {

            updateRatingDisplay(
                event.target.value
            );

        }
    );


    ratingSlider.addEventListener(
        "change",
        event => {

            updateRatingDisplay(
                event.target.value
            );

        }
    );

}


/* =========================================================
   SAVE RATING
========================================================= */

getElement(
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


        const id =
            getAnimeId(
                currentAnime
            );


        if (
            !id
        ) {

            return;

        }


        const rating =
            normalizeRating(
                currentRating
            );


        if (
            !rating
        ) {

            showToast(
                "Choose a rating first.",
                "error"
            );


            return;

        }


        const button =
            getElement(
                "submitRating"
            );


        const oldText =
            button?.textContent ||
            "Save Rating";


        if (
            button
        ) {

            button.disabled =
                true;

            button.textContent =
                "Saving...";

        }


        try {

            const data =
                await apiRequest(
                    `/api/my-list/${id}/rating`,
                    {
                        method:
                            "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                {
                                    rating
                                }
                            )
                    }
                );


            const existing =
                getListAnime(
                    currentAnime
                );


            if (
                existing
            ) {

                existing.rating =
                    normalizeRating(
                        data.rating ??
                        rating
                    );

            }


            currentAnime.rating =
                normalizeRating(
                    data.rating ??
                    rating
                );


            renderMyList();


            renderHomeList();


            closeRatingModal();


            showToast(
                `Rated ${rating.toFixed(1)}/5.`,
                "success"
            );


        } catch (
            error
        ) {

            console.error(
                "RATING SAVE ERROR:",
                error
            );


            showToast(
                error.message ||
                "Could not save rating.",
                "error"
            );


        } finally {

            if (
                button
            ) {

                button.disabled =
                    false;

                button.textContent =
                    oldText;

            }

        }

    }
);


/* =========================================================
   SEARCH PAGE
========================================================= */

getElement(
    "searchForm"
)?.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const text =
            getElement(
                "searchInput"
            )
            ?.value
            .trim() ||
            "";


        performSearch(
            text
        );

    }
);


async function performSearch(
    searchText
) {

    const grid =
        getElement(
            "searchGrid"
        );


    const status =
        getElement(
            "searchStatus"
        );


    if (
        !searchText
    ) {

        if (
            status
        ) {

            status.textContent =
                "Enter an anime name to search.";

        }


        if (
            grid
        ) {

            grid.innerHTML =
                "";

        }


        return;

    }


    if (
        status
    ) {

        status.textContent =
            `Searching for "${searchText}"...`;

    }


    if (
        grid
    ) {

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
            await apiRequest(
                `/anime/search?name=${encodeURIComponent(
                    searchText
                )}`
            );


        const anime =
            normalizeAnimeList(
                data.data ||
                []
            );


        if (
            !anime.length
        ) {

            if (
                status
            ) {

                status.textContent =
                    "No anime found.";

            }


            if (
                grid
            ) {

                grid.innerHTML = `

                    <div class="loading">

                        No anime found.

                    </div>

                `;

            }


            return;

        }


        if (
            status
        ) {

            status.textContent =
                `${anime.length} result${
                    anime.length ===
                    1
                        ? ""
                        : "s"
                } found.`;

        }


        renderAnimeGrid(
            grid,
            anime
        );


    } catch (
        error
    ) {

        console.error(
            "SEARCH ERROR:",
            error
        );


        if (
            status
        ) {

            status.textContent =
                "Search failed. Please try again.";

        }


        if (
            grid
        ) {

            grid.innerHTML = `

                <div class="loading">

                    Search failed.

                </div>

            `;

        }

    }

}


/* =========================================================
   GRID RENDERER
========================================================= */

function renderAnimeGrid(
    grid,
    animeList
) {

    if (
        !grid
    ) {

        return;

    }


    const normalized =
        normalizeAnimeList(
            animeList
        );


    if (
        !normalized.length
    ) {

        grid.innerHTML = `

            <div class="loading">

                No anime available.

            </div>

        `;


        return;

    }


    grid.innerHTML =
        normalized
            .map(
                (
                    anime,
                    index
                ) =>
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
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                card.dataset.index
                            );


                        openAnimeModal(
                            normalized[
                                index
                            ]
                        );

                    }
                );

            }
        );

}


/* =========================================================
   POPULAR ANIME
========================================================= */

async function loadPopularAnime() {

    if (
        isLoadingPopular
    ) {

        return;

    }


    isLoadingPopular =
        true;


    try {

        const data =
            await apiRequest(
                "/anime/top?limit=30"
            );


        popularAnime =
            normalizeAnimeList(
                data.data ||
                []
            );


        featuredIndex =
            0;


        renderHero();


        const grid =
            getElement(
                "popularGrid"
            );


        if (
            grid
        ) {

            renderAnimeGrid(
                grid,
                popularAnime.slice(
                    0,
                    12
                )
            );

        }


        startHeroAutoplay();


    } catch (
        error
    ) {

        console.error(
            "POPULAR ERROR:",
            error
        );


        const grid =
            getElement(
                "popularGrid"
            );


        if (
            grid
        ) {

            grid.innerHTML = `

                <div class="loading">

                    Unable to load popular anime.

                </div>

            `;

        }

    } finally {

        isLoadingPopular =
            false;

    }

}


/* =========================================================
   HERO
========================================================= */

function getFeaturedAnime() {

    if (
        !popularAnime.length
    ) {

        return null;

    }


    const count =
        Math.min(
            popularAnime.length,
            8
        );


    featuredIndex =
        (
            featuredIndex +
            count
        ) %
        count;


    return popularAnime[
        featuredIndex
    ];

}


function renderHero() {

    const anime =
        getFeaturedAnime();


    if (
        !anime
    ) {

        return;

    }


    const image =
        anime.image ||
        anime.image_url ||
        "";


    const title =
        anime.title ||
        "MIRAI";


    const hero =
        getElement(
            "homeHero"
        );


    const heroImage =
        getElement(
            "heroImage"
        );


    const heroTitle =
        getElement(
            "heroTitle"
        );


    const heroSynopsis =
        getElement(
            "heroSynopsis"
        );


    const heroMeta =
        getElement(
            "heroMeta"
        );


    if (
        heroImage
    ) {

        heroImage.src =
            image;


        heroImage.alt =
            title;

    }


    if (
        heroTitle
    ) {

        heroTitle.textContent =
            title;

    }


    if (
        heroSynopsis
    ) {

        heroSynopsis.textContent =
            anime.synopsis ||
            "Discover your next favourite anime.";

    }


    if (
        heroMeta
    ) {

        const score =
            anime.score ??
            "N/A";


        const episodes =
            anime.episodes ??
            "?";


        heroMeta.textContent =
            `★ ${
                score ===
                "N/A"
                    ? score
                    : Number(
                        score
                    ).toFixed(
                        1
                    )
            } • ${
                anime.type ||
                "Anime"
            } • ${
                episodes
            } episodes`;

    }


    if (
        hero &&
        image
    ) {

        hero.style.backgroundImage =
            `
                linear-gradient(
                    90deg,
                    rgba(5,6,10,.98) 0%,
                    rgba(5,6,10,.88) 34%,
                    rgba(5,6,10,.50) 63%,
                    rgba(5,6,10,.10) 100%
                ),
                url("${image.replaceAll(
                    '"',
                    '\\"'
                )}")
            `;

    }


    const viewButton =
        getElement(
            "heroViewButton"
        );


    if (
        viewButton
    ) {

        viewButton.onclick =
            () => {

                openAnimeModal(
                    anime
                );

            };

    }


    const trailerButton =
        getElement(
            "heroTrailerButton"
        );


    if (
        trailerButton
    ) {

        trailerButton.onclick =
            () => {

                openTrailerForAnime(
                    anime
                );

            };

    }


    renderHeroDots();

}


function renderHeroDots() {

    const container =
        getElement(
            "heroDots"
        );


    if (
        !container ||
        !popularAnime.length
    ) {

        return;

    }


    const count =
        Math.min(
            popularAnime.length,
            8
        );


    container.innerHTML =
        Array.from(
            {
                length:
                    count
            },
            (
                _,
                index
            ) => `

                <button
                    class="carousel-dot ${
                        index ===
                        featuredIndex
                            ? "active"
                            : ""
                    }"
                    type="button"
                    data-hero-index="${index}"
                    aria-label="Featured anime ${index + 1}"
                ></button>

            `
        )
            .join("");


    container
        .querySelectorAll(
            "[data-hero-index]"
        )
        .forEach(
            dot => {

                dot.addEventListener(
                    "click",
                    () => {

                        featuredIndex =
                            Number(
                                dot.dataset
                                    .heroIndex
                            );


                        renderHero();

                        restartHeroAutoplay();

                    }
                );

            }
        );

}


/* =========================================================
   HERO NEXT / PREVIOUS
========================================================= */

function nextFeaturedAnime() {

    if (
        !popularAnime.length
    ) {

        return;

    }


    const count =
        Math.min(
            popularAnime.length,
            8
        );


    featuredIndex =
        (
            featuredIndex +
            1
        ) %
        count;


    renderHero();


    restartHeroAutoplay();

}


function previousFeaturedAnime() {

    if (
        !popularAnime.length
    ) {

        return;

    }


    const count =
        Math.min(
            popularAnime.length,
            8
        );


    featuredIndex =
        (
            featuredIndex -
            1 +
            count
        ) %
        count;


    renderHero();


    restartHeroAutoplay();

}


getElement(
    "heroNext"
)?.addEventListener(
    "click",
    nextFeaturedAnime
);


getElement(
    "heroPrevious"
)?.addEventListener(
    "click",
    previousFeaturedAnime
);


/* =========================================================
   HERO AUTOPLAY
========================================================= */

function startHeroAutoplay() {

    clearInterval(
        heroAutoplayTimer
    );


    heroAutoplayTimer =
        setInterval(
            () => {

                const home =
                    pages.home;


                if (
                    home &&
                    home.classList.contains(
                        "active-page"
                    )
                ) {

                    nextFeaturedAnime();

                }

            },
            8000
        );

}


function restartHeroAutoplay() {

    clearInterval(
        heroAutoplayTimer
    );


    startHeroAutoplay();

}


/* =========================================================
   HERO PAUSE ON HOVER
========================================================= */

getElement(
    "homeHero"
)?.addEventListener(
    "mouseenter",
    () => {

        clearInterval(
            heroAutoplayTimer
        );

    }
);


getElement(
    "homeHero"
)?.addEventListener(
    "mouseleave",
    () => {

        startHeroAutoplay();

    }
);


/* =========================================================
   TOUCH SWIPE
========================================================= */

let heroTouchStartX =
    null;


document.addEventListener(
    "touchstart",
    event => {

        const home =
            pages.home;


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


        heroTouchStartX =
            event.touches[0]
                .clientX;

    },
    {
        passive:
            true
    }
);


document.addEventListener(
    "touchend",
    event => {

        if (
            heroTouchStartX ===
            null
        ) {

            return;

        }


        const endX =
            event.changedTouches[0]
                ?.clientX;


        if (
            typeof endX !==
            "number"
        ) {

            heroTouchStartX =
                null;

            return;

        }


        const distance =
            heroTouchStartX -
            endX;


        if (
            Math.abs(
                distance
            ) >
            55
        ) {

            if (
                distance >
                0
            ) {

                nextFeaturedAnime();

            } else {

                previousFeaturedAnime();

            }

        }


        heroTouchStartX =
            null;

    },
    {
        passive:
            true
    }
);


/* =========================================================
   KEYBOARD CAROUSEL
========================================================= */

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
            pages.home;


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

            nextFeaturedAnime();

        }


        if (
            event.key ===
            "ArrowLeft"
        ) {

            previousFeaturedAnime();

        }

    }
);


/* =========================================================
   TRENDING
========================================================= */

async function loadTrending() {

    const grid =
        getElement(
            "trendingGrid"
        );


    if (
        !grid
    ) {

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
            await apiRequest(
                "/anime/trending?limit=30"
            );


        renderAnimeGrid(
            grid,
            data.data ||
            []
        );


    } catch (
        error
    ) {

        console.error(
            "TRENDING ERROR:",
            error
        );


        grid.innerHTML = `

            <div class="loading">

                Unable to load trending anime.

            </div>

        `;

    }

}


/* =========================================================
   DISCOVER
========================================================= */

queryAll(
    ".discover-filter"
)
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    queryAll(
                        ".discover-filter"
                    )
                        .forEach(
                            other => {

                                other.classList.remove(
                                    "active"
                                );

                            }
                        );


                    button.classList.add(
                        "active"
                    );


                    currentDiscoverMode =
                        button.dataset.discover ||
                        "popular";


                    loadDiscover(
                        currentDiscoverMode
                    );

                }
            );

        }
    );


async function loadDiscover(
    mode =
        "popular"
) {

    const grid =
        getElement(
            "discoverGrid"
        );


    if (
        !grid
    ) {

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
            mode ===
            "popular"
        ) {

            const data =
                await apiRequest(
                    "/anime/trending?limit=30"
                );


            anime =
                normalizeAnimeList(
                    data.data ||
                    []
                );

        } else {

            const data =
                await apiRequest(
                    "/anime/top?limit=50"
                );


            anime =
                normalizeAnimeList(
                    data.data ||
                    []
                );

        }


        if (
            mode ===
            "upcoming"
        ) {

            const now =
                new Date();


            anime =
                anime
                    .filter(
                        item => {

                            if (
                                !item.start_date
                            ) {

                                return false;

                            }


                            const date =
                                new Date(
                                    item.start_date
                                );


                            return (
                                date >
                                now
                            );

                        }
                    );

        }


        if (
            mode ===
            "airing"
        ) {

            anime =
                anime.filter(
                    item =>
                        String(
                            item.status ||
                            ""
                        ).toLowerCase()
                            .includes(
                                "currently"
                            ) ||
                        Boolean(
                            item.broadcast
                        )
                );

        }


        renderAnimeGrid(
            grid,
            anime.slice(
                0,
                24
            )
        );


    } catch (
        error
    ) {

        console.error(
            "DISCOVER ERROR:",
            error
        );


        grid.innerHTML = `

            <div class="loading">

                Unable to load Discover.

            </div>

        `;

    }

}


/* =========================================================
   RANDOM
========================================================= */

getElement(
    "randomButton"
)?.addEventListener(
    "click",
    async () => {

        const result =
            getElement(
                "randomResult"
            );


        if (
            result
        ) {

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
                await apiRequest(
                    "/anime/random"
                );


            const anime =
                normalizeAnime(
                    data.data
                );


            if (
                !anime
            ) {

                throw new Error(
                    "No anime was returned."
                );

            }


            if (
                result
            ) {

                result.innerHTML =
                    "";

            }


            openAnimeModal(
                anime
            );


        } catch (
            error
        ) {

            console.error(
                "RANDOM ERROR:",
                error
            );


            if (
                result
            ) {

                result.innerHTML =
                    "";

            }


            showToast(
                "Unable to find a random anime.",
                "error"
            );

        }

    }
);


/* =========================================================
   SCHEDULE
========================================================= */

const VALID_DAYS = [

    "sunday",

    "monday",

    "tuesday",

    "wednesday",

    "thursday",

    "friday",

    "saturday"

];


function parseScheduleTime(
    anime
) {

    const airing =
        anime?.airing ||
        {};


    const broadcast =
        anime?.broadcast ||
        {};


    const raw =
        airing.time ||
        broadcast.start_time ||
        broadcast.time ||
        airing.display ||
        "";


    if (
        !raw
    ) {

        return null;

    }


    const match =
        String(
            raw
        )
            .match(
                /(\d{1,2}):(\d{2})/
            );


    if (
        !match
    ) {

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
        hour <
        0 ||
        hour >
        23 ||
        minute <
        0 ||
        minute >
        59
    ) {

        return null;

    }


    return {

        hour,

        minute,

        total:
            (
                hour *
                60
            ) +
            minute

    };

}


function formatScheduleTime(
    hour,
    minute
) {

    const period =
        hour >=
        12
            ? "PM"
            : "AM";


    const twelveHour =
        hour %
        12 ||
        12;


    return (
        `${twelveHour}:` +
        `${String(
            minute
        ).padStart(
            2,
            "0"
        )} ${period}`
    );

}


/* =========================================================
   SCHEDULE HOURS
========================================================= */

function renderScheduleHourStrip(
    animeList
) {

    const container =
        getElement(
            "scheduleHours"
        );


    if (
        !container
    ) {

        return;

    }


    const presentHours =
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
                    parseScheduleTime(
                        anime
                    );


                if (
                    time
                ) {

                    presentHours.add(
                        time.hour
                    );

                }

            }
        );


    container.innerHTML =
        Array.from(
            {
                length:
                    24
            },
            (
                _,
                hour
            ) => `

                <button
                    type="button"
                    class="schedule-hour-chip ${
                        presentHours.has(
                            hour
                        )
                            ? "has-anime"
                            : ""
                    }"
                    data-hour="${hour}"
                >
                    ${
                        escapeHTML(
                            formatScheduleTime(
                                hour,
                                0
                            )
                        )
                    }
                </button>

            `
        )
            .join("");


    container
        .querySelectorAll(
            "[data-hour]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const hour =
                            Number(
                                button.dataset.hour
                            );


                        const list =
                            (
                                Array.isArray(
                                    animeList
                                )
                                    ? animeList
                                    : []
                            )
                                .filter(
                                    anime => {

                                        const time =
                                            parseScheduleTime(
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
                            list.length
                        ) {

                            renderScheduleGrid(
                                getElement(
                                    "scheduleGrid"
                                ),
                                list
                            );

                        } else {

                            renderScheduleGrid(
                                getElement(
                                    "scheduleGrid"
                                ),
                                []
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   SCHEDULE LOAD
========================================================= */

async function loadSchedule(
    day =
        "monday"
) {

    const grid =
        getElement(
            "scheduleGrid"
        );


    if (
        !grid
    ) {

        return;

    }


    currentScheduleDay =
        String(
            day
        )
            .trim()
            .toLowerCase();


    if (
        !VALID_DAYS.includes(
            currentScheduleDay
        )
    ) {

        currentScheduleDay =
            "monday";

    }


    updateScheduleTabs(
        currentScheduleDay
    );


    if (
        scheduleData[
            currentScheduleDay
        ]
    ) {

        renderScheduleHourStrip(
            scheduleData[
                currentScheduleDay
            ]
        );


        renderScheduleGrid(
            grid,
            scheduleData[
                currentScheduleDay
            ]
        );


        return;

    }


    if (
        isLoadingSchedule
    ) {

        return;

    }


    isLoadingSchedule =
        true;


    grid.innerHTML = `

        <div class="loading">

            <div class="spinner"></div>

            <span>
                Loading ${
                    escapeHTML(
                        currentScheduleDay
                    )
                } schedule...
            </span>

        </div>

    `;


    try {

        const data =
            await apiRequest(
                `/anime/schedule?day=${encodeURIComponent(
                    currentScheduleDay
                )}`
            );


        scheduleData[
            currentScheduleDay
        ] =
            Array.isArray(
                data.data
            )
                ? data.data.map(
                    item => ({

                        ...normalizeAnime(
                            item
                        ),

                        airing:
                            item.airing ||
                            null

                    })
                )
                : [];


        renderScheduleHourStrip(
            scheduleData[
                currentScheduleDay
            ]
        );


        renderScheduleGrid(
            grid,
            scheduleData[
                currentScheduleDay
            ]
        );


    } catch (
        error
    ) {

        console.error(
            "SCHEDULE ERROR:",
            error
        );


        grid.innerHTML = `

            <div class="loading">

                Unable to load the schedule.

            </div>

        `;


    } finally {

        isLoadingSchedule =
            false;

    }

}


/* =========================================================
   SCHEDULE TABS
========================================================= */

function updateScheduleTabs(
    activeDay
) {

    queryAll(
        ".schedule-tab"
    )
        .forEach(
            tab => {

                tab.classList.toggle(
                    "active",

                    String(
                        tab.dataset.day ||
                        ""
                    )
                        .toLowerCase() ===
                    activeDay
                );

            }
        );

}


queryAll(
    ".schedule-tab"
)
    .forEach(
        tab => {

            tab.addEventListener(
                "click",
                () => {

                    loadSchedule(
                        tab.dataset.day ||
                        "monday"
                    );

                }
            );

        }
    );


/* =========================================================
   SCHEDULE GRID
========================================================= */

function renderScheduleGrid(
    grid,
    animeList
) {

    if (
        !grid
    ) {

        return;

    }


    if (
        !animeList ||
        !animeList.length
    ) {

        grid.innerHTML = `

            <div class="loading">

                No anime found for this time.

            </div>

        `;


        return;

    }


    const sorted =
        [...animeList]
            .sort(
                (
                    a,
                    b
                ) => {

                    const at =
                        parseScheduleTime(
                            a
                        );


                    const bt =
                        parseScheduleTime(
                            b
                        );


                    return (
                        (
                            at?.total ??
                            Infinity
                        ) -
                        (
                            bt?.total ??
                            Infinity
                        )
                    );

                }
            );


    const groups =
        new Map();


    sorted.forEach(
        anime => {

            const time =
                parseScheduleTime(
                    anime
                );


            const key =
                time
                    ? `${time.hour}:${time.minute}`
                    : "unknown";


            if (
                !groups.has(
                    key
                )
            ) {

                groups.set(
                    key,
                    []
                );

            }


            groups
                .get(
                    key
                )
                .push(
                    anime
                );

        }
    );


    const ordered =
        [...groups.entries()]
            .sort(
                (
                    [a],
                    [b]
                ) => {

                    if (
                        a ===
                        "unknown"
                    ) {

                        return 1;

                    }


                    if (
                        b ===
                        "unknown"
                    ) {

                        return -1;

                    }


                    const [
                        ah,
                        am
                    ] =
                        a
                            .split(
                                ":"
                            )
                            .map(
                                Number
                            );


                    const [
                        bh,
                        bm
                    ] =
                        b
                            .split(
                                ":"
                            )
                            .map(
                                Number
                            );


                    return (
                        ah *
                        60 +
                        am
                    ) -
                    (
                        bh *
                        60 +
                        bm
                    );

                }
            );


    grid.innerHTML =
        ordered
            .map(
                (
                    [
                        key,
                        items
                    ]
                ) => {

                    const parts =
                        key ===
                        "unknown"
                            ? null
                            : key
                                .split(
                                    ":"
                                )
                                .map(
                                    Number
                                );


                    const label =
                        parts
                            ? formatScheduleTime(
                                parts[0],
                                parts[1]
                            )
                            : "Time TBA";


                    return `

                        <section
                            class="schedule-hour"
                        >

                            <div class="schedule-time">
                                ${
                                    escapeHTML(
                                        label
                                    )
                                }
                            </div>


                            <div>

                                ${
                                    items
                                        .map(
                                            anime => `

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
                                                            ${
                                                                escapeHTML(
                                                                    anime.title
                                                                )
                                                            }
                                                        </strong>


                                                        <div class="anime-card-meta">

                                                            ${
                                                                anime.type
                                                                    ? escapeHTML(
                                                                        anime.type
                                                                    )
                                                                    : "Anime"
                                                            }

                                                            ${
                                                                anime.episodes
                                                                    ? ` • ${
                                                                        escapeHTML(
                                                                            String(
                                                                                anime.episodes
                                                                            )
                                                                        )
                                                                    } episodes`
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
            .join("");


    grid
        .querySelectorAll(
            ".schedule-anime"
        )
        .forEach(
            item => {

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


                        if (
                            anime
                        ) {

                            openAnimeModal(
                                anime
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   TRAILERS
========================================================= */

async function getTrailer(
    anime
) {

    const id =
        getAnimeId(
            anime
        );


    if (
        !id
    ) {

        return null;

    }


    try {

        const data =
            await apiRequest(
                `/anime/trailer/${id}`
            );


        return (
            data.data ||
            null
        );

    } catch (
        error
    ) {

        console.debug(
            "TRAILER ERROR:",
            error
        );


        return null;

    }

}


async function openTrailerForAnime(
    anime
) {

    const trailer =
        await getTrailer(
            anime
        );


    if (
        !trailer?.embed_url
    ) {

        showToast(
            "No official trailer is available for this anime.",
            "error"
        );


        return;

    }


    openTrailerModal(
        trailer
    );

}


function openTrailerModal(
    trailer
) {

    const frame =
        getElement(
            "trailerFrame"
        );


    if (
        !frame ||
        !trailer?.embed_url
    ) {

        return;

    }


    frame.src =
        trailer.embed_url;


    trailerModal?.classList.add(
        "open"
    );


    document.body.style.overflow =
        "hidden";

}


function closeTrailerModal() {

    const frame =
        getElement(
            "trailerFrame"
        );


    if (
        frame
    ) {

        frame.src =
            "";

    }


    trailerModal?.classList.remove(
        "open"
    );


    restoreBodyScroll();

}


async function loadAnimeTrailerButton(
    anime
) {

    const area =
        getElement(
            "modalTrailerArea"
        );


    const button =
        getElement(
            "modalTrailerButton"
        );


    if (
        !area ||
        !button ||
        !anime
    ) {

        return;

    }


    area.classList.add(
        "hidden"
    );


    const trailer =
        await getTrailer(
            anime
        );


    if (
        !trailer?.embed_url
    ) {

        return;

    }


    area.classList.remove(
        "hidden"
    );


    button.onclick =
        () => {

            openTrailerModal(
                trailer
            );

        };

}


getElement(
    "heroTrailerButton"
)?.addEventListener(
    "click",
    () => {

        const anime =
            getFeaturedAnime();


        if (
            anime
        ) {

            openTrailerForAnime(
                anime
            );

        }

    }
);


getElement(
    "modalTrailerButton"
)?.addEventListener(
    "click",
    () => {

        if (
            currentAnime
        ) {

            openTrailerForAnime(
                currentAnime
            );

        }

    }
);


getElement(
    "trailerModalClose"
)?.addEventListener(
    "click",
    closeTrailerModal
);


trailerModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            trailerModal
        ) {

            closeTrailerModal();

        }

    }
);


/* =========================================================
   RANDOM PAGE
========================================================= */

/* Random functionality is intentionally kept
   entirely server-driven so it does not repeatedly
   return the same local list item. */


/* =========================================================
   IMAGE ERROR HANDLING
========================================================= */

document.addEventListener(
    "error",
    event => {

        const target =
            event.target;


        if (
            target?.matches?.(
                ".anime-image, .modal-anime-image, #heroImage, .featured-slide-image"
            )
        ) {

            target.style.display =
                "none";

        }

    },
    true
);


/* =========================================================
   MODAL ESCAPE
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

        closeTrailerModal();

    }
);


/* =========================================================
   MODAL BACKGROUND CLICK
========================================================= */

[
    accountModal,
    animeModal,
    ratingModal,
    trailerModal
]
    .filter(
        Boolean
    )
    .forEach(
        modal => {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target !==
                        modal
                    ) {

                        return;

                    }


                    modal.classList.remove(
                        "open"
                    );


                    restoreBodyScroll();

                }
            );

        }
    );


/* =========================================================
   VISIBILITY REFRESH
   Useful when the same account is open on
   more than one browser/device.
========================================================= */

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


        try {

            await loadMyListFromServer();

        } catch (
            error
        ) {

            console.debug(
                "VISIBILITY LIST REFRESH ERROR:",
                error
            );

        }

    }
);


/* =========================================================
   PERIODIC LIST SYNC
========================================================= */

setInterval(
    async () => {

        if (
            !currentUser
        ) {

            return;

        }


        if (
            document.visibilityState !==
            "visible"
        ) {

            return;

        }


        try {

            await loadMyListFromServer();

        } catch (
            error
        ) {

            console.debug(
                "BACKGROUND SYNC ERROR:",
                error
            );

        }

    },
    60_000
);


/* =========================================================
   STARTUP
========================================================= */

async function initializeMIRAI() {

    updateAccountUI();


    await checkSession();


    await loadPopularAnime();


    const activeScheduleTab =
        query(
            ".schedule-tab.active"
        );


    currentScheduleDay =
        activeScheduleTab?.dataset.day ||
        "monday";


    await loadSchedule(
        currentScheduleDay
    );


    startHeroAutoplay();

}


initializeMIRAI();


/* =========================================================
   FINAL MOBILE POLISH
========================================================= */

(() => {

    const sidebar =
        getElement(
            "sidebar"
        );


    const menu =
        getElement(
            "mobileMenuBtn"
        );


    if (
        menu &&
        sidebar
    ) {

        menu.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                sidebar.classList.toggle(
                    "open"
                );


                getElement(
                    "mobileBackdrop"
                )?.classList.toggle(
                    "open",
                    sidebar.classList.contains(
                        "open"
                    )
                );

            }
        );

    }


    /*
       Prevent horizontal overflow caused
       by long anime titles.
    */

    document.documentElement.style.overflowX =
        "hidden";


    document.body.style.overflowX =
        "hidden";

})();