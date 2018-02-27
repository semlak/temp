'use strict';

// const ORM = require("./myorm");
// const mysql = require('mysql');
// let Product = new ORM('products')
const relation = 'line_item';
// const dbName = 'bamazon';
const idKey = 'id'
const ORM = require('./myorm');

// let pool = mysql.createPool({
// 	connectionLimit: 10,
// 	host: "localhost",
// 	port: 3306,
// 	user: 'semlak',
// 	password: '',
// 	database: dbName
// });

module.exports = class LineItem extends ORM{
	constructor(params) {
		// Object.keys(params).forEach(key=> this[key] = params[key]);
		// this.params = params;
		super(params);
		this.relation = relation;
		this.idKey = idKey;

	}


	remove(callback) {
		let params = {};
		params[idKey] = this[idKey];
		LineItem.remove(params, callback);
	}

	static newMe(params) {
		let item = new LineItem(params);
		return item;
	}

}

module.exports.idKey = idKey
module.exports.relation = relation;