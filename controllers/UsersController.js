#!/usr/bin/env node
import dbClient from '../utils/db';

class UsersController {
  static postNew(req, res) {
    dbClient.addUser(req.body.email, req.body.password)
      .then((data) => res.status(201).json(data))
      .catch((err) => res.status(400).json({ error: err.message }));
  }
}

export default UsersController;
