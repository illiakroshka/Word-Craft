'use strict';

const { Telegraf, session } = require('telegraf');
const { Markup } = require('telegraf');
const { message } = require('telegraf/filters');
const { code } = require('telegraf/format')
const { openAI } = require('./openAI');
const config = require('../config/default.json');
const botReplies = require('../config/botReplies.json');

const INITIAL_SESSION = {
  messages: [],
}

const bot = new Telegraf(config.TELEGRAM_TOKEN);

bot.use(session());

const parameters = {
  isTopicSelected: false,
  isPromptRunning: false,
  botLanguage: botReplies.en,
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
  receiveParameter('level', level);
  await chooseLanguage(ctx);
};

const chooseLevel = async (ctx) => {
  await ctx.reply(parameters.botLanguage.level,{
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
  await ctx.reply(parameters.botLanguage.language,{
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

const setBotLanguage = async (ctx) => {
  await ctx.reply('Set bot language',{
    reply_markup:{
      inline_keyboard:[
        [
          {
            text: 'English',
            callback_data: 'en'
          },
          {
            text: 'Ukrainian (demo)',
            callback_data: 'ukr'
          }
        ]
      ]
    }
  })
}

const chooseTopic = async (ctx) => {
  await ctx.reply(`${parameters.botLanguage.topic}\n`+
  `${parameters.botLanguage.topicInfo}`);
  parameters.isTopicSelected = true;
}

bot.start(async (ctx) => {
  if (ctx.from.language_code === 'ru'){
    parameters.botLanguage = botReplies.ukr;
  }
  const welcomeMessage = `${parameters.botLanguage.welcome}, ${ctx.from.first_name}!\n`+
  `${parameters.botLanguage.introduction}`;
  const menuOptions = Markup.keyboard([
    ['/runBot'],
    ['/changeTopic', '/regenerateList'],
    ['/help', '/info','/setBotLanguage'],
  ]).resize();

  await ctx.reply(welcomeMessage, menuOptions);
})

bot.command('runBot', async (ctx) => {
  if (parameters.isPromptRunning) {
    return;
  }
  ctx.session = INITIAL_SESSION;
  await chooseLevel(ctx);
});

bot.command('setBotLanguage',async (ctx) => {
  if (parameters.isPromptRunning) {
    return;
  }
  await setBotLanguage(ctx);
})

bot.command('changeTopic',async (ctx) => {
  if (parameters.isPromptRunning) {
    return;
  }
  if (parameters.level && parameters.language){
    await chooseTopic(ctx);
  }else{
    await ctx.reply(parameters.botLanguage.changeTopicErr)
  }
});

bot.command('info',async (ctx) => {
  if (parameters.isPromptRunning) {
    return;
  }
 await ctx.reply(parameters.botLanguage.info)
})

bot.command('help', async (ctx) => {
  if (parameters.isPromptRunning) {
    return;
  }
  await ctx.reply(parameters.botLanguage.help)
})

bot.command('setInput',async (ctx) => {
  parameters.isPromptRunning = false;
  await ctx.reply(code(parameters.botLanguage.inputAck));
})

bot.command('regenerateList', async (ctx) => {
  if (parameters.isPromptRunning) {
    return;
  }
  const { language, level, topic } = parameters;

  if (language && level && topic) {
    ctx.session ??= INITIAL_SESSION;
    await ctx.reply(code(`${parameters.botLanguage.ackReg}. ${parameters.botLanguage.warning}`));
    const prompt = improveListPrompt(parameters);
    console.log(prompt);
    parameters.isPromptRunning = true;
    const reply = await sendPrompt(ctx, prompt);
    await ctx.reply(reply);
    await ctx.reply(`/setInput - ${parameters.botLanguage.activeInput}`);
  }else{
    await ctx.reply(code(`${parameters.botLanguage.RegErr}`));
  }
})

bot.command('topics', async (ctx) => {
  if (parameters.isPromptRunning) {
    return;
  }
  const { level } = parameters;
  if (level){
    const topicList = parameters.botLanguage.topics[level].join('\n');
    await ctx.reply(`${parameters.botLanguage.topicsR}\n`+
    `${topicList}`)
  }else {
    await ctx.reply(parameters.botLanguage.topicsErr);
  }
});

bot.action('ukr', async (ctx) => {
  parameters.botLanguage = botReplies.ukr;
  await ctx.reply(code('Бот переведено на Українську мову'))
})

bot.action('en', async (ctx) => {
  parameters.botLanguage = botReplies.en;
  await ctx.reply(code('Bot has been translated to English'))
})

bot.action(/^[abc][1-2]$/, handleLevelAction);

bot.action('ukrainian', async (ctx)=>{
  receiveParameter('language','Ukrainian');
  await chooseTopic(ctx);
})

bot.action('without translation',async (ctx)=>{
  receiveParameter('language','without translation');
  await chooseTopic(ctx);
})

bot.on(message('text'), async (ctx) => {
  if (parameters.isPromptRunning) {
    return;
  }
  if (!parameters.isTopicSelected) {
    await ctx.reply(code(parameters.botLanguage.inputErr));
  } else {
    ctx.session ??= INITIAL_SESSION;
    await ctx.reply(code(`${parameters.botLanguage.ack} ${ctx.update.message.text}. ${parameters.botLanguage.warning}`));
    receiveParameter('topic', ctx.update.message.text);
    const prompt = createPrompt(parameters);
    console.log(prompt);

    parameters.isPromptRunning = true;

    const reply = await sendPrompt(ctx, prompt);
    await ctx.reply(reply);
    await ctx.reply(`/setInput - ${parameters.botLanguage.activeInput}`);
    parameters.isTopicSelected = false;
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));