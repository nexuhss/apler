# 🤖 Apler - Gemini Discord Bot

<div align="center">

[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

A powerful Discord bot powered by Google's Gemini 2.5 Pro AI with intelligent fallback to Gemini 2.5 Flash.

</div>

---

## ✨ Features

- 🧠 **Dual AI Models**: Uses Gemini 2.5 Pro with automatic fallback to Gemini 2.5 Flash when rate limits are reached
- ⚡ **Fast Responses**: Intelligent model switching ensures minimal downtime
- 💬 **Mention-based**: Simply mention @apler to interact
- 📝 **Long Message Support**: Automatically handles responses exceeding Discord's 2000 character limit
- 🔒 **Secure**: Environment-based configuration keeps your API keys safe

##  Usage

Simply mention the bot in any channel with your message:

```
@apler What is the meaning of life?
@apler Write me a poem about coding
@apler Explain quantum computing in simple terms
```

The bot will respond using:
- **Gemini 2.5 Pro** (primary model) for the best quality responses
- **Gemini 2.5 Flash** (fallback model) when rate limits are reached

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

---

<div align="center">

Made with ❤️ by [nexuhss](https://github.com/nexuhss)

⭐ Star this repo if you find it helpful!

</div>