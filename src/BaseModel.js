'use strict';

const ORM = require('./ORM');

class BaseModel {
  static get tableName() {
    throw new Error('You must override tableName getter in child class');
  }
  
  static query() {
    return ORM.table(this.tableName);
  }
  
  static async findById(id) {
    return await this.query().where({ id }).findOne();
  }
  
  static async findOne(conditions) {
    return await this.query().where(conditions).findOne();
  }
  
  static async find(conditions = {}) {
    const query = this.query();
    if (Object.keys(conditions).length > 0) {
      query.where(conditions);
    }
    return await query.find();
  }
  
  static async findAll() {
    return await this.query().find();
  }
  
  static async create(data) {
    return await ORM.insert(this.tableName, data);
  }
  
  static async update(id, data) {
    return await ORM.update(this.tableName, data, { id });
  }
  
  static async delete(id) {
    return await ORM.delete(this.tableName, { id });
  }
  
  static async paginate(page = 1, perPage = 10, conditions = {}) {
    const query = this.query();
    if (Object.keys(conditions).length > 0) {
      query.where(conditions);
    }
    return await query.paginate(page, perPage);
  }
  
  static async count(conditions = {}) {
    const query = this.query();
    if (Object.keys(conditions).length > 0) {
      query.where(conditions);
    }
    return await query.count();
  }
}

module.exports = BaseModel;