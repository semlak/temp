-- SET sql_mode = 'STRICT_ALL_TABLES';
SET sql_mode = 'TRADITIONAL';


DROP DATABASE IF EXISTS bamazon;
-- Creates the "favorite_db" database --
CREATE DATABASE bamazon;

-- Make it so all of the following code will affect favorite_db --
use bamazon;
-- Creates the table "favorite_foods" within favorite_db --
CREATE TABLE products (
	item_id integer(11) NOT NULL AUTO_INCREMENT,
	product_name VARCHAR(100) NOT NULL,
	department_name VARCHAR(50) NOT NULL,
	price decimal(13,4) NOT NULL,
	stock_quantity integer(11) NOT NULL,
	PRIMARY KEY (item_id),
	check (price >= 0),
	check (quantity >= 0)
);


CREATE TABLE user (
	id integer(11) NOT NULL auto_increment,
	email varchar(320) NOT NULL,
	role varchar(255) default 'customer',
	PRIMARY KEY (id),
	UNIQUE KEY email (email(320))
) DEFAULT CHARSET=latin1 ;


-- create table user (
-- 	id  integer(11) NOT NULL AUTO_INCREMENT,
-- 	email varchar(320) not null,
-- 	primary key (id)
-- 	unique(email),
-- 	check (email like '%___@___%')
-- );


-- CREATE TABLE orders (
-- 	id integer(11) NOT NULL auto_increment,
-- 	email varchar(320) NOT NULL,
-- 	PRIMARY KEY (id),
-- 	UNIQUE KEY email (email(320))
-- ) DEFAULT CHARSET=latin1 ;

create table user_order (
	id integer(11) NOT NULL auto_increment,
	user_id integer(11) NOT NULL,
	PRIMARY KEY (id),
	foreign key (user_id) references user(id)
);


CREATE TABLE line_item (
	id  integer(11) NOT NULL AUTO_INCREMENT,
	item_id integer(11) NOT NULL,
	order_id integer(11) not null,
	unit_price decimal(13,4) NOT NULL,
	quantity integer(11) NOT NULL,
	PRIMARY KEY (id),
	foreign key (item_id) references products(item_id) on delete cascade,
	-- foreign key (item_id) references products(item_id),
	foreign key (order_id) references user_order(id) on delete cascade
);

-- include quantity, price, order_id


-- items_to_cart?

-- cart, orders, user




delimiter $$
CREATE TRIGGER checkprice_bi BEFORE INSERT ON products FOR EACH ROW
BEGIN
	DECLARE dummy,baddata, badquantity INT;
	SET baddata = 0;
	set badquantity = 0;
	IF NEW.price < 0 THEN
		SET baddata = 1;
	END IF;
	if NEW.stock_quantity < 0 THEN
		set badquantity = 1;
	end if;
	IF baddata = 1 THEN
		SELECT CONCAT('Cannot Insert This Because Price ',NEW.price,' is Invalid')
		INTO dummy FROM information_schema.tables;
	END IF;
	if badquantity = 1 then
		SELECT CONCAT('Cannot Insert This Because stock_quantity ',NEW.stock_quantity,' is Invalid')
		INTO dummy FROM information_schema.tables;
	end if;
END; $$


CREATE TRIGGER checkprice_bu BEFORE UPDATE ON products FOR EACH ROW
BEGIN
	DECLARE dummy,baddata,badquantity INT;
	SET baddata = 0;
	IF NEW.price < 0 THEN
		SET baddata = 1;
	END IF;
	if NEW.stock_quantity < 0 THEN
		set badquantity = 1;
	end if;
	IF baddata = 1 THEN
		SELECT CONCAT('Cannot Update This Because Price ',NEW.price,' is Invalid')
		INTO dummy FROM information_schema.tables;
	END IF;
	if badquantity = 1 then
		SELECT CONCAT('Cannot Update This Because stock_quantity ',NEW.stock_quantity,' is Invalid')
		INTO dummy FROM information_schema.tables;
	end if;
END; $$



create trigger newLineItem_added after insert on line_item for each ROW
begin
	declare itemID,quantity INT;
	set itemID = NEW.item_id;
	set quantity = NEW.quantity;
	update products set stock_quantity = stock_quantity - quantity where itemID = item_ID;
END; $$

DELIMITER ;
