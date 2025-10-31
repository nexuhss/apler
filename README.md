# 🤖 Apler - Your AI Discord Companion

<div align="center">

[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Pro-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

A smart Discord bot powered by Google's Gemini 2.5 Pro AI. Use slash commands or mention @apler to get instant AI-powered answers!

</div>

---

## ✨ Features

- 🧠 **Powered by Gemini 2.5 Pro**: Uses Google's most advanced AI model for high-quality responses
- 🔍 **Web Search Integration**: Automatically searches Google for current information, weather, news, and real-time data
- � **Flexible Memory Modes**: Choose between channel-wide or per-user conversation memory
- 🔄 **Multi-Key Load Balancing**: Rotates through 5 API keys to maximize uptime and avoid rate limits
- ⚡ **Slash Commands**: Modern Discord commands for clean interactions
- 📝 **Smart Message Splitting**: Automatically splits long responses at natural boundaries
- 🎨 **Visual Feedback**: Animated thinking emoji while processing
- 🧹 **Auto-Cleanup**: Automatic cleanup of inactive channels (30+ days) and error messages
- ⚡ **Always Available**: Runs 24/7 on Railway
- 💬 **Easy to Use**: Slash commands or simple mentions!

## 📖 Usage

### Using Slash Commands
```
/ask question: What's the capital of France?
/help - Show all available commands
/stats - View bot statistics
/ping - Check bot response time
/clear - Clear conversation history (Admin only)
/memorymode - Switch between channel-wide or per-user memory (Admin only)
```

### Using Mentions
```
@apler What's the capital of France?
@apler Tell me something interesting about it
@apler How's the weather in Tokyo today?
@apler Help me write a Python function to sort a list
```

Apler remembers your conversation and can search the web when needed!

## 🎮 Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/ask` | Ask Apler anything | Everyone |
| `/help` | Show information and commands | Everyone |
| `/stats` | View bot statistics (uptime, memory, etc.) | Everyone |
| `/ping` | Check bot response time | Everyone |
| `/clear` | Clear conversation history for this channel | Admin only |
| `/memorymode` | Change memory mode (channel/user) | Admin only |

## 🧠 Memory Modes

Apler supports two memory modes per channel:

- **Channel Mode** (default): Everyone in the channel shares the same conversation memory
- **User Mode**: Each user has their own separate conversation memory in that channel

Admins can switch modes using `/memorymode` - perfect for different use cases!

## 🛠️ How It Works

```
User uses /ask or mentions @apler
       ↓
Bot shows thinking emoji reaction
       ↓
Bot retrieves conversation history (channel or user-based)
       ↓
Sends message to Gemini 2.5 Pro (round-robin across 5 API keys)
       ↓
   AI needs current info? ──Yes──→ Automatically searches Google
       ↓                                    ↓
      No                           Results sent back to AI
       ↓                                    ↓
   Success? ──Yes──→ Remove emoji & send formatted response
       ↓
      No (rate limit)
       ↓
Try next API key
       ↓
Repeat until success or all keys exhausted
```

## 🚀 Technical Highlights

- **Google Custom Search integration** - AI automatically searches for current information
- **Function calling** - Seamless integration between AI and web search
- **Round-robin API key rotation** for 5x capacity
- **Flexible memory system** (per-channel or per-user)
- **Per-channel/user conversation memory** (up to 20 messages)
- **Smart message splitting** at paragraphs, sentences, or natural breaks
- **Model instance reuse** for efficient resource usage
- **Automatic memory cleanup** (removes channels inactive for 30+ days)
- **Auto-deleting error messages** (5 seconds)
- **Animated thinking reactions** for visual feedback
- **Optimized system prompts** for short, well-formatted responses

## 🔧 Setup for Railway Deployment

To deploy this bot yourself:

1. **Get API Keys**:
   - Discord Bot Token from [Discord Developer Portal](https://discord.com/developers/applications)
   - 5 Gemini API Keys from [Google AI Studio](https://aistudio.google.com/apikey)
   - Google Custom Search API Key from [Google Cloud Console](https://console.cloud.google.com/)
   - Custom Search Engine ID from [Programmable Search Engine](https://programmablesearchengine.google.com/)

2. **Deploy to Railway**:
   - Fork this repository
   - Create a new project on [Railway](https://railway.app/)
   - Connect your GitHub repository
   - Add environment variables in Railway dashboard:
     ```
     DISCORD_BOT_TOKEN=your_token
     GEMINI_API_KEY_1=your_key_1
     GEMINI_API_KEY_2=your_key_2
     GEMINI_API_KEY_3=your_key_3
     GEMINI_API_KEY_4=your_key_4
     GEMINI_API_KEY_5=your_key_5
     GOOGLE_SEARCH_API_KEY=your_search_key
     GOOGLE_SEARCH_CX=your_cx_id
     ```
   - Railway will auto-deploy on every push to main branch

3. **Invite the Bot**:
   - Go to Discord Developer Portal
   - OAuth2 → URL Generator
   - Select scopes: `bot`, `applications.commands`
   - Select permissions: `Send Messages`, `Use Slash Commands`, `Add Reactions`
   - Copy and visit the URL to add bot to your server

**Note**: Free tier limits:
- Railway: 500 hours/month
- Gemini: Rate limits per key (5 keys = 5x capacity)
- Google Search: 100 searches/day

---

<div align="center">

Made with ❤️ by [nexuhss](https://github.com/nexuhss)

⭐ Star this repo if you find it helpful!

</div>