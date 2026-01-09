require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// ============================================
// DISCORD BOT FOR POSTING ARTICLES
// ============================================
const discordClient = new Client({
    intents: [GatewayIntentBits.Guilds]
});

let discordReady = false;

discordClient.once('ready', () => {
    console.log(`🤖 Discord bot connected as ${discordClient.user.tag}`);
    discordReady = true;
});

// Connect Discord bot
if (process.env.DISCORD_BOT_TOKEN) {
    discordClient.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
        console.error('Discord bot login failed:', err.message);
    });
}

// Function to post article to Discord
async function postArticleToDiscord(article, baseUrl) {
    if (!discordReady) {
        console.log('Discord bot not ready, skipping post');
        return;
    }

    try {
        const guild = discordClient.guilds.cache.get(process.env.DISCORD_GUILD_ID);
        if (!guild) {
            console.error('Guild not found');
            return;
        }

        const channelName = process.env.DISCORD_WEBHOOK_CHANNEL || 'njcaa-website';
        const channel = guild.channels.cache.find(ch => ch.name === channelName);
        
        if (!channel) {
            console.error(`Channel #${channelName} not found`);
            return;
        }

        const articleUrl = `${baseUrl}/news.html?id=${article.id}`;
        
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setAuthor({
                name: '📰 NEW ARTICLE',
                iconURL: guild.iconURL()
            })
            .setTitle(article.title)
            .setDescription(article.content.substring(0, 300) + (article.content.length > 300 ? '...' : ''))
            .addFields(
                { name: '✍️ Author', value: article.author, inline: true },
                { name: '📅 Published', value: new Date(article.date).toLocaleDateString(), inline: true }
            )
            .setURL(articleUrl)
            .setFooter({ text: 'NJCAA Roblox Football League' })
            .setTimestamp();

        if (article.image) {
            embed.setImage(article.image.startsWith('http') ? article.image : `${baseUrl}${article.image}`);
        }

        await channel.send({
            content: '📢 **New article published on the NJCAA website!**',
            embeds: [embed]
        });

        console.log(`✅ Article posted to #${channelName}`);
    } catch (error) {
        console.error('Error posting to Discord:', error);
    }
}
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// ============================================
// DISCORD BOT FOR POSTING ARTICLES
// ============================================
const discordClient = new Client({
    intents: [GatewayIntentBits.Guilds]
});

let discordReady = false;

discordClient.once('ready', () => {
    console.log(`🤖 Discord bot connected as ${discordClient.user.tag}`);
    discordReady = true;
});

// Connect Discord bot
if (process.env.DISCORD_BOT_TOKEN) {
    discordClient.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
        console.error('Discord bot login failed:', err.message);
    });
}

// Function to post article to Discord
async function postArticleToDiscord(article, baseUrl) {
    if (!discordReady) {
        console.log('Discord bot not ready, skipping post');
        return;
    }

    try {
        const guild = discordClient.guilds.cache.get(process.env.DISCORD_GUILD_ID);
        if (!guild) {
            console.error('Guild not found');
            return;
        }

        const channelName = process.env.DISCORD_WEBHOOK_CHANNEL || 'njcaa-website';
        const channel = guild.channels.cache.find(ch => ch.name === channelName);
        
        if (!channel) {
            console.error(`Channel #${channelName} not found`);
            return;
        }

        const articleUrl = `${baseUrl}/news.html?id=${article.id}`;
        
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setAuthor({
                name: '📰 NEW ARTICLE',
                iconURL: guild.iconURL()
            })
            .setTitle(article.title)
            .setDescription(article.content.substring(0, 300) + (article.content.length > 300 ? '...' : ''))
            .addFields(
                { name: '✍️ Author', value: article.author, inline: true },
                { name: '📅 Published', value: new Date(article.date).toLocaleDateString(), inline: true }
            )
            .setURL(articleUrl)
            .setFooter({ text: 'NJCAA Roblox Football League' })
            .setTimestamp();

        if (article.image) {
            embed.setImage(article.image.startsWith('http') ? article.image : `${baseUrl}${article.image}`);
        }

        await channel.send({
            content: '📢 **New article published on the NJCAA website!**',
            embeds: [embed]
        });

        console.log(`✅ Article posted to #${channelName}`);
    } catch (error) {
        console.error('Error posting to Discord:', error);
    }
}

const app = express();

// Trust proxy for Render/Heroku (required for sessions)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Session - works with Render
app.use(session({
    secret: process.env.SESSION_SECRET || 'njcaa-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 
    }
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

// Initialize data files with defaults
function initDataFiles() {
    const defaults = {
        articles: [],
        games: [],
        teams: [],
        slides: [],
        settings: {
            siteName: 'NJCAA Roblox Football League',
            tagline: 'The Premier Roblox Football Experience',
            season: 'Season ONE'
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
        const data = fs.readFileSync(dataFiles[file], 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${file}:`, error);
        return file === 'settings' ? {} : [];
    }
}

function writeData(file, data) {
    try {
        fs.writeFileSync(dataFiles[file], JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${file}:`, error);
        return false;
    }
}

// Discord OAuth
const DISCORD_API = 'https://discord.com/api/v10';
const getOAuthUrl = () => {
    const redirectUri = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/auth/discord/callback';
    return `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20guilds`;
};

// Check if user is admin
async function checkAdmin(accessToken) {
    try {
        const guildsRes = await fetch(`${DISCORD_API}/users/@me/guilds`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const guilds = await guildsRes.json();
        
        if (!Array.isArray(guilds)) return false;
        
        const guild = guilds.find(g => g.id === process.env.DISCORD_GUILD_ID);
        if (!guild) return false;
        
        // Check for admin, manage server, or moderator permissions
        const adminPerms = 0x8 | 0x20 | 0x10000; // ADMINISTRATOR | MANAGE_GUILD | MANAGE_ROLES
        return (Number(guild.permissions) & adminPerms) !== 0;
    } catch (error) {
        console.error('Admin check error:', error);
        return false;
    }
}

// ============================================
// AUTH ROUTES
// ============================================

app.get('/auth/discord', (req, res) => {
    res.redirect(getOAuthUrl());
});

app.get('/auth/discord/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect('/?error=no_code');

    try {
        const redirectUri = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/auth/discord/callback';
        
        // Exchange code for token
        const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri
            })
        });
        const tokens = await tokenRes.json();

        if (!tokens.access_token) {
            console.error('Token exchange failed:', tokens);
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

app.get('/api/teams/:id', (req, res) => {
    const teams = readData('teams');
    const team = teams.find(t => t.id === req.params.id);
    if (team) {
        res.json(team);
    } else {
        res.status(404).json({ error: 'Team not found' });
    }
});

app.get('/api/slides', (req, res) => {
    res.json(readData('slides'));
});

app.get('/api/settings', (req, res) => {
    res.json(readData('settings'));
});

// ============================================
// ADMIN API ROUTES - TEAMS
// ============================================

app.post('/api/admin/teams', requireAdmin, (req, res) => {
    try {
        const teams = readData('teams');
        const newTeam = {
            id: uuidv4(),
            name: req.body.name,
            abbreviation: req.body.abbreviation || '',
            nickname: req.body.nickname || '',
            logo: req.body.logo || req.body.logoUrl || '',
            conference: req.body.conference || '',
            location: req.body.location || '',
            athleticDirector: req.body.athleticDirector || '',
            headCoach: req.body.headCoach || ''
        };
        teams.push(newTeam);
        writeData('teams', teams);
        res.json(newTeam);
    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({ error: 'Failed to create team' });
    }
});

app.put('/api/admin/teams/:id', requireAdmin, (req, res) => {
    try {
        const teams = readData('teams');
        const index = teams.findIndex(t => t.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Team not found' });
        
        teams[index] = {
            ...teams[index],
            name: req.body.name ?? teams[index].name,
            abbreviation: req.body.abbreviation ?? teams[index].abbreviation,
            nickname: req.body.nickname ?? teams[index].nickname,
            logo: req.body.logo || req.body.logoUrl || teams[index].logo,
            conference: req.body.conference ?? teams[index].conference,
            location: req.body.location ?? teams[index].location,
            athleticDirector: req.body.athleticDirector ?? teams[index].athleticDirector,
            headCoach: req.body.headCoach ?? teams[index].headCoach
        };
        writeData('teams', teams);
        res.json(teams[index]);
    } catch (error) {
        console.error('Error updating team:', error);
        res.status(500).json({ error: 'Failed to update team' });
    }
});

app.delete('/api/admin/teams/:id', requireAdmin, (req, res) => {
    try {
        let teams = readData('teams');
        const initialLength = teams.length;
        teams = teams.filter(t => t.id !== req.params.id);
        
        if (teams.length === initialLength) {
            return res.status(404).json({ error: 'Team not found' });
        }
        
        writeData('teams', teams);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting team:', error);
        res.status(500).json({ error: 'Failed to delete team' });
    }
});

// ============================================
// ADMIN API ROUTES - GAMES
// ============================================

app.post('/api/admin/games', requireAdmin, (req, res) => {
    try {
        const games = readData('games');
        const newGame = {
            id: uuidv4(),
            homeTeam: req.body.homeTeam,
            awayTeam: req.body.awayTeam,
            homeScore: req.body.homeScore || null,
            awayScore: req.body.awayScore || null,
            date: req.body.date,
            time: req.body.time || '',
            venue: req.body.venue || '',
            status: req.body.status || 'scheduled'
        };
        games.push(newGame);
        writeData('games', games);
        res.json(newGame);
    } catch (error) {
        console.error('Error creating game:', error);
        res.status(500).json({ error: 'Failed to create game' });
    }
});

app.put('/api/admin/games/:id', requireAdmin, (req, res) => {
    try {
        const games = readData('games');
        const index = games.findIndex(g => g.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Game not found' });
        
        games[index] = {
            ...games[index],
            homeTeam: req.body.homeTeam ?? games[index].homeTeam,
            awayTeam: req.body.awayTeam ?? games[index].awayTeam,
            homeScore: req.body.homeScore ?? games[index].homeScore,
            awayScore: req.body.awayScore ?? games[index].awayScore,
            date: req.body.date ?? games[index].date,
            time: req.body.time ?? games[index].time,
            venue: req.body.venue ?? games[index].venue,
            status: req.body.status ?? games[index].status
        };
        writeData('games', games);
        res.json(games[index]);
    } catch (error) {
        console.error('Error updating game:', error);
        res.status(500).json({ error: 'Failed to update game' });
    }
});

app.delete('/api/admin/games/:id', requireAdmin, (req, res) => {
    try {
        let games = readData('games');
        games = games.filter(g => g.id !== req.params.id);
        writeData('games', games);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting game:', error);
        res.status(500).json({ error: 'Failed to delete game' });
    }
});

// ============================================
// ADMIN API ROUTES - ARTICLES
// ============================================

app.post('/api/admin/articles', requireAdmin, (req, res) => {
    try {
        const articles = readData('articles');
        const newArticle = {
            id: uuidv4(),
            title: req.body.title,
            content: req.body.content,
            image: req.body.image || req.body.imageUrl || '',
            date: new Date().toISOString(),
            author: req.session.user.username
        };
        articles.push(newArticle);
        writeData('articles', articles);
        
        // Post to Discord
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        postArticleToDiscord(newArticle, baseUrl);
        
        res.json(newArticle);
    } catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({ error: 'Failed to create article' });
    }
});

app.put('/api/admin/articles/:id', requireAdmin, (req, res) => {
    try {
        const articles = readData('articles');
        const index = articles.findIndex(a => a.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Article not found' });
        
        articles[index] = {
            ...articles[index],
            title: req.body.title ?? articles[index].title,
            content: req.body.content ?? articles[index].content,
            image: req.body.image || req.body.imageUrl || articles[index].image
        };
        writeData('articles', articles);
        res.json(articles[index]);
    } catch (error) {
        console.error('Error updating article:', error);
        res.status(500).json({ error: 'Failed to update article' });
    }
});

app.delete('/api/admin/articles/:id', requireAdmin, (req, res) => {
    try {
        let articles = readData('articles');
        articles = articles.filter(a => a.id !== req.params.id);
        writeData('articles', articles);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ error: 'Failed to delete article' });
    }
});

// ============================================
// ADMIN API ROUTES - SLIDES
// ============================================

app.post('/api/admin/slides', requireAdmin, (req, res) => {
    try {
        const slides = readData('slides');
        const newSlide = {
            id: uuidv4(),
            title: req.body.title,
            subtitle: req.body.subtitle || '',
            image: req.body.image || req.body.imageUrl || '',
            link: req.body.link || '',
            date: new Date().toISOString()
        };
        slides.push(newSlide);
        writeData('slides', slides);
        res.json(newSlide);
    } catch (error) {
        console.error('Error creating slide:', error);
        res.status(500).json({ error: 'Failed to create slide' });
    }
});

app.delete('/api/admin/slides/:id', requireAdmin, (req, res) => {
    try {
        let slides = readData('slides');
        slides = slides.filter(s => s.id !== req.params.id);
        writeData('slides', slides);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting slide:', error);
        res.status(500).json({ error: 'Failed to delete slide' });
    }
});

// ============================================
// ADMIN API ROUTES - SETTINGS
// ============================================

app.put('/api/admin/settings', requireAdmin, (req, res) => {
    try {
        const settings = { ...readData('settings'), ...req.body };
        writeData('settings', settings);
        res.json(settings);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// ============================================
// FILE UPLOAD
// ============================================

app.post('/api/admin/upload', requireAdmin, upload.single('file'), (req, res) => {
    if (req.file) {
        res.json({ url: `/uploads/${req.file.filename}` });
    } else {
        res.status(400).json({ error: 'No file uploaded' });
    }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🏈 NJCAA Roblox Football League running on http://localhost:${PORT}`);
    console.log(`📊 Admin panel: http://localhost:${PORT}/admin.html`);
});
