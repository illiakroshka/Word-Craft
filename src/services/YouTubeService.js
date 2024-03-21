const {google} = require('googleapis');
require('dotenv').config({ path: './config/.env' });


class YouTubeService {
  constructor(apiKey) {
    this.youtube = google.youtube({
      version: 'v3',
      auth: apiKey,
    })
  }

  #languageCodes = {
    'en': 'English',
    'en-GB': 'English (United Kingdom)',
    'en-IN': 'English (India)',
  }

  async validateVideoId (videoId) {
    try {
      const videoData=  await this.youtube.videos.list({
        part: 'snippet',
        id: videoId
      });
      return videoData.data.items.length > 0;
    } catch (error) {
      console.error('Error validating video ID:', error.message);
      return false;
    }
  }

  async validateLanguage  (videoId) {
    try {
      const captions = await this.youtube.captions.list({
        part: 'snippet',
        videoId,
      });
      return captions.data.items.some((item) =>
        item.snippet.language in this.#languageCodes
      )
    } catch (error) {
      console.error('Error downloading subtitles:', error.message);
      return false;
    }
  }

  async validateVideoDuration (videoId, maxDuration) {
    try {
      const response = await this.youtube.videos.list({
        part: 'contentDetails',
        id: videoId,
      })
      const duration = response.data.items[0].contentDetails.duration;
      const durationRegex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
      const matches = duration.match(durationRegex);
      let totalMinutes = 0;

      if (matches) {
        const hours = parseInt(matches[1]) || 0;
        const minutes = parseInt(matches[2]) || 0;
        const seconds = parseInt(matches[3]) || 0;

        totalMinutes = hours * 60 + minutes + Math.ceil(seconds / 60);
      }
      return totalMinutes <= maxDuration;
    }catch (err) {
      console.error('Error fetching video duration:', err);
      return false;
    }
  }
}

const youTubeService = new YouTubeService(process.env.GOOGLE_API_KEY);

module.exports = {
  youTubeService,
}