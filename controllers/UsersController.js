#!/usr/bin/env node
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static postNew(req, res) {
    dbClient.addUser(req.body.email, req.body.password)
      .then((data) => res.status(201).json(data))
      .catch((err) => res.status(400).json({ error: err.message }));
  }

  static getMe(req, res) {
    const token = req.header('X-token');
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    redisClient.get(`auth_${token}`)
      .then(async (data) => {
        if (data) {
          try {
            const user = await dbClient.getUserById(data.toString());
            res.status(200).json({
              id: user._id.toString(),
              email: user.email,
            });
          } catch (err) {
            res.status(401).json({ error: err.message });
          }
        } else {
          throw new Error('Unauthorized');
        }
      })
      .catch((err) => {
        res.status(401).json({ error: err.message });
      });
  }
}

export default UsersController;
