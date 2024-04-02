'use strict';

const { Telegraf, Markup } = require('telegraf');
const { message } = require('telegraf/filters');
const { code, pre} = require('telegraf/format')
const { openAI } = require('./openAI');
const i18n = require('./internationalization/i18n.json');
const messageService = require('./services/messageService.js');
const commands = require('./internationalization/commands.json');
const usersService = require('./services/userService.js');
const premiumUsersService = require('./services/premiumUsersService.js');
const dateService = require('./services/dateService.js');
const subtitlesService = require('./services/subtitlesService.js');
const promptService = require('./services/promptsService.js');
require('dotenv').config({ path: './config/.env' });

const REQUEST_INCREMENT = 1;

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

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

const setNumberOfWords = async (ctx) => {
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  await ctx.reply(`${i18n.wordsNumber[botLanguage]}`, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 15, callback_data: '15' },
          { text: 20, callback_data: '20' },
          { text: 25, callback_data: '25' },
          { text: 30, callback_data: '30' },
        ]
      ]
    }
  })
}

const specifyRole = async (ctx) => {
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  await ctx.reply(`${i18n.roleForWl[botLanguage]}`,{
    reply_markup: {
      inline_keyboard: [
        [
          { text: i18n.refuseButton[botLanguage], callback_data: 'refuse' },
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

const handleLevelAction = async (ctx) => {
  await usersService.updateData('level',ctx.match[0].toUpperCase(),ctx.from.id);
  await chooseLanguage(ctx);
};

const chooseTopic = async (ctx) => {
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  await ctx.reply(`${i18n.topic[botLanguage]}`);
  await usersService.updateData('is_topic_selected',true, ctx.from.id);
}

bot.start(async (ctx) => {
  await usersService.getOrCreateUser(ctx.from.id);

  const preferredLanguage = languageCodes[ctx.from.language_code];
  if (preferredLanguage){
    await usersService.updateBotLanguage(ctx.from.id, preferredLanguage);
  }

  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  const { boldText, menuOptions} = messageService.getWelcomeMessage(botLanguage,ctx.from.first_name);
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
  const info = messageService.getSelectedText(i18n.info[botLanguage]);
  await ctx.replyWithMarkdown(info);
})

bot.hears(commands.help, async (ctx) => {
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  const help = messageService.getSelectedText(i18n.help[botLanguage]);
  await ctx.replyWithMarkdown(help);
});

bot.hears(commands.regenerate, async (ctx) => {
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  const userData = await usersService.getUserData(ctx.from.id);
  const wordList = await usersService.getWordList(ctx.from.id);
  const { language, level, topic , definition, number_words, role } = userData;

  if (!language || !level || !topic || !wordList) {
    return  ctx.reply(code(`${i18n.RegErr[botLanguage]}`));
  }
  const { prompt, systemMessage } = promptService.improveListPrompt(
    level,
    language,
    topic,
    definition,
    number_words,
    wordList,
    role
  );
  await ctx.reply(code(`${i18n.ackReg[botLanguage]}. ${i18n.warning[botLanguage]}`));
  await processPrompt(ctx, prompt, systemMessage, botLanguage);
  await usersService.updateData('can_generate_audio',true, ctx.from.id);
})

bot.hears(commands.profile, async (ctx) => {
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  const requests = await usersService.getUsersRequests(ctx.from.id);
  const freeRequests = await usersService.getFreeRequests(ctx.from.id);
  const subscriptionDetails = await premiumUsersService.getSubscriptionDetails(ctx.from.id);
  const options = { day: 'numeric', month: 'numeric', year: 'numeric' };
  const replyMessage = messageService.getProfileMessage(botLanguage,ctx.from.id,requests, freeRequests, subscriptionDetails,options);
  await ctx.replyWithMarkdown(replyMessage);
});

bot.hears(commands.premium, async (ctx) => {
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  await usersService.updateData('photo_upload_enabled', true, ctx.from.id);
  const premiumMessage = messageService.getPremiumMessage(botLanguage);
  await ctx.replyWithMarkdown(premiumMessage);
})

bot.hears(commands.audio, async (ctx) => {
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);

  const wordList = await usersService.getWordList(ctx.from.id);
  if (!wordList) return ctx.reply(i18n.wordListErr[botLanguage]);
  const { can_generate_audio } = await usersService.getFlag(ctx.from.id, 'can_generate_audio');
  if (!can_generate_audio) return ctx.reply(i18n.duplicateAudioErr[botLanguage]);
  await ctx.reply(i18n.audioWarning[botLanguage]);
  const { topic } = await usersService.getUserData(ctx.from.id);
  openAI.audio(wordList)
    .then(audioData => {
      return ctx.replyWithAudio({
        filename: `${topic}`,
        source: audioData,
      });
    })
    .then(() => {
      const callToAction = messageService.getSelectedText(i18n.callAfterVideo[botLanguage])
      return ctx.replyWithMarkdown(callToAction);
    })
    .catch((err) => {
      ctx.reply(i18n.audioErr[botLanguage]);
    })
  await usersService.updateData('can_generate_audio', false, ctx.from.id);
})

bot.hears(commands.video, async (ctx) => {
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  return ctx.reply(i18n.videoAction[botLanguage])
})

bot.action('defTrue', async (ctx) => {
  await usersService.updateData('definition', true, ctx.from.id);
  await setNumberOfWords(ctx);
})

bot.action('defFalse', async (ctx) => {
  await usersService.updateData('definition', false, ctx.from.id);
  await setNumberOfWords(ctx);
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
  await setNumberOfWords(ctx)
  //await chooseTopic(ctx);
})

bot.action(/^(15|20|25|30)$/, async (ctx) => {
  await usersService.updateData('number_words', parseInt(ctx.update.callback_query.data), ctx.from.id);
  await chooseTopic(ctx);
})

bot.action('without translation',async (ctx)=>{
  await usersService.updateData('language','without translation',ctx.from.id);
  await queryDefinition(ctx);
})

bot.action('refuse', async (ctx) => {
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  await usersService.updateData('role','', ctx.from.id);
  await generateWordList(ctx, botLanguage);
})

bot.action(/(day|week|month|year|refuse):(.+)/, async (ctx) => {
  const action = ctx.match[1];
  const userId = ctx.match[2];
  const botLanguage = await usersService.getBotLanguage(userId);
  const duration = durationOptions[action];
  if (!duration) {
    return bot.telegram.sendMessage(userId, i18n.subscriptionDecline[botLanguage]);
  }
  const {startDate, endDate} = dateService.getDates(duration);
  try{
    const userExists = await premiumUsersService.checkUserPremium(userId);
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
  const { is_topic_selected, bot_language, is_role_selected } = await usersService.getSpecificUserData(ctx.from.id, ['is_topic_selected','bot_language','is_role_selected']);

  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

  const match = ctx.message.text.match(youtubeRegex);
  if (match) {
    await ctx.reply(i18n.videoScanWar[bot_language]);
    try {
      const youtubeVideoId = match[1];
      await videoVocabularyScan(youtubeVideoId, ctx);
      return;
    }catch (error) {
      return ctx.reply(error.message)
    }
  }

  if (is_topic_selected) {
    await usersService.updateData('is_topic_selected',false, ctx.from.id);
    await usersService.updateData('is_role_selected', true, ctx.from.id);
    await usersService.updateData('topic', ctx.update.message.text, ctx.from.id);
    return specifyRole(ctx);
  }
  if (is_role_selected) {
    await usersService.updateData('is_role_selected', false, ctx.from.id);
    await usersService.updateData('role', ctx.message.text, ctx.from.id);
    return generateWordList(ctx, bot_language);
  }
  return ctx.reply(code(i18n.inputErr[bot_language]))
});

bot.on([message('photo'), message('document')], async (ctx) => {
  const {photo_upload_enabled} = await usersService.getFlag(ctx.from.id, 'photo_upload_enabled');
  const botLanguage = await usersService.getBotLanguage(ctx.from.id);
  if (!photo_upload_enabled) return ctx.reply(i18n.enablePhotoUpload[botLanguage])
  const adminId = process.env.ADMIN_ID;
  await ctx.telegram.forwardMessage(adminId, ctx.message.chat.id, ctx.message.message_id);
  await setSubscription(ctx, ctx.from.id);
  await ctx.reply(i18n.paymentConfirmation[botLanguage])
  await usersService.updateData('photo_upload_enabled',false, ctx.from.id);
})

const processPrompt = async (ctx, prompt, systemMessage, botLanguage) => {
  sendPrompt(ctx, prompt, systemMessage)
    .then(reply => {
      return ctx.reply(reply)
        .then(() => {
          return Promise.all([
            usersService.incrementRequests(ctx.from.id, REQUEST_INCREMENT),
            usersService.alterWordList(ctx.from.id, reply)
          ]);
        })
    })
    .then(() => {
      const callToAction = messageService.getSelectedText(i18n.callToAction[botLanguage]);
      return ctx.replyWithMarkdown(callToAction);
    })
    .catch(err => {
      ctx.reply(`${i18n.genErr[botLanguage]} promise`);
    });
}

const sendPrompt = (ctx, prompt, systemMessage) => {
  return new Promise(async (resolve, reject) => {
    try {
      const messages = [{ role: openAI.roles.USER, content: prompt },{ role: openAI.roles.SYSTEM, content: systemMessage}];
      const response = await openAI.chat(messages);
      resolve(response.content);
    } catch (error) {
      reject(error);
    }
  });
};

const videoVocabularyScan = async (videoId, ctx) => {
  try {
    const subtitles = await subtitlesService.downloadSubtitles(videoId);
    const { language, level} = await usersService.getUserData(ctx.from.id);
    const trLang = language ? language : 'without translation';
    const userLevel = level ? level : 'B1';
    const botLanguage = await usersService.getBotLanguage(ctx.from.id);
    const { prompt, systemMessage } = promptService.analyzeVideoPrompt(subtitles, trLang, level);
    sendPrompt(ctx, prompt, systemMessage).then((data)=> {
      return ctx.reply(data)
        .then(() => {
          return Promise.all([
            usersService.alterWordList(ctx.from.id, data),
            usersService.updateData('can_generate_audio',true, ctx.from.id),
            usersService.updateData('topic','video',ctx.from.id)
          ])
        })
    })
      .then(() => {
        const callToAction = messageService.getSelectedText(i18n.videoCallToAction[botLanguage])
        return ctx.replyWithMarkdown(callToAction);
      })
  }catch (error) {
    throw error;
  }
}

const generateWordList = async (ctx, botLanguage) => {
  const userData = await usersService.getUserData(ctx.from.id);
  const { prompt, systemMessage } = promptService.createPrompt(userData);
  await ctx.reply(code(`${i18n.ack[botLanguage]}: '${userData.topic}'. ${i18n.warning[botLanguage]}`));
  await processPrompt(ctx, prompt, systemMessage, botLanguage);
  await usersService.updateData('can_generate_audio',true, ctx.from.id);
}

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));