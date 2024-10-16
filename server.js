#!/usr/bin/python3

import express from 'express';
import appView from './routes';

const port = process.env.PORT || 5000;
const app = express();

app.use('/', appView);

app.listen(port, () => {
  console.log(`Server Listen to ${port}`);
});

export default app;
