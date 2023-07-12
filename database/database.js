'use strict';

const { Pool } = require('pg');
const config = require('../config/dbConfig');

const checkUser = async (telegramId) => {
  const pool = new Pool(config);
  try{
    const query = {
      text: `SELECT * FROM users WHERE telegram_id = $1`,
      values: [telegramId],
    };
    const result = await pool.query(query);
    return result.rowCount
  } catch (err) {
    console.error('Error executing query', err);
  } finally {
    pool.end();
  }
}

const insertUser = async (userData, telegramId, freeRequests) => {
  const pool = new Pool(config);
  try {
    const query = {
      text: 'INSERT INTO users (data, telegram_id, free_requests) VALUES ($1, $2, $3)',
      values: [JSON.stringify(userData), telegramId, freeRequests]
    };
    await pool.query(query);
  } catch (err) {
    console.error('Error executing query', err);
  } finally {
    pool.end();
  }
};

const updateUserFlag = async (flag, booleanValue, telegramId) => {
  const pool = new Pool(config);
  try {
    const query = {
      text: `UPDATE "users" SET data = jsonb_set(data, $1::text[], $2) WHERE telegram_id = $3`,
      values: [[flag], booleanValue, telegramId]
    };
    await pool.query(query);
  } catch (err) {
    console.error('Error updating user flag:', err);
  } finally {
    pool.end();
  }
};

const getUserFlag = async (flag, telegramId) => {
  const pool = new Pool(config);
  try {
    const query = {
      text: `SELECT data -> $1 AS flag_value FROM "users" WHERE telegram_id = $2`,
      values: [flag, telegramId]
    };

    const result = await pool.query(query);
    return result.rows[0].flag_value;
  } catch (err) {
    console.error('Error retrieving flag value:', err);
  } finally {
    pool.end();
  }
};

const updateUserData = async (keyName, value, telegramId) => {
  const pool = new Pool(config);
  try {
    const query = {
      text: `UPDATE "users" SET data = jsonb_set(data, $1::text[], $2::jsonb) WHERE telegram_id = $3`,
      values: [[keyName], `"${value}"`, telegramId]
    };

    await pool.query(query);
  } catch (err) {
    console.error('Error updating user data:', err);
  } finally {
    pool.end();
  }
};

const resetUserData = async (telegramId) => {
  const pool = new Pool(config);
  try {
    const newData = {
      level: "",
      language: "",
      topic: "",
      definition: false,
      isTopicSelected: false
    };

    const query = {
      text: `UPDATE users
             SET data = data || $1
             WHERE telegram_id = $2`,
      values: [newData, telegramId]
    };

    await pool.query(query);
  } catch (err) {
    console.error('Error updating user data:', err);
  } finally {
    pool.end();
  }
};

const getUserData = async (telegramId) => {
  const pool = new Pool(config);
  try {
    const query = {
      text: `SELECT data ->> 'language' AS language,
                    data ->> 'level' AS level,
                    data ->> 'topic' AS topic,
                    (data ->> 'definition')::boolean AS definition
             FROM users
             WHERE telegram_id = $1`,
      values: [telegramId]
    };

    const result = await pool.query(query);
    return  result.rows[0];
  } catch (err) {
    console.error('Error retrieving user data:', err);
  } finally {
    pool.end();
  }
};

const getBotLanguage = async (telegramId) => {
  const pool = new Pool(config);
  try {
    const query = {
      text: `SELECT data -> 'botLanguage' AS bot_language
             FROM users
             WHERE telegram_id = $1`,
      values: [telegramId]
    };

    const result = await pool.query(query);
    return result.rows[0].bot_language;
  } catch (err) {
    console.error('Error retrieving user data:', err);
  } finally {
    pool.end();
  }
};

const getUserRequests = async (telegramId) => {
  const pool = new Pool(config);
  try {
    const query = {
      text: 'SELECT requests FROM Users WHERE telegram_id = $1',
      values: [telegramId],
    };

    const result = await pool.query(query);
    return result.rows[0].requests;
  } catch (error) {
    console.error('Error occurred while fetching requests:', error);
  } finally {
    pool.end();
  }
}

const updateUserBotLanguage = async (telegramId, languageCode) => {
  const pool = new Pool(config);
  try {
    const query = {
      text: `UPDATE users
             SET data = jsonb_set(data, '{botLanguage}', $1::jsonb)
             WHERE telegram_id = $2`,
      values: [`"${languageCode}"`, telegramId]
    };

    await pool.query(query);
  } catch (err) {
    console.error('Error updating user bot language:', err);
  } finally {
    pool.end();
  }
};

const incrementRequests = async (telegramId, incrementValue) => {
  const pool = new Pool(config);
  try {
    const query = {
      text: `UPDATE users
             SET requests = requests + $1
             WHERE telegram_id = $2`,
      values: [incrementValue, telegramId]
    };

    await pool.query(query);
  } catch (err) {
    console.error('Error incrementing requests count:', err);
  } finally {
    pool.end();
  }
};

const decrementFreeRequests = async (telegramId, decrementValue) => {
  const pool = new Pool(config);
  try {
    const query = {
      text: `UPDATE users
             SET free_requests = free_requests - $1
             WHERE telegram_id = $2`,
      values: [decrementValue, telegramId]
    };

    await pool.query(query);
  } catch (err) {
    console.error('Error incrementing requests count:', err);
  } finally {
    pool.end();
  }
}

const getUserFreeRequests = async (telegramId) => {
  const pool = new Pool(config);
  try {
    const query = {
      text: 'SELECT free_requests FROM Users WHERE telegram_id = $1',
      values: [telegramId],
    };

    const result = await pool.query(query);
    return result.rows[0].free_requests;
  } catch (error) {
    console.error('Error occurred while fetching requests:', error);
  } finally {
    pool.end();
  }
}

const checkUserPremium = async (telegramId) => {
  const pool = new Pool(config);
  try{
    const query = {
      text: `SELECT * FROM premium_users WHERE telegram_id = $1`,
      values: [telegramId],
    };
    const result = await pool.query(query);
    return result.rowCount
  } catch (err) {
    console.error('Error executing query', err);
  } finally {
    pool.end();
  }
}

const insertUserPremium = async (telegramId, startDate, duration, endDate, subscriptionStatus) => {
  const pool = new Pool(config);
  try {
    const query = {
      text: 'INSERT INTO premium_users ( telegram_id, start_date, duration, end_date, premium_subscription) VALUES ($1, $2, $3, $4, $5)',
      values: [telegramId, startDate, duration, endDate, subscriptionStatus]
    };
    await pool.query(query);
  } catch (err) {
    console.error('Error executing query', err);
  } finally {
    pool.end();
  }
}

const updateUserPremium = async (telegramId, startDate, duration, endDate, subscriptionStatus) => {
  const pool = new Pool(config);
  try {
    const query = {
      text: 'UPDATE premium_users SET start_date = $2, duration = $3, end_date = $4, premium_subscription = $5 WHERE telegram_id = $1',
      values: [telegramId, startDate, duration, endDate, subscriptionStatus]
    };
    await pool.query(query);
  } catch (err) {
    console.error('Error executing query', err);
  } finally {
    pool.end();
  }
};

async function getSubscriptionDetails(telegramID) {
  const pool = new Pool(config);
  try {
    const query = {
      text: 'SELECT end_date, premium_subscription FROM premium_users WHERE telegram_id = $1',
      values: [telegramID],
    };

    const result = await pool.query(query);
    return result.rows[0];
  } catch (error) {
    console.error('Error executing query', error);
  } finally {
    pool.end();
  }
}

module.exports = {
  checkUser,
  insertUser,
  updateUserFlag,
  getUserFlag,
  updateUserData,
  resetUserData,
  getUserData,
  incrementRequests,
  getBotLanguage,
  updateUserBotLanguage,
  getUserRequests,
  decrementFreeRequests,
  getUserFreeRequests,
  checkUserPremium,
  insertUserPremium,
  updateUserPremium,
  getSubscriptionDetails,
};
