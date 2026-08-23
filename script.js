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

const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const searchTitle = document.getElementById("searchTitle");
const searchClear = document.getElementById("searchClear");

const trendingResults = document.getElementById("trendingResults");
const trendingPageResults = document.getElementById("trendingPageResults");

const discoverResults = document.getElementById("discoverResults");
const myListResults = document.getElementById("myListResults");
const homeMyListResults = document.getElementById("homeMyListResults");

const randomResult = document.getElementById("randomResult");
const randomButton = document.getElementById("randomButton");

const pageTitle = document.getElementById("pageTitle");

const animeModal = document.getElementById("animeModal");
const modalClose = document.getElementById("modalClose");
const modalImage = document.getElementById("modalImage");
const modalType = document.getElementById("modalType");
const modalTitle = document.getElementById("modalTitle");
const modalMeta = document.getElementById("modalMeta");
const modalDescription = document.getElementById("modalDescription");
const modalGenres = document.getElementById("modalGenres");

const statusSelect = document.getElementById("statusSelect");
const episodeInput = document.getElementById("episodeInput");
const ratingSelect = document.getElementById("ratingSelect");
const addListButton = document.getElementById("addListButton");


// ======================================================
// SCHEDULE ELEMENTS
// ======================================================

const schedulePage = document.getElementById("schedulePage");
const newestAiringResults = document.getElementById("newestAiringResults");


// ======================================================
// STATE
// ======================================================

let currentAnime = null;
let searchTimer = null;

let currentScheduleDay = getTodayName();

let myList = JSON.parse(
    localStorage.getItem("miraiAnimeList") || "[]"
);


// ======================================================
// HELPERS
// ======================================================

function animeData(item) {
    return item?.node || item;
}


function escapeHTML(value) {
    if (value === null || value === undefined) {
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
    const episodes = Number(anime?.num_episodes);

    if (!episodes || episodes <= 0) {
        if (anime?.media_type === "movie") {
            return "Movie";
        }

        if (anime?.media_type === "special") {
            return "Special";
        }

        return "Episodes unknown";
    }

    return `${episodes} eps`;
}


function getScore(anime) {
    const score = Number(anime?.mean);

    if (!score) {
        return "N/A";
    }

    return score.toFixed(2);
}


function getType(anime) {
    const type = anime?.media_type || "anime";

    return type
        .replaceAll("_", " ")
        .replace(/\b\w/g, letter => letter.toUpperCase());
}


function getGenres(anime) {
    return (anime?.genres || [])
        .map(genre => genre.name)
        .filter(Boolean);
}


function saveList() {
    localStorage.setItem(
        "miraiAnimeList",
        JSON.stringify(myList)
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

    return days[new Date().getDay()];
}


// ======================================================
// API
// ======================================================

async function apiFetch(url) {

    console.log("MIRAI API REQUEST:", url);

    const response = await fetch(url);

    console.log("MIRAI API STATUS:", response.status);

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error(
            "The MIRAI server returned invalid JSON."
        );
    }

    if (!response.ok || data.success === false) {
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

    anime = animeData(anime);

    const card = document.createElement("article");

    card.className = "anime-card";

    const image = getImage(anime);

    card.innerHTML = `

        <div class="anime-card-image">

            <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(anime.title)}"
                loading="lazy"
            >

            <div class="anime-card-overlay"></div>

            <div class="anime-card-rating">
                ★ ${escapeHTML(getScore(anime))}
            </div>

        </div>

        <div class="anime-card-info">

            <h3>
                ${escapeHTML(anime.title)}
            </h3>

            <div class="anime-card-meta">

                <span>
                    ${escapeHTML(getType(anime))}
                </span>

                <span>
                    ${escapeHTML(getEpisodes(anime))}
                </span>

            </div>

        </div>

    `;

    card.addEventListener("click", () => {
        openAnime(anime);
    });

    return card;
}


// ======================================================
// RENDER GRID
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

    if (!animeList || animeList.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ✦
                </div>

                <h3>
                    Nothing found
                </h3>

                <p>
                    ${escapeHTML(emptyText)}
                </p>

            </div>

        `;

        return;
    }

    animeList.forEach(anime => {
        container.appendChild(
            createAnimeCard(anime)
        );
    });
}


// ======================================================
// SEARCH
// ======================================================

async function searchAnime() {

    const query = searchInput.value.trim();

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
                    Try Naruto, One Piece, Bleach,
                    Jujutsu Kaisen, or anything else.
                </p>

            </div>

        `;

        searchTitle.textContent = "Find Anime";

        return;
    }

    searchTitle.textContent = `Results for "${query}"`;

    searchResults.innerHTML = `

        <div class="loading">
            Searching...
        </div>

    `;

    try {

        const data = await apiFetch(
            `${API}/anime/search?name=${encodeURIComponent(query)}`
        );

        const anime = (data.data || [])
            .map(animeData);

        renderAnimeGrid(
            searchResults,
            anime,
            "No anime matched your search."
        );

    } catch (error) {

        console.error("Search failed:", error);

        searchResults.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    !
                </div>

                <h3>
                    Search failed
                </h3>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            </div>

        `;
    }
}


if (searchInput) {

    searchInput.addEventListener("input", () => {

        clearTimeout(searchTimer);

        searchTimer = setTimeout(
            searchAnime,
            350
        );

    });


    searchInput.addEventListener("keydown", event => {

        if (event.key === "Enter") {

            clearTimeout(searchTimer);

            searchAnime();
        }

    });
}


if (searchClear) {

    searchClear.addEventListener("click", () => {

        searchInput.value = "";

        searchInput.focus();

        searchAnime();

    });

}


// ======================================================
// TRENDING
// ======================================================

async function loadTrending() {

    const containers = [
        trendingResults,
        trendingPageResults
    ].filter(Boolean);

    if (!containers.length) {
        return;
    }

    containers.forEach(container => {

        container.innerHTML = `

            <div class="loading">
                Loading trending anime...
            </div>

        `;

    });

    try {

        const data = await apiFetch(
            `${API}/anime/trending?limit=20`
        );

        const anime = (data.data || [])
            .map(animeData);

        containers.forEach(container => {

            renderAnimeGrid(
                container,
                anime,
                "No trending anime found."
            );

        });

    } catch (error) {

        console.error(
            "Trending failed:",
            error
        );

        containers.forEach(container => {

            container.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        !
                    </div>

                    <h3>
                        Trending unavailable
                    </h3>

                    <p>
                        ${escapeHTML(error.message)}
                    </p>

                </div>

            `;

        });

    }
}


// ======================================================
// RANDOM
// ======================================================

async function loadRandom() {

    if (!randomResult) {
        return;
    }

    randomResult.innerHTML = `

        <div class="loading">
            Finding something for you...
        </div>

    `;

    try {

        const data = await apiFetch(
            `${API}/anime/random`
        );

        const anime = animeData(data.data);

        randomResult.innerHTML = "";

        randomResult.appendChild(
            createAnimeCard(anime)
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
                    ${escapeHTML(error.message)}
                </p>

            </div>

        `;
    }
}


if (randomButton) {

    randomButton.addEventListener(
        "click",
        loadRandom
    );

}


// ======================================================
// MODAL
// ======================================================

function openAnime(anime) {

    currentAnime = animeData(anime);

    if (!currentAnime) {
        return;
    }

    modalTitle.textContent =
        currentAnime.title || "Unknown Anime";

    modalType.textContent =
        getType(currentAnime);

    modalImage.style.backgroundImage =
        `url("${getImage(currentAnime)}")`;

    modalDescription.textContent =
        currentAnime.synopsis ||
        "No description is available.";

    modalMeta.innerHTML = `

        <span>
            ★ ${escapeHTML(getScore(currentAnime))}
        </span>

        <span>
            ${escapeHTML(getEpisodes(currentAnime))}
        </span>

        <span>
            ${escapeHTML(
                currentAnime.status
                    ?.replaceAll("_", " ")
                    || "Unknown"
            )}
        </span>

    `;

    modalGenres.innerHTML =
        getGenres(currentAnime)
            .map(genre => `

                <span class="genre-tag">
                    ${escapeHTML(genre)}
                </span>

            `)
            .join("");

    const existing = myList.find(
        item =>
            Number(item.id) ===
            Number(currentAnime.id)
    );

    if (existing) {

        statusSelect.value =
            existing.status || "plan";

        episodeInput.value =
            existing.episode || 0;

        ratingSelect.value =
            existing.rating || 0;

        addListButton.textContent =
            "✓ Update My List";

    } else {

        statusSelect.value = "plan";

        episodeInput.value = 0;

        ratingSelect.value = 0;

        addListButton.textContent =
            "★ Add to My List";
    }

    animeModal.classList.remove("hidden");

    document.body.classList.add("modal-open");
}


function closeAnime() {

    if (!animeModal) {
        return;
    }

    animeModal.classList.add("hidden");

    document.body.classList.remove("modal-open");

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
        animeModal.querySelector(".modal-backdrop");

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

        if (event.key === "Escape") {
            closeAnime();
        }

    }
);


// ======================================================
// ADD TO MY LIST
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
                        Number(currentAnime.id)
                );

            if (index >= 0) {

                myList[index] = entry;

            } else {

                myList.push(entry);

            }

            saveList();

            addListButton.textContent =
                "✓ Saved to My List";

            renderMyList();

            renderHomeMyList();

        }
    );

}


// ======================================================
// MY LIST PAGE
// ======================================================

function renderMyList(filter = "all") {

    if (!myListResults) {
        return;
    }

    let filtered = [...myList];

    if (filter !== "all") {

        filtered = filtered.filter(
            anime =>
                anime.status === filter
        );

    }

    renderAnimeGrid(
        myListResults,
        filtered,
        "Your list is empty."
    );
}


// ======================================================
// HOME MY LIST
// ======================================================

function renderHomeMyList() {

    if (!homeMyListResults) {
        return;
    }

    homeMyListResults.innerHTML = "";

    if (!myList || myList.length === 0) {

        homeMyListResults.innerHTML = `

            <div class="empty-state home-list-empty">

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
        [...myList]
            .reverse()
            .slice(0, 6);

    homeAnime.forEach(anime => {

        homeMyListResults.appendChild(
            createAnimeCard(anime)
        );

    });
}


// ======================================================
// MY LIST FILTERS
// ======================================================

document
    .querySelectorAll(".list-filter")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".list-filter")
                    .forEach(b => {
                        b.classList.remove("active");
                    });

                button.classList.add("active");

                renderMyList(
                    button.dataset.status
                );

            }
        );

    });


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

        const data = await apiFetch(
            `${API}/anime/top?limit=50`
        );

        let anime = (data.data || [])
            .map(animeData);

        if (genre !== "all") {

            anime = anime.filter(item =>
                getGenres(item).some(
                    itemGenre =>
                        itemGenre.toLowerCase() ===
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
                    ${escapeHTML(error.message)}
                </p>

            </div>

        `;

    }

}


document
    .querySelectorAll(".discover-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".discover-button")
                    .forEach(b => {
                        b.classList.remove("active");
                    });

                button.classList.add("active");

                loadDiscover(
                    button.dataset.genre
                );

            }
        );

    });


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


function getDateForDay(dayName) {

    const today = new Date();

    const todayIndex = today.getDay();

    const targetIndex =
        DAYS.findIndex(
            day => day.key === dayName
        );

    const result = new Date(today);

    let difference =
        targetIndex - todayIndex;

    if (difference < 0) {
        difference += 7;
    }

    result.setDate(
        today.getDate() + difference
    );

    return result;
}


function formatDate(date) {

    return date.toLocaleDateString(
        undefined,
        {
            weekday: "long",
            month: "long",
            day: "numeric"
        }
    );
}


function getScheduleTime(anime) {

    return (
        anime?.broadcast?.start_time ||
        "Unknown"
    );

}


// ======================================================
// SCHEDULE CARD
// ======================================================

function createScheduleCard(anime) {

    const card =
        document.createElement("article");

    card.className =
        "schedule-anime";

    const time =
        getScheduleTime(anime);

    card.innerHTML = `

        <div class="schedule-anime-image">

            <img
                src="${escapeHTML(
                    getImage(anime)
                )}"
                alt="${escapeHTML(
                    anime.title
                )}"
                loading="lazy"
            >

        </div>

        <div class="schedule-anime-info">

            <h3>
                ${escapeHTML(anime.title)}
            </h3>

            <div class="schedule-anime-tags">

                <span>
                    ${escapeHTML(
                        getEpisodes(anime)
                    )}
                </span>

                <span>
                    ${escapeHTML(time)}
                </span>

            </div>

        </div>

    `;

    card.addEventListener(
        "click",
        () => openAnime(anime)
    );

    return card;
}


// ======================================================
// SCHEDULE DAY BUTTONS
// ======================================================

function renderScheduleDays(animeList) {

    const scheduleDays =
        document.querySelector(".schedule-days");

    if (!scheduleDays) {
        return;
    }

    scheduleDays
        .querySelectorAll(".schedule-day")
        .forEach(button => {

            const day =
                button.dataset.day;

            button.classList.toggle(
                "active",
                day === currentScheduleDay
            );

            const date =
                getDateForDay(day);

            const dateElement =
                button.querySelector(".day-date");

            if (dateElement) {

                dateElement.textContent =
                    date.getDate();

            }

        });
}


function updateSelectedScheduleDate() {

    const selectedDayName =
        document.getElementById(
            "selectedDayName"
        );

    const selectedFullDate =
        document.getElementById(
            "selectedFullDate"
        );

    const date =
        getDateForDay(
            currentScheduleDay
        );

    const day =
        DAYS.find(
            item =>
                item.key ===
                currentScheduleDay
        );

    if (selectedDayName) {

        selectedDayName.textContent =
            day ? day.label : "Today";

    }

    if (selectedFullDate) {

        selectedFullDate.textContent =
            formatDate(date);

    }
}


// ======================================================
// RENDER SCHEDULE
// ======================================================

function renderSchedule(animeList) {

    const sections =
        document.querySelectorAll(
            ".time-section"
        );

    if (!sections.length) {
        return;
    }

    renderScheduleDays(animeList);

    updateSelectedScheduleDate();

    sections.forEach(section => {

        const hour =
            Number(
                section.dataset.hour
            );

        const list =
            section.querySelector(
                ".time-anime-list"
            );

        if (!list) {
            return;
        }

        list.innerHTML = "";

        const matchingAnime =
            animeList.filter(anime => {

                const day =
                    anime?.broadcast
                        ?.day_of_the_week
                        ?.toLowerCase();

                if (day !== currentScheduleDay) {
                    return false;
                }

                const time =
                    getScheduleTime(anime);

                if (time === "Unknown") {
                    return false;
                }

                const animeHour =
                    Number(
                        time.substring(0, 2)
                    );

                return animeHour === hour;

            });

        matchingAnime.sort(
            (a, b) =>
                getScheduleTime(a)
                    .localeCompare(
                        getScheduleTime(b)
                    )
        );

        matchingAnime.forEach(anime => {

            list.appendChild(
                createScheduleCard(anime)
            );

        });

        section.classList.toggle(
            "empty-time",
            matchingAnime.length === 0
        );

    });

}


// ======================================================
// NEWEST AIRING
// ======================================================

function createNewestAiring(animeList) {

    if (!newestAiringResults) {
        return;
    }

    newestAiringResults.innerHTML = "";

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
                            a.start_date || 0
                        );

                    const dateB =
                        new Date(
                            b.start_date || 0
                        );

                    return dateB - dateA;

                }
            )
            .slice(0, 8);

    if (!sorted.length) {

        newestAiringResults.innerHTML = `

            <div class="empty-state">

                <h3>
                    No recent anime found
                </h3>

                <p>
                    MAL did not return recent airing information.
                </p>

            </div>

        `;

        return;
    }

    sorted.forEach(anime => {

        const card =
            document.createElement("article");

        card.className =
            "newest-airing-card";

        const image =
            getImage(anime);

        card.style.backgroundImage =
            `url("${image}")`;

        card.innerHTML = `

            <div class="newest-airing-background"
                style="
                    background-image:
                    url('${escapeHTML(image)}');
                ">
            </div>

            <div class="newest-airing-content">

                <div>

                    <p class="eyebrow">
                        AIRING
                    </p>

                    <h3>
                        ${escapeHTML(
                            anime.title
                        )}
                    </h3>

                </div>

                <div class="newest-airing-tags">

                    <span>
                        ${escapeHTML(
                            getEpisodes(anime)
                        )}
                    </span>

                    <span>
                        ${escapeHTML(
                            getScheduleTime(anime)
                        )}
                    </span>

                </div>

            </div>

        `;

        card.addEventListener(
            "click",
            () => openAnime(anime)
        );

        newestAiringResults.appendChild(
            card
        );

    });

}


// ======================================================
// LOAD SCHEDULE
// ======================================================

async function loadSchedule() {

    if (!schedulePage) {
        return;
    }

    const timeline =
        document.querySelector(
            ".schedule-timeline"
        );

    if (timeline) {

        timeline.classList.add(
            "schedule-loading"
        );

    }

    if (newestAiringResults) {

        newestAiringResults.innerHTML = `

            <div class="loading">
                Loading newest episodes...
            </div>

        `;

    }

    try {

        console.log(
            "Loading MIRAI schedule..."
        );

        const data =
            await apiFetch(
                `${API}/anime/schedule`
            );

        const animeList =
            (data.data || [])
                .map(animeData);

        console.log(
            "Schedule anime received:",
            animeList.length
        );

        renderSchedule(
            animeList
        );

        createNewestAiring(
            animeList
        );

    } catch (error) {

        console.error(
            "Schedule failed:",
            error
        );

        if (newestAiringResults) {

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

        document
            .querySelectorAll(
                ".time-anime-list"
            )
            .forEach(list => {

                list.innerHTML = `

                    <div class="schedule-error">
                        Unable to load schedule.
                    </div>

                `;

            });

    } finally {

        if (timeline) {

            timeline.classList.remove(
                "schedule-loading"
            );

        }

    }

}


// ======================================================
// SCHEDULE DAY CLICK
// ======================================================

document
    .querySelectorAll(".schedule-day")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                currentScheduleDay =
                    button.dataset.day;

                document
                    .querySelectorAll(
                        ".schedule-day"
                    )
                    .forEach(dayButton => {

                        dayButton.classList.toggle(
                            "active",
                            dayButton.dataset.day ===
                            currentScheduleDay
                        );

                    });

                updateSelectedScheduleDate();

                if (window.miraiScheduleData) {

                    renderSchedule(
                        window.miraiScheduleData
                    );

                }

            }
        );

    });


// ======================================================
// NAVIGATION
// ======================================================

document
    .querySelectorAll(".nav-item")
    .forEach(item => {

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
                    .forEach(nav => {

                        nav.classList.remove(
                            "active"
                        );

                    });

                item.classList.add("active");

                document
                    .querySelectorAll(".page")
                    .forEach(section => {

                        section.classList.remove(
                            "active-page"
                        );

                    });

                const target =
                    document.getElementById(
                        `${page}Page`
                    );

                if (target) {

                    target.classList.add(
                        "active-page"
                    );

                }

                if (pageTitle) {

                    pageTitle.textContent =
                        item.textContent.trim();

                }

                if (page === "my-list") {

                    renderMyList();

                }

                if (page === "trending") {

                    loadTrending();

                }

                if (page === "schedule") {

                    loadSchedule();

                }

                if (page === "discover") {

                    loadDiscover();

                }

            }
        );

    });


// ======================================================
// HOME TRENDING BUTTON
// ======================================================

const homeTrendingButton =
    document.getElementById(
        "homeTrendingButton"
    );

if (homeTrendingButton) {

    homeTrendingButton.addEventListener(
        "click",
        () => {

            const trendingNav =
                document.querySelector(
                    '.nav-item[data-page="trending"]'
                );

            if (trendingNav) {
                trendingNav.click();
            }

        }
    );

}


// ======================================================
// MOBILE MENU
// ======================================================

const mobileMenu =
    document.getElementById(
        "mobileMenu"
    );

const sidebar =
    document.getElementById(
        "sidebar"
    );

if (mobileMenu && sidebar) {

    mobileMenu.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

        }
    );

}


// ======================================================
// INITIAL LOAD
// ======================================================

console.log("MIRAI script.js loaded.");

renderMyList();

renderHomeMyList();

loadDiscover();


// ======================================================
// END
// ======================================================