const Promise = require('promise');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const PKG = require('../package.json');

const router = require('./api');

const debug = require('debug')('API');
const app = express();

// An array of the required env vars!
const REQUIRED_VARS = ['MONGODB', 'JWT_SIGNATURE'];

// Collect some env vars
const PORT			= process.env.PORT || 3000;
const PRETTY_PRINT	= process.env.PRETTY_PRINT || false;
const MONGODB_URL	= process.env.MONGODB_URL || 'mongodb://localhost:27017/';
const MONGODB		= process.env.MONGODB;

REQUIRED_VARS.forEach(required => {
	if (!process.env[required]) {
		debug(`[ERROR] Missing required variable: ${required}`);
		process.exit(0);
	}
});

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

app.locals.VERSION = process.env.APP_VERSION || PKG.version;

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