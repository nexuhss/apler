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
- 📹 **YouTube Video Summarization**: Can summarize YouTube videos using transcripts and descriptions
- 💭 **Flexible Memory Modes**: Choose between channel-wide or per-user conversation memory
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
@apler Summarize this video: https://youtube.com/watch?v=...
@apler Help me write a Python function to sort a list
```

Apler remembers your conversation and can search the web or summarize videos when needed!

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
   AI needs video summary? ──Yes──→ Gets YouTube transcript & summarizes
       ↓                                    ↓
      No                           Summary sent back to AI
       ↓                                    ↓
   Success? ──Yes──→ Remove emoji & send formatted response
       ↓
      No (rate limit)
       ↓
Try next API key
       ↓
Repeat until success or all keys exhausted
```

## 🎯 What Makes Apler Special

- **Always Up-to-Date**: Automatically searches the web for current information when needed
- **Video Summarization**: Can summarize YouTube videos using transcripts and descriptions
- **Reliable**: Multiple API keys ensure the bot stays responsive even during high usage
- **Smart Memory**: Remembers conversations and adapts to your server's needs
- **User-Friendly**: Clean slash commands and natural conversation flow
- **Polished Experience**: Thoughtful details like animated reactions and auto-cleanup

---

<div align="center">

Made with ❤️ by [nexuhss](https://github.com/nexuhss)

⭐ Star this repo if you find it helpful!

</div>