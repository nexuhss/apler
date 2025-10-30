const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// --- CONFIGURATION ---
// Create a .env file in your project root and add these variables
// DISCORD_BOT_TOKEN=your_discord_bot_token
// GEMINI_API_KEY=your_gemini_api_key

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!DISCORD_BOT_TOKEN || !GEMINI_API_KEY) {
  console.error("Error: DISCORD_BOT_TOKEN or GEMINI_API_KEY not found in .env file.");
  process.exit(1);
}

// --- INITIALIZE CLIENTS ---
// Setup Discord client with necessary permissions (intents)
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Setup Gemini AI client
const ai = new GoogleGenerativeAI(GEMINI_API_KEY);
const primaryModel = ai.getGenerativeModel({ model: 'gemini-2.5-pro' });
const fallbackModel = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

      // 5. Call the Gemini API to get a response (with fallback)
      let geminiResponseText;
      try {
        // Try primary model first (gemini-2.5-pro)
        const result = await primaryModel.generateContent(userPrompt);
        const response = await result.response;
        geminiResponseText = response.text();
        console.log('✓ Used primary model: gemini-2.5-pro');
      } catch (primaryError) {
        // Check if it's a rate limit or quota error
        if (primaryError.status === 429 || primaryError.status === 503 || 
            (primaryError.message && primaryError.message.includes('quota'))) {
          console.log('⚠ Primary model limit reached, falling back to gemini-2.5-flash');
          try {
            // Fall back to flash model
            const result = await fallbackModel.generateContent(userPrompt);
            const response = await result.response;
            geminiResponseText = response.text();
            console.log('✓ Used fallback model: gemini-2.5-flash');
          } catch (fallbackError) {
            // If fallback also fails, throw the error
            throw fallbackError;
          }
        } else {
          // If it's not a rate limit error, throw it
          throw primaryError;
        }
      }

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