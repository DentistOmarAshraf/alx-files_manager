#!/usr/bin/env node

import { MongoClient, ObjectId } from 'mongodb';
import crypto from 'crypto';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

class DBClient {
  /**
   * constructor
   */
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || '27017';
    this.databaseEnv = process.env.DB_DATABASE || 'files_manager';
    this.client = new MongoClient(`mongodb://${this.host}:${this.port}`, { useUnifiedTopology: true });
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
  * addUser - add new user
  * @param {string} email
  * @param {string} password
  * @returns
  */
  async addUser(email, password) {
    if (!email || email.length === 0) { throw new Error('Missing email'); }
    if (!password || password.length === 0) { throw new Error('Missing password'); }
    try {
      const collection = this.database.collection('users');
      const checkEmail = await collection.find({ email }).toArray();
      if (checkEmail.length > 0) { throw new Error('Already exist'); }
      const data = {
        email,
        password: crypto.createHash('sha1').update(password).digest('hex'),
      };
      const result = await collection.insertOne(data);
      const toReturn = {
        id: result.ops[0]._id,
        email: result.ops[0].email,
      };
      return (toReturn);
    } catch (err) {
      return { error: err.message };
    }
  }

  async checkUser(email, password) {
    if (!email || email.length === 0) { throw new Error('Unauthorized'); }
    if (!password || password.length === 0) { throw new Error('Unauthorized'); }
    try {
      const collection = this.database.collection('users');
      const checkUser = await collection.find({ email }).toArray();
      if (checkUser.length === 0) {
        throw new Error('Unauthorized');
      }
      const inputPass = crypto.createHash('sha1').update(password).digest('hex');
      if (inputPass !== checkUser[0].password) {
        throw new Error('Unauthorized');
      }
      return {
        id: checkUser[0]._id.toString(),
        email: checkUser[0].email,
      };
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async getUserById(id) {
    if (!id || !id.length) return null;
    try {
      const collection = this.database.collection('users');
      const users = await collection.find({ _id: new ObjectId(id) }).toArray();
      if (!users.length) {
        throw new Error('Unauthorized');
      }
      return users[0];
    } catch (err) {
      throw new Error(err.message);
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

  async addFile(name, type, data, parentId = 0, isPublic = false, userId) {
    const acceptedType = ['file', 'folder', 'image'];
    const collection = this.database.collection('files');
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const fileName = uuidv4();
    const localPath = `${folderPath}/${fileName}`;
    let parent;
    let doc;
    if (!name) {
      throw new Error('Missing name');
    }
    if (!type || !acceptedType.includes(type)) {
      throw new Error('Missing type');
    }
    if (!data && type !== 'folder') {
      throw new Error('Missing data');
    }
    if (parentId) {
      try {
        parent = await this.getFileById(parentId);
        if (parent.type !== 'folder') {
          throw new Error('Parent is not a folder');
        }
      } catch (err) {
        if (err.message === 'Parent is not a folder') {
          throw new Error(err.message);
        } else {
          throw new Error('Parent not found');
        }
      }
    }
    if (data && type !== 'folder') {
      fs.mkdirSync(folderPath, { recursive: true });
      fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
    }
    try {
      if (type === 'folder') {
        doc = {
          userId: new ObjectId(userId),
          name,
          type,
          parentId: parentId ? new ObjectId(parentId) : 0,
        };
      } else {
        doc = {
          userId: new ObjectId(userId),
          name,
          type,
          parentId: parentId ? new ObjectId(parentId) : 0,
          isPublic,
          localPath,
        };
      }
      const response = await collection.insertOne(doc);
      return {
        id: response.ops[0]._id,
        userId: response.ops[0].userId,
        name: response.ops[0].name,
        type: response.ops[0].type,
        isPublic: response.ops[0].isPublic,
        parentId: response.ops[0].parentId.toString(),
      };
    } catch (err) {
      return (err);
    }
  }

  async getFileById(id) {
    if (!id) return null;
    const collection = this.database.collection('files');
    const data = await collection.find({ _id: new ObjectId(id) }).toArray();
    if (!data.length) {
      throw new Error('Not found');
    }
    return (data[0]);
  }

  async getFileByUserId(userId, parentId = 0, page = 0, size = 1) {
    if (!userId) return null;
    const collection = this.database.collection('files');
    const start = page * size;
    let match;
    if (parentId) {
      match = { userId: new ObjectId(userId), parentId: new ObjectId(parentId) };
    } else if (!parentId) {
      match = { userId: new ObjectId(userId) };
    }
    const data = await collection.aggregate([
      { $match: match },
      { $skip: start },
      { $limit: size },
    ]).toArray();
    return (data.map((item) => ({
      id: item._id,
      ...item,
      _id: undefined,
    })));
  }

  async getFileByUserFileId(userId, fileId) {
    if (!userId || !fileId) return null;
    const collection = this.database.collection('files');
    const data = await collection.find({
      _id: new ObjectId(fileId),
      userId: new ObjectId(userId),
    }).toArray();
    if (!data.length) { throw new Error('Not found'); }
    return (data[0]);
  }

  async updatePublicity(fileId, userId, publicity) {
    const collection = this.database.collection('files');
    const check = await collection.updateMany(
      { _id: new ObjectId(fileId), userId: new ObjectId(userId) },
      { $set: { isPublic: publicity } },
    );
    if (!check.matchedCount) { throw new Error('Not found'); }
    const file = await this.getFileById(fileId);
    const toReturn = {
      id: file._id,
      ...file,
      _id: undefined,
    };
    return (toReturn);
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
