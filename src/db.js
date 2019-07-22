import Promise from 'promise';
import mongoose from 'mongoose';
import models from './schemas';

/**
 * Mongoose ObjectID
 * @type {ObjectId}
 */
const ObjectId = require('mongoose').Types.ObjectId;

/**
 * Max limit for queries
 * @type {number}
 */
const MAX_LIMIT = 30;

/**
 * Default limit for queries
 * @type {number}
 */
const DEFAULT_LIMIT = 20;

/**
 * Default order for results
 * @type {string}
 */
const DEFAULT_ORDER = 'ASC';

/**
 * Returns an object with functions to insert, update, search and remove documents
 *
 * @param {string} db The mongoose schema to use
 * @return {object}
 */
export default function(db) {
	var model = models[db];

	return {
		insert(body) {
			return new Promise((resolve, reject) => {
				return model.create(body, (err, result) => {
					if (err) {
						return reject(err);
					}

					return resolve(result);
				});
			});
		},

		get(id) {
			let search = {
				_id: id,
				deleted: null
			};

			let query = model.find(search);

			query.exec().then(result => {
				if (result.length) {
					return result[0];
				}

				return Promise.reject(`Object with _id: ${id} not found`);
			});
		},

		search(filters, query) {
			let q;

			filters = filters || {};
			query = query || {};

			// Delete unwanted query items
			delete query.token;
			delete query.pretty;
			delete filters.token;
			delete filters.pretty;

			// Password verification should be done later
			delete filters.password;

			for (let field in filters) {
				if (/^(\<|\>|=)*[0-9]+$/.test(filters[field])) {
					// @TODO: Support number queries
					return;
				}

				// Not a numeric search, create regex
				filters[field] = new RegExp(filters[field], 'gi');
			}

			filters.deleted = null;
			q = model.find(filters);

			// Skip to desired page
			if (query.page) {
				query.limit = (query.limit > 0 && query.limit < MAX_LIMIT) ? query.limit : DEFAULT_LIMIT;
				q.skip((parseInt(query.page) - 1) * parseInt(query.limit));
			}

			// Change sort order
			if (query.sort) {
				let order = (query.order) ? query.order : DEFAULT_ORDER;
				let s = {};

				s[query.sort] = order.toLowerCase();

				q.sort(s);
			}

			q.limit(parseInt(query.limit));

			return q.exec().then(function(results) {
				// Filter the results before outputing them
				let result = results.map(function(item) {
					item = item.toObject();

					// Remove internal data
					delete item.__v;

					return item;
				});

				if (!query.page) {
					return result;
				}

				return model.count(filters).exec().then(count => {
					return {
						'total': count,
						'result': result
					};
				});
			});
		},

		update(id, body) {
			return model.update({
				_id: new ObjectId(id),
				deleted: null
			}, {
					$set: body
				}
			)
			.exec()
			.then(result => Promise.resolve({ error: false, updated: result.n }));
		},

		remove(id) {
			return model.update({
				_id: new ObjectId(id),
				deleted: null
			}, {
					$set: {
						deleted: true
					}
				}
			)
			.exec()
			.then(result => Promise.resolve({ error: false, updated: result.n }));
		}
	}
}