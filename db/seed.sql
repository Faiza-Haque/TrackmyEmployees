insert into departments(name) 
values
('Sales'),
('Logistics'),
('Engineering'),
('Human Resources'),
('Marketing'),
('IT'),
('Finance');

insert into roles (title, salary, department_id)
values
('Sales Manager', 100000, 1),
('Sales Representative', 60000, 1),
('Logistics Manager', 80000, 2),
('Logistics Coordinator', 50000, 2),
('Software Engineer', 120000, 3),
('Mechanical Engineer', 110000, 3),
('HR Manager', 70000, 4),
('HR Generalist', 50000, 4),
('Marketing Manager', 90000, 5),
('Marketing Coordinator', 60000, 5),
('IT Manager', 100000, 6),
('IT Support Specialist', 50000, 6),
('Financial Analyst', 80000, 7);

insert into employee (first_name, last_name, role_id, manager_id)
values 
('John', 'Doe', 1, null),
('Jane', 'Doyle', 2, 1),
('Bob', 'Smith', 3, null),
('Alice', 'Johnson', 4, 3),
('Mike', 'Brown', 5, null),
('Emily', 'Davis', 6, 5),
('Sarah', 'Taylor', 7, null),
('Kevin', 'White', 8, 7),
('Lisa', 'Hall', 9, null),
('Tom', 'Harris', 10, 9),
('Rachel', 'Martin', 11, null),
('Chris', 'Walker', 12, 11),
('David', 'Lee', 13, null);






