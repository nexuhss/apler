require('dotenv').config();
const ytdl = require('ytdl-core');
const { YoutubeTranscript } = require('youtube-transcript');
const { getSubtitles } = require('youtube-captions-scraper');

// Simplified version of the summarizeYouTubeVideo function for testing
async function testSummarizeYouTubeVideo(videoUrl) {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) {
    return 'YouTube API is not configured.';
  }

  try {
    // Extract video ID
    const videoIdMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/);
    if (!videoIdMatch) {
      return 'Invalid YouTube URL.';
    }
    const videoId = videoIdMatch[1];
    console.log(`Testing video ID: ${videoId}`);

    // Get video details
    const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${YOUTUBE_API_KEY}&part=snippet,contentDetails`;
    const videoResponse = await fetch(videoDetailsUrl);
    const videoData = await videoResponse.json();

    if (videoData.error) {
      console.error('YouTube API error:', videoData.error);
      return `YouTube API error: ${videoData.error.message}`;
    }

    if (!videoData.items || videoData.items.length === 0) {
      return 'Video not found.';
    }

    const video = videoData.items[0];
    const title = video.snippet.title;
    console.log(`Found video: "${title}"`);

    // Try to get transcript using multiple methods
    let transcript = '';

    // First try youtube-captions-scraper
    try {
      console.log('Trying youtube-captions-scraper...');
      const captions = await getSubtitles({
        videoID: videoId,
        lang: 'en'
      });

      if (captions && captions.length > 0) {
        transcript = captions.map(caption => caption.text).join(' ');
        console.log(`✓ youtube-captions-scraper: ${transcript.length} characters`);
      } else {
        console.log('✗ youtube-captions-scraper: empty captions');
        throw new Error('Empty captions');
      }
    } catch (scraperError) {
      console.log('youtube-captions-scraper failed:', scraperError.message);

      // Fallback: try youtube-transcript
      try {
        console.log('Trying youtube-transcript...');
        const transcriptData = await YoutubeTranscript.fetchTranscript(videoId, {
          lang: 'en',
          country: 'US'
        });

        if (transcriptData && transcriptData.length > 0) {
          transcript = transcriptData.map(item => item.text).join(' ');
          console.log(`✓ youtube-transcript: ${transcript.length} characters`);
        } else {
          console.log('✗ youtube-transcript: empty data');
          throw new Error('Empty transcript data');
        }
      } catch (transcriptError) {
        console.log('youtube-transcript failed:', transcriptError.message);

        // Final fallback: try ytdl-core
        try {
          console.log('Trying ytdl-core...');
          const info = await ytdl.getInfo(videoId);
          const tracks = info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

          if (tracks && tracks.length > 0) {
            const track = tracks.find(t => t.languageCode === 'en' || t.languageCode.startsWith('en')) || tracks[0];
            console.log(`Found caption track: ${track.name?.simpleText || track.languageCode}`);

            const captionResponse = await fetch(track.baseUrl);
            const captionXml = await captionResponse.text();

            const textMatches = captionXml.match(/<text[^>]*>([^<]+)<\/text>/g);
            if (textMatches) {
              transcript = textMatches
                .map(match => match.replace(/<[^>]+>/g, '')
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'")
                  .replace(/&apos;/g, "'"))
                .join(' ');
              console.log(`✓ ytdl-core: ${transcript.length} characters`);
            } else {
              console.log('✗ ytdl-core: no text matches in XML');
            }
          } else {
            console.log('✗ ytdl-core: no caption tracks');
          }
        } catch (ytdlError) {
          console.log('ytdl-core failed:', ytdlError.message);
        }
      }
    }

    return {
      title,
      transcriptLength: transcript.length,
      hasTranscript: transcript.length > 0,
      transcript: transcript.substring(0, 200) + (transcript.length > 200 ? '...' : '')
    };

  } catch (error) {
    console.error('Test error:', error);
    return `Failed: ${error.message}`;
  }
}

// Test with videos that are more likely to have transcripts
async function runTests() {
  const testUrls = [
    'https://www.youtube.com/watch?v=5MgBikgcWnY', // Kurzgesagt video (educational, likely has captions)
    'https://www.youtube.com/watch?v=0zvrGiPkVcs', // TED-Ed video
    'https://www.youtube.com/watch?v=Unzc731iCUY', // Vsauce video
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Roll (music video, may not have transcripts)
  ];

  for (const url of testUrls) {
    console.log(`\n=== Testing: ${url} ===`);
    const result = await testSummarizeYouTubeVideo(url);
    console.log('Result:', result);
  }
}

runTests();