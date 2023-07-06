'use strict';

const { Pool } = require('pg');
const config = require('../config/dbConfig');

const pool = new Pool(config);

const checkUser = async (telegramId) => {
  try{
    const query = {
      text: `SELECT * FROM users WHERE telegram_id = $1`,
      values: [telegramId],
    };
    const result = await pool.query(query);
    console.log(result.rowCount);
    return result.rowCount
  } catch (err) {
    console.error('Error executing query', err);
  }
}

const insertUser = async (userData, telegramId) => {
  try {
    const query = {
      text: 'INSERT INTO users (data, telegram_id) VALUES ($1, $2)',
      values: [JSON.stringify(userData), telegramId]
    };
    await pool.query(query);
  } catch (err) {
    console.error('Error executing query', err);
  }
};

const updateUserFlag = async (flag, booleanValue, telegramId) => {
  try {
    const query = {
      text: `UPDATE "users" SET data = jsonb_set(data, $1::text[], $2) WHERE telegram_id = $3`,
      values: [[flag], booleanValue, telegramId]
    };
    await pool.query(query);
  } catch (err) {
    console.error('Error updating user flag:', err);
  }
};

const getUserFlag = async (flag, telegramId) => {
  try {
    const query = {
      text: `SELECT data -> $1 AS flag_value FROM "users" WHERE telegram_id = $2`,
      values: [flag, telegramId]
    };

    const result = await pool.query(query);
    return result.rows[0].flag_value;
  } catch (err) {
    console.error('Error retrieving flag value:', err);
  }
};

const updateUserData = async (keyName, value, telegramId) => {
  try {
    const query = {
      text: `UPDATE "users" SET data = jsonb_set(data, $1::text[], $2::jsonb) WHERE telegram_id = $3`,
      values: [[keyName], `"${value}"`, telegramId]
    };

    await pool.query(query);
  } catch (err) {
    console.error('Error updating user data:', err);
  }
};

const resetUserData = async (telegramId) => {
  try {
    const query = {
      text: `UPDATE "users"
             SET data = jsonb_set(jsonb_set(jsonb_set(jsonb_set(data, '{level}', '""'), '{language}', '""'), '{topic}', '""'), '{isTopicSelected}', 'false'::jsonb)
             WHERE telegram_id = $1`,
      values: [telegramId]
    };

    await pool.query(query);
  } catch (err) {
    console.error('Error updating user data:', err);
  }
};

const getUserData = async (telegramId) => {
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
  }
};

const getBotLanguage = async (telegramId) => {
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
  }
};

const getUserRequests = async (telegramId) => {
  try {
    const query = {
      text: 'SELECT requests FROM Users WHERE telegram_id = $1',
      values: [telegramId],
    };

    const result = await pool.query(query);
    return result.rows[0].requests;
  } catch (error) {
    console.error('Error occurred while fetching requests:', error);
  }
}

const updateUserBotLanguage = async (telegramId, value) => {
  try {
    const query = {
      text: `UPDATE users
             SET data = jsonb_set(data, '{botLanguage}', $1::jsonb)
             WHERE telegram_id = $2`,
      values: [`"${value}"`, telegramId]
    };

    await pool.query(query);
  } catch (err) {
    console.error('Error updating user bot language:', err);
  }
};

const incrementRequests = async (telegramId, incrementValue) => {
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
  }
};


module.exports = { insertUser , checkUser, updateUserFlag, getUserFlag, updateUserData, resetUserData, getUserData, incrementRequests, getBotLanguage, updateUserBotLanguage, getUserRequests };