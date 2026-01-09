// ============================================
// NJCAA WEBSITE - MAIN JAVASCRIPT
// ============================================

// State
let currentSlide = 0;
let slides = [];
let isPaused = false;
let sliderInterval;
let currentUser = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupUserMenu();
    
    // Only load these if on homepage
    if (document.getElementById('slides')) {
        loadSlides();
    }
    if (document.getElementById('newsGrid')) {
        loadNews();
    }
    if (document.getElementById('scoreboardGrid')) {
        loadScoreboard();
    }
});

// ============================================
// AUTHENTICATION
// ============================================

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
    const loggedOut = document.getElementById('loggedOut');
    const loggedIn = document.getElementById('loggedIn');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const adminLink = document.getElementById('adminLink');
    
    if (loggedOut) loggedOut.style.display = 'none';
    if (loggedIn) loggedIn.style.display = 'block';
    
    if (userAvatar && currentUser) {
        const avatar = currentUser.avatar
            ? `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';
        userAvatar.src = avatar;
    }
    
    if (userName && currentUser) {
        userName.textContent = currentUser.username;
    }
    
    if (adminLink && currentUser?.isAdmin) {
        adminLink.style.display = 'flex';
    }
}

function showLoggedOutState() {
    const loggedOut = document.getElementById('loggedOut');
    const loggedIn = document.getElementById('loggedIn');
    
    if (loggedOut) loggedOut.style.display = 'block';
    if (loggedIn) loggedIn.style.display = 'none';
}

function setupUserMenu() {
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
// SLIDER
// ============================================

async function loadSlides() {
    try {
        const res = await fetch('/api/slides');
        slides = await res.json();
        
        if (slides.length === 0) {
            slides = [{
                id: '1',
                image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=1920',
                title: 'Welcome to NJCAA Roblox Football',
                date: new Date().toISOString()
            }];
        }
        
        renderSlides();
        startSlider();
    } catch (error) {
        console.error('Error loading slides:', error);
    }
}

function renderSlides() {
    const container = document.getElementById('slides');
    const dotsContainer = document.getElementById('sliderDots');
    
    if (!container || !dotsContainer) return;
    
    container.innerHTML = slides.map((slide, index) => `
        <div class="slide ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})">
            <img src="${slide.image}" alt="${slide.title}">
        </div>
    `).join('');
    
    dotsContainer.innerHTML = slides.map((_, index) => `
        <div class="slider-dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>
    `).join('');
    
    updateSlideInfo();
}

function updateSlideInfo() {
    const slide = slides[currentSlide];
    const slideDate = document.getElementById('slideDate');
    const slideTitle = document.getElementById('slideTitle');
    
    if (slide && slideDate && slideTitle) {
        slideDate.textContent = formatDate(slide.date);
        slideTitle.textContent = slide.title;
        
        // Update active states
        document.querySelectorAll('.slide').forEach((el, i) => {
            el.classList.toggle('active', i === currentSlide);
        });
        document.querySelectorAll('.slider-dot').forEach((el, i) => {
            el.classList.toggle('active', i === currentSlide);
        });
    }
}

function changeSlide(direction) {
    currentSlide += direction;
    if (currentSlide >= slides.length) currentSlide = 0;
    if (currentSlide < 0) currentSlide = slides.length - 1;
    updateSlideInfo();
}

function goToSlide(index) {
    currentSlide = index;
    updateSlideInfo();
}

function togglePause() {
    isPaused = !isPaused;
    const icon = document.getElementById('pauseIcon');
    if (icon) {
        icon.className = isPaused ? 'fas fa-play' : 'fas fa-pause';
    }
    
    if (isPaused) {
        clearInterval(sliderInterval);
    } else {
        startSlider();
    }
}

function startSlider() {
    if (sliderInterval) clearInterval(sliderInterval);
    sliderInterval = setInterval(() => {
        if (!isPaused) changeSlide(1);
    }, 5000);
}

// ============================================
// NEWS
// ============================================

async function loadNews() {
    try {
        const res = await fetch('/api/articles');
        const articles = await res.json();
        renderNews(articles.slice(0, 3));
    } catch (error) {
        console.error('Error loading news:', error);
    }
}

function renderNews(articles) {
    const container = document.getElementById('newsGrid');
    
    if (!container) return;
    
    if (articles.length === 0) {
        container.innerHTML = `
            <div class="news-card">
                <div class="news-card-image">
                    <img src="https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800" alt="News">
                </div>
                <div class="news-card-content">
                    <p class="news-card-date">January 9, 2026</p>
                    <h3 class="news-card-title">Welcome to NJCAA Roblox Football</h3>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = articles.map(article => `
        <div class="news-card" onclick="viewArticle('${article.id}')">
            <div class="news-card-image">
                <img src="${article.image || 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800'}" alt="${article.title}">
            </div>
            <div class="news-card-content">
                <p class="news-card-date">${formatDate(article.date)}</p>
                <h3 class="news-card-title">${article.title}</h3>
            </div>
        </div>
    `).join('');
}

function viewArticle(id) {
    window.location.href = `/article.html?id=${id}`;
}

// ============================================
// SCOREBOARD
// ============================================

async function loadScoreboard() {
    try {
        const res = await fetch('/api/games');
        const games = await res.json();
        renderScoreboard(games.slice(0, 6));
    } catch (error) {
        console.error('Error loading scoreboard:', error);
    }
}

function renderScoreboard(games) {
    const container = document.getElementById('scoreboardGrid');
    
    if (!container) return;
    
    if (games.length === 0) {
        container.innerHTML = `
            <div class="score-card">
                <div class="score-card-header">
                    <span>🏈 Football</span>
                    <span>No Games Scheduled</span>
                </div>
                <div class="score-card-body">
                    <p style="text-align: center; padding: 20px; color: #666;">Check back soon for upcoming games!</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = games.map(game => `
        <div class="score-card">
            <div class="score-card-header">
                <span>🏈 Football</span>
                <span>${formatShortDate(game.date)} ${game.status === 'final' ? 'Final' : game.time || ''}</span>
            </div>
            <div class="score-card-body">
                <div class="score-team">
                    <div class="team-info">
                        <span class="team-name">${game.awayTeam}</span>
                    </div>
                    <span class="team-score ${game.status === 'final' && game.awayScore > game.homeScore ? 'winner' : ''}">${game.awayScore ?? '-'}</span>
                </div>
                <div class="score-team">
                    <div class="team-info">
                        <span class="team-location">at</span>
                        <span class="team-name">${game.homeTeam}</span>
                    </div>
                    <span class="team-score ${game.status === 'final' && game.homeScore > game.awayScore ? 'winner' : ''}">${game.homeScore ?? '-'}</span>
                </div>
                ${game.venue ? `<p class="score-venue">${game.venue}</p>` : ''}
            </div>
        </div>
    `).join('');
}

// ============================================
// UTILITIES
// ============================================

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: '2-digit'
    });
}

function formatShortDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit'
    });
}
