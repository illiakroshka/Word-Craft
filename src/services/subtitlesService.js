const getSubtitles = require('youtube-captions-scraper');
const { youTubeService } = require("./YouTubeService.js");

const validateYoutubeVideo = async (videoId) => {
  const id = await youTubeService.validateVideoId(videoId);
  if (!id) throw new Error('Video with such id is not found');
  const duration = await youTubeService.validateVideoDuration(videoId,15);
  if (!duration)  throw new Error('Video duration is to long');
  const language = await youTubeService.validateLanguage(videoId);
  if (!language) throw new Error('Video language must be English');
}

const downloadSubtitles = async (videoId) => {
  try {
    await validateYoutubeVideo(videoId);
    const data = await getSubtitles.getSubtitles({
      videoID: videoId,
      lang: 'en',
    })
    let videoText = '';
    for (const chunk of data) {
      videoText+=' '+chunk.text;
    }
    return videoText;
  }catch (error) {
   throw error;
  }
}

module.exports = {
  downloadSubtitles,
}
