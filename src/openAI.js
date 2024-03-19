'use strict';

const OpenAI = require("openai")
require('dotenv').config({ path: './config/.env' });

class OpenAi {
  roles = {
    ASSISTANT: 'assistant',
    SYSTEM: 'system',
    USER: 'user',
  }

  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
  }

  async chat(messages){
    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.CHAT_GPT_MODEL,
        messages,
      });
      return response.choices[0].message
    }catch (err){
      console.log('Error in OpenAI', err.message);
    }
  }

  async audio (message){
    message = this.replaceNumbers(message);
    const mp3 = await this.openai.audio.speech.create({
      model: process.env.CHAT_GPT_AUDIO_MODEL,
      voice: process.env.CHAT_GPT_VOICE,
      input: message,
    });
    return Buffer.from(await mp3.arrayBuffer());
  }

  replaceNumbers (string) {
    return string.replace(/\d+/g, ',');
  }
}

const openAI = new OpenAi(process.env.OPENAI_KEY);

module.exports = { openAI };