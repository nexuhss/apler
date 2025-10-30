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
// Structure: { channelId: [{ role: 'user', parts: [{ text: '...' }] }, ...] }
const conversationHistory = new Map();

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

// Function to create models for a given API key
function createModelsForKey(apiKey) {
  const ai = new GoogleGenerativeAI(apiKey);
  return {
    primary: ai.getGenerativeModel({ model: 'gemini-2.5-pro' })
  };
}

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
        conversationHistory.set(message.channel.id, []);
      }
      const history = conversationHistory.get(message.channel.id);

      // Add user's message to history
      history.push({
        role: 'user',
        parts: [{ text: userPrompt }]
      });

      // Keep only last 20 messages (10 exchanges) to avoid token limits
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      // 5. Call the Gemini API to get a response (with multiple API keys and fallback)
      let geminiResponseText;
      let usedModel = '';
      
      // Try all API keys in sequence until one works
      let lastError = null;
      for (let attempt = 0; attempt < GEMINI_API_KEYS.length; attempt++) {
        const apiKey = getNextApiKey();
        const models = createModelsForKey(apiKey);
        const keyIndex = (currentKeyIndex === 0 ? GEMINI_API_KEYS.length : currentKeyIndex);
        
        try {
          // Try primary model first (gemini-2.5-pro) with conversation history
          const chat = models.primary.startChat({
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