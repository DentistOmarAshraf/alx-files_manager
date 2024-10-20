#!/usr/bin/env node
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FileController {
  static postUpload(req, res) {
    const token = req.header('X-token');

    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const {
      name, type, data, parentId, isPublic = false,
    } = req.body;

    redisClient.get(`auth_${token}`)
      .then(async (userToken) => {
        try {
          if (!userToken) { throw new Error('Unauthorized'); }
          const user = await dbClient.getUserById(userToken.toString());
          const file = await dbClient.addFile(
            name, type, data, parentId, isPublic, user._id.toString(),
          );
          return res.status(201).json(file);
        } catch (err) {
          throw new Error(err.message);
        }
      })
      .catch((error) => {
        res.status(401).json({ error: error.message });
      });
  }
}

export default FileController;
