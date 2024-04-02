const i18n = require('../internationalization/i18n.json');
const { Markup} = require("telegraf");

const getWelcomeMessage = (botLanguage, userName) => {
  const welcomeMessage = `${i18n.greeting[botLanguage]}, ${userName}!\n\n`+
    `${i18n.introduction[botLanguage]}`;
  const boldText = welcomeMessage.replace(/(•\s*)(.*?) -/g, '$1*$2* -');
  const menuOptions = Markup.keyboard(i18n.menuOptions[botLanguage]).resize();
  return {boldText, menuOptions};
};

const getSelectedText = (text) => {
  return text.replace(/(•\s*)(.*?) -/g, '$1*$2* -');
}

const getTopics = (botLanguage, level) => {
  const topicList = i18n.topics[botLanguage][level].map(topic => `\`${topic}\``).join('\n');
  return `${i18n.topicsR[botLanguage]}\n${topicList}`;
}

const getProfileMessage = (botLanguage, userId, requests, freeRequests, subscriptionDetails, options) => {
  return `${i18n.idMessage[botLanguage]} \`${userId}\`\n\n` +
    `${i18n.requests[botLanguage]} ${requests}\n\n`;
  //  `${i18n.freeRequestsStatus[botLanguage]} ${freeRequests}\n\n`;
  // if (!subscriptionDetails){
  //   replyMessage += `${i18n.subscriptionMessage[botLanguage]} ${i18n.subscriptionInactive[botLanguage]}`;
  //   return replyMessage;
  // }
  // const { end_date, is_active } = subscriptionDetails;
  // if (is_active) {
  //   replyMessage += `${i18n.subscriptionMessage[botLanguage]} ${i18n.subscriptionActive[botLanguage]}\n\n`;
  //   replyMessage += `${i18n.endDateMessage[botLanguage]} ${end_date.toLocaleDateString('uk-UA', options)}`;
  // }else {
  //   replyMessage += `${i18n.subscriptionMessage[botLanguage]} ${i18n.subscriptionInactive[botLanguage]}\n\n`;
  // }
  // return replyMessage;
}

const getPremiumMessage = (botLanguage) => {
  return `${i18n.premiumSubscriptionOptions[botLanguage].replace(/(•\s*)(.*)/g, '$1*$2*')}\n`+
    `${i18n.premiumSubscriptionCost[botLanguage].replace(/(•\s*)(.*)/g, '$1*$2*')}\n`+
    `${i18n.premiumSubscriptionPayment[botLanguage].replace(/(\d+)/g, '`$1`')}\n`+
    `${i18n.premiumSubscriptionMessage[botLanguage]}\n`;
}

module.exports = {
  getWelcomeMessage,
  getTopics,
  getProfileMessage,
  getPremiumMessage,
  getSelectedText,
}