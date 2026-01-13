'use strict';

const mysql = require('mysql2');

class QueryBuilder {
  constructor(table, connection) {
    this.table = table;
    this.connection = connection;
    this.reset();
  }

  reset() {
    this.query = {
      select: ['*'],
      distinct: false,
      where: [],
      having: [],
      joins: [],
      orderBy: [],
      groupBy: [],
      limit: null,
      offset: null,
      params: [],
      alias: null,
      lock: null
    };
    return this;
  }

  select(fields = '*') {
    if (Array.isArray(fields)) {
      this.query.select = fields;
    } else if (typeof fields === 'string') {
      this.query.select = [fields];
    }
    return this;
  }

  where(condition, value = null) {
    if (typeof condition === 'object') {
      Object.entries(condition).forEach(([key, val]) => {
        if (val === null || val === undefined) {
          this.query.where.push(`${key} IS NULL`);
        } else {
          this.query.where.push(`${key} = ?`);
          this.query.params.push(val);
        }
      });
    } else if (typeof condition === 'string') {
      if (value === null || value === undefined) {
        this.query.where.push(`${condition} IS NULL`);
      } else {
        this.query.where.push(`${condition} = ?`);
        this.query.params.push(value);
      }
    }
    return this;
  }

  orWhere(condition, value = null) {
    return this.where(condition, value);
  }

  whereRaw(condition, params = []) {
    this.query.where.push(condition);
    this.query.params.push(...params);
    return this;
  }

  whereIn(field, values) {
    if (values && values.length > 0) {
      const placeholders = values.map(() => '?').join(',');
      this.query.where.push(`${field} IN (${placeholders})`);
      this.query.params.push(...values);
    }
    return this;
  }

  whereNotIn(field, values) {
    if (values && values.length > 0) {
      const placeholders = values.map(() => '?').join(',');
      this.query.where.push(`${field} NOT IN (${placeholders})`);
      this.query.params.push(...values);
    }
    return this;
  }

  whereBetween(field, from, to) {
    if (from !== undefined && to !== undefined) {
      this.query.where.push(`${field} BETWEEN ? AND ?`);
      this.query.params.push(from, to);
    }
    return this;
  }

  whereLike(field, value) {
    if (value) {
      this.query.where.push(`${field} LIKE ?`);
      this.query.params.push(`%${value}%`);
    }
    return this;
  }

  whereNull(field) {
    this.query.where.push(`${field} IS NULL`);
    return this;
  }

  whereNotNull(field) {
    this.query.where.push(`${field} IS NOT NULL`);
    return this;
  }

  orderBy(field, direction = 'ASC') {
    const dir = direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    this.query.orderBy.push(`${field} ${dir}`);
    return this;
  }

  groupBy(fields) {
    if (Array.isArray(fields)) {
      this.query.groupBy.push(...fields);
    } else {
      this.query.groupBy.push(fields);
    }
    return this;
  }

  limit(num) {
    this.query.limit = parseInt(num);
    return this;
  }

  offset(num) {
    this.query.offset = parseInt(num);
    return this;
  }

  join(table, condition, type = 'INNER') {
    this.query.joins.push({ type, table, condition });
    return this;
  }

  leftJoin(table, condition) {
    return this.join(table, condition, 'LEFT');
  }

  innerJoin(table, condition) {
    return this.join(table, condition, 'INNER');
  }

  paginate(page = 1, perPage = 10) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(perPage) || 10);
    this.query.limit = limitNum;
    this.query.offset = (pageNum - 1) * limitNum;
    return this;
  }

  _buildWhere() {
    if (this.query.where.length === 0) return '';
    return 'WHERE ' + this.query.where.join(' AND ');
  }

  _buildJoins() {
    if (this.query.joins.length === 0) return '';
    
    return this.query.joins
      .map(join => `${join.type} JOIN ${join.table} ON ${join.condition}`)
      .join(' ');
  }

  build() {
    let sql = 'SELECT ';
    
    if (this.query.distinct) {
      sql += 'DISTINCT ';
    }
    
    sql += this.query.select.join(', ');
    sql += ` FROM ${this.table}`;
    
    const joinsClause = this._buildJoins();
    if (joinsClause) sql += ' ' + joinsClause;
    
    const whereClause = this._buildWhere();
    if (whereClause) sql += ' ' + whereClause;
    
    if (this.query.groupBy.length > 0) {
      sql += ' GROUP BY ' + this.query.groupBy.join(', ');
    }
    
    if (this.query.orderBy.length > 0) {
      sql += ' ORDER BY ' + this.query.orderBy.join(', ');
    }
    
    if (this.query.limit !== null) {
      sql += ` LIMIT ${this.query.limit}`;
      if (this.query.offset !== null) {
        sql += ` OFFSET ${this.query.offset}`;
      }
    }
    
    if (this.query.lock) {
      sql += ` ${this.query.lock}`;
    }
    
    return {
      sql,
      params: this.query.params
    };
  }

  async execute() {
    const { sql, params } = this.build();
    const [rows] = await this.connection.query(sql, params);
    return rows;
  }

  async findOne() {
    this.limit(1);
    const results = await this.execute();
    return results[0] || null;
  }

  async find() {
    return await this.execute();
  }

  async count() {
    const originalSelect = this.query.select;
    this.query.select = ['COUNT(*) as count'];
    const [result] = await this.execute();
    this.query.select = originalSelect;
    return result ? parseInt(result.count) : 0;
  }

  async sum(field) {
    const originalSelect = this.query.select;
    this.query.select = [`SUM(${field}) as total`];
    const [result] = await this.execute();
    this.query.select = originalSelect;
    return result ? parseFloat(result.total) || 0 : 0;
  }

  async avg(field) {
    const originalSelect = this.query.select;
    this.query.select = [`AVG(${field}) as average`];
    const [result] = await this.execute();
    this.query.select = originalSelect;
    return result ? parseFloat(result.average) || 0 : 0;
  }

  async paginate(page = 1, perPage = 10) {
    const total = await this.count();
    const data = await this.paginate(page, perPage).find();
    
    return {
      data,
      pagination: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage)
      }
    };
  }
}

class ORM {
  static pool = null;
  
  static init(config) {
    this.pool = mysql.createPool({
      host: config.host || 'localhost',
      user: config.user || 'root',
      password: config.password || '',
      database: config.database,
      port: config.port || 3306,
      waitForConnections: true,
      connectionLimit: config.connectionLimit || 10,
      queueLimit: 0,
      timezone: config.timezone || 'local',
      dateStrings: config.dateStrings || true
    });
    
    return this;
  }
  
  static table(tableName) {
    if (!this.pool) {
      throw new Error('ORM not initialized. Call ORM.init(config) first.');
    }
    
    const connection = {
      query: async (sql, params) => {
        return await this.pool.promise().query(sql, params);
      }
    };
    
    return new QueryBuilder(tableName, connection);
  }
  
  static async query(sql, params = []) {
    if (!this.pool) {
      throw new Error('ORM not initialized. Call ORM.init(config) first.');
    }
    
    try {
      const [rows] = await this.pool.promise().query(sql, params);
      return rows;
    } catch (error) {
      console.error('Query Error:', error.message);
      throw error;
    }
  }
  
  static async insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const [result] = await this.pool.promise().query(sql, values);
    
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows,
      ...data
    };
  }
  
  static async update(table, data, conditions) {
    const setClause = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    const whereClause = Object.keys(conditions)
      .map(key => `${key} = ?`)
      .join(' AND ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    const params = [...Object.values(data), ...Object.values(conditions)];
    
    const [result] = await this.pool.promise().query(sql, params);
    return {
      affectedRows: result.affectedRows,
      changedRows: result.changedRows
    };
  }
  
  static async delete(table, conditions) {
    const whereClause = Object.keys(conditions)
      .map(key => `${key} = ?`)
      .join(' AND ');
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    
    const [result] = await this.pool.promise().query(sql, Object.values(conditions));
    return {
      affectedRows: result.affectedRows
    };
  }
  
  static async transaction(callback) {
    if (!this.pool) {
      throw new Error('ORM not initialized. Call ORM.init(config) first.');
    }
    
    const connection = await this.pool.promise().getConnection();
    
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      console.error('Transaction Error:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // ADD THIS METHOD
  static async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('Database connection closed');
    }
  }
}

module.exports = ORM;