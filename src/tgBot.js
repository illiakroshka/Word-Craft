'use strict';

const { Telegraf, session } = require('telegraf');
const config = require('../config/default.json');
const { Markup } = require('telegraf');
const { message } = require('telegraf/filters');
const { code } = require('telegraf/format')
const { openAI } = require('./openAI');

const INITIAL_SESSION = {
  messages: [],
}

const bot = new Telegraf(config.TELEGRAM_TOKEN);

bot.use(session());

const parameters = {
  isTopicSelected: false,
};

const receiveParameter = (parameterName, parameterValue) => {
    parameters[parameterName] = parameterValue;
}

const createPrompt = ({ level, language, topic }) => {
  if (!level || !language || !topic) {
    return 'Error';
  }

  if (language === 'without translation') {
    return `Can you send ${level} level words that are used in the topic of ${topic}.`;
  }

  return `Can you send ${level} level words that are used in the topic of ${topic}.\n
  Send me the response in format (english word - translation in ${language})`;
};

const improveListPrompt = ({ level }) => {
  if (!level) {
    return 'Error';
  }
  return `In the previous answer, the words did not correspond to level ${level}. 
  Regenerate the word list. And send only words`;
}

const sendPrompt = async (ctx , text) => {
  ctx.session.messages.push({ role: openAI.roles.USER, content: text });
  const response = await openAI.chat(ctx.session.messages);
  ctx.session.messages.push({ role: openAI.roles.ASSISTANT, content: response.content })
  return response.content
}

const handleLevelAction = async (ctx) => {
  const level = ctx.match[0].toUpperCase();
  await ctx.reply(code(`Level ${level} has been set`));
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
  await ctx.reply('Write the topic of words that you want to learn');
  parameters.isTopicSelected = true;
}

bot.start(async (ctx) => {
  const welcomeMessage = `Welcome to the bot, ${ctx.from.first_name}!`;
  const menuOptions = Markup.keyboard([
    ['/runBot'],
    ['/changeTopic', '/regenerateList'],
    ['/help', '/info'],
  ]).resize();

  await ctx.reply(welcomeMessage, menuOptions);
})

bot.command('runBot', async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await chooseLevel(ctx);
});

bot.command('changeTopic',async (ctx) => {
  if (parameters.level && parameters.language){
    await chooseTopic(ctx);
  }else{
    await ctx.reply('Set your English level and to which language to translate first.')
  }
});

bot.command('info',async (ctx) => {
 await ctx.reply('This bot is used to generate word lists on a specific topic for a specific level of English.' +
   'Also you can choose the language in which to translate these words.\n' +
   '/help - command for navigation')
})

bot.command('help', async (ctx) => {
  await ctx.reply('/changeTopic - is used to change topic \n' +
    '/info - information about bot \n' +
    '/runBot - to run the bot \n' +
    '/regenerateList - to regenerate list if you know most of the words')
})

bot.command('regenerateList', async (ctx) => {
  const { language, level, topic } = parameters;

  if (language && level && topic) {
    ctx.session ??= INITIAL_SESSION;
    await ctx.reply(code('Regenerating your word list'));
    const prompt = improveListPrompt(parameters);
    console.log(prompt);
    const reply = await sendPrompt(ctx, prompt);
    await ctx.reply(reply);
  }else{
    await ctx.reply('You can not regenerate defunct word list');
  }
})

bot.action(/^[abc][1-2]$/, handleLevelAction);

bot.action('ukrainian', async (ctx)=>{
  await ctx.reply(code('Ukrainian language has been set'));
  receiveParameter('language','Ukrainian');
  await chooseTopic(ctx);
})

bot.action('without translation',async (ctx)=>{
  await ctx.reply(code('You won`t get translation'));
  receiveParameter('language','without translation');
  await chooseTopic(ctx);
})

bot.on(message('text'),async (ctx)=>{
  if (!parameters.isTopicSelected) {
    await ctx.reply(code('Wrong input'));
  } else {
    ctx.session ??= INITIAL_SESSION;
    await ctx.reply(code(`Prepare word list with topic ${ctx.update.message.text}`));
    receiveParameter('topic', ctx.update.message.text);
    const prompt = createPrompt(parameters);
    console.log(prompt);
    const reply = await sendPrompt(ctx, prompt);
    await ctx.reply(reply);
    parameters.isTopicSelected = false;
  }
})

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));