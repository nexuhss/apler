# 🤖 Apler - Gemini Discord Bot

<div align="center">

[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

A powerful Discord bot powered by Google's Gemini 2.5 Pro AI with intelligent fallback to Gemini 2.5 Flash.

[Features](#-features) • [Installation](#-installation) • [Deployment](#-deployment) • [Usage](#-usage)

</div>

---

## ✨ Features

- 🧠 **Dual AI Models**: Uses Gemini 2.5 Pro with automatic fallback to Gemini 2.5 Flash when rate limits are reached
- ⚡ **Fast Responses**: Intelligent model switching ensures minimal downtime
- 💬 **Mention-based**: Simply mention @apler to interact
- 📝 **Long Message Support**: Automatically handles responses exceeding Discord's 2000 character limit
- 🔒 **Secure**: Environment-based configuration keeps your API keys safe

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Discord Bot Token](https://discord.com/developers/applications)
- [Google Gemini API Key](https://makersuite.google.com/app/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nexuhss/apler.git
   cd apler
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the project root:
   ```env
   DISCORD_BOT_TOKEN=your_discord_bot_token_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Enable Discord Bot Intents**
   
   Go to the [Discord Developer Portal](https://discord.com/developers/applications):
   - Select your application
   - Navigate to **Bot** → **Privileged Gateway Intents**
   - Enable **Message Content Intent** ✅

5. **Invite the bot to your server**
   
   Use this URL (replace `YOUR_CLIENT_ID` with your Application ID):
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2048&scope=bot
   ```

6. **Start the bot**
   ```bash
   npm start
   ```

## 📖 Usage

Simply mention the bot in any channel with your message:

```
@apler What is the meaning of life?
@apler Write me a poem about coding
@apler Explain quantum computing in simple terms
```

The bot will respond using:
- **Gemini 2.5 Pro** (primary model) for the best quality responses
- **Gemini 2.5 Flash** (fallback model) when rate limits are reached

## 🌐 Deployment

### Railway (Recommended)

Railway offers $5/month free credit, perfect for keeping your bot online 24/7.

1. **Push your code to GitHub** (already done!)

2. **Deploy to Railway**
   - Visit [railway.app](https://railway.app)
   - Click **"New Project"** → **"Deploy from GitHub repo"**
   - Select the `apler` repository
   - Add environment variables:
     - `DISCORD_BOT_TOKEN`
     - `GEMINI_API_KEY`

3. **Deploy!** Railway will automatically detect the Node.js project and start your bot.

### Alternative Hosting Options

| Platform | Free Tier | Always On | Notes |
|----------|-----------|-----------|-------|
| [Railway](https://railway.app) | $5/month credit | ✅ Yes | **Recommended** |
| [Fly.io](https://fly.io) | Free allowance | ✅ Yes | Good alternative |
| [Render](https://render.com) | Free | ❌ Sleeps after 15min | Testing only |

## 🛠️ How It Works

```
User mentions @apler
       ↓
Bot receives message
       ↓
Try Gemini 2.5 Pro
       ↓
   Success? ──Yes──→ Send response
       ↓
      No (rate limit)
       ↓
Try Gemini 2.5 Flash
       ↓
   Success? ──Yes──→ Send response
       ↓
      No
       ↓
  Error message
```

## 📝 Project Structure

```
apler/
├── index.js          # Main bot logic
├── package.json      # Dependencies and scripts
├── .env             # Environment variables (not in git)
├── .gitignore       # Git ignore rules
└── README.md        # You are here!
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Discord.js](https://discord.js.org/)
- Powered by [Google Gemini AI](https://ai.google.dev/)
- Inspired by the need for smarter Discord interactions

---

<div align="center">

Made with ❤️ by [nexuhss](https://github.com/nexuhss)

⭐ Star this repo if you find it helpful!

</div>