#!/usr/bin/env node
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  /**
   * getStatus - Status of redis and mongo
   * @param {import('http').IncomingMessage} req
   * @param {import('http').ServerResponse} res
   */
  static getStatus(req, res) {
    const data = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    const jsonString = JSON.stringify(data);
    res.statusCode = 200;
    res.setHeader('Contnet-Type', 'application/json');
    res.setHeader('Content-Length', jsonString.length);
    res.end(jsonString);
  }

  /**
   * getStats - Stats in mongodb
   * @param {import('http').IncomingMessage} req
   * @param {import('http').ServerResponse} res
   */
  static async getStats(req, res) {
    const data = {
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    };
    const jsonString = JSON.stringify(data);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', jsonString.length);
    res.end(jsonString);
  }
}

export default AppController;
