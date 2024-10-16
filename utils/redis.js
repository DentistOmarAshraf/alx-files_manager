#!/usr/bin/env node
import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  /**
   * constructor - instance start connection to redis
   */
  constructor() {
    this.client = createClient();
    this.isConnected = true;
    this.client.on('error', (error) => {
      this.isConnected = false;
      console.log(`Redis Client Connection fail ${error}`);
    });
    this.client.on('connect', () => {
      this.isConnected = true;
    });
    this.asyncGET = promisify(this.client.get).bind(this.client);
    this.asyncSETEX = promisify(this.client.setex).bind(this.client);
    this.asyncDEL = promisify(this.client.del).bind(this.client);
  }

  /**
   * isAlive - check connection to redis
   * @returns boolean
   */
  isAlive() {
    return this.isConnected;
  }

  /**
   * get - get key from redis
   * @param {string} key
   * @returns string
   */
  async get(key) {
    try {
      return await this.asyncGET(key);
    } catch (error) {
      return (error);
    }
  }

  /**
   * set - set value for duration
   * @param {string} key
   * @param {string} value
   * @param {number} duration
   * @returns
   */
  async set(key, value, duration) {
    try {
      return await this.asyncSETEX(key, duration, value);
    } catch (error) {
      return (error);
    }
  }

  /**
   * del - delete from redis DB
   * @param {string} key
   * @returns
   */
  async del(key) {
    try {
      return await this.asyncDEL(key);
    } catch (error) {
      return (error);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
