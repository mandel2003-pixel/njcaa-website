// ============================================
// NJCAA ADMIN PANEL - JAVASCRIPT
// ============================================

let currentUser = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupTabs();
    setupForms();
    loadAllData();
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
                window.location.href = '/';
                return;
            }
            showUserInfo();
        } else {
            window.location.href = '/auth/discord';
        }
    } catch (error) {
        window.location.href = '/';
    }
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
            
            // Update active states
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show tab content
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// ============================================
// DATA LOADING
// ============================================

async function loadAllData() {
    await Promise.all([
        loadArticles(),
        loadGames(),
        loadTeams(),
        loadSlides(),
        loadSettings()
    ]);
    updateStats();
}

async function loadArticles() {
    try {
        const res = await fetch('/api/articles');
        const articles = await res.json();
        renderArticlesTable(articles);
    } catch (error) {
        console.error('Error loading articles:', error);
    }
}

async function loadGames() {
    try {
        const res = await fetch('/api/games');
        const games = await res.json();
        renderGamesTable(games);
    } catch (error) {
        console.error('Error loading games:', error);
    }
}

async function loadTeams() {
    try {
        const res = await fetch('/api/teams');
        const teams = await res.json();
        renderTeamsTable(teams);
    } catch (error) {
        console.error('Error loading teams:', error);
    }
}

async function loadSlides() {
    try {
        const res = await fetch('/api/slides');
        const slides = await res.json();
        renderSlidesTable(slides);
    } catch (error) {
        console.error('Error loading slides:', error);
    }
}

async function loadSettings() {
    try {
        const res = await fetch('/api/settings');
        const settings = await res.json();
        document.getElementById('settingSiteName').value = settings.siteName || '';
        document.getElementById('settingHeroTitle').value = settings.heroTitle || '';
        document.getElementById('settingSeason').value = settings.season || '';
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function updateStats() {
    document.getElementById('statArticles').textContent = 
        document.querySelectorAll('#articlesTable tr').length;
    document.getElementById('statGames').textContent = 
        document.querySelectorAll('#gamesTable tr').length;
    document.getElementById('statTeams').textContent = 
        document.querySelectorAll('#teamsTable tr').length;
    document.getElementById('statSlides').textContent = 
        document.querySelectorAll('#slidesTable tr').length;
}

// ============================================
// TABLE RENDERERS
// ============================================

function renderArticlesTable(articles) {
    const tbody = document.getElementById('articlesTable');
    tbody.innerHTML = articles.map(article => `
        <tr>
            <td><img src="${article.image || '/placeholder.jpg'}" alt=""></td>
            <td>${article.title}</td>
            <td>${formatDate(article.date)}</td>
            <td>${article.author || 'Admin'}</td>
            <td class="actions">
                <button class="btn btn-sm btn-primary" onclick="editArticle('${article.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteArticle('${article.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderGamesTable(games) {
    const tbody = document.getElementById('gamesTable');
    tbody.innerHTML = games.map(game => `
        <tr>
            <td>${formatDate(game.date)}</td>
            <td>${game.awayTeam} @ ${game.homeTeam}</td>
            <td>${game.awayScore ?? '-'} - ${game.homeScore ?? '-'}</td>
            <td>${game.venue || '-'}</td>
            <td><span class="status-${game.status}">${game.status}</span></td>
            <td class="actions">
                <button class="btn btn-sm btn-primary" onclick="editGame('${game.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteGame('${game.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderTeamsTable(teams) {
    const tbody = document.getElementById('teamsTable');
    tbody.innerHTML = teams.map(team => `
        <tr>
            <td><img src="${team.logo || '/placeholder.jpg'}" alt="" style="width: 40px; height: 40px; object-fit: contain;"></td>
            <td>${team.name}</td>
            <td>${team.abbreviation || '-'}</td>
            <td>${team.conference || '-'}</td>
            <td class="actions">
                <button class="btn btn-sm btn-primary" onclick="editTeam('${team.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteTeam('${team.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderSlidesTable(slides) {
    const tbody = document.getElementById('slidesTable');
    tbody.innerHTML = slides.map(slide => `
        <tr>
            <td><img src="${slide.image}" alt=""></td>
            <td>${slide.title}</td>
            <td>${formatDate(slide.date)}</td>
            <td class="actions">
                <button class="btn btn-sm btn-danger" onclick="deleteSlide('${slide.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ============================================
// FORMS
// ============================================

function setupForms() {
    // Article Form
    document.getElementById('articleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const id = formData.get('id');
        
        try {
            const url = id ? `/api/admin/articles/${id}` : '/api/admin/articles';
            const method = id ? 'PUT' : 'POST';
            
            const res = await fetch(url, { method, body: formData });
            if (res.ok) {
                showSuccess('Article saved successfully!');
                closeModal('articleModal');
                e.target.reset();
                loadArticles();
                updateStats();
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            showError('Error saving article');
        }
    });

    // Game Form
    document.getElementById('gameForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const id = formData.get('id');
        const data = Object.fromEntries(formData);
        
        try {
            const url = id ? `/api/admin/games/${id}` : '/api/admin/games';
            const method = id ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                showSuccess('Game saved successfully!');
                closeModal('gameModal');
                e.target.reset();
                loadGames();
                updateStats();
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            showError('Error saving game');
        }
    });

    // Team Form
    document.getElementById('teamForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const id = formData.get('id');
        
        try {
            const url = id ? `/api/admin/teams/${id}` : '/api/admin/teams';
            const method = id ? 'PUT' : 'POST';
            
            const res = await fetch(url, { method, body: formData });
            if (res.ok) {
                showSuccess('Team saved successfully!');
                closeModal('teamModal');
                e.target.reset();
                loadTeams();
                updateStats();
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            showError('Error saving team');
        }
    });

    // Slide Form
    document.getElementById('slideForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const res = await fetch('/api/admin/slides', { method: 'POST', body: formData });
            if (res.ok) {
                showSuccess('Slide added successfully!');
                closeModal('slideModal');
                e.target.reset();
                loadSlides();
                updateStats();
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            showError('Error saving slide');
        }
    });

    // Settings Form
    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                showSuccess('Settings saved!');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            showError('Error saving settings');
        }
    });
}

// ============================================
// CRUD OPERATIONS
// ============================================

async function deleteArticle(id) {
    if (!confirm('Delete this article?')) return;
    try {
        await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
        showSuccess('Article deleted');
        loadArticles();
        updateStats();
    } catch (error) {
        showError('Error deleting article');
    }
}

async function deleteGame(id) {
    if (!confirm('Delete this game?')) return;
    try {
        await fetch(`/api/admin/games/${id}`, { method: 'DELETE' });
        showSuccess('Game deleted');
        loadGames();
        updateStats();
    } catch (error) {
        showError('Error deleting game');
    }
}

async function deleteTeam(id) {
    if (!confirm('Delete this team?')) return;
    try {
        await fetch(`/api/admin/teams/${id}`, { method: 'DELETE' });
        showSuccess('Team deleted');
        loadTeams();
        updateStats();
    } catch (error) {
        showError('Error deleting team');
    }
}

async function deleteSlide(id) {
    if (!confirm('Delete this slide?')) return;
    try {
        await fetch(`/api/admin/slides/${id}`, { method: 'DELETE' });
        showSuccess('Slide deleted');
        loadSlides();
        updateStats();
    } catch (error) {
        showError('Error deleting slide');
    }
}

function editArticle(id) {
    // Would load article data into form - simplified for now
    document.getElementById('articleId').value = id;
    openModal('articleModal');
}

function editGame(id) {
    document.getElementById('gameId').value = id;
    openModal('gameModal');
}

function editTeam(id) {
    document.getElementById('teamId').value = id;
    openModal('teamModal');
}

// ============================================
// MODALS
// ============================================

function openModal(id) {
    document.getElementById(id).classList.add('show');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
    // Reset hidden ID fields
    const form = document.querySelector(`#${id} form`);
    if (form) {
        const idField = form.querySelector('input[name="id"]');
        if (idField) idField.value = '';
    }
}

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});

// ============================================
// ALERTS
// ============================================

function showSuccess(message) {
    const alert = document.getElementById('successAlert');
    alert.textContent = message;
    alert.classList.add('show');
    setTimeout(() => alert.classList.remove('show'), 3000);
}

function showError(message) {
    const alert = document.getElementById('errorAlert');
    alert.textContent = message;
    alert.classList.add('show');
    setTimeout(() => alert.classList.remove('show'), 3000);
}

// ============================================
// UTILITIES
// ============================================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
    });
}
