#!/usr/bin/env node
import fs from 'fs';
import mime from 'mime-types';
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
          return res.status(400).json({ error: err.message });
        }
      })
      .catch((error) => {
        res.status(401).json({ error: error.message });
      });
  }

  static getShow(req, res) {
    const { id } = req.params;
    const userToken = req.header('X-token');
    redisClient.get(`auth_${userToken}`)
      .then((userId) => {
        if (!userId) { throw new Error('Unauthorized'); }
        dbClient.getFileByUserFileId(userId.toString(), id)
          .then((data) => res.status(200).json(data))
          .catch((err) => res.status(404).json({ error: err.message }));
      })
      .catch((err) => res.status(401).json({ error: err.message }));
  }

  static getIndex(req, res) {
    const { parentId, page } = req.query;
    const userToken = req.header('X-token');
    redisClient.get(`auth_${userToken}`)
      .then((userId) => {
        if (!userId) { throw new Error('Unauthorized'); }
        dbClient.getFileByUserId(userId, parentId, page, 20)
          .then((data) => res.status(200).json(data))
          .catch((err) => res.status(404).json({ error: err.message }));
      })
      .catch((err) => res.status(401).json({ error: err.message }));
  }

  static putPublish(req, res) {
    const { id } = req.params;
    const userToken = req.header('X-token');
    redisClient.get(`auth_${userToken}`)
      .then((userId) => {
        if (!userId) { throw new Error('Unauthorized'); }
        dbClient.updatePublicity(id, userId, true)
          .then((file) => res.status(200).json(file))
          .catch((err) => res.status(404).json({ error: err.message }));
      })
      .catch((err) => res.status(401).json({ error: err.message }));
  }

  static putUnpublish(req, res) {
    const { id } = req.params;
    const userToken = req.header('X-token');
    redisClient.get(`auth_${userToken}`)
      .then((userId) => {
        if (!userId) { throw new Error('Unauthorized'); }
        dbClient.updatePublicity(id, userId, false)
          .then((file) => res.status(200).json(file))
          .catch((err) => res.status(404).json({ error: err.message }));
      })
      .catch((err) => res.status(401).json({ error: err.message }));
  }

  static getFile(req, res) {
    const userToken = req.header('X-token');
    const { id } = req.params;
    redisClient.get(`auth_${userToken}`)
      .then((userId) => {
        dbClient.getFileById(id)
          // eslint-disable-next-line consistent-return
          .then((fileObj) => {
            if (!fileObj.isPublic && fileObj.userId.toString() !== userId) {
              throw new Error('Not found');
            }
            if (fileObj.type === 'folder') {
              return res.status(400).json({ error: 'A folder doesn\'t have content' });
            }
            let isEmpty = true;
            const stream = fs.createReadStream(fileObj.localPath);
            stream.on('data', () => { isEmpty = false; });
            stream.on('end', () => {
              if (isEmpty) { res.status(404).json({ error: 'Not found' }); }
            });
            res.status(200).setHeader('Content-Type', mime.lookup(fileObj.name));
            stream.pipe(res);
          })
          .catch((err) => res.status(404).json({ error: err.message }));
      })
      .catch((err) => res.status(401).json({ error: err.message }));
  }
}

export default FileController;
