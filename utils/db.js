#!/usr/bin/env node

import { MongoClient } from 'mongodb';

class DBClient {
  /**
   * constructor
   */
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || '27017';
    this.databaseEnv = process.env.DB_DATABASE || 'files_manager';
    this.client = new MongoClient(`mongodb://${this.host}:${this.port}`);
    this.isConnected = true;
    (async () => {
      await this.connect();
      this.database = this.client.db(this.databaseEnv);
    })();
  }

  /**
   * isAlive - check connection
   * @returns boolean
   */
  isAlive() {
    return this.isConnected;
  }

  /**
   * nbUsers - return countDocument in collection
   * @returns number
   */
  async nbUsers() {
    try {
      const collection = this.database.collection('users');
      return await collection.countDocuments();
    } catch (err) {
      return (err);
    }
  }

  /**
   * nbFiles - return countDocument in collection
   * @returns number
   */
  async nbFiles() {
    try {
      const collection = this.database.collection('files');
      return await collection.countDocuments();
    } catch (err) {
      return (err);
    }
  }

  /**
   * async connection to mongodb
   */
  async connect() {
    try {
      await this.client.connect();
      this.isConnected = true;
    } catch (err) {
      console.error('connection Fail');
      this.isConnected = false;
    }
  }
}

const dbClient = new DBClient();
export default dbClient;
