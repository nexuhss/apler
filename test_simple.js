require('dotenv').config();

// Test the new YouTube function approach
async function testNewApproach() {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  const videoId = 'dQw4w9WgXcQ'; // Rick Roll

  try {
    // Get comprehensive video details
    const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${YOUTUBE_API_KEY}&part=snippet,contentDetails,statistics`;
    const videoResponse = await fetch(videoDetailsUrl);
    const videoData = await videoResponse.json();

    if (!videoData.items || videoData.items.length === 0) {
      console.log('Video not found');
      return;
    }

    const video = videoData.items[0];
    const title = video.snippet.title;
    const description = video.snippet.description;
    const channelTitle = video.snippet.channelTitle;
    const publishedAt = video.snippet.publishedAt;
    const tags = video.snippet.tags || [];
    const viewCount = video.statistics?.viewCount || 'N/A';
    const likeCount = video.statistics?.likeCount || 'N/A';

    console.log('✅ Successfully retrieved video metadata:');
    console.log(`Title: ${title}`);
    console.log(`Channel: ${channelTitle}`);
    console.log(`Views: ${parseInt(viewCount).toLocaleString()}`);
    console.log(`Likes: ${parseInt(likeCount).toLocaleString()}`);
    console.log(`Published: ${new Date(publishedAt).toLocaleDateString()}`);
    console.log(`Tags: ${tags.slice(0, 3).join(', ')}`);
    console.log(`Description length: ${description.length} characters`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNewApproach();