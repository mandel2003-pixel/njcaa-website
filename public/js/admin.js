// ============================================
// NJCAA ADMIN PANEL - FULLY FUNCTIONAL
// ============================================

let currentUser = null;
let teamsData = [];
let gamesData = [];
let articlesData = [];
let slidesData = [];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupTabs();
    setupForms();
});

// ============================================
// AUTHENTICATION
// ============================================

async function checkAuth() {
    try {
        const res = await fetch('/auth/me');
        if (res.ok) {
            currentUser = await res.json();
            if (!currentUser.isAdmin) {
                showLoginRequired('You do not have admin access. Please contact a league administrator.');
                return;
            }
            document.getElementById('adminContent').style.display = 'block';
            document.getElementById('loginRequired').style.display = 'none';
            showUserInfo();
            loadAllData();
        } else {
            showLoginRequired('Please log in with Discord to access the admin panel.');
        }
    } catch (error) {
        console.error('Auth error:', error);
        showLoginRequired('Connection error. Please try again.');
    }
}

function showLoginRequired(message) {
    document.getElementById('adminContent').style.display = 'none';
    document.getElementById('loginRequired').style.display = 'flex';
    document.getElementById('loginMessage').textContent = message;
}

function showUserInfo() {
    const avatar = currentUser.avatar
        ? `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png`
        : 'https://cdn.discordapp.com/embed/avatars/0.png';
    
    document.getElementById('adminAvatar').src = avatar;
    document.getElementById('adminName').textContent = currentUser.username;
}

// ============================================
// TABS
// ============================================

function setupTabs() {
    const navLinks = document.querySelectorAll('.sidebar-nav a[data-tab]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.dataset.tab;
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// ============================================
// DATA LOADING
// ============================================

async function loadAllData() {
    try {
        await Promise.all([
            loadTeams(),
            loadGames(),
            loadArticles(),
            loadSlides(),
            loadSettings()
        ]);
        updateStats();
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load data. Please refresh.');
    }
}

async function loadTeams() {
    try {
        const res = await fetch('/api/teams');
        if (!res.ok) throw new Error('Failed to fetch teams');
        teamsData = await res.json();
        renderTeamsTable();
        populateTeamSelects();
    } catch (error) {
        console.error('Error loading teams:', error);
        document.getElementById('teamsTable').innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-exclamation-circle"></i><h4>Failed to load teams</h4></td></tr>';
    }
}

async function loadGames() {
    try {
        const res = await fetch('/api/games');
        if (!res.ok) throw new Error('Failed to fetch games');
        gamesData = await res.json();
        renderGamesTable();
    } catch (error) {
        console.error('Error loading games:', error);
        document.getElementById('gamesTable').innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-exclamation-circle"></i><h4>Failed to load games</h4></td></tr>';
    }
}

async function loadArticles() {
    try {
        const res = await fetch('/api/articles');
        if (!res.ok) throw new Error('Failed to fetch articles');
        articlesData = await res.json();
        renderArticlesTable();
    } catch (error) {
        console.error('Error loading articles:', error);
        document.getElementById('articlesTable').innerHTML = '<tr><td colspan="4" class="empty-state"><i class="fas fa-exclamation-circle"></i><h4>Failed to load articles</h4></td></tr>';
    }
}

async function loadSlides() {
    try {
        const res = await fetch('/api/slides');
        if (!res.ok) throw new Error('Failed to fetch slides');
        slidesData = await res.json();
        renderSlidesTable();
    } catch (error) {
        console.error('Error loading slides:', error);
        document.getElementById('slidesTable').innerHTML = '<tr><td colspan="4" class="empty-state"><i class="fas fa-exclamation-circle"></i><h4>Failed to load slides</h4></td></tr>';
    }
}

async function loadSettings() {
    try {
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error('Failed to fetch settings');
        const settings = await res.json();
        document.getElementById('settingSiteName').value = settings.siteName || '';
        document.getElementById('settingTagline').value = settings.tagline || '';
        document.getElementById('settingSeason').value = settings.season || '';
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function updateStats() {
    document.getElementById('statTeams').textContent = teamsData.length;
    document.getElementById('statGames').textContent = gamesData.length;
    document.getElementById('statArticles').textContent = articlesData.length;
    document.getElementById('statSlides').textContent = slidesData.length;
}

// ============================================
// TABLE RENDERERS
// ============================================

function renderTeamsTable() {
    const tbody = document.getElementById('teamsTable');
    
    if (teamsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h4>No teams yet</h4>
                        <p>Click "Add Team" to create your first team</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = teamsData.map(team => {
        const initials = getInitials(team.name);
        const regionClass = team.conference?.includes('East') ? 'badge-east' : 'badge-south';
        
        return `
            <tr>
                <td>
                    <div class="item-row">
                        <div class="item-avatar">
                            ${team.logo ? `<img src="${team.logo}" alt="${team.name}">` : initials}
                        </div>
                        <div class="item-info">
                            <h4>${team.name}</h4>
                            <p>${team.nickname || team.abbreviation || ''}</p>
                        </div>
                    </div>
                </td>
                <td><span class="badge ${regionClass}">${team.conference || 'Unassigned'}</span></td>
                <td>${team.location || '-'}</td>
                <td>${team.athleticDirector || '<em style="color: var(--gray-400)">Available</em>'}</td>
                <td>${team.headCoach || '<em style="color: var(--gray-400)">Available</em>'}</td>
                <td>
                    <div class="actions">
                        <button class="btn btn-sm btn-outline" onclick="editTeam('${team.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTeam('${team.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderGamesTable() {
    const tbody = document.getElementById('gamesTable');
    
    if (gamesData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="fas fa-football"></i>
                        <h4>No games scheduled</h4>
                        <p>Click "Add Game" to schedule a game</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = gamesData.map(game => {
        const statusClass = `badge-${game.status}`;
        const score = game.status === 'final' || game.status === 'live' 
            ? `${game.homeScore || 0} - ${game.awayScore || 0}`
            : '-';
        const weekBadge = game.week ? `<small style="color: var(--gray-500)">Week ${game.week}</small><br>` : '';
        const streamLink = game.streamUrl && game.status === 'live' 
            ? `<br><a href="${game.streamUrl}" target="_blank" style="color: var(--danger); font-size: 12px;"><i class="fas fa-tv"></i> Stream</a>` 
            : '';
        
        return `
            <tr${game.status === 'live' ? ' style="background: rgba(239, 68, 68, 0.05);"' : ''}>
                <td>${weekBadge}${formatDate(game.date)}${game.time ? `<br><small style="color: var(--gray-500)">${game.time}</small>` : ''}</td>
                <td>
                    <strong>${game.awayTeam}</strong> @ <strong>${game.homeTeam}</strong>${streamLink}
                </td>
                <td><strong>${score}</strong></td>
                <td>${game.venue || '-'}</td>
                <td><span class="badge ${statusClass}">${game.status === 'live' ? '🔴 LIVE' : capitalizeFirst(game.status)}</span></td>
                <td>
                    <div class="actions">
                        <button class="btn btn-sm btn-outline" onclick="editGame('${game.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteGame('${game.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderArticlesTable() {
    const tbody = document.getElementById('articlesTable');
    
    if (articlesData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty-state">
                        <i class="fas fa-newspaper"></i>
                        <h4>No articles yet</h4>
                        <p>Click "Add Article" to post news</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = articlesData.map(article => `
        <tr>
            <td>
                <div class="item-row">
                    <div class="item-avatar" style="border-radius: 8px; width: 60px; height: 40px;">
                        ${article.image ? `<img src="${article.image}" alt="" style="border-radius: 8px;">` : '<i class="fas fa-image"></i>'}
                    </div>
                    <div class="item-info">
                        <h4>${article.title}</h4>
                        <p>${truncate(article.content, 60)}</p>
                    </div>
                </div>
            </td>
            <td>${article.author || 'Admin'}</td>
            <td>${formatDate(article.date)}</td>
            <td>
                <div class="actions">
                    <button class="btn btn-sm btn-outline" onclick="editArticle('${article.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteArticle('${article.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderSlidesTable() {
    const tbody = document.getElementById('slidesTable');
    
    if (slidesData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty-state">
                        <i class="fas fa-images"></i>
                        <h4>No slides yet</h4>
                        <p>Click "Add Slide" to add hero images</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = slidesData.map(slide => `
        <tr>
            <td>
                <img src="${slide.image}" alt="" style="width: 120px; height: 60px; object-fit: cover; border-radius: 8px;">
            </td>
            <td><strong>${slide.title}</strong></td>
            <td>${slide.subtitle || '-'}</td>
            <td>
                <div class="actions">
                    <button class="btn btn-sm btn-danger" onclick="deleteSlide('${slide.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ============================================
// POPULATE SELECTS
// ============================================

function populateTeamSelects() {
    const homeSelect = document.getElementById('gameHomeTeam');
    const awaySelect = document.getElementById('gameAwayTeam');
    
    const options = '<option value="">Select Team</option>' + 
        teamsData.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
    
    homeSelect.innerHTML = options;
    awaySelect.innerHTML = options;
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function openModal(id) {
    document.getElementById(id).classList.add('show');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
    // Reset form
    const form = document.querySelector(`#${id} form`);
    if (form) form.reset();
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// ============================================
// TEAM CRUD
// ============================================

function openTeamModal(team = null) {
    document.getElementById('teamModalTitle').textContent = team ? 'Edit Team' : 'Add Team';
    
    if (team) {
        document.getElementById('teamId').value = team.id;
        document.getElementById('teamName').value = team.name || '';
        document.getElementById('teamAbbr').value = team.abbreviation || '';
        document.getElementById('teamNickname').value = team.nickname || '';
        document.getElementById('teamConference').value = team.conference || '';
        document.getElementById('teamLocation').value = team.location || '';
        document.getElementById('teamAD').value = team.athleticDirector || '';
        document.getElementById('teamHC').value = team.headCoach || '';
        document.getElementById('teamLogo').value = team.logo || '';
    } else {
        document.getElementById('teamForm').reset();
        document.getElementById('teamId').value = '';
    }
    
    openModal('teamModal');
}

function editTeam(id) {
    const team = teamsData.find(t => t.id === id);
    if (team) {
        openTeamModal(team);
    } else {
        showError('Team not found');
    }
}

async function deleteTeam(id) {
    const team = teamsData.find(t => t.id === id);
    if (!confirm(`Are you sure you want to delete "${team?.name}"?`)) return;
    
    try {
        const res = await fetch(`/api/admin/teams/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
        
        showSuccess('Team deleted successfully');
        await loadTeams();
        updateStats();
    } catch (error) {
        showError('Error deleting team');
    }
}

// ============================================
// GAME CRUD
// ============================================

function openGameModal(game = null) {
    document.getElementById('gameModalTitle').textContent = game ? 'Edit Game' : 'Add Game';
    
    if (game) {
        document.getElementById('gameId').value = game.id;
        document.getElementById('gameHomeTeam').value = game.homeTeam || '';
        document.getElementById('gameAwayTeam').value = game.awayTeam || '';
        document.getElementById('gameDate').value = game.date ? game.date.split('T')[0] : '';
        document.getElementById('gameTime').value = game.time || '';
        document.getElementById('gameVenue').value = game.venue || '';
        document.getElementById('gameHomeScore').value = game.homeScore ?? '';
        document.getElementById('gameAwayScore').value = game.awayScore ?? '';
        document.getElementById('gameWeek').value = game.week ?? '';
        document.getElementById('gameStatus').value = game.status || 'scheduled';
        document.getElementById('gameStreamUrl').value = game.streamUrl || '';
    } else {
        document.getElementById('gameForm').reset();
        document.getElementById('gameId').value = '';
    }
    
    openModal('gameModal');
}

function editGame(id) {
    const game = gamesData.find(g => g.id === id);
    if (game) {
        openGameModal(game);
    } else {
        showError('Game not found');
    }
}

async function deleteGame(id) {
    if (!confirm('Are you sure you want to delete this game?')) return;
    
    try {
        const res = await fetch(`/api/admin/games/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
        
        showSuccess('Game deleted successfully');
        await loadGames();
        updateStats();
    } catch (error) {
        showError('Error deleting game');
    }
}

// ============================================
// ARTICLE CRUD
// ============================================

function openArticleModal(article = null) {
    document.getElementById('articleModalTitle').textContent = article ? 'Edit Article' : 'Add Article';
    
    if (article) {
        document.getElementById('articleId').value = article.id;
        document.getElementById('articleTitle').value = article.title || '';
        document.getElementById('articleContent').value = article.content || '';
        document.getElementById('articleImage').value = article.image || '';
    } else {
        document.getElementById('articleForm').reset();
        document.getElementById('articleId').value = '';
    }
    
    openModal('articleModal');
}

function editArticle(id) {
    const article = articlesData.find(a => a.id === id);
    if (article) {
        openArticleModal(article);
    } else {
        showError('Article not found');
    }
}

async function deleteArticle(id) {
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
        const res = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
        
        showSuccess('Article deleted successfully');
        await loadArticles();
        updateStats();
    } catch (error) {
        showError('Error deleting article');
    }
}

// ============================================
// SLIDE CRUD
// ============================================

function openSlideModal() {
    document.getElementById('slideForm').reset();
    openModal('slideModal');
}

async function deleteSlide(id) {
    if (!confirm('Are you sure you want to delete this slide?')) return;
    
    try {
        const res = await fetch(`/api/admin/slides/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
        
        showSuccess('Slide deleted successfully');
        await loadSlides();
        updateStats();
    } catch (error) {
        showError('Error deleting slide');
    }
}

// ============================================
// FORM HANDLERS
// ============================================

function setupForms() {
    // Team Form
    document.getElementById('teamForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('teamId').value;
        const data = {
            name: document.getElementById('teamName').value,
            abbreviation: document.getElementById('teamAbbr').value,
            nickname: document.getElementById('teamNickname').value,
            conference: document.getElementById('teamConference').value,
            location: document.getElementById('teamLocation').value,
            athleticDirector: document.getElementById('teamAD').value,
            headCoach: document.getElementById('teamHC').value,
            logo: document.getElementById('teamLogo').value
        };
        
        try {
            const url = id ? `/api/admin/teams/${id}` : '/api/admin/teams';
            const method = id ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!res.ok) throw new Error('Failed to save');
            
            showSuccess(id ? 'Team updated successfully' : 'Team created successfully');
            closeModal('teamModal');
            await loadTeams();
            updateStats();
        } catch (error) {
            showError('Error saving team');
        }
    });

    // Game Form
    document.getElementById('gameForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('gameId').value;
        const data = {
            homeTeam: document.getElementById('gameHomeTeam').value,
            awayTeam: document.getElementById('gameAwayTeam').value,
            date: document.getElementById('gameDate').value,
            time: document.getElementById('gameTime').value,
            venue: document.getElementById('gameVenue').value,
            homeScore: document.getElementById('gameHomeScore').value || null,
            awayScore: document.getElementById('gameAwayScore').value || null,
            week: document.getElementById('gameWeek').value || 1,
            status: document.getElementById('gameStatus').value,
            streamUrl: document.getElementById('gameStreamUrl').value || null
        };
        
        try {
            const url = id ? `/api/admin/games/${id}` : '/api/admin/games';
            const method = id ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!res.ok) throw new Error('Failed to save');
            
            showSuccess(id ? 'Game updated successfully' : 'Game scheduled successfully');
            closeModal('gameModal');
            await loadGames();
            updateStats();
        } catch (error) {
            showError('Error saving game');
        }
    });

    // Article Form
    document.getElementById('articleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('articleId').value;
        const data = {
            title: document.getElementById('articleTitle').value,
            content: document.getElementById('articleContent').value,
            image: document.getElementById('articleImage').value
        };
        
        try {
            const url = id ? `/api/admin/articles/${id}` : '/api/admin/articles';
            const method = id ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!res.ok) throw new Error('Failed to save');
            
            showSuccess(id ? 'Article updated successfully' : 'Article published successfully');
            closeModal('articleModal');
            await loadArticles();
            updateStats();
        } catch (error) {
            showError('Error saving article');
        }
    });

    // Slide Form
    document.getElementById('slideForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            title: document.getElementById('slideTitle').value,
            subtitle: document.getElementById('slideSubtitle').value,
            image: document.getElementById('slideImage').value
        };
        
        try {
            const res = await fetch('/api/admin/slides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!res.ok) throw new Error('Failed to save');
            
            showSuccess('Slide added successfully');
            closeModal('slideModal');
            await loadSlides();
            updateStats();
        } catch (error) {
            showError('Error saving slide');
        }
    });

    // Settings Form
    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            siteName: document.getElementById('settingSiteName').value,
            tagline: document.getElementById('settingTagline').value,
            season: document.getElementById('settingSeason').value
        };
        
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!res.ok) throw new Error('Failed to save');
            
            showSuccess('Settings saved successfully');
        } catch (error) {
            showError('Error saving settings');
        }
    });
}

// ============================================
// ALERTS
// ============================================

function showSuccess(message) {
    const alert = document.getElementById('successAlert');
    document.getElementById('successMessage').textContent = message;
    alert.classList.add('show');
    setTimeout(() => alert.classList.remove('show'), 4000);
}

function showError(message) {
    const alert = document.getElementById('errorAlert');
    document.getElementById('errorMessage').textContent = message;
    alert.classList.add('show');
    setTimeout(() => alert.classList.remove('show'), 4000);
}

// ============================================
// UTILITIES
// ============================================

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncate(str, length) {
    if (!str) return '';
    return str.length > length ? str.substring(0, length) + '...' : str;
}
