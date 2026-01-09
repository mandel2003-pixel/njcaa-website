// ============================================
// NJCAA WEBSITE - PAGES JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Only setup auth if not already done by main.js
    if (typeof window.currentUserPages === 'undefined') {
        checkAuthPages();
        setupUserMenuPages();
    }
    
    // Page-specific initialization
    const path = window.location.pathname;
    
    if (path.includes('news.html')) {
        loadNewsPage();
    } else if (path.includes('teams.html')) {
        // Teams are hardcoded in HTML for now
    } else if (path.includes('championships.html')) {
        // Championships are hardcoded in HTML for now
    } else if (path.includes('about.html')) {
        // About is static
    } else if (path.includes('membership.html')) {
        // Membership is static
    }
    
    // Load sidebar scores on pages that have sidebar
    if (document.getElementById('sidebarScores')) {
        loadSidebarScores();
    }
});

// ============================================
// AUTHENTICATION (for pages without main.js)
// ============================================

window.currentUserPages = null;

async function checkAuthPages() {
    try {
        const res = await fetch('/auth/me');
        if (res.ok) {
            window.currentUserPages = await res.json();
            showLoggedInStatePages();
        } else {
            showLoggedOutStatePages();
        }
    } catch (error) {
        showLoggedOutStatePages();
    }
}

function showLoggedInStatePages() {
    const loggedOut = document.getElementById('loggedOut');
    const loggedIn = document.getElementById('loggedIn');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const adminLink = document.getElementById('adminLink');
    
    if (loggedOut) loggedOut.style.display = 'none';
    if (loggedIn) loggedIn.style.display = 'block';
    
    if (userAvatar && window.currentUserPages) {
        const avatar = window.currentUserPages.avatar
            ? `https://cdn.discordapp.com/avatars/${window.currentUserPages.id}/${window.currentUserPages.avatar}.png`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';
        userAvatar.src = avatar;
    }
    
    if (userName && window.currentUserPages) {
        userName.textContent = window.currentUserPages.username;
    }
    
    if (adminLink && window.currentUserPages?.isAdmin) {
        adminLink.style.display = 'flex';
    }
}

function showLoggedOutStatePages() {
    const loggedOut = document.getElementById('loggedOut');
    const loggedIn = document.getElementById('loggedIn');
    
    if (loggedOut) loggedOut.style.display = 'block';
    if (loggedIn) loggedIn.style.display = 'none';
}

function setupUserMenuPages() {
    const btn = document.getElementById('userBtn');
    const dropdown = document.getElementById('userDropdown');
    
    if (!btn || !dropdown) return;
    
    btn.addEventListener('click', () => {
        dropdown.classList.toggle('show');
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu')) {
            dropdown.classList.remove('show');
        }
    });
}

// ============================================
// NEWS PAGE
// ============================================

async function loadNewsPage() {
    try {
        const res = await fetch('/api/articles');
        const articles = await res.json();
        
        // Featured article
        const featuredContainer = document.getElementById('featuredArticle');
        if (articles.length > 0 && featuredContainer) {
            renderFeaturedArticle(articles[0]);
            renderNewsGrid(articles.slice(1));
        } else if (featuredContainer) {
            featuredContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">No articles yet. Check back soon!</p>';
        }
        
        // Setup filter buttons
        setupNewsFilters();
    } catch (error) {
        console.error('Error loading news:', error);
    }
}

function renderFeaturedArticle(article) {
    const container = document.getElementById('featuredArticle');
    if (!container) return;
    
    container.innerHTML = `
        <div class="featured-image">
            <img src="${article.image || 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800'}" alt="${article.title}">
        </div>
        <div class="featured-content">
            <span class="featured-badge">FEATURED</span>
            <p class="featured-date">${formatDatePages(article.date)}</p>
            <h2 class="featured-title">${article.title}</h2>
            <p class="featured-excerpt">${article.content?.substring(0, 200)}...</p>
            <a href="/article.html?id=${article.id}" class="featured-link">Read More <i class="fas fa-arrow-right"></i></a>
        </div>
    `;
}

function renderNewsGrid(articles) {
    const container = document.getElementById('newsGrid');
    if (!container) return;
    
    if (articles.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">No more articles.</p>';
        return;
    }
    
    container.innerHTML = articles.map(article => `
        <div class="news-item" onclick="window.location.href='/article.html?id=${article.id}'">
            <div class="news-item-image">
                <img src="${article.image || 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800'}" alt="${article.title}">
            </div>
            <div class="news-item-content">
                <p class="news-item-date">${formatDatePages(article.date)}</p>
                <h3 class="news-item-title">${article.title}</h3>
                <p class="news-item-excerpt">${article.content?.substring(0, 100)}...</p>
            </div>
        </div>
    `).join('');
}

function setupNewsFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Filter logic would go here
        });
    });
}

// ============================================
// SIDEBAR SCORES
// ============================================

async function loadSidebarScores() {
    try {
        const res = await fetch('/api/games');
        const games = await res.json();
        renderSidebarScores(games.slice(0, 3));
    } catch (error) {
        console.error('Error loading sidebar scores:', error);
    }
}

function renderSidebarScores(games) {
    const container = document.getElementById('sidebarScores');
    if (!container) return;
    
    if (games.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No games scheduled</p>';
        return;
    }
    
    container.innerHTML = games.map(game => `
        <div class="sidebar-score-item">
            <div class="sidebar-score-header">
                <span>${formatShortDatePages(game.date)}</span>
                <span class="status-${game.status}">${game.status === 'final' ? 'Final' : game.status}</span>
            </div>
            <div class="sidebar-score-teams">
                <div class="sidebar-team">
                    <span>${game.awayTeam}</span>
                    <span>${game.awayScore ?? '-'}</span>
                </div>
                <div class="sidebar-team">
                    <span>${game.homeTeam}</span>
                    <span>${game.homeScore ?? '-'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// UTILITIES
// ============================================

function formatDatePages(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: '2-digit'
    });
}

function formatShortDatePages(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit'
    });
}
