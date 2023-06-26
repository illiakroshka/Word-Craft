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

module.exports = { insertUser , checkUser };