import express from 'express';

import models from '../schemas';
import db from '../db';

/**
 * An object that translates de url parameters to db methods
 * Also used to remove its keys from the body
 *
 * @type {object}
 */
const SEARCH_PARAMS = {
	'max': 'limit',
	'limit': 'limit',
	'limite': 'limit',
	'page': 'page',
	'pag': 'page',
	'pagina': 'page',
	'from': 'page',
	'desde': 'page',
	'order': 'order',
	'sort': 'sort',
	'pretty': ''
};

let router = express.Router();

router.use('/:model/:id?', (req, res) => {
	if (!models[req.params.model]) {
		return res.status(500).json({
			'error': true,
			'msg': `Base de datos ${req.params.model} no encontrada`
		});
	}

	switch (req.method) {
		case 'POST':
			db(req.params.model).insert(req.body)
				.then(result => res.status(200).json(result))
				.catch(err => res.status(500).json(err));
		break;
		case 'GET':
			// Find by Id
			if (req.params.id || req.params._id) {
				let id = req.params.id || req.params._id;

				return db(req.params.model).get(id)
					.then(result => res.status(200).json(result))
					.catch(err => res.status(500).json(err));
			}

			let body = req.query;
			let query = {};

			// Remove parameters from filters
			Object.keys(SEARCH_PARAMS).forEach(param => {
				if (body[param] && SEARCH_PARAMS[param] != '') {
					// If we can use it as a parameter for the search, assign to query
					query[param] = body[param];
				}

				delete body[param]
			});

			db(req.params.model)
				.search(body, query)
				.then(result => res.json(result))
				.catch(err => res.status(500).json(err));
		break;
		case 'PUT':
			if (!req.params.id) {
				return res.status(400).json({
					'error': true,
					'msg': 'No se envio la Id del objeto a modificar'
				});
			}

			db(req.params.model).update(req.params.id, req.query)
				.then(result => res.json(result))
				.catch(err => res.status(500).json(err));
		break;
		case 'DELETE':
			if (!req.params.id) {
				return res.status(400).json({
					'error': true,
					'msg': 'No se envio la Id del objeto a eliminar'
				});
			}

			db(req.params.model)
				.remove(req.params.id)
				.then(result => res.json(result))
				.catch(err => res.status(500).json(err));
		break;
	}
});

export default router;