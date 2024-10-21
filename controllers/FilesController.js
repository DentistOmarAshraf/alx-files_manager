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
        if (!userToken) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        try {
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
        res.status(400).json({ error: error.message });
      });
  }

  static getShow(req, res) {
    const { id } = req.params;
    const userToken = req.header('X-token');
    redisClient.get(`auth_${userToken}`)
      .then((userId) => {
        dbClient.getFileByUserFileId(userId, id)
          .then((data) => res.status(200).json(data))
          .catch((err) => res.status(404).json({ error: err.message }));
      })
      .catch((err) => res.status(401).json({ error: err.message }));
  }
}

export default FileController;
