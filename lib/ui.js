const inquirer = require("inquirer");
const Product = require("./product");
const User = require("./user");
const clear = require("clear");
// const Order = require("./lib/order");
// const LineItem = require("./lib/line_item");

const Order = require("./order");
const LineItem = require("./line_item");
let tablePrint = require("./tableprint").tablePrint;

let formatPrice = require("./tableprint").formatPrice;
let chalk = require("chalk");

module.exports = class UI {
	constructor() {
		this.product_data = [];
		this.xena = "Xena";
		this.orderItems = [];
		this.order = null;
		this.productData = null;
		this.userId  = null;
	}
	selectItems(data, message) {
		if (this.productData == null && data != null) this.productData = data;
		if (data == null & this.productData != null) data = this.productData;
		let me = this;
		// function will run recursively, continually prompting the user if they want to select something else, and then quanity
		let validQuantity = (x) => {
			let n = parseInt(x);
			// console.log(n, n>0, n < 10000);
			return (n >= 0 && n < 100000);
		}

		let menuChoices = me.product_data.map(item => ({
				name: item.product_name + " ($" + formatPrice(item.price) + ")",
				value: item
			})
		);
		menuChoices.push({name :chalk.red.bold("Go to Cart/Checkout"), value: "goToCart"});
		menuChoices.push({name :chalk.red.bold.underline("Exit Application"), value: "exit"});
		// console.log(menuChoices)
		let questions = [
		{
			name: "selectedItem",
			type: 'list',
			message: "Please select an item to purchase",
			// choices: items.map(item => 'In Department ' + item.department_name + ", " + item.product_name)
			choices: menuChoices
		},
		{
			message: "Great, how many of those items would you like to buy (entering 0 cancels this item)?",
			name: "quantity",
			type: "input",
			validate: validQuantity,
			when: function( answers ) {
				return !(typeof answers.selectedItem === "string" && answers.selectedItem.match(/^(goToCart|exit)/))
			}
		},
		{
			message: "Would you like to select another item?",
			type: "confirm",
			name: "continueShopping",
			when: function (answers) {
				return !(typeof answers.selectedItem === "string" && answers.selectedItem.match(/^(goToCart|exit)/))
			}
		}];
		clear();
		console.log("\n\n" + chalk.cyan.bold.underline(message || "Welcome to Joe's Amazing Emporium!"))
		tablePrint(me.product_data);
		inquirer.prompt(questions).then(function(answers) {
			if (answers.selectedItem === "goToCart") {
				return me.viewCart();
			}
			else if (answers.selectedItem === "exit") {
				return me.exitApp();
			}
			else {
				let item = answers.selectedItem;
			 	// item.quantity = parseInt(answers.quantity);
				// assuming user hasn't already selected item, just push ontothe me.orderItems array. However, check first, and update existing item if possible
				// not sure if data types are same, so use the double equals for type coersion
				let existingItem = me.orderItems.find(existingItem => {
					// console.log("existingItem.item_id", existingItem.item_id, "item.item_id", item.item_id)
					return existingItem.item_id == item.item_id
				});
				// console.log("existingItem != null", existingItem != null);
				if (existingItem != null) {
					let val = existingItem.quantity
					let newVal = parseInt(item.quantity);
					// console.log("val", val, "newVal", newVal);

					val+=newVal;
					// console.log("updated val", val);

					// existingItem.quantity += parseInt(item.quantity);
					existingItem.quantity += parseInt(answers.quantity);
				}
				else if (answers.quantity > 0) {
					item.quantity = parseInt(answers.quantity);
					me.orderItems.push(item);
				}

				// console.log("selection output:\n\n\n", answers);
				if (answers.continueShopping)  {
					me.selectItems(data);
				}
				else {
					// console.log("orderItems", me.orderItems);
					me.viewCart()
					// me.checkout();
				}
			}

		});
	}
	exitApp(message) {
		console.log("\n\n");
		console.log(message || "")
		Order.pool.end();
		console.log(chalk.cyan.bold("Thank you for shopping at Joe's Amazing Emporium! Exiting..."));
	}

	viewCart(message) {
		let me = this;
		if (this.orderItems < 1) {
			return me.selectItems(null, "You do not have any items in your cart!")
		}

		// console.log
		let tableItems = this.orderItems.map(item => {
			item.totalPrice = item.price * item.quantity;
			return item;
			// item.selectedItem.quantity = item.quantity;
		})
		clear();
		tablePrint(tableItems);
		let questions = [
		{
			name: "nextStep",
			type: 'list',
			message: message || "What next?",
			// choices: items.map(item => 'In Department ' + item.department_name + ", " + item.product_name)
			choices: [
				{name: "Submit Order", value : "submit"},
				{name: "Modify Cart", value : "modify"},
				{name: "Continue Shopping", value : "shop"},
				{name: "Exit Application", value : "exit"}]
		}];
		inquirer.prompt(questions).then(function(answers) {
			// console.log("answers", answers, answers.nextStep);
			switch (answers.nextStep) {
				case "submit": return me.checkout();
				case "modify": return me.exitApp("Can't modify cart yet!");
				case "shop": return me.selectItems(null, "Continue shopping! We have lots of stuff at Joe's Amazing Emporium");
				case "exit" : return me.exitApp();
				default : return me.exitApp("Unexpected Input")
			}
		}).catch(function(err) {
			me.exitApp("Unexpected Input")
		});
	}

	checkout() {
		let me = this;
		let questions = [{
			message: "Are you ready to submit your order?",
			type: "confirm",
			name: "submit"
		}];
		inquirer.prompt(questions).then(function(answers) {
			if (answers.submit) {
				// console.log("in confirm branch");
					let lineItems = me.orderItems.map(item => {
						// console.log("preparing item", item);
						let lineItem = new LineItem({
							item_id: item.item_id,
							unit_price: parseFloat(item.price),
							quantity: parseFloat(item.quantity)
						});
						// console.log("created lineItem: " , lineItem);
						return lineItem;
					})
				me.order = new Order({user_id: me.userId });

				try {
					let errorcb = (err) => me.viewCart(typeof err === "string" ? err : "Sorry, your order could not be completed. Try editing items in cart.");
					let orderCallback = function(results, err) {
						if (err) {
							return me.viewCart(typeof err === "string" ? err : "Sorry, your order could not be completed. Try editing items in cart.");
						}
						else if (typeof results === "object") {
							// console.log("\n\n\n\n")
							clear();
							console.log("Great! Your order was  successful!")
							// console.log(chalk.cyan.bold("Great! Your order was successful!"));
							return tablePrint(results);
							me.exitApp("Thank you for your order!")
						}

					}
					me.order.submit(lineItems, tablePrint, errorcb);

				}
				catch (err) {
					console.log("Sorry. Unable to fill that order")
					console.log("err", err);
					me.viewCart("Sorry. Unable to fill your order.");
				}
			}
			else {
				console.log("Not submitting order.")
				me.viewCart();
				// Order.pool.end();
			}
		})
	}


	start() {
		Product.find(null, this.goUser.bind(this));
	}

	goUser(data) {
		this.product_data = data;
		let me = this;
		// console.log("this0", this);
		const questions = [
		{
			name: 'playerName',
			type: 'input',
			message: "Welcome to my amazing online store! Please tell me your name:",
			validate: function(value) {
				if (value.length) {
					return true;
				}
				else {
					return "Please enter at least something for a name."
				}
			},
		},
		{
			name: 'email',
			type: 'input',
			message: "Email address:",
			validate: function(value) {
				if (value.length) {
					return true;
				}
				else {
					return "Please enter at least something for your email."
				}
			},
		}];
		clear();
		console.log("\n\n" + chalk.cyan.bold.underline("Welcome to Joe's Amazing Emporium!"))

		inquirer.prompt(questions).then(function(answers) {
			// console.log(answers);
			let user = new User({email: answers.email})

			// User.insertIfNotPresent(user, console.log);
			User.insertIfNotPresent(user, returnedUser => {
				me.userId = returnedUser.id;
				me.selectItems();
			})

			// console.log("this1", this);

			// console.log("me", me);
			// me.selectItems();

		});
	}


}