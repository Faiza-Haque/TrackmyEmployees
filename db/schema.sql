drop DATABASE if exists employee_db;
CREATE DATABASE employee_db;
\c employee_db;
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
name varchar(30) NOT NULL
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    title varchar(30) NOT NULL,
    salary decimal(10,2) NOT NULL,
    department_id integer,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE employee (
id SERIAL PRIMARY KEY,
first_name varchar(30),
last_name varchar(30),
role_id integer,
manager_id integer,
FOREIGN KEY (role_id) REFERENCES roles(id),
FOREIGN key (manager_id) REFERENCES employee(id)
);

