'use strict';

const { Telegraf, Markup } = require('telegraf');
const { message } = require('telegraf/filters');
const { code } = require('telegraf/format')
const { openAI } = require('./openAI');
const config = require('../config/default.json');
const i18n = require('../config/i18n.json');
const commands = require('../config/commands.json');
const prompts = require('./aiPromptUtils');
const db = require('../database/database');

const REQUEST_INCREMENT = 1;
const REQUEST_DECREMENT = 1;
const DEFAULT_FREE_REQUESTS = 14;

const bot = new Telegraf(config.TELEGRAM_TOKEN);

const parameters = {
  isTopicSelected: false,
  definition: false,
  botLanguage: "en",
  level: '',
  language: '',
  topic: '',
};

const durationOptions  = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
  refuse: 0,
}

const sendPrompt = (ctx, text) => {
  return new Promise(async (resolve, reject) => {
    try {
      const messages = [{ role: openAI.roles.USER, content: text }];
      const response = await openAI.chat(messages);
      resolve(response.content);
    } catch (error) {
      reject(error);
    }
  });
};


const handleLevelAction = async (ctx) => {
  await db.updateUserData('level',ctx.match[0].toUpperCase(),ctx.from.id);
  await chooseLanguage(ctx);
};

const chooseLevel = async (ctx) => {
  await ctx.reply(i18n.level[await db.getBotLanguage(ctx.from.id)],{
    reply_markup:{
      inline_keyboard:[
        [
          { text: 'A1', callback_data: 'a1' },
          { text: 'A2', callback_data: 'a1' },
          { text: 'B1', callback_data: 'b1' },
          { text: 'B2', callback_data: 'b2' },
          { text: 'C1', callback_data: 'c1' },
        ],
      ]
    }
  })
}

const chooseLanguage = async (ctx) =>{
  const botLanguage = await db.getBotLanguage(ctx.from.id);
  await ctx.reply(i18n.language[botLanguage],{
    reply_markup:{
      inline_keyboard: [
        [
          { text: i18n.ukrButton[botLanguage], callback_data: 'ukrainian' },
          { text: i18n.wtButton[botLanguage], callback_data: 'without translation' }
        ]
      ]
    }
  })
}

const queryDefinition = async (ctx) => {
  const botLanguage = await db.getBotLanguage(ctx.from.id);
  await ctx.reply(`${i18n.definitions[botLanguage]}`, {
    reply_markup:{
      inline_keyboard: [
        [
          { text: i18n.yesButton[botLanguage], callback_data: 'defTrue' },
          { text: i18n.noButton[botLanguage], callback_data: 'defFalse' }
        ]
      ]
    }
  })
}

const setBotLanguage = async (ctx) => {
  const botLanguage = await db.getBotLanguage(ctx.from.id);
  await ctx.reply(`${i18n.botLang[botLanguage]}`,{
    reply_markup:{
      inline_keyboard:[
        [
          { text: i18n.engButton[botLanguage], callback_data: 'en' },
          { text: i18n.ukrButton[botLanguage], callback_data: 'ukr' }
        ]
      ]
    }
  })
}

const setSubscription = async (ctx, userId) => {
  const adminId = 382588668;
  await bot.telegram.sendMessage(adminId, `Set subscription for user ${userId}`,{
    reply_markup:{
      inline_keyboard:[
        [
          {text: 'Day', callback_data: `day:${userId}`},
          {text: 'Week', callback_data: `week:${userId}`},
          {text: 'Month', callback_data: `month:${userId}`},
          {text: 'Year', callback_data: `year:${userId}`},
          {text: 'Refuse', callback_data: `refuse:${userId}`}
        ]
      ]
    }
  })
}

const chooseTopic = async (ctx) => {
  const botLanguage = await db.getBotLanguage(ctx.from.id);
  await ctx.reply(`${i18n.topic[botLanguage]}\n`+
  `${i18n.topicInfo[botLanguage]}`);
  await db.updateUserFlag('isTopicSelected',true, ctx.from.id);
}

bot.start(async (ctx) => {
  const userExists = await db.checkUser(ctx.from.id);

  if (!userExists) {
    await db.insertUser(parameters, ctx.from.id, DEFAULT_FREE_REQUESTS);
  } else {
    await db.resetUserData(ctx.from.id);
  }

  if (ctx.from.language_code === 'ru' || ctx.from.language_code === 'uk'){
    await db.updateUserBotLanguage(ctx.from.id,"ukr");
  }
  const botLanguage = await db.getBotLanguage(ctx.from.id);

  const welcomeMessage = `${i18n.greeting[botLanguage]}, ${ctx.from.first_name}!\n`+
  `${i18n.introduction[botLanguage]}`;
  const boldText = welcomeMessage.replace(/(•\s*)(.*?) -/g, '$1*$2* -');
  const menuOptions = Markup.keyboard(i18n.menuOptions[botLanguage]).resize();

  await ctx.replyWithMarkdown(boldText, menuOptions);
})

bot.hears(commands.runBot, async (ctx) => {
  await db.resetUserData(ctx.from.id);
  await chooseLevel(ctx);
});

bot.hears(commands.botLanguage, async (ctx) => {
  await setBotLanguage(ctx);
})

bot.hears(commands.changeTopic,async (ctx) => {
  const {level, language} = await db.getUserData(ctx.from.id);
  if (level && language){
    await chooseTopic(ctx);
  }else{
    await ctx.reply(i18n.changeTopicErr[await db.getBotLanguage(ctx.from.id)])
  }
});

bot.hears(commands.info, async (ctx) => {
  const botLanguage = await db.getBotLanguage(ctx.from.id);
  const infoText = i18n.info[botLanguage];
  const boldText = infoText.replace(/(•\s*)(.*?) -/g, '$1*$2* -');
  await ctx.replyWithMarkdown(boldText);
})

bot.hears(commands.help, async (ctx) => {
  const botLanguage = await db.getBotLanguage(ctx.from.id);
  const helpText = i18n.help[botLanguage];
  const boldText = helpText.replace(/(•\s*)(.*?) -/g, '$1*$2* -');
  await ctx.replyWithMarkdown(boldText);
});

bot.hears(commands.regenerate, async (ctx) => {
  const botLanguage = await db.getBotLanguage(ctx.from.id);
  const userData = await db.getUserData(ctx.from.id);
  const freeRequests = await db.getUserFreeRequests(ctx.from.id);
  const { language, level, topic } = userData;

  if (!language || !level || !topic){
    await ctx.reply(code(`${i18n.RegErr[botLanguage]}`));
  }else if(!freeRequests){
    await ctx.reply(i18n.freeRequestsErr[botLanguage])
  }else {
    await ctx.reply(code(`${i18n.ackReg[botLanguage]}. ${i18n.warning[botLanguage]}`));
    const prompt = prompts.improveListPrompt(userData);
    console.log(prompt);
    try {
      sendPrompt(ctx, prompt)
        .then(reply => {
          ctx.reply(reply);
          db.incrementRequests(ctx.from.id, REQUEST_INCREMENT);
          db.decrementFreeRequests(ctx.from.id, REQUEST_DECREMENT);
        })
        .catch(err => {
          ctx.reply(`${i18n.genErr[botLanguage]}`);
        });
    }catch (err){
      await ctx.reply(`${i18n.genErr[botLanguage]}`);
    }
  }
})

bot.command('topics', async (ctx) => {
  const botLanguage = await db.getBotLanguage(ctx.from.id);
  const { level } = await db.getUserData(ctx.from.id);

  if (level) {
    const topicList = i18n.topics[botLanguage][level].map(topic => `\`${topic}\``).join('\n');
    await ctx.replyWithMarkdownV2(`${i18n.topicsR[botLanguage]}\n${topicList}`);
  } else {
    await ctx.reply(i18n.topicsErr[botLanguage]);
  }
});

bot.hears(commands.profile, async (ctx) => {
  const botLanguage = await db.getBotLanguage(ctx.from.id);
  const requests = await db.getUserRequests(ctx.from.id);
  const freeRequests = await db.getUserFreeRequests(ctx.from.id);
  const subscriptionDetails = await db.getSubscriptionDetails(ctx.from.id);
  let replyMessage = `${i18n.idMessage[botLanguage]} \`${ ctx.from.id }\`\n\n` +
  `${i18n.requests[botLanguage]} ${requests}\n\n` +
    `${i18n.freeRequestsStatus[botLanguage]} ${freeRequests}\n\n`;
  if (!subscriptionDetails){
    replyMessage += `${i18n.subscriptionMessage[botLanguage]} ${i18n.subscriptionInactive[botLanguage]}`;
  }else {
    const { end_date, premium_subscription } = subscriptionDetails;
    if (premium_subscription) {
      replyMessage += `${i18n.subscriptionMessage[botLanguage]} ${i18n.subscriptionActive[botLanguage]}\n\n`;
      replyMessage += `${i18n.endDateMessage[botLanguage]} ${end_date}`;
    }else {
      replyMessage += `${i18n.subscriptionMessage[botLanguage]} ${i18n.subscriptionInactive[botLanguage]}\n\n`;
    }
  }
  ctx.replyWithMarkdown(replyMessage);
});

bot.hears('premium', async (ctx) => {
  const botLanguage = await db.getBotLanguage(ctx.from.id);
  await ctx.reply(i18n.premiumSubscription[botLanguage]);
})

bot.action('defTrue', async (ctx) => {
  await db.updateUserFlag('definition', true, ctx.from.id);
  await chooseTopic(ctx);
})

bot.action('defFalse', async (ctx) => {
  await db.updateUserFlag('definition', false, ctx.from.id);
  await chooseTopic(ctx);
})

bot.action('ukr', async (ctx) => {
  await db.updateUserBotLanguage(ctx.from.id,"ukr");
  const botLanguage = await db.getBotLanguage(ctx.from.id);
  const menuOptions = Markup.keyboard(i18n.menuOptions[botLanguage]).resize();
  await ctx.reply(code('Бот переведено на Українську мову'), menuOptions);
})

bot.action('en', async (ctx) => {
  await db.updateUserBotLanguage(ctx.from.id,"en");
  const botLanguage = await db.getBotLanguage(ctx.from.id);
  const menuOptions = Markup.keyboard(i18n.menuOptions[botLanguage]).resize();
  await ctx.reply(code('Bot has been translated to English'),menuOptions);
})

bot.action(/^[abc][1-2]$/, handleLevelAction);

bot.action('ukrainian', async (ctx)=>{
  await db.updateUserData('language','Ukrainian',ctx.from.id);
  await chooseTopic(ctx);
})

bot.action('without translation',async (ctx)=>{
  await db.updateUserData('language','without translation',ctx.from.id);
  await queryDefinition(ctx);
})

bot.action(/(day|week|month|year|refuse):(.+)/, async (ctx) => {
  const action = ctx.match[1];
  const userId = ctx.match[2];
  const subscription = durationOptions[action];
  if (subscription){
    const userExists = await db.checkUserPremium(userId);
    if (!userExists) {
      const startDay = new Date();
      const startDayString = startDay.toISOString().slice(0, 10);
      const endDate = new Date();
      endDate.setDate(startDay.getDate() + subscription);
      const endDateString = endDate.toISOString().slice(0, 10);
      await db.insertUserPremium(userId, startDayString, subscription, endDateString, true);
      await bot.telegram.sendMessage(userId, `You subscription for ${action} is active`);
    } else {
      const startDay = new Date();
      const startDayString = startDay.toISOString().slice(0, 10);
      const endDate = new Date();
      endDate.setDate(startDay.getDate() + subscription);
      const endDateString = endDate.toISOString().slice(0, 10);
      await db.updateUserPremium(userId, startDayString, subscription, endDateString, true);
      await bot.telegram.sendMessage(userId, `You subscription for ${action} is active`);
    }
  }else{
    await bot.telegram.sendMessage(userId, `You request for subscription has been refused`);
  }
  console.log(`${subscription} User: ${userId}`);
});

bot.on(message('text'), async (ctx) => {
  const topicStatus = await db.getUserFlag('isTopicSelected',ctx.from.id);
  const botLanguage = await db.getBotLanguage(ctx.from.id);
  const freeRequests = await db.getUserFreeRequests(ctx.from.id);
  if (!topicStatus) {
    await ctx.reply(code(i18n.inputErr[botLanguage]));
  }else if(!freeRequests){
    await ctx.reply(i18n.freeRequestsErr[botLanguage])
  }else {
    await ctx.reply(code(`${i18n.ack[botLanguage]} ${ctx.update.message.text}. ${i18n.warning[botLanguage]}`));
    await db.updateUserData('topic', ctx.update.message.text, ctx.from.id);
    const prompt = prompts.createPrompt( await db.getUserData(ctx.from.id));
    console.log(prompt);

    try {
      sendPrompt(ctx, prompt)
        .then(reply => {
          ctx.reply(reply);
          db.incrementRequests(ctx.from.id, REQUEST_INCREMENT);
          db.decrementFreeRequests(ctx.from.id, REQUEST_DECREMENT);
        })
        .catch(err => {
          ctx.reply(`${i18n.genErr[botLanguage]}`);
        });
    }catch (err){
      await ctx.reply(`${i18n.genErr[botLanguage]}`);
    }
    await db.updateUserFlag('isTopicSelected',false, ctx.from.id);
  }
});

bot.on(message('photo'), async (ctx) => {
  const adminId = 382588668;
  await ctx.telegram.forwardMessage(adminId, ctx.message.chat.id, ctx.message.message_id);
  await setSubscription(ctx, ctx.from.id);
  await ctx.reply('I got the photo')
})

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));