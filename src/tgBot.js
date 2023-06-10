'use strict';

const { Telegraf } = require('telegraf');
const config = require('../config/default.json');
const {message} = require("telegraf/filters");

const bot = new Telegraf(config.TELEGRAM_TOKEN);

bot.start(async (ctx)=>{
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
})

bot.action('a1',async (ctx)=>{
  await ctx.reply('Your level is A1');
  await chooseLanguage(ctx);
})
bot.action('a2',async (ctx)=>{
  await ctx.reply('Your level is A2');
  await chooseLanguage(ctx);
})
bot.action('b1',async (ctx)=>{
  await ctx.reply('Your level is B1');
  await chooseLanguage(ctx);
})
bot.action('b2',async (ctx)=>{
  await ctx.reply('Your level is B2');
  await chooseLanguage(ctx);
})
bot.action('c1',async (ctx)=>{
  await ctx.reply('Your level is C1');
  await chooseLanguage(ctx);
})

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

bot.action('ukrainian', async (ctx)=>{
  await ctx.reply('Ukrainian language has been set');
  await chooseTopic(ctx);
})
bot.action('without translation',async (ctx)=>{
  await ctx.reply('You won`t get translation');
  await chooseTopic(ctx);
})

const chooseTopic = async (ctx) => {
  await ctx.reply('Write the topic of words that you want to learn')
}

bot.on(message('text'),async (ctx)=>{
  await ctx.reply(`Prepare word list with topic ${ctx.update.message.text}`);
})

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));