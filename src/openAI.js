'use strict';

const { Configuration, OpenAIApi } = require("openai");
const config = require('../config/default.json');

class OpenAI {
  constructor(apiKey) {
    const configuration = new Configuration({
      apiKey: apiKey,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async chat(messages){
    try {
      const response = await this.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages,
      });
      return response.data.choices[0].message
    }catch (err){
      console.log(err.message);
    }
  }
}

const openAI = new OpenAI(config.OPENAI_KEY);

module.exports = {openAI};
