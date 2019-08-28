# Node-api
Quickly start your project by just cloning this repo!

## Install
Just clone this repo, run `npm install` and you should have a complete node crud api. Of course, you need NodeJS and MongoDB installed first. Here's a detailed step by step:

- [Install NodeJS](https://nodejs.org/es/) version >= 10
- [Install MongoDB](https://www.mongodb.com)
- Clone this repo: `git clone https://github.com/aeberdinelli/node-api.git` (you can also fork this so you can just push to your own repo with this API as a base)
- Install node dependencies: `npm install`
- Set log outputs: 
    - On Mac/Linux: `export DEBUG=API*`
    - On Windows: `set DEBUG=API*`
- Run! `npm start`

## Using
This api will read all the mongoose schemas inside `src/schemas` and create endpoints for each one of them. There's already a schema that you can use as an example which is also needed in order for this API to work.

For example, if you want to create a CRUD for books, you can create a schema file like this:

```javascript
const mongoose = require('mongoose');

let SchemaBooks = new mongoose.Schema({
	'title': {
		type: String
	},
	'author': {
		type: String
	},
	'deleted': {
		type: Boolean,
		default: null
	}
});

module.exports = mongoose.model('Book', SchemaBooks);
```

## Permissions
This API supports permissions per user per endpoint. For example, if you want to add a user that can create, delete and read books but can only read authors, you should add a document like this in the users collections in MongoDB:

```javascript
{
    "name" : "An user who have full access for the book endpoint but read only for author",
    "lastname" : "Some",
    "nickname" : "User",
    "email" : "some@user",
    "phone" : "+1 321 1234567",
    "password" : "$2b$10$RqMmS35qslNgqFwebcwy4.g3gfVic51u3bAeAtytAPcpjHmQth/bm",
    "privileges" : [
        {
            "model" : "book",
            "methods" : [ 
                "GET", 
                "POST", 
                "PUT", 
                "DELETE"
            ]
        }, 
        {
            "model" : "author",
            "methods" : [ 
                "GET"
            ]
        }
    ],
    "deleted" : null
}
```

**Tip**: You can create a POST request to the `user` endpoint to create it and update the privileges later so the API will encrypt the password for you. (And for security reasons, the API will ignore the privileges property on the request).

## Settings
To make this API easily configurable in different environments, most of the settings are used from environment variables. Here's a table with the available vars.

<table>
	<thead>
		<tr>
			<th>Name</th>
			<th>Type</th>
			<th>Default value</th>
			<th>Doc</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>
				<pre>PORT</pre>
			</td>
			<td>
				<pre>number</pre>
			</td>
			<td>
				<pre>3000</pre>
			</td>
			<td>Defines the port to use in the API</td>
		</tr>
		<tr>
			<td>
				<pre>PRETTY_PRINT</pre>
			</td>
			<td>
				<pre>boolean</pre>
			</td>
			<td>
				<pre>false</pre>
			</td>
			<td>(Works only if you have views), sets if pretty prints the HTML when you use a template engine</td>
		</tr>
		<tr>
			<td>
				<pre>MONGODB_URL</pre>
			</td>
			<td>
				<pre>string</pre>
			</td>
			<td>
				<pre>mongodb://localhost:27017/</pre>
			</td>
			<td>The URL for the MongoDB connection</td>
		</tr>
		<tr>
			<td>
				<pre>MONGODB</pre>
			</td>
			<td>
				<pre>string</pre>
			</td>
			<td>
				<em>null</em>
			</td>
			<td>**required** Name of the database to use</td>
		</tr>
		<tr>
			<td>
				<pre>DEBUG</pre>
			</td>
			<td>
				<pre>string</pre>
			</td>
			<td>
				<em>null</em>
			</td>
			<td>This sets the logs output to the console. I recommend you use this value: `API*`. That will enable all logs for the API and its sublevels</td>
		</tr>
		<tr>
			<td>
				<pre>JWT_SIGNATURE</pre>
			</td>
			<td>
				<pre>string</pre>
			</td>
			<td>
				<em>null</em>
			</td>
			<td>
				<strong>required</strong>
				The JWT signature. You can use any word just like <code>pepe</code>. Also, you can change this to disable all the existing JWT tokens forcing a new login
			</td>
		</tr>
		<tr>
			<td>
				<pre>JWT_LIFETIME</pre>
			</td>
			<td>
				<pre>string</pre>
			</td>
			<td>
				<pre>9</pre>
			</td>
			<td>
				The JWT session token lifetime, in hours.
			</td>
		</tr>
		<tr>
			<td>
				<pre>GUEST_PRIVILEGES</pre>
			</td>
			<td>
				<pre>array</pre>
			</td>
			<td>
				<pre>['GET']</pre>
			</td>
			<td>
				An array with the allowed http verbs for a guest (for example, if you want all guest to be able to create and read things, you should set this to <code>['POST','GET']</code>)
			</td>
		</tr>
	</tbody>
</table>