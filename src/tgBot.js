'use strict';

const { Telegraf } = require('telegraf');
const config = require('../config/default.json');
const {message} = require("telegraf/filters");

const bot = new Telegraf(config.TELEGRAM_TOKEN);

const parameters = {};

const receiveParameter = (parameterName, parameterValue) => {
    parameters[parameterName] = parameterValue;
}

const handleLevelAction = async (ctx) => {
  const level = ctx.match[0].toUpperCase();
  await ctx.reply(`Your level is ${level}`);
  receiveParameter('level', level);
  await chooseLanguage(ctx);
};

const chooseLevel = async (ctx) => {
  await ctx.reply('What is your level of English?',{
    reply_markup:{
      inline_keyboard:[
        [
          {
            text: 'A1',
            callback_data: 'a1'
          },
          {
            text: 'A2',
            callback_data: 'a1'
          },
          {
            text: 'B1',
            callback_data: 'b1'
          },
          {
            text: 'B2',
            callback_data: 'b2'
          },
          {
            text: 'C1',
            callback_data: 'c1'
          },
        ],
      ]
    }
  })
}

const chooseLanguage = async (ctx) =>{
  await ctx.reply('To which language to translate?',{
    reply_markup:{
      inline_keyboard: [
        [
          {
            text: 'Ukrainian',
            callback_data: 'ukrainian'
          },
          {
            text: 'Without translation',
            callback_data: 'without translation'
          }
        ]
      ]
    }
  })
}

const chooseTopic = async (ctx) => {
  await ctx.reply('Write the topic of words that you want to learn')
}

bot.start(async (ctx)=>{
  await chooseLevel(ctx);
})

bot.action(/^[abc][1-2]$/, handleLevelAction);

bot.action('ukrainian', async (ctx)=>{
  await ctx.reply('Ukrainian language has been set');
  receiveParameter('language','Ukrainian');
  await chooseTopic(ctx);
})
bot.action('without translation',async (ctx)=>{
  await ctx.reply('You won`t get translation');
  receiveParameter('language','without translation');
  await chooseTopic(ctx);
})

bot.on(message('text'),async (ctx)=>{
  await ctx.reply(`Prepare word list with topic ${ctx.update.message.text}`);
  receiveParameter('topic', ctx.update.message.text);
  console.log(parameters);
})

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));