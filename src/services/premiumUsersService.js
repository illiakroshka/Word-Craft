const { premiumUsersRepository} = require('../database/repositories/TemplateRepository.js')

const checkUserPremium = async (telegramId) => {
  return premiumUsersRepository.select({telegram_id: telegramId});
}

const insertUser = async (telegramId, startDate, endDate) => {
  return premiumUsersRepository.create({telegram_id: telegramId, start_date: startDate, end_date: endDate});
}

const updateSubscription = async (telegramId, startDate, endDate, isActive) => {
  return premiumUsersRepository.query(
    'UPDATE "premium_users" SET "start_date" = $1, "end_date" = $2, "is_active" = $3 WHERE "telegram_id" = $4',
    [startDate,endDate,isActive,telegramId]
  )
}

const getSubscriptionDetails = async (telegramId) => {
  const subDetails = await premiumUsersRepository.select({telegram_id: telegramId}, ['end_date','is_active']);
  if (!subDetails.length) return
  return subDetails[0];
}

const getSubscriptionStatus = async (telegramId) => {
  const status = await premiumUsersRepository.select({telegram_id: telegramId}, ['is_active']);
  if (!status.length) return false
  return status[0].is_active;
}

const alterWordList = async (telegramId, wordList) => {
  return premiumUsersRepository.update({word_list: wordList},{telegram_id: telegramId})
}

const getWordList = async (telegramId) => {
  const wordList = await premiumUsersRepository.select({telegram_id: telegramId},['word_list']);
  return wordList[0];
}

const getAudioFlag = async (telegramId) => {
  const audio = await premiumUsersRepository.select({telegram_id: telegramId}, ['can_generate_audio']);
  return audio[0].can_generate_audio;
}

const updateAudioFlag = async (telegramId, flag) => {
  return premiumUsersRepository.update({telegram_id: telegramId},{can_generate_audio: flag});
}

module.exports = {
  checkUserPremium,
  insertUser,
  updateSubscription,
  getSubscriptionDetails,
  alterWordList,
  getWordList,
  getAudioFlag,
  updateAudioFlag,
  getSubscriptionStatus,
}