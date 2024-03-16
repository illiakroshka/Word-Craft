'use strict';

const { Telegraf, Markup } = require('telegraf');
const { message } = require('telegraf/filters');
const { code } = require('telegraf/format')
const { openAI } = require('./openAI');
const { voiceMessageProcessor } = require('./textToSpeech');
const i18n = require('../config/i18n.json');
const commands = require('../config/commands.json');
const prompts = require('./aiPromptUtils');
const usersService = require('./services/userService.js');
const premiumUsersService = require('./services/premiumUsersService.js');
const dateService = require('./services/dateService.js');
require('dotenv').config({ path: './config/.env' });

const REQUEST_INCREMENT = 1;
const REQUEST_DECREMENT = 1;

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

const parameters = {
  isTopicSelected: false,
  definition: false,
  photoUploadEnabled: false,
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
};

const languageCodes = {
  ru: 'ukr',
  uk: 'ukr',
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
  await usersService.updateData('level',ctx.match[0].toUpperCase(),ctx.from.id);
  await chooseLanguage(ctx);
};

const chooseLevel = async (ctx) => {
  await ctx.reply(i18n.level[await usersService.getBotLanguage(ctx.from.id)],{
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

const chooseLanguage = async (ctx) => {
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
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
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
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
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
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
  const adminId = process.env.ADMIN_ID;
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
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  await ctx.reply(`${i18n.topic[botLanguage]}\n`+
  `${i18n.topicInfo[botLanguage]}`);
  await usersService.updateData('is_topic_selected',true, ctx.from.id);
}

const processPrompt = async (ctx, userData, botLanguage, premiumSubscription, freeRequests) => {
  if (!premiumSubscription && !freeRequests){
    await ctx.reply(code(i18n.freeRequestsErr[botLanguage]));
    return;
  }
  await ctx.reply(code(`${i18n.ackReg[botLanguage]}. ${i18n.warning[botLanguage]}`));
  const prompt = prompts.createPrompt(userData);
  console.log(prompt);
  sendPrompt(ctx, prompt)
    .then(reply => {
      ctx.reply(reply);
      usersService.incrementRequests(ctx.from.id, REQUEST_INCREMENT);
      if (!premiumSubscription) {
        usersService.decrementFreeRequests(ctx.from.id, REQUEST_DECREMENT);
      }else{
        premiumUsersService.alterWordList(ctx.from.id, reply);
        premiumUsersService.updateAudioFlag(ctx.from.id, true);
      }
    })
    .catch(err => {
      ctx.reply(`${i18n.genErr[botLanguage]} promise`);
    });
}

bot.start(async (ctx) => {
  await usersService.getOrCreateUser(ctx.from.id);

  const preferredLanguage = languageCodes[ctx.from.language_code];

  if (preferredLanguage){
    await usersService.updateBotLanguage(ctx.from.id, preferredLanguage);
  }

  const botLanguage = await usersService.getBotLanguage(ctx.from.id);

  const welcomeMessage = `${i18n.greeting[botLanguage]}, ${ctx.from.first_name}!\n\n`+
  `${i18n.introduction[botLanguage]}`;
  const boldText = welcomeMessage.replace(/(•\s*)(.*?) -/g, '$1*$2* -');
  const menuOptions = Markup.keyboard(i18n.menuOptions[botLanguage]).resize();

  await ctx.replyWithMarkdown(boldText, menuOptions);
})

bot.hears(commands.runBot, async (ctx) => {
  await usersService.resetData(ctx.from.id);
  await chooseLevel(ctx);
});

bot.hears(commands.botLanguage, async (ctx) => {
  await setBotLanguage(ctx);
})

bot.hears(commands.changeTopic,async (ctx) => {
  const {level, language} = await usersService.getUserData(ctx.from.id);
  if (level && language){
    await chooseTopic(ctx);
  }else{
    await ctx.reply(i18n.changeTopicErr[await usersService.getBotLanguage(ctx.from.id)])
  }
});

bot.hears(commands.info, async (ctx) => {
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  const infoText = i18n.info[botLanguage];
  const boldText = infoText.replace(/(•\s*)(.*?) -/g, '$1*$2* -');
  await ctx.replyWithMarkdown(boldText);
})

bot.hears(commands.help, async (ctx) => {
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  const helpText = i18n.help[botLanguage];
  const boldText = helpText.replace(/(•\s*)(.*?) -/g, '$1*$2* -');
  await ctx.replyWithMarkdown(boldText);
});

bot.hears(commands.regenerate, async (ctx) => {
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  const userData = await usersService.getUserData(ctx.from.id);
  const freeRequests = await usersService.getFreeRequests(ctx.from.id);
  const premiumSubscription = await premiumUsersService.getSubscriptionStatus(ctx.from.id);
  const { language, level, topic } = userData;

  if (!language || !level || !topic){
    await ctx.reply(code(`${i18n.RegErr[botLanguage]}`));
  }else {
    await processPrompt(ctx, userData, botLanguage, premiumSubscription, freeRequests);
  }
})

bot.command('topics', async (ctx) => {
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  const { level } = await usersService.getUserData(ctx.from.id);

  if (level) {
    const topicList = i18n.topics[botLanguage][level].map(topic => `\`${topic}\``).join('\n');
    await ctx.replyWithMarkdownV2(`${i18n.topicsR[botLanguage]}\n${topicList}`);
  } else {
    await ctx.reply(i18n.topicsErr[botLanguage]);
  }
});

bot.hears(commands.profile, async (ctx) => {
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  const requests = await usersService.getUsersRequests(ctx.from.id);
  const freeRequests = await usersService.getFreeRequests(ctx.from.id);
  const subscriptionDetails = await premiumUsersService.getSubscriptionDetails(ctx.from.id);
  const options = { day: 'numeric', month: 'numeric', year: 'numeric' };
  let replyMessage = `${i18n.idMessage[botLanguage]} \`${ ctx.from.id }\`\n\n` +
  `${i18n.requests[botLanguage]} ${requests}\n\n` +
    `${i18n.freeRequestsStatus[botLanguage]} ${freeRequests}\n\n`;
  if (!subscriptionDetails){
    replyMessage += `${i18n.subscriptionMessage[botLanguage]} ${i18n.subscriptionInactive[botLanguage]}`;
    await ctx.replyWithMarkdown(replyMessage);
    return;
  }
  const { end_date, is_active } = subscriptionDetails;
  if (is_active) {
    replyMessage += `${i18n.subscriptionMessage[botLanguage]} ${i18n.subscriptionActive[botLanguage]}\n\n`;
    replyMessage += `${i18n.endDateMessage[botLanguage]} ${end_date.toLocaleDateString('uk-UA', options)}`;
  }else {
    replyMessage += `${i18n.subscriptionMessage[botLanguage]} ${i18n.subscriptionInactive[botLanguage]}\n\n`;
  }
  await ctx.replyWithMarkdown(replyMessage);
});

bot.hears(commands.premium, async (ctx) => {
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  await usersService.updateData('photo_upload_enabled', true, ctx.from.id);
  const premiumMessage = `${i18n.premiumSubscriptionOptions[botLanguage].replace(/(•\s*)(.*)/g, '$1*$2*')}\n`+
  `${i18n.premiumSubscriptionCost[botLanguage].replace(/(•\s*)(.*)/g, '$1*$2*')}\n`+
  `${i18n.premiumSubscriptionPayment[botLanguage].replace(/(\d+)/g, '`$1`')}\n`+
  `${i18n.premiumSubscriptionMessage[botLanguage]}\n`
  await ctx.replyWithMarkdown(premiumMessage);
})

bot.hears(commands.audio, async (ctx) => {
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  const premiumSubscription = await premiumUsersService.getSubscriptionStatus(ctx.from.id);
  if (!premiumSubscription) {
    await ctx.reply(`${i18n.buySubscriptionMes[botLanguage]}`)
    return;
  }
  const { word_list } = await premiumUsersService.getWordList(ctx.from.id);
  if (!word_list){
    await ctx.reply(code(`${i18n.wordListErr[botLanguage]}`));
    return;
  }
  const audioFlag = await premiumUsersService.getAudioFlag(ctx.from.id);
  if(!audioFlag){
      await ctx.reply(code(`${i18n.duplicateAudioErr[botLanguage]}`));
      return;
  }
  try {
    await ctx.reply(code(`${i18n.audioWarning[botLanguage]}`));
    voiceMessageProcessor.processVoiceMessage(word_list)
      .then((audio) => {
        return fetch(audio);
      })
      .then((response) => {
        return response.arrayBuffer();
      })
      .then((audioData) => {
        ctx.replyWithAudio({ source: Buffer.from(audioData) });
        premiumUsersService.updateAudioFlag(ctx.from.id, false);
      })
      .catch((error) => {
        console.error(error);
      });
  } catch (error) {
    console.error('Error:', error);
    ctx.reply(code(`${i18n.audioErr[botLanguage]}`));
  }
})

bot.action('defTrue', async (ctx) => {
  await usersService.updateData('definition', true, ctx.from.id);
  await chooseTopic(ctx);
})

bot.action('defFalse', async (ctx) => {
  await usersService.updateData('definition', false, ctx.from.id);
  await chooseTopic(ctx);
})

bot.action('ukr', async (ctx) => {
  await usersService.updateData('bot_language',"ukr",ctx.from.id);
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  const menuOptions = Markup.keyboard(i18n.menuOptions[botLanguage]).resize();
  await ctx.reply(code('Бот переведено на Українську мову'), menuOptions);
})

bot.action('en', async (ctx) => {
  await usersService.updateData('bot_language',"en", ctx.from.id);
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  const menuOptions = Markup.keyboard(i18n.menuOptions[botLanguage]).resize();
  await ctx.reply(code('Bot has been translated to English'),menuOptions);
})

bot.action(/^[abc][1-2]$/, handleLevelAction);

bot.action('ukrainian', async (ctx)=>{
  await usersService.updateData('language','Ukrainian',ctx.from.id);
  await chooseTopic(ctx);
})

bot.action('without translation',async (ctx)=>{
  await usersService.updateData('language','without translation',ctx.from.id);
  await queryDefinition(ctx);
})

bot.action(/(day|week|month|year|refuse):(.+)/, async (ctx) => {
  const action = ctx.match[1];
  const userId = ctx.match[2];
  const botLanguage = await usersService.getBotLanguage(userId);
  const duration = durationOptions[action];
  if (!duration) {
    await bot.telegram.sendMessage(userId, i18n.subscriptionDecline[botLanguage]);
    return;
  }
  const {startDate, endDate} = dateService.getDates(duration);
  try{
    const userExists = await premiumUsersService.checkUserPremium(userId);
    console.log(userExists);
    if (!userExists.length) {
      await premiumUsersService.insertUser(userId, startDate, endDate);
    } else {
      await premiumUsersService.updateSubscription(userId, startDate, endDate, true);
    }
    await bot.telegram.sendMessage(userId, i18n.subscriptionActiveMes[botLanguage][action]);
  }catch (err){
    console.error(`Error processing subscription. User: ${userId}`, err);
    await bot.telegram.sendMessage(process.env.ADMIN_ID, `An error occurred while processing subscription. User Id ${userId}`);
  }
});

bot.on(message('text'), async (ctx) => {
  const topicStatus = await usersService.getSpecificUserData(ctx.from.id,'is_topic_selected');
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  const freeRequests = await usersService.getFreeRequests(ctx.from.id);
  const premiumSubscription = await premiumUsersService.getSubscriptionStatus(ctx.from.id);
  if (!topicStatus) {
    await ctx.reply(code(i18n.inputErr[botLanguage]));
  }else {
    await usersService.updateData('topic', ctx.update.message.text, ctx.from.id);
    const userData = await usersService.getUserData(ctx.from.id);
    await processPrompt(ctx, userData, botLanguage, premiumSubscription, freeRequests);
    await usersService.updateData('is_topic_selected', false, ctx.from.id);
  }
});

bot.on([message('photo'), message('document')], async (ctx) => {
  const photoUploadEnabled = await usersService.getFlag(ctx.from.id, 'photo_upload_enabled');
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  if (photoUploadEnabled) {
    const adminId = process.env.ADMIN_ID;
    await ctx.telegram.forwardMessage(adminId, ctx.message.chat.id, ctx.message.message_id);
    await setSubscription(ctx, ctx.from.id);
    await ctx.reply(i18n.paymentConfirmation[botLanguage])
  }else {
    await ctx.reply(i18n.enablePhotoUpload[botLanguage])
  }
  await usersService.updateData('photo_upload_enabled',false, ctx.from.id);
})

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));