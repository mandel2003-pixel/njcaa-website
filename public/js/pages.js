// ============================================
// NJCAA WEBSITE - PAGES JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupUserMenu();
    
    // Page-specific initialization
    const path = window.location.pathname;
    
    if (path.includes('news.html')) {
        loadNewsPage();
    } else if (path.includes('teams.html')) {
        loadTeamsPage();
    } else if (path.includes('championships.html')) {
        loadChampionshipsPage();
    } else if (path.includes('division1.html') || path.includes('division3.html')) {
        loadDivisionPage();
    } else if (path.includes('about.html')) {
        loadAboutPage();
    } else if (path.includes('membership.html')) {
        loadMembershipPage();
    }
    
    // Load sidebar scores on all pages
    loadSidebarScores();
});

// ============================================
// AUTHENTICATION (shared)
// ============================================

let currentUser = null;

async function checkAuth() {
    try {
        const res = await fetch('/auth/me');
        if (res.ok) {
            currentUser = await res.json();
            showLoggedInState();
        } else {
            showLoggedOutState();
        }
    } catch (error) {
        showLoggedOutState();
    }
}

function showLoggedInState() {
    document.getElementById('loggedOut').style.display = 'none';
    document.getElementById('loggedIn').style.display = 'block';
    
    const avatar = currentUser.avatar
        ? `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png`
        : 'https://cdn.discordapp.com/embed/avatars/0.png';
    
    document.getElementById('userAvatar').src = avatar;
    document.getElementById('userName').textContent = currentUser.username;
    
    if (currentUser.isAdmin) {
        document.getElementById('adminLink').style.display = 'flex';
    }
}

function showLoggedOutState() {
    document.getElementById('loggedOut').style.display = 'block';
    document.getElementById('loggedIn').style.display = 'none';
}

function setupUserMenu() {
    const btn = document.getElementById('userBtn');
    const dropdown = document.getElementById('userDropdown');
    
    if (btn && dropdown) {
        btn.addEventListener('click', () => {
            dropdown.classList.toggle('show');
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                dropdown.classList.remove('show');
            }
        });
    }
}

// ============================================
// NEWS PAGE
// ============================================

async function loadNewsPage() {
    try {
        const res = await fetch('/api/articles');
        const articles = await res.json();
        
        // Featured article
        if (articles.length > 0) {
            renderFeaturedArticle(articles[0]);
            renderNewsGrid(articles.slice(1));
        }
        
        // Setup filters
        setupNewsFilters();
    } catch (error) {
        console.error('Error loading news:', error);
    }
}

function renderFeaturedArticle(article) {
    const container = document.getElementById('featuredArticle');
    if (!container) return;
    
    container.innerHTML = `
        <div class="featured-card" onclick="viewArticle('${article.id}')">
            <div class="featured-image">
                <img src="${article.image || 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=1200'}" alt="${article.title}">
                <div class="featured-overlay">
                    <span class="featured-tag">FEATURED</span>
                </div>
            </div>
            <div class="featured-content">
                <span class="featured-date">${formatDate(article.date)}</span>
                <h2>${article.title}</h2>
                <p>${article.content ? article.content.substring(0, 200) + '...' : ''}</p>
                <span class="read-more">Read Full Story <i class="fas fa-arrow-right"></i></span>
            </div>
        </div>
    `;
}

function renderNewsGrid(articles) {
    const container = document.getElementById('newsGrid');
    if (!container) return;
    
    if (articles.length === 0) {
        container.innerHTML = '<p class="no-content">No additional articles found.</p>';
        return;
    }
    
    container.innerHTML = articles.map(article => `
        <div class="news-card-full" onclick="viewArticle('${article.id}')">
            <div class="news-card-image">
                <img src="${article.image || 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800'}" alt="${article.title}">
            </div>
            <div class="news-card-content">
                <span class="news-date">${formatDate(article.date)}</span>
                <h3>${article.title}</h3>
                <p>${article.content ? article.content.substring(0, 150) + '...' : ''}</p>
                <span class="read-more">Read More <i class="fas fa-chevron-right"></i></span>
            </div>
        </div>
    `).join('');
}

function setupNewsFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Filter logic would go here
        });
    });
}

function viewArticle(id) {
    window.location.href = `/article.html?id=${id}`;
}

// ============================================
// TEAMS PAGE
// ============================================

async function loadTeamsPage() {
    try {
        const res = await fetch('/api/teams');
        const teams = await res.json();
        renderTeamsGrid(teams);
        setupTeamsFilters();
    } catch (error) {
        console.error('Error loading teams:', error);
    }
}

function renderTeamsGrid(teams) {
    const container = document.getElementById('teamsGrid');
    if (!container) return;
    
    if (teams.length === 0) {
        container.innerHTML = `
            <div class="no-content">
                <i class="fas fa-users"></i>
                <p>No teams found. Check back soon!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = teams.map(team => `
        <div class="team-card">
            <div class="team-logo">
                <img src="${team.logo || 'https://www.njcaa.org/images/setup/site-logo.png'}" alt="${team.name}">
            </div>
            <div class="team-info">
                <h3>${team.name}</h3>
                <span class="team-conference">${team.conference || 'NJCAA'}</span>
                <span class="team-location"><i class="fas fa-map-marker-alt"></i> ${team.location || 'Location TBD'}</span>
            </div>
            <div class="team-actions">
                <a href="#" class="team-btn">View Roster</a>
                <a href="#" class="team-btn secondary">Schedule</a>
            </div>
        </div>
    `).join('');
}

function setupTeamsFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// ============================================
// CHAMPIONSHIPS PAGE
// ============================================

function loadChampionshipsPage() {
    // Championships are static content for now
    console.log('Championships page loaded');
}

// ============================================
// DIVISION PAGES
// ============================================

async function loadDivisionPage() {
    try {
        const [teamsRes, gamesRes] = await Promise.all([
            fetch('/api/teams'),
            fetch('/api/games')
        ]);
        
        const teams = await teamsRes.json();
        const games = await gamesRes.json();
        
        renderDivisionTeams(teams);
        renderDivisionGames(games);
    } catch (error) {
        console.error('Error loading division data:', error);
    }
}

function renderDivisionTeams(teams) {
    const container = document.getElementById('divisionTeams');
    if (!container) return;
    
    container.innerHTML = teams.slice(0, 6).map(team => `
        <div class="division-team-card">
            <img src="${team.logo || 'https://www.njcaa.org/images/setup/site-logo.png'}" alt="${team.name}">
            <h4>${team.name}</h4>
            <span>${team.location || ''}</span>
        </div>
    `).join('');
}

function renderDivisionGames(games) {
    const container = document.getElementById('divisionGames');
    if (!container) return;
    
    container.innerHTML = games.slice(0, 4).map(game => `
        <div class="division-game-card">
            <div class="game-date">${formatShortDate(game.date)}</div>
            <div class="game-matchup">
                <span>${game.awayTeam}</span>
                <span class="vs">@</span>
                <span>${game.homeTeam}</span>
            </div>
            <div class="game-score">
                ${game.status === 'final' ? `${game.awayScore} - ${game.homeScore}` : game.time || 'TBD'}
            </div>
        </div>
    `).join('');
}

// ============================================
// ABOUT PAGE
// ============================================

function loadAboutPage() {
    // About page is static content
    console.log('About page loaded');
}

// ============================================
// MEMBERSHIP PAGE
// ============================================

function loadMembershipPage() {
    // Membership page is static content
    console.log('Membership page loaded');
}

// ============================================
// SIDEBAR
// ============================================

async function loadSidebarScores() {
    const container = document.getElementById('sidebarScores');
    if (!container) return;
    
    try {
        const res = await fetch('/api/games');
        const games = await res.json();
        
        container.innerHTML = games.slice(0, 3).map(game => `
            <div class="sidebar-score-card">
                <div class="sidebar-score-header">${formatShortDate(game.date)}</div>
                <div class="sidebar-score-teams">
                    <div class="sidebar-team">
                        <span>${game.awayTeam}</span>
                        <span class="score ${game.awayScore > game.homeScore ? 'winner' : ''}">${game.awayScore ?? '-'}</span>
                    </div>
                    <div class="sidebar-team">
                        <span>${game.homeTeam}</span>
                        <span class="score ${game.homeScore > game.awayScore ? 'winner' : ''}">${game.homeScore ?? '-'}</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p class="no-content">Unable to load scores</p>';
    }
}

// ============================================
// UTILITIES
// ============================================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: '2-digit'
    });
}

function formatShortDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit'
    });
}
