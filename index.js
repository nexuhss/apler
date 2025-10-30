const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
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

// Store conversation history per channel or per user depending on channel settings
// Structure: { channelId/userId: { history: [...], lastActivity: timestamp } }
const conversationHistory = new Map();

// Store memory mode settings per channel
// Structure: { channelId: 'channel' | 'user' }
const channelMemoryMode = new Map();

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

// Bot start time for uptime tracking
const botStartTime = Date.now();

// --- SLASH COMMANDS SETUP ---
const commands = [
  new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask Apler anything')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Your question for Apler')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show information about Apler and available commands'),
  
  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear conversation history for this channel (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  new SlashCommandBuilder()
    .setName('memorymode')
    .setDescription('Change memory mode for this channel (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('Memory tracking mode')
        .setRequired(true)
        .addChoices(
          { name: 'Channel (everyone shares memory)', value: 'channel' },
          { name: 'User (separate memory per user)', value: 'user' }
        )),
  
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show bot statistics'),
  
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot response time'),
].map(command => command.toJSON());

// Register slash commands
async function registerCommands() {
  try {
    const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);
    console.log('Registering slash commands...');
    
    await rest.put(
      Routes.applicationCommands(discordClient.user.id),
      { body: commands }
    );
    
    console.log('✓ Slash commands registered successfully!');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

// --- DISCORD BOT LOGIC ---
discordClient.once('ready', async () => {
  console.log(`Logged in as ${discordClient.user.tag}!`);
  console.log('Bot is ready and waiting for messages.');
  await registerCommands();
});

// Helper function to get AI response
async function getAIResponse(userPrompt, channelId, userId = null) {
  // Determine memory key based on channel's memory mode
  const memoryMode = channelMemoryMode.get(channelId) || 'channel'; // Default to channel mode
  const memoryKey = memoryMode === 'user' ? userId : channelId;
  
  // Get or create conversation history for this key
  if (!conversationHistory.has(memoryKey)) {
    conversationHistory.set(memoryKey, {
      history: [],
      lastActivity: Date.now()
    });
  }
  const channelData = conversationHistory.get(memoryKey);
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

  // Try all API keys in sequence until one works
  let geminiResponseText;
  let usedModel = '';
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
  
  return geminiResponseText;
}

// Handle slash commands
discordClient.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    if (commandName === 'ask') {
      const question = interaction.options.getString('question');
      await interaction.deferReply();
      
      console.log(`Received /ask from ${interaction.user.tag}: "${question}"`);
      
      const response = await getAIResponse(question, interaction.channel.id, interaction.user.id);
      
      // Handle Discord's 2000 character limit
      const MAX_LENGTH = 2000;
      if (response.length <= MAX_LENGTH) {
        await interaction.editReply(response);
      } else {
        const chunks = response.match(new RegExp(`.{1,${MAX_LENGTH}}`, 'g')) || [];
        await interaction.editReply(chunks[0]);
        for (let i = 1; i < chunks.length; i++) {
          await interaction.followUp(chunks[i]);
        }
      }
    } 
    else if (commandName === 'help') {
      const helpMessage = `🤖 **Apler - Your AI Discord Companion**\n\nPowered by Google Gemini 2.5 Pro\n\n**How to use:**\n• Mention @apler with your question\n• Use \`/ask [question]\` to ask anything\n\n**Available Commands:**\n\`/ask\` - Ask Apler anything\n\`/clear\` - Reset conversation history (Admin only)\n\`/memorymode\` - Change memory mode: channel or per-user (Admin only)\n\`/stats\` - View bot statistics\n\`/ping\` - Check bot response time\n\`/help\` - Show this message\n\nApler remembers conversations based on the channel's memory mode!`;
      
      await interaction.reply({ content: helpMessage, ephemeral: true });
    }
    else if (commandName === 'clear') {
      // Check if user has administrator permission
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({ content: '❌ Only server administrators can clear conversation history.', ephemeral: true });
        return;
      }
      
      const memoryMode = channelMemoryMode.get(interaction.channel.id) || 'channel';
      
      if (memoryMode === 'channel') {
        // Clear channel-wide history
        if (conversationHistory.has(interaction.channel.id)) {
          conversationHistory.delete(interaction.channel.id);
          await interaction.reply('✅ Conversation history cleared for this channel! Starting fresh.');
        } else {
          await interaction.reply('ℹ️ No conversation history found for this channel.');
        }
      } else {
        // Clear all user histories in this channel
        let cleared = 0;
        for (const [key] of conversationHistory.entries()) {
          // In user mode, keys are user IDs, but we need to clear all related to this context
          conversationHistory.delete(key);
          cleared++;
        }
        await interaction.reply(`✅ Cleared ${cleared} user conversation histories! Starting fresh.`);
      }
    }
    else if (commandName === 'memorymode') {
      // Check if user has administrator permission
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        await interaction.reply({ content: '❌ Only server administrators can change memory mode.', ephemeral: true });
        return;
      }
      
      const mode = interaction.options.getString('mode');
      const oldMode = channelMemoryMode.get(interaction.channel.id) || 'channel';
      
      channelMemoryMode.set(interaction.channel.id, mode);
      
      let modeDescription = mode === 'channel' 
        ? 'everyone in this channel shares the same conversation memory'
        : 'each user has their own separate conversation memory';
      
      // Clear existing history when switching modes
      conversationHistory.clear();
      
      await interaction.reply(`✅ Memory mode changed from **${oldMode}** to **${mode}**!\n\nNow ${modeDescription}. Previous conversation history has been cleared.`);
    }
    else if (commandName === 'stats') {
      const uptime = Date.now() - botStartTime;
      const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
      
      const channelCount = conversationHistory.size;
      const memoryMB = (JSON.stringify(Array.from(conversationHistory.entries())).length / 1024 / 1024).toFixed(2);
      
      const statsMessage = `📊 **Apler Statistics**\n\n⏰ Uptime: ${days}d ${hours}h ${minutes}m\n🔑 API Keys: ${GEMINI_API_KEYS.length} loaded\n💬 Active Channels: ${channelCount} channels with conversation history\n💾 Memory: ${memoryMB} MB of conversation data\n🤖 Model: Gemini 2.5 Pro`;
      
      await interaction.reply({ content: statsMessage, ephemeral: true });
    }
    else if (commandName === 'ping') {
      const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true, ephemeral: true });
      const responseTime = sent.createdTimestamp - interaction.createdTimestamp;
      await interaction.editReply(`🏓 Pong! Response time: **${responseTime}ms**`);
    }
  } catch (error) {
    console.error(`Error handling /${commandName}:`, error);
    const errorMessage = 'Sorry, I ran into an error. Please try again later.';
    
    if (interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
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

      // Use the helper function to get AI response
      const geminiResponseText = await getAIResponse(userPrompt, message.channel.id, message.author.id);

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