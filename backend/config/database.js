const { Sequelize } = require('sequelize');
require('dotenv').config();

const getDatabaseConfig = () => {
  if (process.env.DB_DIALECT === 'sqlite') {
    return {
      dialect: 'sqlite',
      storage: process.env.DB_STORAGE || './database.sqlite',
      logging: process.env.NODE_ENV === 'development' ? console.log : false
    };
  } else {
    return {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    };
  }
};

const sequelize = new Sequelize(getDatabaseConfig());

module.exports = sequelize;