-- SET sql_mode = 'STRICT_ALL_TABLES';
SET sql_mode = 'TRADITIONAL';


use bamazon;

-- truncate products;
-- truncate user;
-- truncate line_item;
-- truncate user_order;
-- insert into products (product_name, department_name, price, stock_quantity) values \
	-- ("Logitech M510 Wireless Mouse", "Computers", -19.50, 200);

insert into products (product_name, department_name, price, stock_quantity) values \
	("Logitech M325 Wireless Mouse for Web Scrolling - Black", "Computers", 14.70, 40);

insert into products (product_name, department_name, price, stock_quantity) values \
	("Hotel California", "CDs & Vinyl", 9.98, 67);

insert into products (product_name, department_name, price, stock_quantity) values \
	("ASUS Zenbook Pro UX550VE 15.6 inch Ultra Book", "Computers", 1699.00, 3);

insert into products (product_name, department_name, price, stock_quantity) values \
	("Logitech M500 USB Corded Mouse with Hyper-Fast Scroll", "Computers", 24.90, 93);

insert into products (product_name, department_name, price, stock_quantity) values \
	("Wireless Mini Mouse M187", "Computers", 8.99, 73);

insert into products (product_name, department_name, price, stock_quantity) values \
	("Journey: Greatest Hits", "CDs & Vinyl", 8.98, 104);

insert into products (product_name, department_name, price, stock_quantity) values \
	("Fargo: Special Edition", "DVDs", 17.99, 87);

insert into products (product_name, department_name, price, stock_quantity) values \
	("Burn After Reading", "DVDs", 6.78, 24);

insert into products (product_name, department_name, price, stock_quantity) values \
	("CLIF BAR - Chocolate Chip - 12 pack", "Food", 11.29, 10234);

-- update products set stock_quantity = -1 where item_id = 2;

insert into user (email, role) values ("xena@gmail.com", 'customer');
insert into user (email, role) values ("semlak@gmail.com", 'manager');
insert into user (email) values ("semlak1@gmail.com");
-- insert into user (email) values ("xena@gmail.com");