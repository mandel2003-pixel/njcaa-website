require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'njcaa-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

// File upload config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Data storage paths
const DATA_DIR = './data';
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const dataFiles = {
    articles: path.join(DATA_DIR, 'articles.json'),
    games: path.join(DATA_DIR, 'games.json'),
    teams: path.join(DATA_DIR, 'teams.json'),
    slides: path.join(DATA_DIR, 'slides.json'),
    settings: path.join(DATA_DIR, 'settings.json')
};

// Initialize data files
function initDataFiles() {
    const defaults = {
        articles: [],
        games: [],
        teams: [],
        slides: [
            {
                id: '1',
                image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=1920',
                title: 'Welcome to NJCAA Football',
                date: new Date().toISOString()
            }
        ],
        settings: {
            siteName: 'NJCAA Football',
            heroTitle: 'NJCAA FOOTBALL',
            season: '2025-2026'
        }
    };

    for (const [key, filePath] of Object.entries(dataFiles)) {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaults[key], null, 2));
        }
    }
}
initDataFiles();

// Helper functions
function readData(file) {
    try {
        return JSON.parse(fs.readFileSync(dataFiles[file], 'utf8'));
    } catch {
        return [];
    }
}

function writeData(file, data) {
    fs.writeFileSync(dataFiles[file], JSON.stringify(data, null, 2));
}

// Discord OAuth URLs
const DISCORD_API = 'https://discord.com/api/v10';
const OAUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;

// Check if user is admin in the guild
async function checkAdmin(accessToken) {
    try {
        // Get user's guilds
        const guildsRes = await fetch(`${DISCORD_API}/users/@me/guilds`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const guilds = await guildsRes.json();
        
        // Find our guild
        const guild = guilds.find(g => g.id === process.env.DISCORD_GUILD_ID);
        if (!guild) return false;
        
        // Check for admin permission (0x8 is ADMINISTRATOR)
        return (guild.permissions & 0x8) === 0x8;
    } catch (error) {
        console.error('Admin check error:', error);
        return false;
    }
}

// Send Discord webhook notification
async function sendDiscordNotification(type, data) {
    try {
        const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
        const client = new Client({ intents: [GatewayIntentBits.Guilds] });
        
        await client.login(process.env.DISCORD_BOT_TOKEN);
        
        const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
        const channel = guild.channels.cache.find(c => c.name === process.env.DISCORD_WEBHOOK_CHANNEL);
        
        if (!channel) {
            client.destroy();
            return;
        }

        let embed;
        if (type === 'article') {
            embed = new EmbedBuilder()
                .setColor(0x003366)
                .setTitle(`📰 ${data.title}`)
                .setDescription(data.content?.substring(0, 200) + '...')
                .setImage(data.image)
                .setFooter({ text: 'NJCAA Website Update' })
                .setTimestamp();
        } else if (type === 'game') {
            embed = new EmbedBuilder()
                .setColor(0x003366)
                .setTitle('🏈 Game Scheduled')
                .addFields(
                    { name: 'Matchup', value: `${data.homeTeam} vs ${data.awayTeam}`, inline: true },
                    { name: 'Date', value: data.date, inline: true },
                    { name: 'Venue', value: data.venue || 'TBD', inline: true }
                )
                .setFooter({ text: 'NJCAA Website Update' })
                .setTimestamp();
        } else if (type === 'score') {
            embed = new EmbedBuilder()
                .setColor(0x003366)
                .setTitle('🏈 Final Score')
                .setDescription(`**${data.homeTeam}** ${data.homeScore} - ${data.awayScore} **${data.awayTeam}**`)
                .setFooter({ text: 'NJCAA Website Update' })
                .setTimestamp();
        }

        if (embed) {
            await channel.send({ embeds: [embed] });
        }
        
        client.destroy();
    } catch (error) {
        console.error('Discord notification error:', error);
    }
}

// ============================================
// AUTH ROUTES
// ============================================

app.get('/auth/discord', (req, res) => {
    res.redirect(OAUTH_URL);
});

app.get('/auth/discord/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect('/?error=no_code');

    try {
        // Exchange code for token
        const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: process.env.DISCORD_REDIRECT_URI
            })
        });
        const tokens = await tokenRes.json();

        if (!tokens.access_token) {
            return res.redirect('/?error=token_failed');
        }

        // Get user info
        const userRes = await fetch(`${DISCORD_API}/users/@me`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        const user = await userRes.json();

        // Check admin status
        const isAdmin = await checkAdmin(tokens.access_token);

        // Store in session
        req.session.user = {
            id: user.id,
            username: user.username,
            discriminator: user.discriminator,
            avatar: user.avatar,
            isAdmin
        };
        req.session.accessToken = tokens.access_token;

        res.redirect(isAdmin ? '/admin.html' : '/');
    } catch (error) {
        console.error('OAuth error:', error);
        res.redirect('/?error=auth_failed');
    }
});

app.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/auth/me', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
});

// Admin middleware
function requireAdmin(req, res, next) {
    if (req.session.user?.isAdmin) {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
}

// ============================================
// PUBLIC API ROUTES
// ============================================

app.get('/api/articles', (req, res) => {
    const articles = readData('articles');
    res.json(articles.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

app.get('/api/articles/:id', (req, res) => {
    const articles = readData('articles');
    const article = articles.find(a => a.id === req.params.id);
    if (article) {
        res.json(article);
    } else {
        res.status(404).json({ error: 'Article not found' });
    }
});

app.get('/api/games', (req, res) => {
    const games = readData('games');
    res.json(games.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

app.get('/api/teams', (req, res) => {
    res.json(readData('teams'));
});

app.get('/api/slides', (req, res) => {
    res.json(readData('slides'));
});

app.get('/api/settings', (req, res) => {
    res.json(readData('settings'));
});

// ============================================
// ADMIN API ROUTES
// ============================================

// Articles
app.post('/api/admin/articles', requireAdmin, upload.single('image'), async (req, res) => {
    const articles = readData('articles');
    const newArticle = {
        id: uuidv4(),
        title: req.body.title,
        content: req.body.content,
        image: req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl,
        date: new Date().toISOString(),
        author: req.session.user.username
    };
    articles.push(newArticle);
    writeData('articles', articles);
    
    await sendDiscordNotification('article', newArticle);
    res.json(newArticle);
});

app.put('/api/admin/articles/:id', requireAdmin, upload.single('image'), (req, res) => {
    const articles = readData('articles');
    const index = articles.findIndex(a => a.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Not found' });
    
    articles[index] = {
        ...articles[index],
        title: req.body.title || articles[index].title,
        content: req.body.content || articles[index].content,
        image: req.file ? `/uploads/${req.file.filename}` : (req.body.imageUrl || articles[index].image)
    };
    writeData('articles', articles);
    res.json(articles[index]);
});

app.delete('/api/admin/articles/:id', requireAdmin, (req, res) => {
    let articles = readData('articles');
    articles = articles.filter(a => a.id !== req.params.id);
    writeData('articles', articles);
    res.json({ success: true });
});

// Games
app.post('/api/admin/games', requireAdmin, async (req, res) => {
    const games = readData('games');
    const newGame = {
        id: uuidv4(),
        homeTeam: req.body.homeTeam,
        awayTeam: req.body.awayTeam,
        homeScore: req.body.homeScore || null,
        awayScore: req.body.awayScore || null,
        date: req.body.date,
        time: req.body.time,
        venue: req.body.venue,
        status: req.body.status || 'scheduled'
    };
    games.push(newGame);
    writeData('games', games);
    
    await sendDiscordNotification('game', newGame);
    res.json(newGame);
});

app.put('/api/admin/games/:id', requireAdmin, async (req, res) => {
    const games = readData('games');
    const index = games.findIndex(g => g.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Not found' });
    
    const wasScheduled = games[index].status === 'scheduled';
    games[index] = { ...games[index], ...req.body };
    writeData('games', games);
    
    // Send notification if game finished
    if (wasScheduled && req.body.status === 'final') {
        await sendDiscordNotification('score', games[index]);
    }
    
    res.json(games[index]);
});

app.delete('/api/admin/games/:id', requireAdmin, (req, res) => {
    let games = readData('games');
    games = games.filter(g => g.id !== req.params.id);
    writeData('games', games);
    res.json({ success: true });
});

// Teams
app.post('/api/admin/teams', requireAdmin, upload.single('logo'), (req, res) => {
    const teams = readData('teams');
    const newTeam = {
        id: uuidv4(),
        name: req.body.name,
        abbreviation: req.body.abbreviation,
        logo: req.file ? `/uploads/${req.file.filename}` : req.body.logoUrl,
        conference: req.body.conference,
        location: req.body.location
    };
    teams.push(newTeam);
    writeData('teams', teams);
    res.json(newTeam);
});

app.put('/api/admin/teams/:id', requireAdmin, upload.single('logo'), (req, res) => {
    const teams = readData('teams');
    const index = teams.findIndex(t => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Not found' });
    
    teams[index] = {
        ...teams[index],
        ...req.body,
        logo: req.file ? `/uploads/${req.file.filename}` : (req.body.logoUrl || teams[index].logo)
    };
    writeData('teams', teams);
    res.json(teams[index]);
});

app.delete('/api/admin/teams/:id', requireAdmin, (req, res) => {
    let teams = readData('teams');
    teams = teams.filter(t => t.id !== req.params.id);
    writeData('teams', teams);
    res.json({ success: true });
});

// Slides
app.post('/api/admin/slides', requireAdmin, upload.single('image'), (req, res) => {
    const slides = readData('slides');
    const newSlide = {
        id: uuidv4(),
        title: req.body.title,
        subtitle: req.body.subtitle,
        image: req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl,
        link: req.body.link,
        date: new Date().toISOString()
    };
    slides.push(newSlide);
    writeData('slides', slides);
    res.json(newSlide);
});

app.delete('/api/admin/slides/:id', requireAdmin, (req, res) => {
    let slides = readData('slides');
    slides = slides.filter(s => s.id !== req.params.id);
    writeData('slides', slides);
    res.json({ success: true });
});

// Settings
app.put('/api/admin/settings', requireAdmin, (req, res) => {
    const settings = { ...readData('settings'), ...req.body };
    writeData('settings', settings);
    res.json(settings);
});

// Upload endpoint
app.post('/api/admin/upload', requireAdmin, upload.single('file'), (req, res) => {
    if (req.file) {
        res.json({ url: `/uploads/${req.file.filename}` });
    } else {
        res.status(400).json({ error: 'No file uploaded' });
    }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🏈 NJCAA Website running on http://localhost:${PORT}`);
});
