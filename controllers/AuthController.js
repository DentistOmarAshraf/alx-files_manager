#!/usr/bin/env node
import { v4 as uuidv4 } from 'uuid';
import Auth from '../utils/auth';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static getConnect(req, res) {
    const user = Auth.getUserEmailPassword(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    dbClient.checkUser(user.email, user.password)
      .then(async (data) => {
        const newUuid = uuidv4();
        try {
          await redisClient.set(`auth_${newUuid}`, data.id, 86400);
          res.status(200).json({ token: newUuid });
        } catch (err) {
          throw new Error(err.message);
        }
      })
      .catch((err) => {
        res.status(401).json({ error: err.message });
      });
  }

  static getDisconnect(req, res) {
    const token = req.headers['x-token'];
    redisClient.del(`auth_${token}`)
      .then((ret) => {
        if (ret) {
          res.status(204).json();
        } else {
          throw new Error('Unauthorized');
        }
      })
      .catch((err) => {
        res.status(401).json({ error: err.message });
      });
  }
}

export default AuthController;
