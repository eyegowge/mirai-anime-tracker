// ======================================================
// MIRAI ANIME TRACKER
// ======================================================

const API =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:3000"
        : window.location.origin;


// ======================================================
// ELEMENTS
// ======================================================

const searchInput =
    document.getElementById("searchInput");

const searchResults =
    document.getElementById("searchResults");

const searchTitle =
    document.getElementById("searchTitle");

const searchClear =
    document.getElementById("searchClear");

const searchDropdown =
    document.getElementById("searchDropdown");

const discoverResults =
    document.getElementById("discoverResults");

const myListResults =
    document.getElementById("myListResults");

const homeMyListResults =
    document.getElementById("homeMyListResults");

const homeMyListButton =
    document.getElementById("homeMyListButton");

const continueResults =
    document.getElementById("continueResults");

const continueListButton =
    document.getElementById(
        "continueListButton"
    );

const randomResult =
    document.getElementById("randomResult");

const randomButton =
    document.getElementById("randomButton");

const pageTitle =
    document.getElementById("pageTitle");

const animeModal =
    document.getElementById("animeModal");

const modalClose =
    document.getElementById("modalClose");

const modalImage =
    document.getElementById("modalImage");

const modalType =
    document.getElementById("modalType");

const modalTitle =
    document.getElementById("modalTitle");

const modalMeta =
    document.getElementById("modalMeta");

const modalDescription =
    document.getElementById("modalDescription");

const modalGenres =
    document.getElementById("modalGenres");

const statusSelect =
    document.getElementById("statusSelect");

const episodeInput =
    document.getElementById("episodeInput");

const ratingSelect =
    document.getElementById("ratingSelect");

const ratingValue =
    document.getElementById("ratingValue");

const addListButton =
    document.getElementById("addListButton");

const schedulePage =
    document.getElementById("schedulePage");

const newestAiringResults =
    document.getElementById(
        "newestAiringResults"
    );

const scheduleResults =
    document.getElementById(
        "scheduleResults"
    );

const scheduleHeading =
    document.getElementById(
        "scheduleHeading"
    );

const scheduleCount =
    document.getElementById(
        "scheduleCount"
    );

const nextAiringCard =
    document.getElementById(
        "nextAiringCard"
    );

const sidebar =
    document.getElementById(
        "sidebar"
    );

const sidebarToggle =
    document.getElementById(
        "sidebarToggle"
    );

const mobileMenu =
    document.getElementById(
        "mobileMenu"
    );

const listSort =
    document.getElementById(
        "listSort"
    );

const welcomeHero =
    document.getElementById(
        "welcomeHero"
    );


// ======================================================
// STATE
// ======================================================

let currentAnime = null;

let searchTimer = null;

let currentScheduleDay =
    getTodayName();

let miraiScheduleData = [];

let currentListFilter =
    "all";

let currentListSort =
    "recent";


let myList =
    loadStoredList();


// ======================================================
// STORAGE
// ======================================================

function loadStoredList() {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    "miraiAnimeList"
                ) || "[]"
            );


        return Array.isArray(saved)
            ? saved
            : [];

    } catch {

        return [];

    }

}


function saveList() {

    localStorage.setItem(
        "miraiAnimeList",
        JSON.stringify(
            myList
        )
    );

}


// ======================================================
// HELPERS
// ======================================================

function animeData(item) {

    return item?.node || item;

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


function getImage(anime) {

    return (
        anime?.main_picture?.large ||
        anime?.main_picture?.medium ||
        "https://via.placeholder.com/400x600?text=MIRAI"
    );

}


function getEpisodes(anime) {

    const episodes =
        Number(
            anime?.num_episodes
        );


    if (
        !episodes ||
        episodes <= 0
    ) {

        if (
            anime?.media_type === "movie"
        ) {

            return "Movie";

        }


        if (
            anime?.media_type === "special"
        ) {

            return "Special";

        }


        return "Episodes unknown";

    }


    return `${episodes} eps`;

}


function getScore(anime) {

    const score =
        Number(
            anime?.mean
        );


    if (!score) {

        return "N/A";

    }


    return score.toFixed(2);

}


function getType(anime) {

    const type =
        anime?.media_type ||
        "anime";


    return type
        .replaceAll(
            "_",
            " "
        )
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );

}


function getGenres(anime) {

    return (
        anime?.genres ||
        []
    )
        .map(
            genre =>
                genre.name
        )
        .filter(Boolean);

}


function getTodayName() {

    const days = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday"
    ];


    return days[
        new Date().getDay()
    ];

}


function formatRating(value) {

    const rating =
        Number(value) || 0;


    if (
        rating === 0
    ) {

        return "No rating";

    }


    return `${rating.toFixed(1)} / 10`;

}


function getPersonalRating(anime) {

    const rating =
        Number(
            anime?.rating
        ) || 0;


    return rating;

}


function getWatchedEpisode(anime) {

    return Math.max(
        0,
        Number(
            anime?.episode
        ) || 0
    );

}


function getProgress(anime) {

    const total =
        Number(
            anime?.num_episodes
        ) || 0;


    const watched =
        getWatchedEpisode(
            anime
        );


    if (
        total <= 0
    ) {

        return 0;

    }


    return Math.min(
        100,
        Math.round(
            (
                watched /
                total
            ) * 100
        )
    );

}


// ======================================================
// API
// ======================================================

async function apiFetch(url) {

    console.log(
        "MIRAI API REQUEST:",
        url
    );


    const response =
        await fetch(
            url
        );


    console.log(
        "MIRAI API STATUS:",
        response.status
    );


    let data;


    try {

        data =
            await response.json();

    } catch {

        throw new Error(
            "The MIRAI server returned invalid JSON."
        );

    }


    if (
        !response.ok ||
        data.success === false
    ) {

        throw new Error(
            data.details ||
            data.error ||
            "MIRAI server request failed."
        );

    }


    return data;

}


// ======================================================
// RATING UI
// ======================================================

function updateRatingDisplay() {

    if (
        !ratingSelect
    ) {

        return;

    }


    const value =
        Number(
            ratingSelect.value
        ) || 0;


    if (
        ratingValue
    ) {

        ratingValue.textContent =
            formatRating(
                value
            );

    }


    ratingSelect.style.setProperty(
        "--rating-progress",
        `${value * 10}%`
    );

}


if (
    ratingSelect
) {

    ratingSelect.addEventListener(
        "input",
        updateRatingDisplay
    );

}


// ======================================================
// ANIME CARD
// ======================================================

function createAnimeCard(anime) {

    anime =
        animeData(anime);


    const card =
        document.createElement(
            "article"
        );


    card.className =
        "anime-card";


    card.style.setProperty(
        "--anime-background",
        `url("${getImage(anime)}")`
    );


    const personalRating =
        getPersonalRating(
            anime
        );


    card.innerHTML = `

        <div class="anime-card-image">

            <img
                src="${escapeHTML(
                    getImage(anime)
                )}"
                alt="${escapeHTML(
                    anime.title ||
                    "Anime"
                )}"
                loading="lazy"
            >

            <div class="anime-card-overlay"></div>

            <div class="anime-card-rating">
                ★ ${escapeHTML(
                    getScore(anime)
                )}
            </div>

        </div>


        <div class="anime-card-info">

            <h3>
                ${escapeHTML(
                    anime.title ||
                    "Unknown Anime"
                )}
            </h3>


            <div class="anime-card-meta">

                <span>
                    ${escapeHTML(
                        getType(anime)
                    )}
                </span>

                <span>
                    ${escapeHTML(
                        getEpisodes(anime)
                    )}
                </span>

            </div>


            ${
                personalRating > 0
                    ? `
                        <div class="anime-card-personal-rating">
                            ♥ My Rating
                            ${formatRating(
                                personalRating
                            )}
                        </div>
                    `
                    : ""
            }

        </div>

    `;


    card.addEventListener(
        "click",
        () =>
            openAnime(
                anime
            )
    );


    return card;

}


// ======================================================
// GRID
// ======================================================

function renderAnimeGrid(
    container,
    animeList,
    emptyText =
        "No anime found."
) {

    if (
        !container
    ) {

        return;

    }


    container.innerHTML =
        "";


    if (
        !animeList ||
        animeList.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ✦
                </div>

                <h3>
                    Nothing found
                </h3>

                <p>
                    ${escapeHTML(
                        emptyText
                    )}
                </p>

            </div>

        `;


        return;

    }


    animeList.forEach(
        anime => {

            container.appendChild(
                createAnimeCard(
                    anime
                )
            );

        }
    );

}


// ======================================================
// HOME STATS
// ======================================================

function updateHomeStats() {

    const watching =
        myList.filter(
            anime =>
                anime.status ===
                "watching"
        ).length;


    const completed =
        myList.filter(
            anime =>
                anime.status ===
                "completed"
        ).length;


    const plan =
        myList.filter(
            anime =>
                anime.status ===
                "plan"
        ).length;


    const total =
        myList.length;


    const watchingEl =
        document.getElementById(
            "statWatching"
        );


    const completedEl =
        document.getElementById(
            "statCompleted"
        );


    const planEl =
        document.getElementById(
            "statPlan"
        );


    const totalEl =
        document.getElementById(
            "statTotal"
        );


    if (
        watchingEl
    ) {

        watchingEl.textContent =
            watching;

    }


    if (
        completedEl
    ) {

        completedEl.textContent =
            completed;

    }


    if (
        planEl
    ) {

        planEl.textContent =
            plan;

    }


    if (
        totalEl
    ) {

        totalEl.textContent =
            total;

    }


    const countAll =
        document.getElementById(
            "countAll"
        );


    const countWatching =
        document.getElementById(
            "countWatching"
        );


    const countPlan =
        document.getElementById(
            "countPlan"
        );


    const countCompleted =
        document.getElementById(
            "countCompleted"
        );


    if (
        countAll
    ) {

        countAll.textContent =
            total;

    }


    if (
        countWatching
    ) {

        countWatching.textContent =
            watching;

    }


    if (
        countPlan
    ) {

        countPlan.textContent =
            plan;

    }


    if (
        countCompleted
    ) {

        countCompleted.textContent =
            completed;

    }

}


// ======================================================
// HOME HERO
// ======================================================

function updateHeroArtwork() {

    if (
        !welcomeHero
    ) {

        return;

    }


    const artwork =
        myList.find(
            anime =>
                anime?.main_picture
        ) ||
        myList[0];


    if (
        artwork
    ) {

        welcomeHero.style.setProperty(
            "--hero-background",
            `url("${getImage(
                artwork
            )}")`
        );

    } else {

        welcomeHero.style.setProperty(
            "--hero-background",
            "none"
        );

    }

}


// ======================================================
// CONTINUE WATCHING
// ======================================================

function renderContinueWatching() {

    if (
        !continueResults
    ) {

        return;

    }


    const watching =
        myList
            .filter(
                anime =>
                    anime.status ===
                    "watching"
            )
            .sort(
                (a,b) => {

                    return (
                        getProgress(b) -
                        getProgress(a)
                    );

                }
            )
            .slice(
                0,
                4
            );


    continueResults.innerHTML =
        "";


    if (
        watching.length === 0
    ) {

        continueResults.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ▶
                </div>

                <h3>
                    Nothing to continue
                </h3>

                <p>
                    Add something to your Watching list
                    and your progress will appear here.
                </p>

            </div>

        `;


        return;

    }


    watching.forEach(
        anime => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "continue-card";


            card.style.setProperty(
                "--continue-background",
                `url("${getImage(
                    anime
                )}")`
            );


            const watched =
                getWatchedEpisode(
                    anime
                );


            const total =
                Number(
                    anime.num_episodes
                ) || 0;


            const progress =
                getProgress(
                    anime
                );


            card.innerHTML = `

                <div class="continue-content">

                    <h3>
                        ${escapeHTML(
                            anime.title
                        )}
                    </h3>


                    <div class="continue-episode">

                        ${
                            total > 0
                                ? `Episode ${watched} / ${total}`
                                : `Episode ${watched}`
                        }

                    </div>


                    ${
                        total > 0
                            ? `
                                <div class="progress-bar">

                                    <span
                                        style="
                                            width:
                                            ${progress}%;
                                        "
                                    ></span>

                                </div>
                            `
                            : ""
                    }


                    <div class="continue-rating">

                        ${
                            getPersonalRating(
                                anime
                            ) > 0
                                ? `Your rating:
                                   ${formatRating(
                                       getPersonalRating(
                                           anime
                                       )
                                   )}`
                                : "Keep watching"

                        }

                    </div>

                </div>

            `;


            card.addEventListener(
                "click",
                () =>
                    openAnime(
                        anime
                    )
            );


            continueResults.appendChild(
                card
            );

        }
    );

}


// ======================================================
// SEARCH
// ======================================================

async function searchAnime() {

    const query =
        searchInput.value.trim();


    const activePage =
        document.querySelector(
            ".page.active-page"
        );


    const isHome =
        activePage?.id ===
        "homePage";


    if (
        !query
    ) {

        if (
            isHome &&
            searchResults
        ) {

            searchResults.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        ⌕
                    </div>

                    <h3>
                        Search for an anime
                    </h3>

                    <p>
                        Try Naruto, One Piece,
                        Bleach, or Jujutsu Kaisen.
                    </p>

                </div>

            `;


            if (
                searchTitle
            ) {

                searchTitle.textContent =
                    "Find Anime";

            }

        }


        if (
            !isHome &&
            searchDropdown
        ) {

            searchDropdown.classList.remove(
                "visible"
            );

        }


        return;

    }


    saveRecentSearch(
        query
    );


    if (
        isHome
    ) {

        if (
            searchTitle
        ) {

            searchTitle.textContent =
                `Results for "${query}"`;

        }


        if (
            searchResults
        ) {

            searchResults.innerHTML = `

                <div class="loading">
                    Searching...
                </div>

            `;

        }

    } else {

        if (
            searchDropdown
        ) {

            searchDropdown.innerHTML = `

                <div class="search-dropdown-loading">

                    <span class="search-loading-spinner"></span>

                    <span>
                        Searching for
                        "${escapeHTML(
                            query
                        )}"...
                    </span>

                </div>

            `;


            searchDropdown.classList.add(
                "visible"
            );

        }

    }


    try {

        const data =
            await apiFetch(
                `${API}/anime/search?name=${encodeURIComponent(
                    query
                )}`
            );


        const anime =
            (data.data || [])
                .map(
                    animeData
                );


        if (
            isHome
        ) {

            renderAnimeGrid(
                searchResults,
                anime,
                "No anime matched your search."
            );


            return;

        }


        renderSearchResultsDropdown(
            anime,
            query
        );


    } catch (
        error
    ) {

        console.error(
            "Search failed:",
            error
        );


        const message =
            escapeHTML(
                error.message
            );


        if (
            isHome &&
            searchResults
        ) {

            searchResults.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        !
                    </div>

                    <h3>
                        Search failed
                    </h3>

                    <p>
                        ${message}
                    </p>

                </div>

            `;

        } else if (
            searchDropdown
        ) {

            searchDropdown.innerHTML = `

                <div class="search-dropdown-error">

                    <strong>
                        Search failed
                    </strong>

                    <span>
                        ${message}
                    </span>

                </div>

            `;


            searchDropdown.classList.add(
                "visible"
            );

        }

    }

}


if (
    searchInput
) {

    searchInput.addEventListener(
        "input",
        () => {

            clearTimeout(
                searchTimer
            );


            searchTimer =
                setTimeout(
                    searchAnime,
                    350
                );

        }
    );


    searchInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                clearTimeout(
                    searchTimer
                );


                searchAnime();

            }

        }
    );


    searchInput.addEventListener(
        "focus",
        showSearchDropdown
    );


    searchInput.addEventListener(
        "click",
        showSearchDropdown
    );

}


if (
    searchClear
) {

    searchClear.addEventListener(
        "click",
        () => {

            searchInput.value =
                "";

            searchInput.focus();

            searchAnime();

        }
    );

}


// ======================================================
// SEARCH DROPDOWN
// ======================================================

const popularSearches = [
    "Naruto",
    "One Piece",
    "Jujutsu Kaisen",
    "Bleach",
    "Attack on Titan"
];


function getRecentSearches() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "miraiRecentSearches"
            ) || "[]"
        );

    } catch {

        return [];

    }

}


function saveRecentSearch(
    query
) {

    if (
        !query
    ) {

        return;

    }


    let searches =
        getRecentSearches();


    searches =
        searches.filter(
            item =>
                item.toLowerCase() !==
                query.toLowerCase()
        );


    searches.unshift(
        query
    );


    searches =
        searches.slice(
            0,
            5
        );


    localStorage.setItem(
        "miraiRecentSearches",
        JSON.stringify(
            searches
        )
    );

}


function createSearchSuggestion(
    query
) {

    if (
        !searchDropdown
    ) {

        return;

    }


    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "search-suggestion";


    button.innerHTML = `

        <span class="search-suggestion-icon">
            ⌕
        </span>

        <span>
            ${escapeHTML(
                query
            )}
        </span>

    `;


    button.addEventListener(
        "click",
        () => {

            searchInput.value =
                query;

            searchAnime();

        }
    );


    searchDropdown.appendChild(
        button
    );

}


function showSearchDropdown() {

    if (
        !searchDropdown
    ) {

        return;

    }


    const activePage =
        document.querySelector(
            ".page.active-page"
        );


    if (
        !activePage ||
        activePage.id ===
        "homePage"
    ) {

        searchDropdown.classList.remove(
            "visible"
        );

        return;

    }


    const query =
        searchInput.value.trim();


    if (
        query
    ) {

        searchAnime();

        return;

    }


    searchDropdown.innerHTML =
        "";


    const recent =
        getRecentSearches();


    const title =
        document.createElement(
            "div"
        );


    title.className =
        "search-dropdown-title";


    title.textContent =
        recent.length
            ? "RECENT SEARCHES"
            : "POPULAR SEARCHES";


    searchDropdown.appendChild(
        title
    );


    (
        recent.length
            ? recent
            : popularSearches
    )
        .forEach(
            createSearchSuggestion
        );


    searchDropdown.classList.add(
        "visible"
    );

}


function renderSearchResultsDropdown(
    animeList,
    query
) {

    if (
        !searchDropdown
    ) {

        return;

    }


    searchDropdown.innerHTML =
        "";


    const header =
        document.createElement(
            "div"
        );


    header.className =
        "search-dropdown-results-header";


    header.innerHTML = `

        <span>
            RESULTS FOR
            <strong>
                "${escapeHTML(
                    query
                )}"
            </strong>
        </span>

        <small>
            ${animeList.length}
            found
        </small>

    `;


    searchDropdown.appendChild(
        header
    );


    if (
        animeList.length === 0
    ) {

        searchDropdown.innerHTML += `

            <div class="search-dropdown-empty">

                <strong>
                    No anime found
                </strong>

                <span>
                    Try a different search.
                </span>

            </div>

        `;


        searchDropdown.classList.add(
            "visible"
        );


        return;

    }


    animeList
        .slice(0,6)
        .forEach(
            anime => {

                const item =
                    document.createElement(
                        "button"
                    );


                item.type =
                    "button";


                item.className =
                    "search-result-item";


                item.innerHTML = `

                    <img
                        src="${escapeHTML(
                            getImage(
                                anime
                            )
                        )}"
                        alt="${escapeHTML(
                            anime.title
                        )}"
                    >

                    <div
                        class="search-result-item-info"
                    >

                        <strong>
                            ${escapeHTML(
                                anime.title
                            )}
                        </strong>

                        <div>

                            <span>
                                ★ ${escapeHTML(
                                    getScore(
                                        anime
                                    )
                                )}
                            </span>

                            <span>
                                ${escapeHTML(
                                    getType(
                                        anime
                                    )
                                )}
                            </span>

                            <span>
                                ${escapeHTML(
                                    getEpisodes(
                                        anime
                                    )
                                )}
                            </span>

                        </div>

                    </div>

                `;


                item.addEventListener(
                    "click",
                    () => {

                        searchDropdown.classList.remove(
                            "visible"
                        );


                        openAnime(
                            anime
                        );

                    }
                );


                searchDropdown.appendChild(
                    item
                );

            }
        );


    if (
        animeList.length > 6
    ) {

        const footer =
            document.createElement(
                "div"
            );


        footer.className =
            "search-dropdown-footer";


        footer.textContent =
            "Showing the first 6 results";


        searchDropdown.appendChild(
            footer
        );

    }


    searchDropdown.classList.add(
        "visible"
    );

}


document.addEventListener(
    "click",
    event => {

        if (
            searchDropdown &&
            !event.target.closest(
                ".search-wrapper"
            )
        ) {

            searchDropdown.classList.remove(
                "visible"
            );

        }

    }
);


// ======================================================
// MODAL
// ======================================================

function openAnime(
    anime
) {

    currentAnime =
        animeData(
            anime
        );


    if (
        !currentAnime
    ) {

        return;

    }


    modalTitle.textContent =
        currentAnime.title ||
        "Unknown Anime";


    modalType.textContent =
        getType(
            currentAnime
        );


    modalImage.style.backgroundImage =
        `url("${getImage(
            currentAnime
        )}")`;


    animeModal.style.setProperty(
        "--modal-background",
        `url("${getImage(
            currentAnime
        )}")`
    );


    modalDescription.textContent =
        currentAnime.synopsis ||
        "No description is available.";


    modalMeta.innerHTML = `

        <span>
            ★ ${escapeHTML(
                getScore(
                    currentAnime
                )
            )}
        </span>

        <span>
            ${escapeHTML(
                getEpisodes(
                    currentAnime
                )
            )}
        </span>

        <span>
            ${escapeHTML(
                currentAnime.status
                    ?.replaceAll(
                        "_",
                        " "
                    ) ||
                "Unknown"
            )}
        </span>

    `;


    modalGenres.innerHTML =
        getGenres(
            currentAnime
        )
            .map(
                genre => `

                    <span class="genre-tag">
                        ${escapeHTML(
                            genre
                        )}
                    </span>

                `
            )
            .join("");


    // EPISODE LIMIT

    const totalEpisodes =
        Number(
            currentAnime.num_episodes
        );


    if (
        episodeInput
    ) {

        if (
            totalEpisodes > 0
        ) {

            episodeInput.max =
                totalEpisodes;

            episodeInput.placeholder =
                `0 - ${totalEpisodes}`;

        } else {

            episodeInput.removeAttribute(
                "max"
            );

            episodeInput.placeholder =
                "Episodes unknown";

        }

    }


    // EXISTING LIST ENTRY

    const existing =
        myList.find(
            item =>
                Number(item.id) ===
                Number(
                    currentAnime.id
                )
        );


    if (
        existing
    ) {

        statusSelect.value =
            existing.status ||
            "plan";


        let savedEpisode =
            getWatchedEpisode(
                existing
            );


        if (
            totalEpisodes > 0 &&
            savedEpisode >
                totalEpisodes
        ) {

            savedEpisode =
                totalEpisodes;

        }


        episodeInput.value =
            savedEpisode;


        ratingSelect.value =
            existing.rating ||
            0;


        addListButton.textContent =
            "✓ Update My List";

    } else {

        statusSelect.value =
            "plan";


        episodeInput.value =
            0;


        ratingSelect.value =
            0;


        addListButton.textContent =
            "★ Add to My List";

    }


    updateRatingDisplay();


    animeModal.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "modal-open"
    );

}


function closeAnime() {

    if (
        !animeModal
    ) {

        return;

    }


    animeModal.classList.add(
        "hidden"
    );


    document.body.classList.remove(
        "modal-open"
    );


    currentAnime =
        null;

}


if (
    modalClose
) {

    modalClose.addEventListener(
        "click",
        closeAnime
    );

}


if (
    animeModal
) {

    const backdrop =
        document.getElementById(
            "modalBackdrop"
        );


    if (
        backdrop
    ) {

        backdrop.addEventListener(
            "click",
            closeAnime
        );

    }

}


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeAnime();

        }

    }
);


// ======================================================
// EPISODE INPUT
// ======================================================

if (
    episodeInput
) {

    episodeInput.addEventListener(
        "input",
        () => {

            if (
                !currentAnime
            ) {

                return;

            }


            const totalEpisodes =
                Number(
                    currentAnime.num_episodes
                );


            let episode =
                Number(
                    episodeInput.value
                ) || 0;


            if (
                episode < 0
            ) {

                episode = 0;

            }


            if (
                totalEpisodes > 0 &&
                episode >
                    totalEpisodes
            ) {

                episode =
                    totalEpisodes;

            }


            episodeInput.value =
                episode;

        }
    );

}


// ======================================================
// COMPLETED = FULL EPISODE COUNT
// ======================================================

if (
    statusSelect
) {

    statusSelect.addEventListener(
        "change",
        () => {

            if (
                !currentAnime
            ) {

                return;

            }


            const totalEpisodes =
                Number(
                    currentAnime.num_episodes
                );


            if (
                statusSelect.value ===
                    "completed" &&
                totalEpisodes > 0
            ) {

                episodeInput.value =
                    totalEpisodes;

            }

        }
    );

}


// ======================================================
// MY LIST
// ======================================================

if (
    addListButton
) {

    addListButton.addEventListener(
        "click",
        () => {

            if (
                !currentAnime
            ) {

                return;

            }


            const totalEpisodes =
                Number(
                    currentAnime.num_episodes
                );


            let episode =
                Number(
                    episodeInput.value
                ) || 0;


            if (
                episode < 0
            ) {

                episode = 0;

            }


            if (
                totalEpisodes > 0 &&
                episode >
                    totalEpisodes
            ) {

                episode =
                    totalEpisodes;

            }


            if (
                statusSelect.value ===
                    "completed" &&
                totalEpisodes > 0
            ) {

                episode =
                    totalEpisodes;

            }


            const entry = {

                ...currentAnime,

                status:
                    statusSelect.value,

                episode:
                    episode,

                rating:
                    Number(
                        ratingSelect.value
                    ) || 0,

                savedAt:
                    Date.now()

            };


            const index =
                myList.findIndex(
                    item =>
                        Number(item.id) ===
                        Number(
                            currentAnime.id
                        )
                );


            if (
                index >= 0
            ) {

                myList[index] =
                    entry;

            } else {

                myList.push(
                    entry
                );

            }


            saveList();


            updateHomeStats();

            updateHeroArtwork();

            renderContinueWatching();

            renderMyList(
                currentListFilter
            );

            renderHomeMyList();


            addListButton.textContent =
                "✓ Saved to My List";

        }
    );

}


// ======================================================
// MY LIST SORTING
// ======================================================

function sortMyList(
    list
) {

    const sorted =
        [...list];


    switch (
        currentListSort
    ) {

        case "title":

            sorted.sort(
                (a,b) =>
                    String(
                        a.title || ""
                    )
                        .localeCompare(
                            String(
                                b.title || ""
                            )
                        )
            );

            break;


        case "score":

            sorted.sort(
                (a,b) =>
                    (
                        Number(
                            b.mean
                        ) || 0
                    ) -
                    (
                        Number(
                            a.mean
                        ) || 0
                    )
            );

            break;


        case "rating":

            sorted.sort(
                (a,b) =>
                    (
                        Number(
                            b.rating
                        ) || 0
                    ) -
                    (
                        Number(
                            a.rating
                        ) || 0
                    )
            );

            break;


        case "episodes":

            sorted.sort(
                (a,b) =>
                    (
                        Number(
                            b.num_episodes
                        ) || 0
                    ) -
                    (
                        Number(
                            a.num_episodes
                        ) || 0
                    )
            );

            break;


        case "recent":

        default:

            sorted.sort(
                (a,b) =>
                    (
                        Number(
                            b.savedAt
                        ) || 0
                    ) -
                    (
                        Number(
                            a.savedAt
                        ) || 0
                    )
            );

            break;

    }


    return sorted;

}


// ======================================================
// RENDER MY LIST
// ======================================================

function renderMyList(
    filter = currentListFilter
) {

    if (
        !myListResults
    ) {

        return;

    }


    currentListFilter =
        filter;


    let filtered =
        [...myList];


    if (
        filter !== "all"
    ) {

        filtered =
            filtered.filter(
                anime =>
                    anime.status ===
                    filter
            );

    }


    filtered =
        sortMyList(
            filtered
        );


    renderAnimeGrid(
        myListResults,
        filtered,
        "Your list is empty."
    );

}


function renderHomeMyList() {

    if (
        !homeMyListResults
    ) {

        return;

    }


    homeMyListResults.innerHTML =
        "";


    if (
        !myList.length
    ) {

        homeMyListResults.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ☆
                </div>

                <h3>
                    Your list is empty
                </h3>

                <p>
                    Search for an anime and add it
                    to your list to see it here.
                </p>

            </div>

        `;


        return;

    }


    const homeAnime =
        sortMyList(
            myList
        )
            .slice(
                0,
                6
            );


    homeAnime.forEach(
        anime => {

            homeMyListResults.appendChild(
                createAnimeCard(
                    anime
                )
            );

        }
    );

}


// ======================================================
// LIST FILTERS
// ======================================================

document
    .querySelectorAll(
        ".list-filter"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".list-filter"
                        )
                        .forEach(
                            other =>
                                other.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    currentListFilter =
                        button.dataset.status;


                    renderMyList(
                        currentListFilter
                    );

                }
            );

        }
    );


if (
    listSort
) {

    listSort.addEventListener(
        "change",
        () => {

            currentListSort =
                listSort.value;


            renderMyList(
                currentListFilter
            );

        }
    );

}


// ======================================================
// DISCOVER
// ======================================================

async function loadDiscover(
    genre = "all"
) {

    if (
        !discoverResults
    ) {

        return;

    }


    discoverResults.innerHTML = `

        <div class="loading">
            Finding anime...
        </div>

    `;


    try {

        const data =
            await apiFetch(
                `${API}/anime/top?limit=50`
            );


        let anime =
            (data.data || [])
                .map(
                    animeData
                );


        if (
            genre !==
            "all"
        ) {

            anime =
                anime.filter(
                    item =>
                        getGenres(
                            item
                        )
                            .some(
                                itemGenre =>
                                    itemGenre
                                        .toLowerCase() ===
                                    genre.toLowerCase()
                            )
                );

        }


        renderAnimeGrid(
            discoverResults,
            anime,
            "No anime found for this genre."
        );


    } catch (
        error
    ) {

        discoverResults.innerHTML = `

            <div class="empty-state">

                <h3>
                    Discover unavailable
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;

    }

}


document
    .querySelectorAll(
        ".discover-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".discover-button"
                        )
                        .forEach(
                            other =>
                                other.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    loadDiscover(
                        button.dataset.genre
                    );

                }
            );

        }
    );


// ======================================================
// SCHEDULE
// ======================================================

const DAYS = [

    {
        key: "sunday",
        label: "Sunday"
    },

    {
        key: "monday",
        label: "Monday"
    },

    {
        key: "tuesday",
        label: "Tuesday"
    },

    {
        key: "wednesday",
        label: "Wednesday"
    },

    {
        key: "thursday",
        label: "Thursday"
    },

    {
        key: "friday",
        label: "Friday"
    },

    {
        key: "saturday",
        label: "Saturday"
    }

];


function getDateForDay(
    dayName
) {

    const today =
        new Date();


    const todayIndex =
        today.getDay();


    const targetIndex =
        DAYS.findIndex(
            day =>
                day.key ===
                dayName
        );


    const result =
        new Date(
            today
        );


    let difference =
        targetIndex -
        todayIndex;


    if (
        difference < 0
    ) {

        difference += 7;

    }


    result.setDate(
        today.getDate() +
        difference
    );


    return result;

}


function formatDate(
    date
) {

    return date.toLocaleDateString(
        undefined,
        {
            weekday:
                "long",
            month:
                "long",
            day:
                "numeric"
        }
    );

}


function getScheduleTime(
    anime
) {

    return (
        anime?.broadcast
            ?.start_time ||
        "Unknown"
    );

}


function parseScheduleHour(
    time
) {

    if (
        !time ||
        time === "Unknown"
    ) {

        return null;

    }


    const match =
        String(
            time
        ).match(
            /^(\d{1,2}):(\d{2})/
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


    if (
        hour < 0 ||
        hour > 23
    ) {

        return null;

    }


    return hour;

}


function formatTimeLabel(
    hour
) {

    if (
        hour === null ||
        hour === undefined
    ) {

        return "Time unknown";

    }


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    let displayHour =
        hour % 12;


    if (
        displayHour === 0
    ) {

        displayHour = 12;

    }


    return `${displayHour} ${suffix}`;

}


// ======================================================
// SCHEDULE CARD
// ======================================================

function createScheduleCard(
    anime
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "schedule-anime-card";


    card.style.setProperty(
        "--anime-background",
        `url("${getImage(
            anime
        )}")`
    );


    const time =
        getScheduleTime(
            anime
        );


    card.innerHTML = `

        <div class="schedule-anime-image">

            <img
                src="${escapeHTML(
                    getImage(
                        anime
                    )
                )}"
                alt="${escapeHTML(
                    anime.title
                )}"
                loading="lazy"
            >

        </div>


        <div class="schedule-anime-info">

            <h3>
                ${escapeHTML(
                    anime.title
                )}
            </h3>


            <div class="schedule-anime-meta">

                <span>
                    ${escapeHTML(
                        getEpisodes(
                            anime
                        )
                    )}
                </span>

                <span>
                    ${escapeHTML(
                        time
                    )}
                </span>

            </div>

        </div>

    `;


    card.addEventListener(
        "click",
        () =>
            openAnime(
                anime
            )
    );


    return card;

}


// ======================================================
// NEXT AIRING
// ======================================================

function getNextAiringAnime(
    animeList
) {

    const now =
        new Date();


    const currentDay =
        now.getDay();


    const candidates =
        animeList
            .map(
                anime => {

                    const dayName =
                        anime?.broadcast
                            ?.day_of_the_week
                            ?.toLowerCase();


                    const dayIndex =
                        DAYS.findIndex(
                            day =>
                                day.key ===
                                dayName
                        );


                    if (
                        dayIndex < 0
                    ) {

                        return null;

                    }


                    const time =
                        getScheduleTime(
                            anime
                        );


                    const parts =
                        String(
                            time
                        ).split(
                            ":"
                        );


                    if (
                        parts.length < 2
                    ) {

                        return null;

                    }


                    const hour =
                        Number(
                            parts[0]
                        );


                    const minute =
                        Number(
                            parts[1]
                        );


                    if (
                        !Number.isFinite(
                            hour
                        ) ||
                        !Number.isFinite(
                            minute
                        )
                    ) {

                        return null;

                    }


                    let daysAway =
                        (
                            dayIndex -
                            currentDay +
                            7
                        ) % 7;


                    const candidate =
                        new Date(
                            now
                        );


                    candidate.setDate(
                        now.getDate() +
                        daysAway
                    );


                    candidate.setHours(
                        hour,
                        minute,
                        0,
                        0
                    );


                    if (
                        candidate <= now
                    ) {

                        candidate.setDate(
                            candidate.getDate() +
                            7
                        );

                    }


                    return {
                        anime,
                        candidate
                    };

                }
            )
            .filter(
                Boolean
            )
            .sort(
                (a,b) =>
                    a.candidate -
                    b.candidate
            );


    return candidates[0] || null;

}


function renderNextAiring(
    animeList
) {

    if (
        !nextAiringCard
    ) {

        return;

    }


    const next =
        getNextAiringAnime(
            animeList
        );


    if (
        !next
    ) {

        nextAiringCard.innerHTML = `

            <div class="schedule-empty">

                <h3>
                    No upcoming airing found
                </h3>

                <p>
                    MAL did not provide enough
                    broadcast information.
                </p>

            </div>

        `;


        return;

    }


    const anime =
        next.anime;


    const date =
        next.candidate;


    nextAiringCard.style.setProperty(
        "--next-background",
        `url("${getImage(
            anime
        )}")`
    );


    const dayName =
        DAYS[
            date.getDay()
        ]?.label ||
        "Upcoming";


    nextAiringCard.innerHTML = `

        <div class="next-airing-image">

            <img
                src="${escapeHTML(
                    getImage(
                        anime
                    )
                )}"
                alt="${escapeHTML(
                    anime.title
                )}"
            >

        </div>


        <div class="next-airing-info">

            <span class="next-airing-status">
                NEXT ON SCHEDULE
            </span>


            <h3>
                ${escapeHTML(
                    anime.title
                )}
            </h3>


            <div class="next-airing-time">
                ${escapeHTML(
                    dayName
                )}
                •
                ${escapeHTML(
                    getScheduleTime(
                        anime
                    )
                )}
            </div>


            <div class="next-airing-note">
                MAL broadcast time
            </div>

        </div>

    `;


    nextAiringCard.addEventListener(
        "click",
        () =>
            openAnime(
                anime
            )
    );

}


// ======================================================
// SCHEDULE DAYS
// ======================================================

function updateScheduleDays() {

    document
        .querySelectorAll(
            ".schedule-day"
        )
        .forEach(
            button => {

                const day =
                    button.dataset.day;


                button.classList.toggle(
                    "active",
                    day ===
                    currentScheduleDay
                );


                const date =
                    getDateForDay(
                        day
                    );


                const dateElement =
                    button.querySelector(
                        ".day-date"
                    );


                if (
                    dateElement
                ) {

                    dateElement.textContent =
                        date.getDate();

                }

            }
        );

}


function updateSelectedDate() {

    const selectedDayName =
        document.getElementById(
            "selectedDayName"
        );


    const selectedFullDate =
        document.getElementById(
            "selectedFullDate"
        );


    const selectedDay =
        DAYS.find(
            day =>
                day.key ===
                currentScheduleDay
        );


    const date =
        getDateForDay(
            currentScheduleDay
        );


    if (
        selectedDayName
    ) {

        selectedDayName.textContent =
            selectedDay?.label ||
            "Today";

    }


    if (
        selectedFullDate
    ) {

        selectedFullDate.textContent =
            formatDate(
                date
            );

    }


    if (
        scheduleHeading &&
        selectedDay
    ) {

        scheduleHeading.textContent =
            `${selectedDay.label}'s Anime`;

    }

}


// ======================================================
// RENDER SCHEDULE
// ======================================================

function renderSchedule(
    animeList
) {

    if (
        !scheduleResults
    ) {

        return;

    }


    updateScheduleDays();

    updateSelectedDate();


    const selectedAnime =
        animeList.filter(
            anime =>
                anime?.broadcast
                    ?.day_of_the_week
                    ?.toLowerCase() ===
                currentScheduleDay
        );


    if (
        scheduleCount
    ) {

        scheduleCount.textContent =
            `${selectedAnime.length} anime`;

    }


    scheduleResults.innerHTML =
        "";


    if (
        selectedAnime.length ===
        0
    ) {

        scheduleResults.innerHTML = `

            <div class="schedule-empty">

                <div class="empty-icon">
                    ◷
                </div>

                <h3>
                    Nothing scheduled
                </h3>

                <p>
                    MAL doesn't currently
                    have airing information for
                    ${escapeHTML(
                        currentScheduleDay
                    )}.
                </p>

            </div>

        `;


        return;

    }


    const groups =
        new Map();


    selectedAnime.forEach(
        anime => {

            const hour =
                parseScheduleHour(
                    getScheduleTime(
                        anime
                    )
                );


            const key =
                hour === null
                    ? "unknown"
                    : hour;


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


    const sortedKeys =
        [...groups.keys()]
            .sort(
                (a,b) => {

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


                    return a - b;

                }
            );


    sortedKeys.forEach(
        hour => {

            const group =
                document.createElement(
                    "section"
                );


            group.className =
                "schedule-time-group";


            const timeColumn =
                document.createElement(
                    "div"
                );


            timeColumn.className =
                "schedule-time";


            const strong =
                document.createElement(
                    "strong"
                );


            strong.textContent =
                hour ===
                    "unknown"
                    ? "TBA"
                    : formatTimeLabel(
                        hour
                    );


            const small =
                document.createElement(
                    "small"
                );


            small.textContent =
                "AIRING";


            timeColumn.appendChild(
                strong
            );


            timeColumn.appendChild(
                small
            );


            const list =
                document.createElement(
                    "div"
                );


            list.className =
                "schedule-anime-list";


            groups
                .get(
                    hour
                )
                .sort(
                    (a,b) =>
                        getScheduleTime(
                            a
                        )
                            .localeCompare(
                                getScheduleTime(
                                    b
                                )
                            )
                )
                .forEach(
                    anime => {

                        list.appendChild(
                            createScheduleCard(
                                anime
                            )
                        );

                    }
                );


            group.appendChild(
                timeColumn
            );


            group.appendChild(
                list
            );


            scheduleResults.appendChild(
                group
            );

        }
    );

}


// ======================================================
// NEWEST AIRING
// ======================================================

function createNewestAiring(
    animeList
) {

    if (
        !newestAiringResults
    ) {

        return;

    }


    newestAiringResults.innerHTML =
        "";


    const sorted =
        [...animeList]
            .filter(
                anime =>
                    anime?.main_picture
            )
            .sort(
                (a,b) => {

                    const dateA =
                        new Date(
                            a.start_date ||
                            0
                        );


                    const dateB =
                        new Date(
                            b.start_date ||
                            0
                        );


                    return (
                        dateB -
                        dateA
                    );

                }
            )
            .slice(
                0,
                8
            );


    if (
        sorted.length ===
        0
    ) {

        newestAiringResults.innerHTML = `

            <div class="empty-state">

                <h3>
                    No recent anime found
                </h3>

                <p>
                    MAL did not return
                    recent airing information.
                </p>

            </div>

        `;


        return;

    }


    sorted.forEach(
        anime => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "newest-airing-card";


            card.innerHTML = `

                <div
                    class="newest-airing-background"
                    style="
                        background-image:
                        url('${escapeHTML(
                            getImage(
                                anime
                            )
                        )}');
                    "
                ></div>


                <div
                    class="newest-airing-content"
                >

                    <p class="eyebrow">
                        AIRING
                    </p>


                    <h3>
                        ${escapeHTML(
                            anime.title
                        )}
                    </h3>


                    <div
                        class="newest-airing-tags"
                    >

                        <span>
                            ${escapeHTML(
                                getEpisodes(
                                    anime
                                )
                            )}
                        </span>

                        <span>
                            ${escapeHTML(
                                getScheduleTime(
                                    anime
                                )
                            )}
                        </span>

                    </div>

                </div>

            `;


            card.addEventListener(
                "click",
                () =>
                    openAnime(
                        anime
                    )
            );


            newestAiringResults.appendChild(
                card
            );

        }
    );

}


// ======================================================
// LOAD SCHEDULE
// ======================================================

async function loadSchedule() {

    if (
        !schedulePage
    ) {

        return;

    }


    if (
        newestAiringResults
    ) {

        newestAiringResults.innerHTML = `

            <div class="loading">
                Loading newest episodes...
            </div>

        `;

    }


    if (
        scheduleResults
    ) {

        scheduleResults.innerHTML = `

            <div class="loading">
                Loading schedule...
            </div>

        `;

    }


    if (
        nextAiringCard
    ) {

        nextAiringCard.innerHTML = `

            <div class="loading">
                Loading next airing...
            </div>

        `;

    }


    try {

        const data =
            await apiFetch(
                `${API}/anime/schedule`
            );


        miraiScheduleData =
            (data.data || [])
                .map(
                    animeData
                );


        renderSchedule(
            miraiScheduleData
        );


        createNewestAiring(
            miraiScheduleData
        );


        renderNextAiring(
            miraiScheduleData
        );


    } catch (
        error
    ) {

        console.error(
            "Schedule failed:",
            error
        );


        const message =
            escapeHTML(
                error.message
            );


        if (
            newestAiringResults
        ) {

            newestAiringResults.innerHTML = `

                <div class="empty-state">

                    <h3>
                        Schedule unavailable
                    </h3>

                    <p>
                        ${message}
                    </p>

                </div>

            `;

        }


        if (
            scheduleResults
        ) {

            scheduleResults.innerHTML = `

                <div class="schedule-empty">

                    <h3>
                        Schedule unavailable
                    </h3>

                    <p>
                        ${message}
                    </p>

                </div>

            `;

        }


        if (
            nextAiringCard
        ) {

            nextAiringCard.innerHTML = `

                <div class="schedule-empty">

                    <h3>
                        Next airing unavailable
                    </h3>

                    <p>
                        ${message}
                    </p>

                </div>

            `;

        }

    }

}


// ======================================================
// SCHEDULE DAY BUTTONS
// ======================================================

document
    .querySelectorAll(
        ".schedule-day"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    currentScheduleDay =
                        button.dataset.day;


                    renderSchedule(
                        miraiScheduleData
                    );

                }
            );

        }
    );


// ======================================================
// NAVIGATION
// ======================================================

function navigateToPage(
    page
) {

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            item => {

                item.classList.toggle(
                    "active",
                    item.dataset.page ===
                    page
                );

            }
        );


    document
        .querySelectorAll(
            ".mobile-nav-item"
        )
        .forEach(
            item => {

                item.classList.toggle(
                    "active",
                    item.dataset.page ===
                    page
                );

            }
        );


    document
        .querySelectorAll(
            ".page"
        )
        .forEach(
            element => {

                element.classList.remove(
                    "active-page"
                );

            }
        );


    const target =
        document.getElementById(
            `${page}Page`
        );


    if (
        target
    ) {

        target.classList.add(
            "active-page"
        );

    }


    const nav =
        document.querySelector(
            `.nav-item[data-page="${page}"]`
        );


    if (
        pageTitle
    ) {

        pageTitle.textContent =
            nav?.querySelector(
                ".nav-text"
            )?.textContent.trim() ||
            nav?.textContent.trim() ||
            page;

    }


    if (
        searchDropdown
    ) {

        searchDropdown.classList.remove(
            "visible"
        );

    }


    if (
        page === "my-list"
    ) {

        renderMyList();

    }


    if (
        page === "trending"
    ) {

        loadTrending();

    }


    if (
        page === "schedule"
    ) {

        loadSchedule();

    }


    if (
        page === "discover"
    ) {

        loadDiscover();

    }


    if (
        window.innerWidth <= 800 &&
        sidebar
    ) {

        sidebar.classList.remove(
            "open"
        );


        updateSidebarState();

    }

}


document
    .querySelectorAll(
        ".nav-item"
    )
    .forEach(
        item => {

            item.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    navigateToPage(
                        item.dataset.page
                    );

                }
            );

        }
    );


document
    .querySelectorAll(
        ".mobile-nav-item"
    )
    .forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    navigateToPage(
                        item.dataset.page
                    );

                }
            );

        }
    );


// ======================================================
// TRENDING
// ======================================================

async function loadTrending() {

    const container =
        document.getElementById(
            "trendingPageResults"
        );


    if (
        !container
    ) {

        return;

    }


    container.innerHTML = `

        <div class="loading">
            Loading trending anime...
        </div>

    `;


    try {

        const data =
            await apiFetch(
                `${API}/anime/trending?limit=20`
            );


        const anime =
            (data.data || [])
                .map(
                    animeData
                );


        renderAnimeGrid(
            container,
            anime,
            "No trending anime found."
        );


    } catch (
        error
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <h3>
                    Trending unavailable
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;

    }

}


// ======================================================
// RANDOM
// ======================================================

async function loadRandom() {

    if (
        !randomResult
    ) {

        return;

    }


    if (
        randomButton
    ) {

        randomButton.classList.add(
            "spinning"
        );

    }


    randomResult.innerHTML = `

        <div class="loading">
            Finding something for you...
        </div>

    `;


    try {

        const data =
            await apiFetch(
                `${API}/anime/random`
            );


        const anime =
            animeData(
                data.data
            );


        randomResult.innerHTML =
            "";


        randomResult.appendChild(
            createAnimeCard(
                anime
            )
        );


    } catch (
        error
    ) {

        randomResult.innerHTML = `

            <div class="empty-state">

                <h3>
                    Couldn't find an anime
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;

    } finally {

        if (
            randomButton
        ) {

            randomButton.classList.remove(
                "spinning"
            );

        }

    }

}


if (
    randomButton
) {

    randomButton.addEventListener(
        "click",
        loadRandom
    );

}


// ======================================================
// BACK TO HOME
// ======================================================

function addBackHomeButtons() {

    document
        .querySelectorAll(
            ".page"
        )
        .forEach(
            page => {

                if (
                    page.id ===
                    "homePage"
                ) {

                    return;

                }


                if (
                    page.querySelector(
                        ".back-home-button"
                    )
                ) {

                    return;

                }


                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "back-home-button";


                button.innerHTML = `

                    <span class="back-home-arrow">
                        ←
                    </span>

                    Back to Home

                `;


                button.addEventListener(
                    "click",
                    () =>
                        navigateToPage(
                            "home"
                        )
                );


                page.prepend(
                    button
                );

            }
        );

}


addBackHomeButtons();


// ======================================================
// HOME BUTTONS
// ======================================================

if (
    homeMyListButton
) {

    homeMyListButton.addEventListener(
        "click",
        () =>
            navigateToPage(
                "my-list"
            )
    );

}


if (
    continueListButton
) {

    continueListButton.addEventListener(
        "click",
        () =>
            navigateToPage(
                "my-list"
            )
    );

}


// ======================================================
// SIDEBAR
// ======================================================

function updateSidebarState() {

    const mobile =
        window.innerWidth <= 800;


    if (
        mobile
    ) {

        if (
            sidebarToggle
        ) {

            const open =
                sidebar?.classList.contains(
                    "open"
                );


            sidebarToggle.textContent =
                open
                    ? "‹"
                    : "›";


            sidebarToggle.classList.toggle(
                "sidebar-open",
                open
            );

        }


        return;

    }


    const collapsed =
        document.body.classList.contains(
            "sidebar-collapsed"
        );


    if (
        sidebarToggle
    ) {

        sidebarToggle.textContent =
            collapsed
                ? "›"
                : "‹";

    }

}


if (
    sidebarToggle
) {

    sidebarToggle.addEventListener(
        "click",
        () => {

            const mobile =
                window.innerWidth <= 800;


            if (
                mobile
            ) {

                sidebar.classList.toggle(
                    "open"
                );

            } else {

                document.body.classList.toggle(
                    "sidebar-collapsed"
                );

            }


            updateSidebarState();

        }
    );

}


if (
    mobileMenu
) {

    mobileMenu.addEventListener(
        "click",
        () => {

            sidebar.classList.add(
                "open"
            );


            updateSidebarState();

        }
    );

}


window.addEventListener(
    "resize",
    updateSidebarState
);


// ======================================================
// INITIAL LOAD
// ======================================================

updateHomeStats();

updateHeroArtwork();

renderContinueWatching();

renderMyList();

renderHomeMyList();

loadDiscover();

updateRatingDisplay();

updateSidebarState();


console.log(
    "MIRAI script.js loaded successfully."
);