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

const insertUser = async (userData, telegramId) => {
  const pool = new Pool(config);
  try {
    const query = {
      text: 'INSERT INTO users (data, telegram_id) VALUES ($1, $2)',
      values: [JSON.stringify(userData), telegramId]
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
};
