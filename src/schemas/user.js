const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * Complexity for bcrypt
 * @var {Number}
 */
const SALT_FACTOR = 10;

var SchemaUser = new mongoose.Schema({
	'name': {
		type: String,
		required: true
	},
	'lastname': {
		type: String,
		required: true
	},
	'nickname': {
		type: String
	},
	'email': {
		type: String,
		required: true
	},
	'phone': {
		type: String,
		required: true
	},
	'password': {
		type: String,
		required: true
	},
	'privileges': [{
		'model': {
			type: String,
			required: true
		},
		'methods': [{
			type: String,
			enum: ['GET','POST','PUT','DELETE']
		}]
	}],
	'deleted': {
		type: Boolean,
		default: null
	}
});

SchemaUser.pre('save', function(next) {	
	let user = this;

	if (!user.isModified('password')) {
		return next();
	}

	bcrypt.genSalt(SALT_FACTOR, (err, salt) => {
		if (err) {
			return next(err);
		}

		bcrypt.hash(user.password, salt, (err, hash) => {
			if (err) {
				return next(err);
			}

			user.password = hash;
			next();
		});
	});
});

module.exports = mongoose.model('User', SchemaUser);