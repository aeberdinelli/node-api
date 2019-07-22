import Promise from 'promise';
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';

import router from './api';

const debug = require('debug')('API');
const app = express();

// Collect some env vars
const PORT			= process.env.PORT || 3000;
const PRETTY_PRINT	= process.env.PRETTY_PRINT || false;
const MONGODB_URL	= process.env.MONGODB_URL || 'mongodb://localhost:27017/';
const MONGODB		= process.env.MONGODB || 'node-api';

// Connect to db
try {
	mongoose.connect(MONGODB_URL + MONGODB);
	mongoose.Promise = Promise;
}
catch (e) {
	debug(`[WARNING] Could not connect to MongoDB (${MONGODB_URL}${MONGODB})`);
	debug('[WARNING] Make sure Mongo is installed and running');
}

// Configure express
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

if (PRETTY_PRINT) {
	app.locals.pretty = true;
}

// Allow CORS
app.use(require('cors')());

// Allow pretty-print json responses
app.use((req, res, next) => {
	if (req.query.pretty)
	{
		app.set('json spaces', 4);
	}

	req.on('end', () => app.set('json spaces', 0));

	return next();
});

// Configure API routes
app.use('/api', router);

// Start app
app.listen(PORT, () => debug(`[INFO] App started on port ${PORT}`));