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

let myList = JSON.parse(
    localStorage.getItem("mirai_my_list") || "[]"
);

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

document
    .getElementById("mobileMenuBtn")
    .addEventListener("click", () => {

        document
            .getElementById("sidebar")
            .classList.toggle("open");

    });


document
    .getElementById("mobileAccountBtn")
    .addEventListener("click", () => {

        if (currentUser) {

            showPage("my-list");

        } else {

            openLogin();

        }

    });


/* =========================================================
   HERO
========================================================= */

document
    .getElementById("heroSearchBtn")
    .addEventListener("click", () => {

        showPage("search");

        document
            .getElementById("searchInput")
            .focus();

    });


document
    .getElementById("homeSearchBtn")
    .addEventListener("click", () => {

        showPage("search");

        document
            .getElementById("searchInput")
            .focus();

    });


document
    .getElementById("heroListBtn")
    .addEventListener("click", () => {

        showPage("my-list");

    });


document
    .getElementById("listLoginBtn")
    .addEventListener("click", openLogin);


/* =========================================================
   ACCOUNT MODAL
========================================================= */

function openAccountModal() {

    accountModal.classList.add("open");

    document.body.style.overflow = "hidden";

}


function closeAccountModal() {

    accountModal.classList.remove("open");

    document.body.style.overflow = "";

}


function openLogin() {

    clearAccountErrors();

    loginContainer.classList.remove("hidden");

    registerContainer.classList.add("hidden");

    openAccountModal();

}


function openRegister() {

    clearAccountErrors();

    loginContainer.classList.add("hidden");

    registerContainer.classList.remove("hidden");

    openAccountModal();

}


document
    .getElementById("sidebarLoginBtn")
    .addEventListener("click", openLogin);


document
    .getElementById("sidebarSignupBtn")
    .addEventListener("click", openRegister);


document
    .getElementById("showRegisterBtn")
    .addEventListener("click", openRegister);


document
    .getElementById("showLoginBtn")
    .addEventListener("click", openLogin);


document
    .getElementById("accountModalClose")
    .addEventListener("click", closeAccountModal);


accountModal.addEventListener("click", event => {

    if (event.target === accountModal) {
        closeAccountModal();
    }

});


/* =========================================================
   ACCOUNT ERRORS
========================================================= */

function showError(element, message) {

    element.textContent = message;

    element.classList.add("show");

}


function clearAccountErrors() {

    loginError.textContent = "";
    registerError.textContent = "";

    loginError.classList.remove("show");
    registerError.classList.remove("show");

}


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener("submit", async event => {

    event.preventDefault();

    clearAccountErrors();

    const email =
        document
            .getElementById("loginEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("loginPassword")
            .value;

    if (!email || !password) {

        showError(
            loginError,
            "Please enter your email and password."
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

        const response = await fetch(
            `${API_BASE}/auth/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                body: JSON.stringify({
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
                "Incorrect email or password."
            );

        }

        currentUser =
            data.user ||
            data.account ||
            data;

        updateAccountUI();

        closeAccountModal();

        loginForm.reset();

        showToast(
            `Welcome back, ${
                currentUser.username || "User"
            }!`,
            "success"
        );

    } catch (error) {

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


/* =========================================================
   REGISTER
========================================================= */

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

            const response = await fetch(
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
                data;

            updateAccountUI();

            closeAccountModal();

            registerForm.reset();

            showToast(
                "Your MIRAI account has been created!",
                "success"
            );

        } catch (error) {

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


/* =========================================================
   LOGOUT
========================================================= */

document
    .getElementById("logoutBtn")
    .addEventListener("click", async () => {

        try {

            await fetch(
                `${API_BASE}/auth/logout`,
                {
                    method: "POST",
                    credentials: "include"
                }
            );

        } catch (error) {

            console.log(
                "Logout request failed:",
                error
            );

        }

        currentUser = null;

        updateAccountUI();

        showToast(
            "You have been logged out."
        );

        showPage("home");

    });


/* =========================================================
   SESSION CHECK
========================================================= */

async function checkSession() {

    try {

        const response = await fetch(
            `${API_BASE}/auth/me`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        if (!response.ok) {

            currentUser = null;

            updateAccountUI();

            return;

        }

        const data =
            await response.json();

        currentUser =
            data.user ||
            data.account ||
            data;

        if (
            !currentUser ||
            (
                !currentUser.username &&
                !currentUser.email
            )
        ) {

            currentUser = null;

        }

        updateAccountUI();

    } catch (error) {

        console.log(
            "Session check failed:",
            error.message
        );

        currentUser = null;

        updateAccountUI();

    }

}


/* =========================================================
   ACCOUNT UI
========================================================= */

function updateAccountUI() {

    if (currentUser) {

        loggedOutAccount
            .classList
            .add("hidden");

        loggedInAccount
            .classList
            .remove("hidden");

        const username =
            currentUser.username ||
            currentUser.name ||
            currentUser.email?.split("@")[0] ||
            "User";

        sidebarUsername.textContent =
            username;

        userAvatar.textContent =
            username
                .charAt(0)
                .toUpperCase();

        document
            .getElementById("listSubtitle")
            .textContent =
            `Your personal collection, ${username}.`;

    } else {

        loggedOutAccount
            .classList
            .remove("hidden");

        loggedInAccount
            .classList
            .add("hidden");

        document
            .getElementById("listSubtitle")
            .textContent =
            "Log in to access your personal anime collection.";

    }

    renderMyList();

}


/* =========================================================
   ANIME API
========================================================= */

async function fetchAnime(url) {

    const response =
        await fetch(url);

    if (!response.ok) {

        throw new Error(
            "Anime API request failed."
        );

    }

    return await response.json();

}


/* =========================================================
   POPULAR
========================================================= */

async function loadPopularAnime() {

    const grid =
        document.getElementById("popularGrid");

    try {

        const data =
            await fetchAnime("/anime/top");

        const anime =
            data.data ||
            data.results ||
            data.anime ||
            [];

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

        console.error(error);

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
            await fetchAnime("/anime/top");

        const anime =
            data.data ||
            data.results ||
            data.anime ||
            [];

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

        console.error(error);

    }

}


/* =========================================================
   SEARCH
========================================================= */

document
    .getElementById("searchForm")
    .addEventListener(
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
                    data.data ||
                    data.results ||
                    data.anime ||
                    [];

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

                console.error(error);

            }

        }
    );


/* =========================================================
   ANIME GRID
========================================================= */

function renderAnimeGrid(
    grid,
    animeList
) {

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


function animeCard(
    anime,
    index
) {

    const image =
        anime.images?.jpg?.large_image_url ||
        anime.images?.jpg?.image_url ||
        anime.image_url ||
        anime.image ||
        "";

    const title =
        anime.title ||
        anime.name ||
        "Unknown Anime";

    const score =
        anime.score ??
        anime.mal_score ??
        "N/A";

    const episodes =
        anime.episodes ??
        anime.episode_count ??
        "?";

    return `
        <article
            class="anime-card"
            data-index="${index}"
        >

            <div class="anime-image-wrapper">

                <img
                    class="anime-image"
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(title)}"
                    loading="lazy"
                    onerror="this.style.display='none'"
                >

                <div class="score-badge">
                    ★ ${escapeHTML(String(score))}
                </div>

            </div>

            <div class="anime-card-info">

                <div class="anime-card-title">
                    ${escapeHTML(title)}
                </div>

                <div class="anime-card-meta">
                    ${escapeHTML(String(episodes))}
                    episodes
                </div>

            </div>

        </article>
    `;

}


/* =========================================================
   ANIME MODAL
========================================================= */

function openAnimeModal(anime) {

    currentAnime = anime;

    const image =
        anime.images?.jpg?.large_image_url ||
        anime.images?.jpg?.image_url ||
        anime.image_url ||
        anime.image ||
        "";

    const title =
        anime.title ||
        anime.name ||
        "Unknown Anime";

    const score =
        anime.score ??
        anime.mal_score ??
        "N/A";

    const episodes =
        anime.episodes ??
        anime.episode_count ??
        "?";

    const type =
        anime.type ||
        "Anime";

    const synopsis =
        anime.synopsis ||
        anime.description ||
        "No synopsis available.";

    const imageElement =
        document.getElementById(
            "modalAnimeImage"
        );

    imageElement.src = image;
    imageElement.alt = title;

    document.getElementById(
        "modalAnimeTitle"
    ).textContent = title;

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
    ).textContent = synopsis;

    updateModalListButton();

    animeModal.classList.add("open");

    document.body.style.overflow =
        "hidden";

}


function closeAnimeModal() {

    animeModal.classList.remove("open");

    document.body.style.overflow = "";

}


document
    .getElementById("animeModalClose")
    .addEventListener(
        "click",
        closeAnimeModal
    );


animeModal.addEventListener(
    "click",
    event => {

        if (event.target === animeModal) {
            closeAnimeModal();
        }

    }
);


/* =========================================================
   MY LIST
========================================================= */

function getAnimeId(anime) {

    return (
        anime.mal_id ||
        anime.id ||
        anime.anime_id ||
        anime.title
    );

}


function isInList(anime) {

    const id =
        getAnimeId(anime);

    return myList.some(
        item =>
            getAnimeId(item) === id
    );

}


function updateModalListButton() {

    const button =
        document.getElementById(
            "modalListButton"
        );

    if (!currentAnime) return;

    if (isInList(currentAnime)) {

        button.textContent =
            "✓ In My List";

    } else {

        button.textContent =
            "+ Add to My List";

    }

}


document
    .getElementById("modalListButton")
    .addEventListener(
        "click",
        () => {

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

            const id =
                getAnimeId(currentAnime);

            const existingIndex =
                myList.findIndex(
                    item =>
                        getAnimeId(item) === id
                );

            if (existingIndex !== -1) {

                myList.splice(
                    existingIndex,
                    1
                );

                showToast(
                    "Removed from My List."
                );

            } else {

                myList.push(
                    currentAnime
                );

                showToast(
                    "Added to My List!",
                    "success"
                );

            }

            saveLocalList();

            updateModalListButton();

            renderMyList();

        }
    );


function saveLocalList() {

    localStorage.setItem(
        "mirai_my_list",
        JSON.stringify(myList)
    );

}


function renderMyList() {

    const container =
        document.getElementById(
            "myListContent"
        );

    const loginBox =
        document.getElementById(
            "myListLogin"
        );

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

        document
            .getElementById("findAnimeButton")
            .addEventListener(
                "click",
                () => showPage("search")
            );

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

document
    .getElementById("modalRateButton")
    .addEventListener(
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
                currentAnime.name ||
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


document
    .getElementById("submitRating")
    .addEventListener(
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


function closeRatingModal() {

    ratingModal.classList.remove(
        "open"
    );

    document.body.style.overflow = "";

}


document
    .getElementById("ratingModalClose")
    .addEventListener(
        "click",
        closeRatingModal
    );


ratingModal.addEventListener(
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
                Loading ${day} schedule...
            </span>

        </div>
    `;

    try {

        if (!scheduleData[day]) {

            const data =
                await fetchAnime(
                    `/anime/schedule?day=${day}`
                );

            scheduleData[day] =
                data.data ||
                data.results ||
                data.anime ||
                [];

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

        console.error(error);

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

document
    .getElementById("randomButton")
    .addEventListener(
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
                    data.data ||
                    data.anime ||
                    data;

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

                console.error(error);

            }

        }
    );


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

    toast.textContent = message;

    toast.className = "toast";

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

    updateAccountUI();

    await checkSession();

    loadPopularAnime();

    loadSchedule("monday");

}


initializeMIRAI();