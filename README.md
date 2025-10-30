# 🤖 Apler - Your AI Discord Companion

<div align="center">

[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Pro-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

A smart Discord bot powered by Google's Gemini 2.5 Pro AI. Just mention @apler and ask anything!

</div>

---

## ✨ Features

- 🧠 **Powered by Gemini 2.5 Pro**: Uses Google's most advanced AI model for high-quality responses
- 💭 **Conversation Memory**: Remembers chat history per channel for natural, flowing conversations
- � **Multi-Key Load Balancing**: Rotates through 5 API keys to maximize uptime and avoid rate limits
- 📝 **Concise & Well-Formatted**: Optimized to give clear, Discord-friendly responses
- 🧹 **Memory Optimized**: Automatic cleanup of inactive channels (30+ days)
- ⚡ **Always Available**: Runs 24/7 on Railway
- 💬 **Simple to Use**: Just mention @apler and start chatting!

## 📖 Usage

Simply mention the bot in any channel with your message:

```
@apler What's the capital of France?
@apler Tell me something interesting about it
@apler Help me write a Python function to sort a list
```

Apler remembers your conversation in each channel, so you can have natural back-and-forth discussions!

## 🛠️ How It Works

```
User mentions @apler
       ↓
Bot retrieves conversation history for this channel
       ↓
Sends message to Gemini 2.5 Pro (round-robin across 5 API keys)
       ↓
   Success? ──Yes──→ Send formatted response
       ↓
      No (rate limit)
       ↓
Try next API key
       ↓
Repeat until success or all keys exhausted
```

## 🚀 Technical Highlights

- **Round-robin API key rotation** for 5x capacity
- **Per-channel conversation memory** (up to 20 messages)
- **Model instance reuse** for efficient resource usage
- **Automatic memory cleanup** (removes channels inactive for 30+ days)
- **Optimized system prompts** for concise, well-formatted responses

---

<div align="center">

Made with ❤️ by [nexuhss](https://github.com/nexuhss)

⭐ Star this repo if you find it helpful!

</div>