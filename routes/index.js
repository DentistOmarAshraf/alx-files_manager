#!/usr/bin/env node

import express from 'express';
import AppController from '../controllers/AppController';

const appView = express.Router();

appView.get('/status', AppController.getStatus);

appView.get('/stats', AppController.getStats);

export default appView;
