'use strict';

require('dotenv').config({ path: './config/.env' });

class VoiceMessageProcessor {
  async textToSpeech(text) {
    try {
      const url = 'https://play.ht/api/v1/convert';
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          AUTHORIZATION: process.env.PLAYHT_KEY,
          'X-USER-ID': process.env.PLAYHT_USER_ID,
        },
        body: JSON.stringify({
          content: [text],
          voice: 'en-US-JennyNeural',
          transcriptionId: '-Na6LOw_GCKwnPUAXo40',
        }),
      };

      const response = await fetch(url, options);
      return response.json();
    } catch (error) {
      console.error('Error while converting to audio', error);
    }
  }

  async getAudio() {
    try {
      const url = 'https://play.ht/api/v1/articleStatus?transcriptionId=-Na6LOw_GCKwnPUAXo40';
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          AUTHORIZATION: process.env.PLAYHT_KEY,
          'X-USER-ID': process.env.PLAYHT_USER_ID,
        },
      };

      const response = await fetch(url, options);
      return response.json();
    } catch (error) {
      console.error('Error while getting audio', error);
    }
  }

  async processVoiceMessage(text) {
    try {
      const speechResponse = await this.textToSpeech(text);
      const transcriptionId = speechResponse.transcriptionId;

      await new Promise(resolve => setTimeout(resolve, 2000));

      const audioResponse = await this.getAudio(transcriptionId);
      const { converted } = audioResponse;
      if (converted){
        return audioResponse.audioUrl;
      }else {
        return converted
      }
    } catch (error) {
      console.error('Error while processing audio', error);
    }
  }
}

const voiceMessageProcessor = new VoiceMessageProcessor();

module.exports = { voiceMessageProcessor };