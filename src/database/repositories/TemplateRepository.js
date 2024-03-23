'use strict'

require('dotenv').config({ path: './config/.env' });
const { Database } = require('metasql')

const configJSON = process.env.NEW_DATABASE_CONFIG_JSON;
const config = JSON.parse(configJSON);

const database = new Database(config);
class TemplateRepository {
  constructor(tableName, db = database) {
    this.tableName = tableName;
    this.db = db
  }
  async select (where, fields = ['*']) {
    return this.db.select(this.tableName, fields, where);
  }

  async update(data, where) {
    return this.db.update(this.tableName, data, where)
  }

  async create(data) {
    return this.db.insert(this.tableName, data);
  }

  async remove(data) {
    return this.db.delete(this.tableName, data);
  }

  async query(sql, values) {
    return this.db.query(sql, values);
  }
}

const usersRepository = new TemplateRepository('users');
const premiumUsersRepository = new TemplateRepository('premium_users');

module.exports = {
  usersRepository,
  premiumUsersRepository,
};