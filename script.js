// ======================================================
// MIRAI ANIME TRACKER
// MyAnimeList API
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

const trendingPageResults =
    document.getElementById("trendingPageResults");

const discoverResults =
    document.getElementById("discoverResults");

const myListResults =
    document.getElementById("myListResults");

const homeMyListResults =
    document.getElementById("homeMyListResults");

const homeMyListButton =
    document.getElementById("homeMyListButton");

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

const addListButton =
    document.getElementById("addListButton");

const schedulePage =
    document.getElementById("schedulePage");

const newestAiringResults =
    document.getElementById("newestAiringResults");

const scheduleResults =
    document.getElementById("scheduleResults");

const scheduleHeading =
    document.getElementById("scheduleHeading");

const scheduleCount =
    document.getElementById("scheduleCount");

const sidebar =
    document.getElementById("sidebar");

const sidebarToggle =
    document.getElementById("sidebarToggle");

const mobileMenu =
    document.getElementById("mobileMenu");


// ======================================================
// STATE
// ======================================================

let currentAnime = null;

let searchTimer = null;

let currentScheduleDay =
    getTodayName();

let miraiScheduleData = [];

let myList =
    JSON.parse(
        localStorage.getItem(
            "miraiAnimeList"
        ) || "[]"
    );


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
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

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


function saveList() {

    localStorage.setItem(
        "miraiAnimeList",
        JSON.stringify(
            myList
        )
    );

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


// ======================================================
// API
// ======================================================

async function apiFetch(url) {

    console.log(
        "MIRAI API REQUEST:",
        url
    );

    const response =
        await fetch(url);

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

        </div>

    `;

    card.addEventListener(
        "click",
        () =>
            openAnime(anime)
    );

    return card;

}


// ======================================================
// GRID
// ======================================================

function renderAnimeGrid(
    container,
    animeList,
    emptyText = "No anime found."
) {

    if (!container) {

        return;

    }

    container.innerHTML = "";

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
// SEARCH
// ======================================================

async function searchAnime() {

    const query =
        searchInput.value.trim();

    if (!query) {

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
                    Bleach, Jujutsu Kaisen,
                    or anything else.
                </p>

            </div>

        `;

        searchTitle.textContent =
            "Find Anime";

        return;

    }


    saveRecentSearch(
        query
    );


    if (searchDropdown) {

        searchDropdown.classList.remove(
            "visible"
        );

    }


    searchTitle.textContent =
        `Results for "${query}"`;


    searchResults.innerHTML = `

        <div class="loading">
            Searching...
        </div>

    `;


    try {

        const data =
            await apiFetch(
                `${API}/anime/search?name=${encodeURIComponent(query)}`
            );


        const anime =
            (data.data || [])
                .map(animeData);


        renderAnimeGrid(
            searchResults,
            anime,
            "No anime matched your search."
        );


    } catch (error) {

        console.error(
            "Search failed:",
            error
        );


        searchResults.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    !
                </div>

                <h3>
                    Search failed
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


if (searchInput) {

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
                event.key === "Enter"
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
        () => {

            showSearchDropdown();

        }
    );

}


if (searchClear) {

    searchClear.addEventListener(
        "click",
        () => {

            searchInput.value = "";

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

    if (!query) {

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

    if (!searchDropdown) {

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
            ${escapeHTML(query)}
        </span>

    `;


    button.addEventListener(
        "click",
        () => {

            searchInput.value =
                query;

            saveRecentSearch(
                query
            );

            searchDropdown.classList.remove(
                "visible"
            );

            searchAnime();

        }
    );


    searchDropdown.appendChild(
        button
    );

}


function showSearchDropdown() {

    if (!searchDropdown) {

        return;

    }


    const activePage =
        document.querySelector(
            ".page.active-page"
        );


    if (
        !activePage ||
        activePage.id === "homePage"
    ) {

        searchDropdown.classList.remove(
            "visible"
        );

        return;

    }


    const recent =
        getRecentSearches();


    searchDropdown.innerHTML = "";


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


    const suggestions =
        recent.length
            ? recent
            : popularSearches;


    suggestions.forEach(
        query => {

            createSearchSuggestion(
                query
            );

        }
    );


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

function openAnime(anime) {

    currentAnime =
        animeData(anime);

    if (!currentAnime) {

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


    const existing =
        myList.find(
            item =>
                Number(item.id) ===
                Number(
                    currentAnime.id
                )
        );


    if (existing) {

        statusSelect.value =
            existing.status ||
            "plan";

        episodeInput.value =
            existing.episode ||
            0;

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


    animeModal.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "modal-open"
    );

}


function closeAnime() {

    animeModal.classList.add(
        "hidden"
    );

    document.body.classList.remove(
        "modal-open"
    );

    currentAnime = null;

}


if (modalClose) {

    modalClose.addEventListener(
        "click",
        closeAnime
    );

}


if (animeModal) {

    const backdrop =
        animeModal.querySelector(
            ".modal-backdrop"
        );


    if (backdrop) {

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
            event.key === "Escape"
        ) {

            closeAnime();

        }

    }
);


// ======================================================
// MY LIST
// ======================================================

if (addListButton) {

    addListButton.addEventListener(
        "click",
        () => {

            if (!currentAnime) {

                return;

            }


            const entry = {

                ...currentAnime,

                status:
                    statusSelect.value,

                episode:
                    Number(
                        episodeInput.value
                    ) || 0,

                rating:
                    Number(
                        ratingSelect.value
                    ) || 0

            };


            const index =
                myList.findIndex(
                    item =>
                        Number(item.id) ===
                        Number(
                            currentAnime.id
                        )
                );


            if (index >= 0) {

                myList[index] =
                    entry;

            } else {

                myList.push(
                    entry
                );

            }


            saveList();

            renderMyList();

            renderHomeMyList();


            addListButton.textContent =
                "✓ Saved to My List";

        }
    );

}


function renderMyList(
    filter = "all"
) {

    if (!myListResults) {

        return;

    }


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


    renderAnimeGrid(
        myListResults,
        filtered,
        "Your list is empty."
    );

}


function renderHomeMyList() {

    if (!homeMyListResults) {

        return;

    }


    homeMyListResults.innerHTML =
        "";


    if (
        !myList ||
        myList.length === 0
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
                    Search for an anime
                    and add it to your list
                    to see it here.
                </p>

            </div>

        `;

        return;

    }


    const homeAnime =
        [...myList]
            .reverse()
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


                    renderMyList(
                        button.dataset.status
                    );

                }
            );

        }
    );


// ======================================================
// DISCOVER
// ======================================================

async function loadDiscover(
    genre = "all"
) {

    if (!discoverResults) {

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
                .map(animeData);


        if (
            genre !== "all"
        ) {

            anime =
                anime.filter(
                    item =>
                        getGenres(item)
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

    } catch (error) {

        console.error(
            "Discover failed:",
            error
        );


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
            weekday: "long",
            month: "long",
            day: "numeric"
        }
    );

}


function getScheduleTime(
    anime
) {

    return (
        anime?.broadcast?.start_time ||
        "Unknown"
    );

}


function parseHour(
    time
) {

    if (
        !time ||
        time === "Unknown"
    ) {

        return null;

    }


    const match =
        String(time).match(
            /^(\d{1,2}):(\d{2})/
        );


    if (!match) {

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


function createScheduleCard(
    anime
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "schedule-anime-card";


    const time =
        getScheduleTime(
            anime
        );


    card.innerHTML = `

        <div class="schedule-anime-image">

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

        </div>


        <div class="schedule-anime-info">

            <h3>
                ${escapeHTML(
                    anime.title ||
                    "Unknown Anime"
                )}
            </h3>

            <div class="schedule-anime-meta">

                <span>
                    ${escapeHTML(
                        getEpisodes(anime)
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
            openAnime(anime)
    );


    return card;

}


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
            selectedDay
                ? selectedDay.label
                : "Today";

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


function renderSchedule(
    animeList
) {

    if (!scheduleResults) {

        return;

    }


    updateScheduleDays();

    updateSelectedDate();


    const selectedAnime =
        animeList.filter(
            anime => {

                return (
                    anime?.broadcast
                        ?.day_of_the_week
                        ?.toLowerCase() ===
                    currentScheduleDay
                );

            }
        );


    if (
        scheduleCount
    ) {

        scheduleCount.textContent =
            `${selectedAnime.length} ${
                selectedAnime.length === 1
                    ? "anime"
                    : "anime"
            }`;

    }


    scheduleResults.innerHTML =
        "";


    if (
        selectedAnime.length === 0
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
                    MyAnimeList doesn't currently
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
                parseHour(
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
                .get(key)
                .push(anime);

        }
    );


    const sortedKeys =
        [...groups.keys()]
            .sort(
                (a, b) => {

                    if (
                        a === "unknown"
                    ) {

                        return 1;

                    }


                    if (
                        b === "unknown"
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
                hour === "unknown"
                    ? "TBA"
                    : formatTimeLabel(
                        hour
                    );


            const small =
                document.createElement(
                    "small"
                );


            small.textContent =
                hour === "unknown"
                    ? "AIRING TIME"
                    : "AIRING";


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
                .get(hour)
                .sort(
                    (a, b) =>
                        getScheduleTime(a)
                            .localeCompare(
                                getScheduleTime(b)
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
                (a, b) => {

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
        sorted.length === 0
    ) {

        newestAiringResults.innerHTML = `

            <div class="empty-state">

                <h3>
                    No recent anime found
                </h3>

                <p>
                    MAL did not return recent
                    airing information.
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
                            getImage(anime)
                        )}');
                    ">
                </div>

                <div class="newest-airing-content">

                    <p class="eyebrow">
                        AIRING
                    </p>

                    <h3>
                        ${escapeHTML(
                            anime.title ||
                            "Unknown Anime"
                        )}
                    </h3>

                    <div class="newest-airing-tags">

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


    try {

        const data =
            await apiFetch(
                `${API}/anime/schedule`
            );


        miraiScheduleData =
            (data.data || [])
                .map(animeData);


        renderSchedule(
            miraiScheduleData
        );


        createNewestAiring(
            miraiScheduleData
        );


    } catch (error) {

        console.error(
            "Schedule failed:",
            error
        );


        if (
            newestAiringResults
        ) {

            newestAiringResults.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        !
                    </div>

                    <h3>
                        Schedule unavailable
                    </h3>

                    <p>
                        ${escapeHTML(
                            error.message
                        )}
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
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                </div>

            `;

        }

    }

}


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


                    const page =
                        item.dataset.page;


                    document
                        .querySelectorAll(
                            ".nav-item"
                        )
                        .forEach(
                            nav =>
                                nav.classList.remove(
                                    "active"
                                )
                        );


                    item.classList.add(
                        "active"
                    );


                    document
                        .querySelectorAll(
                            ".page"
                        )
                        .forEach(
                            pageElement =>
                                pageElement.classList.remove(
                                    "active-page"
                                )
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


                    if (
                        pageTitle
                    ) {

                        pageTitle.textContent =
                            item
                                .querySelector(
                                    ".nav-text"
                                )
                                ?.textContent
                                .trim() ||
                            item.textContent.trim();

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
                        window.innerWidth <=
                        800 &&
                        sidebar
                    ) {

                        sidebar.classList.remove(
                            "open"
                        );

                    }

                }
            );

        }
    );


// ======================================================
// TRENDING
// ======================================================

async function loadTrending() {

    if (
        !trendingPageResults
    ) {

        return;

    }


    trendingPageResults.innerHTML = `

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
                .map(animeData);


        renderAnimeGrid(
            trendingPageResults,
            anime,
            "No trending anime found."
        );


    } catch (error) {

        console.error(
            "Trending failed:",
            error
        );


        trendingPageResults.innerHTML = `

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


    } catch (error) {

        console.error(
            "Random failed:",
            error
        );


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
// BACK TO HOME BUTTONS
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
                    () => {

                        const homeNav =
                            document.querySelector(
                                '.nav-item[data-page="home"]'
                            );


                        if (
                            homeNav
                        ) {

                            homeNav.click();

                        }

                    }
                );


                const inner =
                    page.querySelector(
                        ".page-inner"
                    );


                if (
                    inner
                ) {

                    inner.insertBefore(
                        button,
                        inner.firstElementChild
                    );

                }

            }
        );

}


addBackHomeButtons();


// ======================================================
// HOME MY LIST BUTTON
// ======================================================

if (
    homeMyListButton
) {

    homeMyListButton.addEventListener(
        "click",
        () => {

            const myListNav =
                document.querySelector(
                    '.nav-item[data-page="my-list"]'
                );


            if (
                myListNav
            ) {

                myListNav.click();

            }

        }
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

            sidebarToggle.textContent =
                sidebar?.classList.contains(
                    "open"
                )
                    ? "‹"
                    : "›";

            sidebarToggle.classList.toggle(
                "sidebar-open",
                sidebar?.classList.contains(
                    "open"
                )
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

                sidebar?.classList.toggle(
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
    mobileMenu &&
    sidebar
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
    () => {

        updateSidebarState();

    }
);


// ======================================================
// INITIAL LOAD
// ======================================================

renderMyList();

renderHomeMyList();

loadDiscover();

updateSidebarState();

console.log(
    "MIRAI script.js loaded successfully."
);