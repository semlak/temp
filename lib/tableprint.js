'use strict';
const Table = require("cli-table");
const chalk = require("chalk");


let tablePrint = function(results) {
	if (!Array.isArray(results) && typeof results !== "object") {
		// console.log("not printing anything")
		return ;
	}

	if (!Array.isArray(results)) results = [results];
	// console.log("results: " , results);
	let columns = Object.keys(results[0]).filter(key => !key.match(/(params|relation|idKey)/))
	let table = new Table({
		head: columns,
		// colAligns: columns.map(column=> !column.match(/price/i) ? 'left': 'right')
		colAligns: columns.map(column=> 'right')
	})
	// if (results.length > 0) console.log( typeof results[0], results[0].hasOwnProperty("totalPrice"))

	// the following few lines are a hack to add a row at the bottom of some tables, if they contain "totalPrice", for a grand total
	if (results.length > 0 && typeof results[0] === "object" &&  results[0].hasOwnProperty("totalPrice")) {
		// add total row for order
		var totalCost = results.map(lineItem=> parseFloat(lineItem.totalPrice)).reduce((a, b) =>a+b);
		// console.log("order total cost: " , totalCost);
		let finalRow = {};
		columns.forEach(column => finalRow[column] =
			column ===  "totalPrice" ? totalCost :
				column === "product_name" ? ("Total Order Cost") : ""
				);
		results.push(finalRow);
	}

	results.forEach((record, i) => table.push(columns.map(key=> {
		let val = key.match(/price/i) && record[key] ? "$" + formatPrice(record[key]) : record[key]||"";
		return (i < results.length - 1 || !totalCost)  ? val : (chalk.red.bold(val));
		})
	));
	console.log(table.toString());

}


let formatPrice = price => parseFloat(price).toFixed(2).replace(/./g, function(c, i, a) {
    		return i && c !== "." && ((a.length - i) % 3 === 0) ? ',' + c : c;
	});



module.exports = {
	tablePrint,
	formatPrice,
}