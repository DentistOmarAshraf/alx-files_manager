#!/usr/bin/python3

import express from 'express';
import appView from './routes';

const port = process.env.PORT || 5000;
const app = express();

appView(app);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
