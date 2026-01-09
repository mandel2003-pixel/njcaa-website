// ============================================
// TEAM PAGE JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupUserMenu();
    loadTeamData();
});

// Get team ID from URL
function getTeamId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Load team data
async function loadTeamData() {
    const teamId = getTeamId();
    
    if (!teamId) {
        window.location.href = '/teams.html';
        return;
    }
    
    try {
        // Fetch team
        const teamRes = await fetch(`/api/teams/${teamId}`);
        if (!teamRes.ok) {
            window.location.href = '/teams.html';
            return;
        }
        const team = await teamRes.json();
        
        // Fetch games
        const gamesRes = await fetch('/api/games');
        const allGames = await gamesRes.json();
        
        // Filter games for this team
        const teamGames = allGames.filter(g => 
            g.homeTeam === team.name || g.awayTeam === team.name
        );
        
        // Calculate record and stats
        const stats = calculateStats(team.name, teamGames);
        
        // Render everything
        renderTeamHero(team, stats);
        renderTeamInfo(team);
        renderStaff(team);
        renderSchedule(team, teamGames);
        renderResults(team, teamGames);
        renderSidebarStats(stats);
        
    } catch (error) {
        console.error('Error loading team:', error);
    }
}

// Calculate team statistics
function calculateStats(teamName, games) {
    let wins = 0, losses = 0, pointsFor = 0, pointsAgainst = 0;
    
    games.forEach(game => {
        if (game.status !== 'final') return;
        
        const isHome = game.homeTeam === teamName;
        const teamScore = isHome ? game.homeScore : game.awayScore;
        const oppScore = isHome ? game.awayScore : game.homeScore;
        
        pointsFor += teamScore || 0;
        pointsAgainst += oppScore || 0;
        
        if (teamScore > oppScore) {
            wins++;
        } else if (teamScore < oppScore) {
            losses++;
        }
    });
    
    return {
        wins,
        losses,
        pointsFor,
        pointsAgainst,
        diff: pointsFor - pointsAgainst
    };
}

// Render team hero section
function renderTeamHero(team, stats) {
    // Get initials
    const initials = team.abbreviation || team.name.split(' ').map(w => w[0]).join('').substring(0, 2);
    
    document.getElementById('teamInitials').textContent = initials;
    document.getElementById('teamName').textContent = team.name;
    document.getElementById('teamLocation').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${team.location || 'Location TBD'}`;
    document.getElementById('wins').textContent = stats.wins;
    document.getElementById('losses').textContent = stats.losses;
    document.getElementById('teamConference').textContent = team.conference || 'NJCAA';
    document.getElementById('breadcrumbTeam').textContent = team.name;
    
    // Update page title
    document.title = `${team.name} | NJCAA Roblox Football`;
}

// Render team info
function renderTeamInfo(team) {
    document.getElementById('infoFullName').textContent = team.name;
    document.getElementById('infoNickname').textContent = team.nickname || '-';
    document.getElementById('infoConference').textContent = team.conference || '-';
    document.getElementById('infoLocation').textContent = team.location || '-';
}

// Render staff
function renderStaff(team) {
    const adEl = document.getElementById('staffAD');
    const hcEl = document.getElementById('staffHC');
    
    if (team.athleticDirector && team.athleticDirector !== 'Available') {
        adEl.textContent = team.athleticDirector;
    } else {
        adEl.textContent = 'Position Open';
        adEl.classList.add('available');
    }
    
    if (team.headCoach && team.headCoach !== 'Available') {
        hcEl.textContent = team.headCoach;
    } else {
        hcEl.textContent = 'Position Open';
        hcEl.classList.add('available');
    }
}

// Render schedule
function renderSchedule(team, games) {
    const container = document.getElementById('scheduleList');
    
    const upcomingGames = games.filter(g => g.status === 'scheduled' || g.status === 'live');
    
    if (upcomingGames.length === 0) {
        container.innerHTML = '<p class="no-results">No upcoming games scheduled</p>';
        return;
    }
    
    container.innerHTML = upcomingGames.map(game => {
        const isHome = game.homeTeam === team.name;
        const opponent = isHome ? game.awayTeam : game.homeTeam;
        const location = isHome ? 'vs' : '@';
        const oppInitials = opponent.split(' ').map(w => w[0]).join('').substring(0, 2);
        
        return `
            <div class="schedule-game">
                <div class="game-opponent">
                    <div class="opponent-logo">${oppInitials}</div>
                    <div class="opponent-info">
                        <span class="opponent-name">${location} ${opponent}</span>
                        <span class="game-location">${game.venue || 'TBD'}</span>
                    </div>
                </div>
                <div class="game-details">
                    <div class="game-date">${formatDate(game.date)}</div>
                    <div class="game-time">${game.time || 'TBD'}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Render results
function renderResults(team, games) {
    const container = document.getElementById('resultsList');
    
    const completedGames = games.filter(g => g.status === 'final');
    
    if (completedGames.length === 0) {
        container.innerHTML = '<p class="no-results">No games played yet</p>';
        return;
    }
    
    container.innerHTML = completedGames.map(game => {
        const isHome = game.homeTeam === team.name;
        const opponent = isHome ? game.awayTeam : game.homeTeam;
        const teamScore = isHome ? game.homeScore : game.awayScore;
        const oppScore = isHome ? game.awayScore : game.homeScore;
        const won = teamScore > oppScore;
        const location = isHome ? 'vs' : '@';
        const oppInitials = opponent.split(' ').map(w => w[0]).join('').substring(0, 2);
        
        return `
            <div class="schedule-game">
                <div class="game-opponent">
                    <div class="opponent-logo">${oppInitials}</div>
                    <div class="opponent-info">
                        <span class="opponent-name">${location} ${opponent}</span>
                        <span class="game-location">${formatDate(game.date)}</span>
                    </div>
                </div>
                <div class="game-details">
                    <div class="game-result ${won ? 'win' : 'loss'}">
                        ${won ? 'W' : 'L'} ${teamScore}-${oppScore}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render sidebar stats
function renderSidebarStats(stats) {
    document.getElementById('statRecord').textContent = `${stats.wins}-${stats.losses}`;
    document.getElementById('statPointsFor').textContent = stats.pointsFor;
    document.getElementById('statPointsAgainst').textContent = stats.pointsAgainst;
    document.getElementById('statDiff').textContent = (stats.diff >= 0 ? '+' : '') + stats.diff;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}

// Auth functions (shared)
let currentUser = null;

async function checkAuth() {
    try {
        const res = await fetch('/auth/me');
        if (res.ok) {
            currentUser = await res.json();
            showLoggedInState();
        }
    } catch (error) {
        // Not logged in
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
