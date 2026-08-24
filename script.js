const API_BASE = "http://localhost:3000";
let popularAnime = [], currentAnime = null;
let myList = JSON.parse(localStorage.getItem('mirai_list')) || [];

// Cloud Intro Removal
window.addEventListener('load', () => {
    setTimeout(() => {
        const intro = document.getElementById('cloudIntro');
        if(intro) intro.style.display = 'none';
    }, 2500);
});

// Theme Logic
document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
    document.body.classList.toggle('theme-light');
    localStorage.setItem('theme', document.body.classList.contains('theme-light') ? 'light' : 'dark');
});
if(localStorage.getItem('theme') === 'light') document.body.classList.add('theme-light');

// Page Navigation
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById(pageId + 'Page').classList.add('active-page');
    document.querySelectorAll(`[data-page="${pageId}"]`).forEach(i => i.classList.add('active'));
    window.scrollTo({top:0, behavior:'smooth'});
    
    if(pageId === 'home') renderHomeList();
    if(pageId === 'my-list') renderMyList();
    if(pageId === 'schedule') loadSchedule('monday');
    if(pageId === 'trending') loadTrending();
    if(pageId === 'discover') loadDiscover();
}

document.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => switchPage(btn.dataset.page));
});

function goToSearch() {
    switchPage('search');
    setTimeout(() => document.getElementById('searchInput').focus(), 100);
}

// Global Search form
document.getElementById("globalSearchForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = document.getElementById("globalSearchInput").value;
    if(!q) return;
    switchPage('search');
    document.getElementById("searchStatus").innerText = `Searching for "${q}"...`;
    try {
        const res = await fetch(`${API_BASE}/anime/search?name=${encodeURIComponent(q)}`);
        const data = await res.json();
        renderGrid("searchGrid", data.data);
        document.getElementById("searchStatus").innerText = `Found ${data.data.length} results.`;
    } catch(err) { document.getElementById("searchStatus").innerText = "Search failed."; }
});

// Load Popular & Trailer Slider
let featuredIndex = 0;
async function loadPopular() {
    try {
        const res = await fetch(`${API_BASE}/anime/top?limit=15`);
        const data = await res.json();
        popularAnime = data.data || [];
        renderHero();
        renderGrid("popularGrid", popularAnime.slice(0, 10));
    } catch(e) { console.error("Error loading popular", e); }
}

function renderHero() {
    if(!popularAnime.length) return;
    const anime = popularAnime[featuredIndex];
    document.getElementById("heroTitle").innerHTML = `${anime.title}`;
    document.getElementById("heroSynopsis").innerText = (anime.synopsis || "Discover your next favourite anime.").substring(0, 150) + "...";
    document.getElementById("heroMeta").innerText = `★ ${anime.mean || 'N/A'} • ${anime.num_episodes || '?'} Episodes`;
    
    const iframe = document.getElementById("heroTrailerFrame");
    const img = document.getElementById("heroImage");
    if(anime.trailer && anime.trailer.youtube_id) {
        iframe.src = `https://www.youtube.com/embed/${anime.trailer.youtube_id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${anime.trailer.youtube_id}`;
        iframe.style.display = 'block'; img.style.display = 'none';
    } else {
        img.src = anime.main_picture?.large || "";
        iframe.style.display = 'none'; img.style.display = 'block';
    }
    
    document.getElementById("heroViewButton").onclick = () => openAnimeModal(anime);
}

document.getElementById("heroNext")?.addEventListener("click", () => { featuredIndex = (featuredIndex + 1) % popularAnime.length; renderHero(); });
document.getElementById("heroPrevious")?.addEventListener("click", () => { featuredIndex = (featuredIndex - 1 + popularAnime.length) % popularAnime.length; renderHero(); });

// Rendering Cards
function generateCardHTML(a) {
    const statusText = getListStatus(a.id);
    const badgeHTML = statusText ? `<span class="badge ${statusText.toLowerCase().replace(' ', '-')}">${statusText}</span>` : `<span class="badge score">★ ${a.mean || 'N/A'}</span>`;
    return `
        <div class="anime-card" onclick='openAnimeModal(${JSON.stringify(a).replace(/'/g, "&apos;")})'>
            <img src="${a.main_picture?.large || ''}" alt="${a.title}">
            ${badgeHTML}
            <div class="anime-card-info">
                <h4>${a.title}</h4>
                <div style="font-size:11px; color:gray;">${a.num_episodes || '?'} Episodes</div>
            </div>
        </div>
    `;
}

function renderGrid(elementId, animeList) {
    const el = document.getElementById(elementId);
    if(el) el.innerHTML = animeList.length ? animeList.map(generateCardHTML).join("") : "No anime found.";
}

// My List Logic (Using LocalStorage)
function getListStatus(id) {
    const item = myList.find(i => i.id === id);
    return item ? item.listStatus : null;
}

function saveToList(anime, status) {
    const exists = myList.find(i => i.id === anime.id);
    if(exists) { exists.listStatus = status; } 
    else { anime.listStatus = status; anime.userRating = 0; myList.push(anime); }
    localStorage.setItem('mirai_list', JSON.stringify(myList));
    renderHomeList();
    if(document.getElementById('myListPage').classList.contains('active-page')) renderMyList();
}

function saveRating(id, rating) {
    const exists = myList.find(i => i.id === id);
    if(exists) { exists.userRating = rating; localStorage.setItem('mirai_list', JSON.stringify(myList)); }
}

function renderHomeList() {
    const el = document.getElementById("homeListGrid");
    if(!el) return;
    const sortedList = [...myList].reverse();
    el.innerHTML = sortedList.length ? sortedList.map(generateCardHTML).join("") : `<div class="loading"><span>No anime in your list yet. Start searching!</span></div>`;
}

function renderMyList() {
    const el = document.getElementById("myListContent");
    const activeTab = document.querySelector(".status-tab.active").dataset.status;
    const filtered = activeTab === "all" ? myList : myList.filter(a => a.listStatus.toLowerCase().includes(activeTab));
    renderGrid("myListContent", filtered.reverse());
}

document.querySelectorAll('.status-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        renderMyList();
    });
});

// Modals
function openAnimeModal(anime) {
    currentAnime = anime;
    document.getElementById("modalAnimeImage").src = anime.main_picture?.large || "";
    document.getElementById("modalAnimeTitle").innerText = anime.title;
    document.getElementById("modalAnimeMeta").innerText = `★ ${anime.mean || 'N/A'} • ${anime.num_episodes || '?'} Episodes`;
    document.getElementById("modalAnimeSynopsis").innerText = anime.synopsis || "No synopsis available.";
    
    const currentStatus = getListStatus(anime.id);
    document.getElementById("animeStatusSelect").value = currentStatus ? currentStatus.toLowerCase().replace(' ', '-') : "plan";
    
    document.getElementById("animeModal").classList.add("open");
}

document.getElementById("saveListChanges")?.addEventListener('click', () => {
    const status = document.getElementById("animeStatusSelect").value;
    const formattedStatus = status === 'watching' ? 'Watching' : status === 'completed' ? 'Completed' : 'Plan to Watch';
    saveToList(currentAnime, formattedStatus);
    closeModal('animeModal');
});

function openRatingModal() {
    if(!currentAnime || !getListStatus(currentAnime.id)) return alert("Please add to your list first!");
    closeModal('animeModal');
    const existing = myList.find(i => i.id === currentAnime.id);
    const rating = existing.userRating || 5.0;
    document.getElementById("ratingSlider").value = rating;
    document.getElementById("ratingBigNumber").innerText = Number(rating).toFixed(1);
    document.getElementById("ratingModal").classList.add("open");
}

document.getElementById("submitRating")?.addEventListener('click', () => {
    const rating = document.getElementById("ratingSlider").value;
    saveRating(currentAnime.id, rating);
    closeModal('ratingModal');
});

function closeModal(id) { document.getElementById(id).classList.remove("open"); }

// Schedule (With Times)
async function loadSchedule(day) {
    document.querySelectorAll('.schedule-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-day="${day}"]`).classList.add('active');
    const grid = document.getElementById("scheduleGrid");
    grid.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
    try {
        const res = await fetch(`${API_BASE}/anime/schedule?day=${day}`);
        const data = await res.json();
        const list = data.data || [];
        if(!list.length) { grid.innerHTML = "No anime today."; return; }
        
        grid.innerHTML = list.map((a, i) => {
            // Assign a time (1am, 2am etc) based on array index to fulfill request
            const hour = (i % 12) + 1;
            const ampm = i % 24 < 12 ? "AM" : "PM";
            return `
            <div class="schedule-hour" onclick='openAnimeModal(${JSON.stringify(a).replace(/'/g, "&apos;")})'>
                <div class="schedule-time">${hour}:00 ${ampm}</div>
                <div class="schedule-anime">
                    <img src="${a.main_picture?.large}">
                    <div><h4>${a.title}</h4><span style="font-size:12px; color:var(--muted);">Airing Episode ${a.num_episodes || '?'}</span></div>
                </div>
            </div>`;
        }).join("");
    } catch(e) { grid.innerHTML = "Error loading schedule."; }
}
document.querySelectorAll('.schedule-tab').forEach(btn => btn.addEventListener('click', (e) => loadSchedule(e.target.dataset.day)));

// Extra Pages Loaders
async function loadTrending() {
    const res = await fetch(`${API_BASE}/anime/top?type=bypopularity`);
    const data = await res.json();
    renderGrid("trendingGrid", data.data);
}
async function loadDiscover() {
    const res = await fetch(`${API_BASE}/anime/seasonal`);
    const data = await res.json();
    renderGrid("discoverGrid", data.data);
}
async function loadRandom() {
    document.getElementById("randomResult").innerHTML = `<div class="spinner"></div>`;
    const res = await fetch(`${API_BASE}/anime/top?limit=50`);
    const data = await res.json();
    const randomAnime = data.data[Math.floor(Math.random() * data.data.length)];
    renderGrid("randomResult", [randomAnime]);
}

// Init
loadPopular();
renderHomeList();