import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const isProduction = process.env.NODE_ENV === 'production';
const isLocalDB = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

const sequelize = new Sequelize(databaseUrl, {
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 20,
    min: 2,
    acquire: 30000,
    idle: 10000,
    evict: 1000
  },
  dialectOptions: {
    ssl: isProduction && !isLocalDB ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

export default sequelize;
