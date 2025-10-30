const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// --- CONFIGURATION ---
// Create a .env file in your project root and add these variables
// DISCORD_BOT_TOKEN=your_discord_bot_token
// GEMINI_API_KEY_1=your_first_gemini_api_key
// GEMINI_API_KEY_2=your_second_gemini_api_key
// ... (up to GEMINI_API_KEY_5)

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Collect all available Gemini API keys
const GEMINI_API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
].filter(key => key); // Remove undefined/empty keys

if (!DISCORD_BOT_TOKEN || GEMINI_API_KEYS.length === 0) {
  console.error("Error: DISCORD_BOT_TOKEN or at least one GEMINI_API_KEY not found in .env file.");
  process.exit(1);
}

console.log(`Loaded ${GEMINI_API_KEYS.length} Gemini API key(s)`);

// Round-robin index for cycling through API keys
let currentKeyIndex = 0;

// Store conversation history per channel
// Structure: { channelId: { history: [...], lastActivity: timestamp } }
const conversationHistory = new Map();

// Cleanup interval - Remove channels inactive for more than 30 days
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // Run cleanup daily (24 hours)
const MAX_INACTIVITY = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

function cleanupOldChannels() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [channelId, data] of conversationHistory.entries()) {
    if (now - data.lastActivity > MAX_INACTIVITY) {
      conversationHistory.delete(channelId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} inactive channel(s) (30+ days old)`);
  }
}

// Run cleanup daily
setInterval(cleanupOldChannels, CLEANUP_INTERVAL);

// --- INITIALIZE CLIENTS ---
// Setup Discord client with necessary permissions (intents)
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Function to get the next API key in round-robin fashion
function getNextApiKey() {
  const key = GEMINI_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
  return key;
}

// Pre-create all models at startup for reuse (optimization)
const modelInstances = GEMINI_API_KEYS.map(apiKey => {
  const ai = new GoogleGenerativeAI(apiKey);
  return ai.getGenerativeModel({ 
    model: 'gemini-2.5-pro',
    systemInstruction: 'You are Apler, a helpful Discord bot. Keep responses concise and well-formatted. Use Discord markdown for better readability (** for bold, * for italic, ` for code, ``` for code blocks). Avoid unnecessarily long responses - be direct and clear. When listing options, keep them compact in a single message. Aim for responses under 1500 characters when possible.'
  });
});

console.log(`Created ${modelInstances.length} model instance(s) for reuse`);

// --- DISCORD BOT LOGIC ---
discordClient.once('ready', () => {
  console.log(`Logged in as ${discordClient.user.tag}!`);
  console.log('Bot is ready and waiting for messages.');
});

discordClient.on('messageCreate', async (message) => {
  // 1. Ignore messages from the bot itself to prevent loops
  if (message.author.bot) return;

  // 2. Check if the bot was mentioned in the message
  if (message.mentions.has(discordClient.user.id)) {
    try {
      // 3. Show a "typing..." indicator to the user
      await message.channel.sendTyping();

      // 4. Extract the user's prompt by removing the bot mention
      const userPrompt = message.content.replace(/<@!?\d+>/g, '').trim();

      if (!userPrompt) {
        message.reply("You mentioned me! Ask me anything.");
        return;
      }

      console.log(`Received prompt from ${message.author.tag}: "${userPrompt}"`);

      // Get or create conversation history for this channel
      if (!conversationHistory.has(message.channel.id)) {
        conversationHistory.set(message.channel.id, {
          history: [],
          lastActivity: Date.now()
        });
      }
      const channelData = conversationHistory.get(message.channel.id);
      const history = channelData.history;
      
      // Update last activity timestamp
      channelData.lastActivity = Date.now();

      // Add user's message to history
      history.push({
        role: 'user',
        parts: [{ text: userPrompt }]
      });

      // Keep only last 20 messages (10 exchanges) to avoid token limits
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      // 5. Call the Gemini API to get a response (with multiple API keys)
      let geminiResponseText;
      let usedModel = '';
      
      // Try all API keys in sequence until one works
      let lastError = null;
      for (let attempt = 0; attempt < GEMINI_API_KEYS.length; attempt++) {
        const modelIndex = currentKeyIndex;
        const model = modelInstances[modelIndex];
        getNextApiKey(); // Advance to next key for round-robin
        const keyIndex = modelIndex + 1;
        
        try {
          // Try model with conversation history
          const chat = model.startChat({
            history: history.slice(0, -1), // All messages except the current one
          });
          const result = await chat.sendMessage(userPrompt);
          const response = await result.response;
          geminiResponseText = response.text();
          usedModel = `gemini-2.5-pro (API Key ${keyIndex})`;
          console.log(`✓ Used: ${usedModel}`);
          break; // Success, exit the loop
        } catch (primaryError) {
          // Check if it's a rate limit or quota error
          if (primaryError.status === 429 || primaryError.status === 503 || 
              (primaryError.message && primaryError.message.includes('quota'))) {
            console.log(`✗ API Key ${keyIndex} rate limit reached, trying next key...`);
            lastError = primaryError;
            // Continue to next API key
          } else {
            // If it's not a rate limit error, throw it
            throw primaryError;
          }
        }
      }
      
      // If all keys failed, throw the last error
      if (!geminiResponseText) {
        throw lastError || new Error('All API keys exhausted');
      }

      // Add bot's response to history
      history.push({
        role: 'model',
        parts: [{ text: geminiResponseText }]
      });

      // 6. Reply with the response, handling Discord's 2000 character limit
      const MAX_LENGTH = 2000;
      if (geminiResponseText.length <= MAX_LENGTH) {
        await message.reply(geminiResponseText);
      } else {
        // If response is too long, split it into chunks
        const chunks = geminiResponseText.match(new RegExp(`.{1,${MAX_LENGTH}}`, 'g')) || [];
        await message.reply(chunks[0]); // Reply to the first chunk
        for (let i = 1; i < chunks.length; i++) {
          await message.channel.send(chunks[i]); // Send follow-ups without replying
        }
      }

    } catch (error) {
      console.error("Error processing message:", error);
      message.reply("Sorry, I ran into an error. Please try again later or check the server logs.");
    }
  }
});

// --- LOGIN ---
// Start the bot by logging in with your token
discordClient.login(DISCORD_BOT_TOKEN);