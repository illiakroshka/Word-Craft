'use strict';

const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config({ path: './config/.env' });

const CHAT_GPT_MODEL = 'gpt-3.5-turbo-0301';

class OpenAI {
  roles = {
    ASSISTANT: 'assistant',
    SYSTEM: 'system',
    USER: 'user',
  }

  constructor(apiKey) {
    const configuration = new Configuration({
      apiKey: apiKey,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async chat(messages){
    try {
      const response = await this.openai.createChatCompletion({
        model: CHAT_GPT_MODEL,
        messages,
      });
      return response.data.choices[0].message
    }catch (err){
      console.log('Error in OpenAI', err.message);
    }
  }
}

const openAI = new OpenAI(process.env.OPENAI_KEY);

module.exports = {openAI};
