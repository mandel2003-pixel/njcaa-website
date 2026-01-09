# NJCAA Football Website

A full-featured NJCAA Football website with Discord authentication and admin panel.

## Features

- 🏈 Full NJCAA-style website design
- 🔐 Discord OAuth login
- 👨‍💼 Admin panel for authorized users
- 📰 Article management
- 🎮 Game scheduling & scores
- 🏆 Team management
- 🖼️ Hero slider management
- 🤖 Discord bot integration for updates

## Setup

### 1. Install Dependencies

```bash
cd njcaa-website
npm install
```

### 2. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name it
3. Go to "OAuth2" section
4. Add redirect URL: `http://localhost:3000/auth/discord/callback`
5. Copy your Client ID and Client Secret

### 3. Configure Environment

Edit the `.env` file:

```env
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=1457369799481884967
DISCORD_WEBHOOK_CHANNEL=njcaa-website

SESSION_SECRET=change-this-to-something-secure

PORT=3000
BASE_URL=http://localhost:3000
```

### 4. Create Discord Channel

Create a channel named `njcaa-website` in your Discord server for bot notifications.

### 5. Run the Server

```bash
npm start
```

Visit `http://localhost:3000`

## Admin Access

Users with **Administrator** permission in the Discord server (ID: 1457369799481884967) will automatically have admin access after logging in with Discord.

## Deployment

### Deploy to Railway (Free)

1. Push code to GitHub
2. Go to [Railway](https://railway.app)
3. Create new project from GitHub repo
4. Add environment variables
5. Deploy!

### Deploy to Render (Free)

1. Push code to GitHub
2. Go to [Render](https://render.com)
3. Create new Web Service
4. Connect GitHub repo
5. Add environment variables
6. Deploy!

## API Endpoints

### Public
- `GET /api/articles` - Get all articles
- `GET /api/games` - Get all games
- `GET /api/teams` - Get all teams
- `GET /api/slides` - Get hero slides
- `GET /api/settings` - Get site settings

### Admin (requires auth)
- `POST /api/admin/articles` - Create article
- `PUT /api/admin/articles/:id` - Update article
- `DELETE /api/admin/articles/:id` - Delete article
- (Same pattern for games, teams, slides)

## Discord Bot Integration

When you create/update content through the admin panel:
- New articles → Posted to #njcaa-website
- New games → Posted to #njcaa-website  
- Final scores → Posted to #njcaa-website

## License

MIT
