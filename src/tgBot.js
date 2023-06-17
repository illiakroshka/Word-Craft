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

const topics = {
  A1: ['Food', 'Animals', 'Family', 'Daily routine', 'Clothes'],
  A2: ['Hobbies', 'Places', 'Jobs', 'Describing people', 'House'],
  B1: ['Education','Health','Travel', 'Music', 'Transportation'],
  B2: ['Business','Environment','Relationships','Politics','Media and entertainment'],
  C1: ['Global issues', 'Economics', 'Science and technology','Critical thinking','Psychology']
};

const receiveParameter = (parameterName, parameterValue) => {
    parameters[parameterName] = parameterValue;
}

const createPrompt = ({ level, language, topic }) => {
  if (!level || !language || !topic) {
    return 'Error';
  }

  if (language === 'without translation') {
    return `Your output should use the following template:
    Word list
    [English word]
    [English word]
    
    Your task is to generate a list of 15 words that are related to ${topic} for ${level} level of English.`;
  }

  return `Your output should use the following template:
  Word list
  [English word] - [translation in ${language}]

  Your task is to generate a list of 15 words that are related to ${topic} for ${level} level of English. 
  And to translate these words in ${language} language. `;
};

const improveListPrompt = ({ language }) => {
  if (!language) {
    return 'Error';
  }
  if (language === 'without translation') {
    return `Your output should use the following template:
    Word list
    [English word]
    [English word]
    
    Your task is to regenerate the previous list of words by replacing the previous words with new ones.`;
  }
  return `Your output should use the following template:
    Word list
    [English word] - [translation in ${language}]
    
    Your task is to regenerate the previous list of words by replacing the previous words with new ones.`;
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
  await ctx.reply('Write the topic of words that you want to learn\n'+
  '/topics - suggests popular example topics for your level');
  parameters.isTopicSelected = true;
}

bot.start(async (ctx) => {
  const welcomeMessage = `Welcome to the bot, ${ctx.from.first_name}!\n`+
  `This bot is used to generate word lists on a specific topic for a specific level of English.\n`+
  `/runBot - to run the bot\n` +
  `/help - commands navigation`;
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
  await ctx.reply(
    '/runBot - to run the bot \n' +
    '/changeTopic - to change topic \n' +
    '/topics - suggests popular example topics for your level \n' +
    '/regenerateList - to regenerate list if you know most of the words \n'+
    '/info - information about bot ')
})

let isPromptRunning = false;
const requestQueue = [];

bot.command('regenerateList', async (ctx) => {
  if (isPromptRunning) {
    requestQueue.unshift(ctx);
    return;
  }
  const { language, level, topic } = parameters;

  if (language && level && topic) {
    ctx.session ??= INITIAL_SESSION;
    await ctx.reply(code('Regenerating your word list'));
    const prompt = improveListPrompt(parameters);
    console.log(prompt);
    isPromptRunning = true;
    const reply = await sendPrompt(ctx, prompt);
    await ctx.reply(reply);
    isPromptRunning = false;
    processRequestQueue();
  }else{
    await ctx.reply('You can not regenerate defunct word list');
  }
})

bot.command('topics', async (ctx) => {
  const { level } = parameters;
  if (level){
    const topicList = topics[level].join('\n');
    await ctx.reply(`Topics you might be interested in:\n`+
    `${topicList}`)
  }else {
    await ctx.reply('Set your English level first');
  }
});

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

bot.on(message('text'), async (ctx) => {
  if (isPromptRunning) {
    requestQueue.unshift(ctx);
    return;
  }

  if (!parameters.isTopicSelected) {
    await ctx.reply(code('Wrong input'));
  } else {
    ctx.session ??= INITIAL_SESSION;
    await ctx.reply(code(`Prepare word list with topic ${ctx.update.message.text}, it can take some time`));
    receiveParameter('topic', ctx.update.message.text);
    const prompt = createPrompt(parameters);
    console.log(prompt);

    isPromptRunning = true;

    const reply = await sendPrompt(ctx, prompt);
    await ctx.reply(reply);

    isPromptRunning = false;

    parameters.isTopicSelected = false;

    processRequestQueue();
  }
});

const processRequestQueue = async () => {
  if (requestQueue.length > 0 && !isPromptRunning) {
    isPromptRunning = true;

    const ctx = requestQueue.shift();
    await bot.handleUpdate(ctx.update);

    isPromptRunning = false;

    processRequestQueue();
  }
};

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));