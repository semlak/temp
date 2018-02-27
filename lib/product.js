'use strict';

// const ORM = require("./myorm");
// const mysql = require('mysql');
// let Product = new ORM('products')
const relation = 'products';
// const dbName = 'bamazon';
const idKey = 'item_id'
const ORM = require('./myorm');

// let pool = mysql.createPool({
// 	connectionLimit: 10,
// 	host: "localhost",
// 	port: 3306,
// 	user: 'semlak',
// 	password: '',
// 	database: dbName
// });

module.exports = class Product extends ORM{
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
		Product.remove(params, callback);
	}

	static newMe(params) {
		let product = new Product(params);
		return product;
	}

}

module.exports.idKey = idKey
module.exports.relation = relation;