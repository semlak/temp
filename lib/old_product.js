'use strict';

// const ORM = require("./myorm");
const mysql = require('mysql');
// let Product = new ORM('products')
const relation = 'products';
const dbName = 'bamazon';
const idKey = 'item_id'

let pool = mysql.createPool({
	connectionLimit: 10,
	host: "localhost",
	port: 3306,
	user: 'semlak',
	password: '',
	database: dbName
});

module.exports = class Product  {
	constructor(params) {
		Object.keys(params).forEach(key=> this[key] = params[key]);
		this.params = params;
	}

	save(callback) {
		let me =this;
		pool.getConnection(function(err, connection) {
			let sqlStatement = 'insert into ' + relation + ' SET ?';
			connection.query(sqlStatement, me.params, function(err, results, fields) {
				if (err) console.log(err);
				console.log("results", results);
			})
		})
	}

	update(callback) {
		let me =this;
		pool.getConnection(function(err, connection) {
			let updates = Object.assign({}, me.params);
			// update anything where the this[key] is not equal to the params[key]
			Object.keys(updates).forEach(key => {
				if (updates[key] === me[key]) {
					delete updates[key]
				}
				else {
					updates[key] = me[key]
				}
			});

			if (updates[idKey]) delete updates[idKey];

			let sqlStatement = 'update ' + relation + ' SET ? where ' + idKey + ' = ?';
			connection.query(sqlStatement, [updates, me.params[idKey]], function(err, results, fields) {
				if (err) console.log(err);
				console.log("results", results);
				console.log("query text: ", this.sql)
			})
		})
	}


	remove(callback) {
		let params = {};
		params[idKey] = this[idKey];
		Product.remove(params, callback);
	}

	static remove(params, callback) {

	}

	static deleteMany(params, callback) {

	}

	static deleteOne(params, callback) {

	}


	static find(params, callback) {
		// callback should expect an an array of recordObjects
		// let me = this;
		pool.getConnection(function(err, connection) {
			let sqlInitialQueryText = 'select * from ' + relation;
			// if pararms is empty, sql statement needs no query clause
			let paramKeys = Object.keys(params|| {});
			let sqlWhereClause = paramKeys.length < 1? "" :  " where " + paramKeys.map(key => key + " = ?").join(", ");

			// + ' where ' + Object.keys(params).map(key => key + " = ?").join(", ");
			let options = {
				sql: sqlInitialQueryText + sqlWhereClause,
				timeout: 10000,
				values: paramKeys.map(key => params[key])
			}
			// console.log("query options", options);
			connection.query(options, function(err, results) {
					if (err) console.log("err", err);
					else if (results.length < 1) {
						throw "No record with with specified params  found in '" + relation + "' relation.";
					}
					if (typeof callback === "function") {
						// convert each result into Product type
						let products = results.map(result => new  Product(result));
						callback(products);
					}
					else {
						console.log("results:", results);
					}
					connection.release();
					// list();

				})
		});
	}


	static findOne(params, callback) {
		// just call the find function, but use the first result
		// callback should expect a single record Object rather than an array of recordObjects
		let newCallback = function(results) {
			callback(results[0]);
		}
		this.find(params, newCallback);
	}

	static findById(id, callback) {
		// just call the findOne function,
		// callback should expect a single record Object rather than an array of recordObjects
		let params = {};
		params[idKey] = id;
		this.findOne(params, callback);
	}
}

