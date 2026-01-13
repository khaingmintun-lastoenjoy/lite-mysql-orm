'use strict';

class HelperUtils {
  static toPagination(total, { page, limit }) {
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      from: total === 0 ? 0 : ((page - 1) * limit) + 1,
      to: total === 0 ? 0 : Math.min(page * limit, total)
    };
  }
  
  static cleanObject(obj) {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined)
    );
  }
  
  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static randomString(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

module.exports = HelperUtils;