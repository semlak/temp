'use strict';

// const ORM = require("./myorm");
// const mysql = require('mysql');
// let Product = new ORM('products')
const relation = 'user_order';
// const dbName = 'bamazon';
const idKey = 'id'
const ORM = require('./myorm');
let LineItem = require("./line_item");

const Product = require("./product");
const User = require("./user");
// let stringify = require('json-stringify');
// let pool = mysql.createPool({
// 	connectionLimit: 10,
// 	host: "localhost",
// 	port: 3306,
// 	user: 'semlak',
// 	password: '',
// 	database: dbName
// });

module.exports = class Order extends ORM{
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
		Order.remove(params, callback);
	}

	static getOrderDetails(order_id, callback) {
		let queryParams = {
			where: {
				"user_order.id": order_id
			},
			join: [
				{
					type: "inner",
					leftModel: Order,
					targetModel: LineItem,
					thisKey: Order.idKey,
					targetKey: "order_id"
				},

				{
					type: "inner",
					leftModel: LineItem,
					targetModel: Product,
					thisKey: "item_id",
					targetKey: Product.idKey
				},
				{
					type: "inner",
					leftModel: Order,
					targetModel: User,
					thisKey: "user_id",
					targetKey: User.idKey
				},
			],
			calc: [{
				// text: "? * ? as totalPrice",
				text: "line_item.quantity * line_item.unit_price as totalPrice",
				values: []
				// values: ["line_item.quantity", "line_item.unit_price"]
			}
			],
			columns:[
				"user.email as email",
				"user_order.id as OrderID",
				"products.product_name",
				"department_name",
				"products.price as unitPrice",
				"line_item.quantity"
			]
		}
		// console.log("queryParams:", queryParams)
		Order.find(queryParams, callback);

	}

	submit(lineItems, submitcallback, errorcb) {
		// this inserts order, associated line items, and modifies the product table items
		// this does so in a transaction, so that the updates can be rolled back if any operation fails
		if (lineItems.length < 1) {
			return ;
		}


		let me = this;
		// console.log("me: " , me);
		this.getPool().getConnection(function(err, connection) {
			connection.beginTransaction(function(err) {
				if (err) {throw err;}
				// console.log("\n\n\nTrying to submit order!");
				let sqlStatement = 'insert into ' + me.relation + ' SET ?';
				connection.query(sqlStatement, me.params, function(err, results, fields) {
					let newOrderID = results.insertId;
					// console.log("order results:" , results)
					if (err) {
						// console.log("111", err);
						return connection.rollback(function() {
							// throw error;
						})
					}
					let order_id = results.insertId;

					// make sure that order has user_id as well

					// update each lineItem with order_id
					lineItems.forEach(lineItem => lineItem.order_id = order_id);
					// console.log("trying to submit lineitems", stringify(lineItems, null, 2));
					LineItem.insert(connection, lineItems, function(err, results) {
						if (err) {
							return connection.rollback(function() {
								// console.log("err", err);
								// console.log("results, ", results)
								// console.log("error1 in order.js. Rolling back")
								console.log('sorry, There is not enough stock for that order')
								// return callback(null, "sorry, not enough something")
								submitcallback("No items inserted");
								// console.log(callback);
								errorcb(err);
								// throw ('Sorry, there is not enough stock for that order.')
								// throw err;
							});
						}
						//n now update product count for each line item
						connection.commit(function(err) {
							// console.log("should have error here", err)
							if (err) {
								return connection.rollback(function() {
									// console.log("error2. Rolling back")
									submitcallback('Sorry, there is not enough stock for that order.')
									// throw ('Sorry, there is not enough stock for that order.')
									// throw err;
								})
							}

							console.log('success!');
							// retrieve order and  print
							// console.log(results)


								// create a getOrderItems function
							if (typeof submitcallback === "function") {
								// the rersults will be an object that says fieldCount, affectedRows, insertID, and some other stuff
								// console.log("executing callback!")
								// console.log("\n\n","newOrderID:" ,newOrderID);
								let cb = results => {
									me.getPool().end();
									submitcallback(results);
								}
								Order.getOrderDetails(newOrderID, cb);
							}

						})
					});

					// console.log("results", results);
					// console.log("sqltext: " ,this.sql);

				})
			});



			// console.log("trying to save")
			// let me =this;
			// pool.getConnection(function(err, connection) {
			// 	let sqlStatement = 'insert into ' + me.relation + ' SET ?';
			// 	connection.query(sqlStatement, me.params, function(err, results, fields) {
			// 		if (err) console.log(err);
			// 		console.log("results", results);
			// 		console.log("sqltext: " ,this.sql);
			// 		if (typeof callback === "function") {
			// 			// the rersults will be an object that says fieldCount, affectedRows, insertID, and some other stuff
			// 			callback(results);
			// 		}
			// 	})
			// })

			// connection.query(options, function(err, results, fields) {
			// 	if (err) console.log("error", err);
			// 	else {
			// 		// results.forEach(result => console.log("result", result));
			// 		console.log("results: ", results);
			// 		// results contains fieldCount, affectedRows, insertId for one of the elements, serverStatus, warningCount, messagae, protocol, changedRows
			// 		if (typeof callback === "function" )  callback(results);
			// 	}
			// })
		}.bind(this))
	}



	static newMe(params) {
		let item = new Order(params);
		return item;
	}

}

module.exports.idKey = idKey
module.exports.relation = relation;