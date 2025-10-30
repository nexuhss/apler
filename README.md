# Apler - Gemini Discord Bot

Your step-by-step guide to creating and deploying the Apler bot with Gemini 2.5 Flash.

## Step 1: The Plan & A Common Misconception

You want to build a Discord bot using the powerful Gemini model and host it for free online. That's an excellent goal! However, there's a critical point to understand about hosting.

### Hosting Bots vs. Websites

Platforms like Netlify or Vercel are designed for static websites and serverless functions. A Discord bot needs a persistent, long-running server process to stay online and listen for messages 24/7. Netlify is not the right tool for this job.

Don't worry! This guide will show you the correct architecture and point you to free services that can host a bot.

## Step 2: The Correct Architecture

Here's how all the pieces fit together:

🤖 Your Discord Bot - A Node.js application that listens for commands on your Discord server.

🧠 Gemini 2.5 Flash API - The "brain" that processes user prompts and generates intelligent responses.

☁️ Backend Hosting Service (e.g., Render, Railway) - A platform that keeps your Node.js bot running 24/7.

## Step 3: Getting Your Keys

Before writing code, you need two secret keys:

- **Discord Bot Token**: This authenticates your script as a bot. Create one in the [Discord Developer Portal](https://discord.com/developers/applications).

- **Gemini API Key**: This gives you access to the Gemini models. You can get one from [Google AI Studio](https://makersuite.google.com/app/apikey). They offer a free tier with daily limits, which is perfect for starting out.

**Important**: Never share these keys or commit them to public code repositories. We'll use a .env file to keep them safe.

## Step 4: Setup

The project is already set up with:

- `package.json` with dependencies
- `index.js` with the bot code
- `.env` with placeholders (replace with your keys)
- `.gitignore` to exclude sensitive files

## Step 5: Running Locally

1. Replace the placeholder values in `.env` with your actual keys.

2. Run `npm start` to start the bot.

## Step 6: Deployment

Now it's time to get your bot online. We'll use a service designed for hosting backends. Render has a great free tier for this.

1. Push your project folder (including index.js, package.json, and .gitignore but NOT .env) to a GitHub repository.

2. Sign up for [Render](https://render.com) and create a new "Web Service".

3. Connect the GitHub repository you just created.

4. In the settings:
   - Set the Build Command to `npm install`.
   - Set the Start Command to `npm start`.

5. Go to the "Environment" tab and add your two secret keys:
   - `DISCORD_BOT_TOKEN` with its value.
   - `GEMINI_API_KEY` with its value.

6. Click "Create Web Service". Render will build and deploy your bot!

Other excellent alternatives with free tiers include Railway and Fly.io. The deployment process is very similar.