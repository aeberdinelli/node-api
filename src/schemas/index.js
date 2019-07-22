import fs from 'fs';
import path from 'path';

/**
 * This file autoloads the db schemas
 * Should not be modified
 */

// Path to the schemas (default: this dir)
const schemas_path = path.join(__dirname);

// Exporting object
let schemas = {};

fs.readdirSync(schemas_path).forEach(file => {
	let name = file.toLowerCase().replace('.js','');

	if (['index','unions'].indexOf(name) > -1) {
		return;
	}

	schemas[name] = require(path.join(schemas_path, file));
	schemas[`${name}s`] = require(path.join(schemas_path, file));
});

export default schemas;