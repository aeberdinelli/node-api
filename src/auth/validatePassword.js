const bcrypt = require('bcrypt');

/**
 * Complexity for bcrypt
 * @var {Number}
 */
const SALT_FACTOR = 10;

/**
 * Validates password with its hash
 * 
 * @param {String}   candidate
 * @param {String}   hash
 * @param {Function} callback
 * @return {void}
 */
module.exports = function(candidate, hash, callback) {
	bcrypt.compare(candidate, hash, function(err, matched) {
		if (err) {
			return callback(err);
		}

		callback(null, matched);
	});
};