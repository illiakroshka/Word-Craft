'use strict';

const { usersRepository} = require('../database/repositories/TemplateRepository')

const getOrCreateUser = async (telegramId) => {
  const user = await usersRepository.select({telegram_id: telegramId});
  if (!user.length) {
    return usersRepository.create({telegram_id: telegramId});
  }
  return user;
}

const getUserBotLanguage = async (telegramId) => {
  return usersRepository.select({telegram_id: telegramId}, ['bot_language']);
}

const updateData = async (flag, value, telegramId) => {
  return usersRepository.update({[flag]: value}, {telegram_id: telegramId});
}

const resetData = async (telegramId) => {
  return usersRepository.update({level:'' ,topic:'',language:'',definition:false,is_topic_selected: false},{telegram_id: telegramId})
}

const getUserData = async (telegramId) => {
  const userData = await usersRepository.select({telegram_id: telegramId}, ['level','language','topic','definition']);
  return userData[0];
}

const getSpecificUserData = async (telegramId, data) => {
  return usersRepository.select({telegram_id: telegramId},[data]);
}

const getBotLanguage = async (telegramId) => {
  const botLanguage = await usersRepository.select({telegram_id: telegramId}, ['bot_language']);
  return botLanguage[0].bot_language;
}

const updateBotLanguage = async (telegramId, language) => {
  return usersRepository.update({language: language}, {telegram_id: telegramId});
}

const getUsersRequests = async (telegramId) => {
  const requests = await usersRepository.select({telegram_id: telegramId}, ['requests'])
  return requests[0].requests;
}

const incrementRequests = async (telegramId, incrementValue) => {
  const requests = await usersRepository.select({telegram_id: telegramId},['requests']);
  return usersRepository.update({request: requests + incrementValue }, {telegram_id: telegramId});
}

const decrementFreeRequests = async (telegramId, decrementValue) => {
  const freeRequests = await usersRepository.select({telegram_id: telegramId}, ['free_requests']);
  return usersRepository.update({free_requests: freeRequests - decrementValue},{telegram_id: telegramId});
}

const getFreeRequests = async (telegramId) => {
  const requests = await usersRepository.select({telegram_id: telegramId}, ['free_requests']);
  return requests[0].free_requests;
}

const getFlag = async (telegramId,flag) => {
  return usersRepository.select({telegram_id: telegramId},[flag]);
}

module.exports = {
  getOrCreateUser,
  getUserBotLanguage,
  updateData,
  resetData,
  getUserData,
  getBotLanguage,
  updateBotLanguage,
  getUsersRequests,
  incrementRequests,
  decrementFreeRequests,
  getFreeRequests,
  getSpecificUserData,
  getFlag,
}
