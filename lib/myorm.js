'use strict';

const stringify = require('json-stringify');
require("dotenv").config();

const validTableNames = {
	"products": true,
	"user": true,
	"line_item": true,
	"user_order": true
};

const mysql = require('mysql');
// let Product = new ORM('products')
// const relation = 'products';
const dbName = 'bamazon';
// const idKey = 'item_id'

let pool = mysql.createPool({
	connectionLimit: 10,
	// host: "localhost",
	host: process.env.DBHOST,
	port: process.env.DBPORT,
	user: process.env.DBUSER,
	password: process.env.DBPASSWD,
	// port: 3306,
	// user: 'semlak',
	// password: '',
	database: dbName
});


module.exports = class ORM {
	constructor(params) {
		// if (!validTableNames[relation]) throw "Relation + '" + relation + "' is not a valid relation for this ORM."
		// this.pool = connectionPool;
		// this.relationName = relation;
		// this.idKey = this.relationName === 'products' ? "item_id" : "id";
		Object.keys(params).forEach(key=> this[key] = params[key]);
		this.params = params;
	}


	static insertIfNotPresent(item, originalCallback) {
		// console.log("checking if item present", item);
		let me = this;
		// example of use, user provides email address
		// this tries to find existing user, and passes the user if found to initial callback.
		// otherwise, user is created, and then the user record is retried and passed to callback
		let callback1 = (results) => {
			// if (err) console.log(err);
			// if results is empty, create (insert) the item, then call original callback
			// otherwise, just call original callback
			// console.log("trying, results", results);
			if (!results ) {
				// console.log("in if branch");
				// console.log("trying to save item " , item);
				item.save(createResult =>  {
					// console.log("save successful")
					if (createResult.insertId != null) {
						me.findById(createResult.insertId, originalCallback);
					}
				})

			}
			else {
				// console.log("in else branch. calling final callback on result", results);
				originalCallback(results)
			}
		};
		this.findOne(item.params, callback1);

	}

	save(callback) {
		// console.log("trying to save")
		let me =this;
		pool.getConnection(function(err, connection) {
			let sqlStatement = 'insert into ' + me.relation + ' SET ?';
			connection.query(sqlStatement, me.params, function(err, results, fields) {
				if (err) console.log("222", err);
				// console.log("results", results);
				// console.log("sqltext: " ,this.sql);
				if (typeof callback === "function") {
					// the rersults will be an object that says fieldCount, affectedRows, insertId, and some other stuff
					callback(results);
				}
			})
		})
	}

	static insert(connection, rows, callback) {
		// this is inserting multiple records at once
		if (rows.length < 1) {
			// console.log("calling callback after attempted bulk insert with no rows returned")
			// console.log("rows", rows);
			callback([]);
			return ;
		}

		let me = this;

		let columnNames = Object.keys(rows[0]).filter(key => key != this.idKey && key != "params" && key != "relation" && key != "idKey");
		// get array of array of values, where each sub-array is a tupple of values for an individual row
		let columnValues = rows.map(row => columnNames.map(key => row[key]));


		// pool.getConnection(function(err, connection) {
			let sqlQuery = 'insert into ' + me.relation + " (" + columnNames.join(", ") + ") values ?"  ;
			let options = {
				sql: sqlQuery,
				timeout: 10000,
				values: [columnValues]
			}
			// console.log("\n\n\nQuery options: " , stringify(options));
			connection.query(options, function(err, results, fields) {
				if (err) {
					// console.log("error in bulk insert", err);
					return connection.rollback(function() {
						// console.log("error1 in myorm.js. Rolling back1")
						// console.log(err);
						if (typeof callback === "function" ) callback(typeof err === "string" ? err:
							"Sorry, your order could not be completed. Try editing items in cart.")

					});

				}
				else {
					// results.forEach(result => console.log("result", result));
					// console.log("results: ", results);
					// results contains fieldCount, affectedRows, insertId for one of the elements, serverStatus, warningCount, messagae, protocol, changedRows
					if (typeof callback === "function" )  callback(null, results, null);

				}
			})
		// }.bind(this))
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

			if (updates[me.idKey]) delete updates[me.idKey];

			if (Object.keys(updates).length < 1) {
				// console.log ("No updates to make");
			}
			else {
				let sqlStatement = 'update ' + me.relation + ' SET ? where ' + me.idKey + ' = ?';
				connection.query(sqlStatement, [updates, me.params[me.idKey]], function(err, results, fields) {
					if (err) console.log("333", err);
					// console.log("results", results);
					// console.log("query text: ", this.sql)
				})
			}

		})
	}


	remove(callback) {
		// let params = {};
		// params[me.idKey] = this[me.idKey];
		// Product.remove(params, callback);
	}

	static newMe(params) {
		// the derived class should implement this function
	}

	static remove(params, callback) {
		// to be implemented
	}

	static deleteMany(params, callback) {
		// to be implemented

	}

	static deleteOne(params, callback) {
		// to be implemented

	}
	static relationName() {
		return this.relation;
	}

	static prepareQuery(params) {
		let me = this;
		// generate the select clause (including requested columns, calculated fields), join clauses, filters (where clauses)
		// also generate the placeholder array of values to be passed to query to replace '?' in query.
		let whereClauseKeys = params && params.where ? Object.keys(params.where) : [];
		let calcFields = params && params.calc ?  params.calc: [];
		let joinClauses = params && params.join ? params.join: [];

		// console.log	("whereClauseKeys", whereClauseKeys)
		// console.log("joinClauses", joinClauses)
		// console.log("calcFields", calcFields)
		let sqlWhereClause = whereClauseKeys.length < 1 ? "" :
			"where " + whereClauseKeys.map(key =>[key,  "=", "?"].join(" ")).join(" and ");
		let sqlWhereClauseValues = whereClauseKeys.map(key => params.where[key]);
		// console.log("sqlWhereClause", sqlWhereClause)
		// console.log("sqlWhereClauseValues", sqlWhereClauseValues)

		let sqlJoinClause = joinClauses.map(joinInfo => [
				joinInfo.type,	"join", joinInfo.targetModel.relation , "on",
				joinInfo.leftModel.relation +"."+ joinInfo.thisKey, "=",
				joinInfo.targetModel.relation +"."+ joinInfo.targetKey
			].join(" ")
		).join(" ");


		let sqlCalcFieldsClause = calcFields.map(obj =>  obj.text);
		let sqlCalcPlaceHolderValues = [].concat.apply([], calcFields.map(obj => obj.values))
			// the [].concat.apply([], arrayOfArays) flattens an array of arrays
			// taken from https://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays-in-javascrip

		let rowColumnsToGet = params && params.columns ? params.columns: []
		let sqlQuery = [
			'select',	[rowColumnsToGet, sqlCalcFieldsClause].filter(arr=> arr.length>0).join(", ") || "*",
			"from", me.relation, sqlJoinClause, sqlWhereClause
		].join(" ")
		let sqlPlaceHolderValues = [].concat.apply([],[sqlCalcPlaceHolderValues, sqlWhereClauseValues]);

		let queryOptions = {
			sql: sqlQuery,
			timeout: 10000,
			values: sqlPlaceHolderValues
		}
		return queryOptions;

	}

	static find(params, callback) {
		// callback should expect an an array of recordObjects
		let me = this;
		// console.log(this);

		pool.getConnection(function(err, connection) {

			let queryOptions = this.prepareQuery(params);
			connection.query(queryOptions, function(err, results) {
				// console.log("this.sql", this.sql)
				if (err) {
					console.log ("err in static find query, query text was ", this.sql);
					// console.log("err", err);
					throw err;
				}
				else if ( results.length < 1) {
					// console.log("no results found");
					callback ("No record with with specified params  found in '" + me.relation + "' relation.");
				}
				if (typeof callback === "function") {
					let items = results.map(result => me.newMe(result));
					callback(items);
				}
				else {
					// console.log("results:", results);
				}
				connection.release();
				})
		}.bind(this));
	}

	static join(params, callback) {
		/*joins results from the current model with model(s) passed in params
			sampleParms = {
				thisObj
			}
		*/

	}

	static findOne(params, callback) {
		// just call the find function, but use the first result
		// callback should expect a single record Object rather than an array of recordObjects
		let newCallback = function(results) {
			// console.log("new callback")
			// console.log("results", results);
			if (typeof callback === "function") {
				callback(results[0]);
			}
		}
		let findParams = {
			where : params
		}


		this.find(findParams, newCallback);
	}

	static findById(id, callback) {
		let me = this;
		// just call the findOne function,
		// callback should expect a single record Object rather than an array of recordObjects
		let params = {};
		// params.where = {};
		// params.where[me.idKey] = id;
		params[me.idKey] = id;
		this.findOne(params, callback);
	}

	static myFindOne(params, callback) {
		// implemented by derived class
	}

	findOne(callback) {
		let me = this;
		// implemented in derived class
		let params = {};
		if (this[this.idKey] || this.params[this.idKey]) {
			params[this.idKey] = (this[this.idKey] || this.params[this.idKey])
		}
		else {
			params.email = this.email || this.params.email;
		}
		// console.log("\n\nparams", params)
		me.myfindOne(params, callback)

	}

	getPool() {
		return pool;
	}


}


module.exports.pool = pool;




let listenForEnd = () =>
	pool.on("release", function(connection) {
	 	console.log('Connection %d released', connection.threadId);
	 	// console.log("pool", pool);
	 	console.log("_connectionQueue", pool._connectionQueue.length)
	 	if (pool._connectionQueue.length < 1) {
	 		pool.end();
	 	}

});

module.exports.listenForEnd = listenForEnd;
