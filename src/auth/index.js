import express from 'express';
import moment from 'moment';
import jwt from 'jwt-simple';
import validatePassword from './validatePassword';

import db from '../../db';

/**
 * Users collection name
 * @var {String}
 */
const USERS_COLLECTION = 'user';

/**
 * Package information
 * @var {object}
 */
const PKG = require('../../../package.json');

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

// Generate token
router.post('/login', (req, res) => {
	if (!req.body.email || !req.body.password) {
		return res.status(400).json({
			'error': true,
			'msg': 'Email and password are required'
		});
	}

	db(USERS_COLLECTION)
		.search(req.body)
		.then(result => {
			validatePassword(req.body.password, result.password, (err, success) => {
				if (err || !success) {
					return res.status(400).json({
						'error': true,
						'msg': 'Password is incorrect'
					});
				}

				let token = jwt.encode({
					user: body,
					iat: moment().unix(),
					exp: moment().add(JWT_LIFETIME, 'hours').unix()
				}, JWT_SIGNATURE);
	
				return res.status(200).send(token);
			});
		})
		.catch(err => res.status(500).json(err));
});

// Validate existing token, if any
router.use((req, res, next) => {
	// Continue to the user validation to check for not logged in permissions
	if (!req.query.token && !req.headers.authorization) {
		return next();
	}

	let token = (req.query.token || req.headers.authorization.split(' ')[1]).trim();

	try {
		let body = jwt.decode(token, JWT_SIGNATURE);

		if (!body.exp || body.exp <= moment().unix()) {
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
	if (!req.user) {
		if (BASIC_PRIVILEGES.indexOf(req.method.toUpperCase()) === -1) {
			return res.status(400).json({
				'error': true,
				'msg': 'User is not allowed to do this'
			});
		}
	}

	// Validate if user has enough privileges
	if (!req.user.privileges[model] || req.user.privileges[model].indexOf(req.method.toUpperCase()) === -1) {
		return res.status(400).json({
			'error': true,
			'msg': 'User cannot perform that action'
		});
	}

	return next();
});

export default router;