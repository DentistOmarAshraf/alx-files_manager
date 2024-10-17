#!/usr/bin/env node

import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const appView = (app) => {
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);
  app.post('/users', express.json(), UsersController.postNew);
};

export default appView;
