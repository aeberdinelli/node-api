const express = require('express');
const moment = require('moment');
const jwt = require('jwt-simple');
const validatePassword = require('./validatePassword');

const db = require('../db');

/**
 * Users collection name
 * @var {String}
 */
const USERS_COLLECTION = 'user';

/**
 * Package information
 * @var {object}
 */
const PKG = require('../../package.json');

/**
 * Signature for JWT
 * @var {String}
 */
const JWT_SIGNATURE = process.env['JWT_SIGNATURE'] || PKG.config.JWT_SIGNATURE || '';

/**
 * Token duration
 * @var {Number}
 */
const JWT_LIFETIME = process.env['JWT_LIFETIME'] || PKG.config.JWT_LIFETIME || 9;

/**
 * Allowed methods for guests
 * @var {Array}
 */
const BASIC_PRIVILEGES = (!!PKG.config.GUEST_PRIVILEGES) ? PKG.config.GUEST_PRIVILEGES : ['GET'];

const ACTIONS = {
	'GET': 'search',
	'POST': 'create',
	'PUT': 'update',
	'DELETE': 'delete'
};

const router = express.Router();

// Allow to get a list of users without auth
router.get(['/user','/users'], (req, res) => {
	db(USERS_COLLECTION)
		.search()
		.then(users => {
			return res.json(users.map(user => {
				delete user.password;
				delete user.privileges;

				return user;
			}));
		})
		.catch(err => res.status(500).json(err));
});

// Allow register new user
router.post(['/user','/users'], (req, res) => {
	// Security: remove privileges
	delete req.body.privileges;

	db(USERS_COLLECTION)
		.insert(req.body)
		.then(user => res.status(201).json({
			'error': false,
			'user': user
		}))
		.catch(err => res.status(500).json({
			'error': true,
			'msg': err
		}));
});

// Generate token
router.post('/login', (req, res) => {
	if (!req.body.email || !req.body.password) {
		return res.status(400).json({
			'error': true,
			'msg': 'Email and password are required'
		});
	}

	let { password } = req.body;
	delete req.body.password;

	db(USERS_COLLECTION)
		.search(req.body)
		.then(result => {
			let user = result[0];

			if (!user) {
				return Promise.reject({
					error: true,
					msg: 'Could not find user'
				});
			}

			validatePassword(password, user.password, (err, success) => {
				if (err || !success) {
					return res.status(400).json({
						'error': true,
						'msg': 'Password is incorrect'
					});
				}

				let token = jwt.encode({
					user: user,
					iat: moment().unix(),
					exp: moment().add(JWT_LIFETIME, 'hours').unix()
				}, JWT_SIGNATURE);
	
				return res.status(200).json({
					'error': false,
					'token': token
				});
			});
		})
		.catch(err => res.status(500).json(err));
});

// Validate existing token, if any
router.use((req, res, next) => {
	// Continue to the user validation to check for not logged in permissions
	if (!req.query.token && (!req.headers.authorization || req.headers.authorization.split(' ').length == 1)) {
		return next();
	}

	let token = (req.query.token || req.headers.authorization.split(' ')[1]).trim();

	try {
		let body = jwt.decode(token, JWT_SIGNATURE);

		if (body.exp && body.exp <= moment().unix()) {
			return res.status(401).json({
				'error': true,
				'msg': 'Token expired',
				'stack': {}
			});
		}

		// Save user data into every request
		req.user = body.user;

		return next();
	}
	catch (e) {
		return res.status(400).json({
			'error': true,
			'msg': 'Token validation error',
			'token': token
		});
	}
});

// Finally, validate permissions
router.use('/:model', (req, res, next) => {
	if (!req.user || !req.user.privileges) {
		if (BASIC_PRIVILEGES.indexOf(req.method.toUpperCase()) === -1) {
			return res.status(400).json({
				'error': true,
				'msg': 'User is not allowed to do this'
			});
		}

		return next();
	}

	// Validate if user has enough privileges
	if (!req.user.privileges.some(privilege => privilege.model == req.params.model && privilege.methods.indexOf(req.method.toUpperCase()) > -1)) {
		return res.status(400).json({
			'error': true,
			'msg': 'User cannot perform that action',
			'action': ACTIONS[req.method],
			'model': req.params.model
		});
	}

	return next();
});

module.exports = router;