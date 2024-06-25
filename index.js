const inquirer = require("inquirer"); // Import the 'inquirer' module for creating interactive command-line prompts
const { Pool } = require("pg");// Import the 'Pool' class from the 'pg' (PostgreSQL) module for connecting to a PostgreSQL database
let pool = null // Initialize the 'pool' variable to null; this will hold the database connection pool

// Define the list of options for the inquirer prompt
const options = ["view all departments", // Option to view all departments
    "view employees by department", // Option to view employees by their department
    "view all roles", // Option to view all roles
    "view all employees", // Option to view all employees
    "view employees by manager", // Option to view employees by their manager
    "add a department", // Option to add a new department
    "add a role", // Option to add a new role
    "add an employee", // Option to add a new employee
    "update an employee role", // Option to update an employee's role
    "update employee managers", // Option to update an employee's manager
    "delete department", // Option to delete a department
    "delete role", // Option to delete a role
    "delete employee", // Option to delete an employee
    "total utilized budget", // Option to view the total utilized budget
    "exit"];// Option to exit the application

// Define an asynchronous function named 'menu' to display a menu and capture user input
const menu = async () => {
    // Use inquirer to prompt the user with a list of options
    const res = await inquirer.prompt([
        {
            type: "list", // Specify the type of prompt as a list
            name: "option", // Name the prompt 'option', which will be used to access the user's selection
            message: "What would you like to do?", // Message to display to the user
            choices: options // Provide the list of choices defined earlier

        }
    ]);
    return res.option; // Return the user's selected option
}

// Define an asynchronous function named 'psqlAccount' to prompt the user for PostgreSQL account credentials
const psqlAccount = async () => {
    // Use inquirer to prompt the user with input fields for PostgreSQL username and password
    const res = await inquirer.prompt([
        {
            type: "input", // Specify the type of prompt as a text input
            name: "username", // Name the prompt 'username', which will be used to access the user's input
            message: "Enter your PostgreSQL username" // Message to display to the user for the username prompt

        },
        {
            type: "password", // Specify the type of prompt as a password input to mask the input
            name: "password", // Name the prompt 'password', which will be used to access the user's input
            message: "Enter your PostgreSQL password" // Message to display to the user for the password prompt
        }
        // The function currently does not have a return or further processing,
        // it captures the input in the 'res' object which can be used for further actions.
    ]);

    // Initialize a new instance of the Pool class from the 'pg' module for connecting to a PostgreSQL database
    pool = new Pool(
        {
            user: `${res.username}`, // Use the username provided by the user from the inquirer prompt
            password: `${res.password}`, // Use the password provided by the user from the inquirer prompt
            host: "localhost", // Specify the database host, in this case, localhost
            database: "employee_db" // Specify the database name to connect to, in this case, 'employee_db'

        });

    // Try to connect to the PostgreSQL database using the connection pool
    try {
        await pool.connect(); // Attempt to establish a connection to the database
        console.log("Connected to PostgreSQL database"); // Log a success message if the connection is established
        return true; // Return true to indicate a successful connection

    }
    // Catch block to handle errors that occur during the connection attempt
    catch (err) {
        console.log("Failed to connect to PostgresSQL database"); // Log an error message if the connection fails
        return false; // Return false to indicate a failed connection

    }

}
// Define an asynchronous function named 'init' to initialize the application
const init = async () => {
    // Prompt the user for PostgreSQL account credentials and attempt to connect
    let running = await psqlAccount();
    // Enter a loop that continues while 'running' is true
    while (running) {
        // Display the menu and capture the user's selected option
        const option = await menu();
        // Handle the user's selected option
        if (option === "view all departments") {
            // Query to retrieve all department names from the database
            const { rows } = await pool.query("SELECT departments.name FROM departments");
            console.table(rows); // Display the result as a table
        }
        else if (option === "view all roles") {
            // Query to retrieve all roles with their titles, salaries, and corresponding department names
            const { rows } = await pool.query("SELECT roles.title, roles.salary, departments.name FROM roles JOIN departments ON roles.department_id = departments.id");
            console.table(rows); // Display the result as a table
        }
        else if (option === "view all employees") {
            // Query to retrieve all employees with their details including role, salary, department, and manager (if any)
            const { rows } = await pool.query("SELECT e.first_name, e.last_name, r.title, r.salary, d.name AS department, COALESCE(m.first_name || ' ' || m.last_name, 'NULL') AS manager FROM employee e JOIN roles r ON e.role_id = r.id JOIN departments d ON r.department_id = d.id LEFT JOIN employee m ON e.manager_id = m.id");
            console.table(rows); // Display the result as a table
        }
        // Handle the 'add a department' option selected by the user
        else if (option === "add a department") {

            // Prompt the user to enter a new department name
            const res = await inquirer.prompt([
                {
                    type: "input", // Specify the type of prompt as a text input
                    name: "department", // Name the prompt 'department', which will be used to access the user's input
                    message: "enter the department name", // Message to display to the user for the department name prompt
                    validate: async (input) => { // Validation function to ensure the input meets certain criteria
                        return input.length <= 30;  // Validate that the input length is 30 characters or less
                    }
                }
            ]);
            // Store the user's input (department name) in an array to be used as values in the query
            const values = [res.department];
            // Execute an SQL query to insert the new department name into the 'departments' table
            // Use parameterized query to prevent SQL injection
            const newData = await pool.query(`INSERT INTO departments (name) VALUES ($1) RETURNING *`, values);
            // Log a message to the console confirming the new department has been added
            // Display the name of the new department from the result of the query
            console.log(`${newData.rows[0].name} is added`)

        }
        // Handle the 'add a role' option selected by the user
        else if (option === "add a role") {
            // Query to retrieve the list of all departments from the database
            const departmentList = await pool.query("SELECT * FROM departments");
            // Prompt the user to enter the details for the new role
            const res = await inquirer.prompt([
                {
                    type: "input", // Specify the type of prompt as a text input
                    name: "title", // Name the prompt 'title', which will be used to access the user's input
                    message: "enter the role title", // Message to display to the user for the role title prompt
                    validate: async (input) => { // Validation function to ensure the input meets certain criteria
                        return input.length <= 30; // Validate that the input length is 30 characters or less
                    }
                },
                {
                    type: "input", // Specify the type of prompt as a text input
                    name: "salary", // Name the prompt 'salary', which will be used to access the user's input
                    message: "enter the salary", // Message to display to the user for the salary prompt
                    validate: async (input) => { // Validation function to ensure the input meets certain criteria
                        return !isNaN(parseFloat(input)); // Validate that the input is a number
                    }
                },
                {
                    type: "list", // Specify the type of prompt as a list selection
                    name: "department", // Name the prompt 'department', which will be used to access the user's selection
                    message: "choose the department", // Message to display to the user for the department selection prompt
                    choices: departmentList.rows  // Provide the list of departments as choices

                }

            ]);
            // Find the department ID that matches the department name selected by the user
            const departmentId = departmentList.rows.find(department => department.name === res.department).id;
            // Store the new role details in an array to be used as values in the query
            const values = [res.title, parseFloat(res.salary), departmentId];
            // Execute an SQL query to insert the new role into the 'roles' table
            // Use parameterized query to prevent SQL injection
            const newData = await pool.query(`INSERT INTO roles (title, salary, department_id) VALUES ($1,$2,$3) RETURNING *`, values);
            // Log a message to the console confirming the new role has been added
            // Display the title of the new role from the user's input
            console.log(`${res.title} is added`)
        }
        else if (option === "add an employee") {
            // Query to retrieve the list of all roles from the database
            const roleList = await pool.query("SELECT r.id, r.title AS name FROM roles r");
            // Initialize the manager list with a 'none' option
            const managerList = [{ id: null, name: "none" }];
            // Query to retrieve the list of all managers from the database
            const { rows } = await pool.query("SELECT m.id, CONCAT(m.first_name, ' ', m.last_name ) AS name FROM employee m");
            // Add each manager from the query result to the manager list
            for (let manager of rows) {
                managerList.push(manager);
            }
            // Prompt the user to enter the details for the new employee
            const res = await inquirer.prompt([{
                type: "input", // Specify the type of prompt as a text input
                name: "firstName", // Name the prompt 'firstName', which will be used to access the user's input
                message: "what is the first name of the new employee" // Message to display to the user for the first name prompt
            }, {
                type: "input", // Specify the type of prompt as a text input
                name: "lastName", // Name the prompt 'lastName', which will be used to access the user's input
                message: "what is the last name of the new employee" // Message to display to the user for the last name prompt

            }, {
                type: "list", // Specify the type of prompt as a list selection
                name: "role", // Name the prompt 'role', which will be used to access the user's selection
                message: "choose the role", // Message to display to the user for the role selection prompt
                choices: roleList.rows, // Provide the list of roles as choices
            }, {
                type: "list", // Specify the type of prompt as a list selection
                name: "manager", // Name the prompt 'manager', which will be used to access the user's selection
                message: "choose the manager", // Message to display to the user for the manager selection prompt
                choices: managerList, // Provide the list of managers as choices
            }
            ]);
            // Find the role ID that matches the role name selected by the user
            const roleId = roleList.rows.find(role => role.name === res.role).id;
            // Find the manager ID that matches the manager name selected by the user
            const managerId = managerList.find(manager => manager.name === res.manager).id;
            // Store the new employee details in an array to be used as values in the query
            const values = [res.firstName, res.lastName, roleId, managerId];
            // Execute an SQL query to insert the new employee into the 'employee' table
            // Use parameterized query to prevent SQL injection
            const newData = await pool.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1,$2,$3,$4)RETURNING *`, values);
            // Log a message to the console confirming the new employee has been added
            // Display the first and last name of the new employee from the user's input
            console.log(`${res.firstName} ${res.lastName} is added`)
        }
        else if (option === "update an employee role") {
            // Query to retrieve the list of all employees from the database
            const employeeList = await pool.query("SELECT e.id, CONCAT(e.first_name ,' ', e.last_name) AS name FROM employee e");

            // Query to retrieve the list of all roles from the database
            const roleList = await pool.query("SELECT r.id, r.title AS name FROM roles r");
            // Prompt the user to select an employee and their new role
            const res = await inquirer.prompt([
                {
                    type: "list", // Specify the type of prompt as a list selection
                    name: "employee", // Name the prompt 'employee', which will be used to access the user's selection
                    message: "choose the employee", // Message to display to the user for the employee selection prompt
                    choices: employeeList.rows, // Provide the list of employees as choices
                },
                {
                    type: "list", // Specify the type of prompt as a list selection
                    name: "role", // Name the prompt 'role', which will be used to access the user's selection
                    message: "choose the new role", // Message to display to the user for the role selection prompt
                    choices: roleList.rows, // Provide the list of roles as choices
                },

            ]);
            // Find the role ID that matches the new role name selected by the user
            const roleId = roleList.rows.find(role => role.name === res.role).id;
            // Find the employee ID that matches the employee name selected by the user
            const employeeId = employeeList.rows.find(employee => employee.name === res.employee).id;
            // Store the role ID and employee ID in an array to be used as values in the query
            const values = [roleId, employeeId];
            // Execute an SQL query to update the employee's role in the 'employee' table
            // Use parameterized query to prevent SQL injection
            await pool.query(`UPDATE employee SET role_id = $1 WHERE id = $2`, values);
            // Log a message to the console confirming the employee's role has been updated
            // Display the name of the updated employee from the user's input
            console.log(`${res.employee} updated`);
        }
        // Handle the 'update employee managers' option selected by the user
        else if (option === "update employee managers") {
            // Query to retrieve the list of all employees from the database
            const employeeList = await pool.query("SELECT e.id, CONCAT(e.first_name ,' ', e.last_name) AS name FROM employee e");
            // Initialize the manager list with a 'none' option
            const managerList = [{ id: null, name: "none" }];
            // Query to retrieve the list of all managers from the database
            const { rows } = await pool.query("SELECT m.id, CONCAT(m.first_name, ' ', m.last_name ) AS name FROM employee m");
            // Add each manager from the query result to the manager list
            for (let manager of rows) {
                managerList.push(manager);
            }
            // Prompt the user to select an employee and their new manager
            const res = await inquirer.prompt([
                {
                    type: "list", // Specify the type of prompt as a list selection
                    name: "employee", // Name the prompt 'employee', which will be used to access the user's selection
                    message: "choose the employee", // Message to display to the user for the employee selection prompt
                    choices: employeeList.rows, // Provide the list of employees as choices
                }, {
                    type: "list", // Specify the type of prompt as a list selection
                    name: "manager", // Name the prompt 'manager', which will be used to access the user's selection
                    message: "choose the new manager", // Message to display to the user for the manager selection prompt
                    choices: managerList, // Provide the list of managers as choices
                }
            ]);
            // Find the manager ID that matches the manager name selected by the user
            const managerId = managerList.find(manager => manager.name === res.manager).id;
            // Find the employee ID that matches the employee name selected by the user
            const employeeId = employeeList.rows.find(employee => employee.name === res.employee).id;
            // Store the manager ID and employee ID in an array to be used as values in the query
            const values = [managerId, employeeId];
            // Execute an SQL query to update the employee's manager in the 'employee' table
            // Use parameterized query to prevent SQL injection
            await pool.query(`UPDATE employee SET manager_id = $1 WHERE id = $2`, values);
            // Log a message to the console confirming the employee's manager has been updated
            // Display the name of the updated employee from the user's input
            console.log(`${res.employee} updated`);
        }
        else if (option === "view employees by manager") {
            // Query to retrieve the list of all managers from the database
            const managerList = await pool.query("SELECT m.id, CONCAT(m.first_name, ' ', m.last_name) AS name FROM employee m");
            // Prompt the user to select a manager to view their employees
            const res = await inquirer.prompt([
                {
                    type: 'list', // Specify the type of prompt as a list selection
                    name: 'manager', // Name the prompt 'manager', which will be used to access the user's selection
                    message: 'choose the manager', // Message to display to the user for the manager selection prompt
                    choices: managerList.rows, // Provide the list of managers as choices
                }
            ]);
            // Find the manager ID that matches the manager name selected by the user
            const managerId = managerList.rows.find(manager => manager.name === res.manager).id;
            // Store the manager ID in an array to be used as values in the query
            const values = [managerId]
            // Execute an SQL query to retrieve the list of employees managed by the selected manager
            // Use parameterized query to prevent SQL injection
            const employeeList = await pool.query("SELECT e.id, CONCAT(e.first_name ,' ', e.last_name) AS name FROM employee e WHERE e.manager_id = $1", values);
            // Display the list of employees managed by the selected manager in a table format
            console.table(employeeList.rows)
        }
        else if (option === "view employees by department") {
            // Query to retrieve the list of all departments from the database
            const departmentList = await pool.query("SELECT d.id, d.name FROM departments d");
            // Prompt the user to select a department to view its employees
            const res = await inquirer.prompt([
                {
                    type: "list", // Specify the type of prompt as a list selection
                    name: "department", // Name the prompt 'department', which will be used to access the user's selection
                    message: "choose the department", // Message to display to the user for the department selection prompt
                    choices: departmentList.rows, // Provide the list of departments as choices

                }
            ]);
            // Find the department ID that matches the department name selected by the user
            const departmentId = departmentList.rows.find(department => department.name === res.department).id;
            // Store the department ID in an array to be used as values in the query
            const values = [departmentId];
            // Execute an SQL query to retrieve the list of employees in the selected department
            // Use parameterized query to prevent SQL injection
            const employeeList = await pool.query("SELECT e.id, CONCAT(e.first_name, ' ', e.last_name) AS name FROM employee e JOIN roles r ON e.role_id = r.id JOIN departments d ON r.department_id = d.id WHERE d.id = $1", values);
            // Display the list of employees in the selected department in a table format
            console.table(employeeList.rows)
        }
        else if (option === "delete department") {
            // Query to retrieve the list of all departments from the database
            const departmentList = await pool.query("SELECT d.id, d.name FROM departments d");
            // Prompt the user to select a department to delete
            const res = await inquirer.prompt([
                {
                    type: "list", // Specify the type of prompt as a list selection
                    name: "department", // Name the prompt 'department', which will be used to access the user's selection
                    message: "choose the department", // Message to display to the user for the department selection prompt
                    choices: departmentList.rows, // Provide the list of departments as choices
                }
            ]);
            // Find the department ID that matches the department name selected by the user
            const departmentId = departmentList.rows.find(department => department.name === res.department).id;
            // Store the department ID in an array to be used as values in the query
            const values = [departmentId];
            // Execute an SQL query to check if there are any roles assigned to the selected department
            // Use parameterized query to prevent SQL injection
            const roleList = await pool.query("SELECT * FROM roles r WHERE r.department_id = $1", values);
            // Check if there are any roles in the department
            if (roleList.rows.length > 0) {
                // If there are roles, inform the user they need to delete the roles first
                console.log("You cannot delete a department with roles assigned to it. Please delete the roles first");
            } else {
                // If there are no roles, execute an SQL query to delete the department
                // Use parameterized query to prevent SQL injection
                await pool.query("DELETE FROM departments d WHERE d.id = $1", values);
                // Inform the user that the department was deleted successfully
                console.log("Department deleted successfully");
            }
        }
        else if (option === "delete role") {
            // Query to retrieve the list of all roles from the database
            const roleList = await pool.query("SELECT r.id, r.title AS name FROM roles r");
            // Prompt the user to select a role to delete
            const res = await inquirer.prompt([
                {
                    type: "list", // Specify the type of prompt as a list selection
                    name: "role", // Name the prompt 'role', which will be used to access the user's selection
                    message: "choose the role", // Message to display to the user for the role selection prompt
                    choices: roleList.rows, // Provide the list of roles as choices
                }
            ]);
            // Find the role ID that matches the role name selected by the user
            const roleId = roleList.rows.find(role => role.name === res.role).id;
            // Store the role ID in an array to be used as values in the query
            const values = [roleId];
            // Execute an SQL query to check if there are any employees assigned to the selected role
            // Use parameterized query to prevent SQL injection
            const employeeList = await pool.query("SELECT * FROM employee e WHERE e.role_id = $1", values);
            // Check if there are any employees in the role
            if (employeeList.rows.length > 0) {
                // If there are employees, inform the user they need to delete the employees first
                console.log("You cannot delete a role with employees assigned to it. Please delete the employee first");
            } else {
                // If there are no employees, execute an SQL query to delete the role
                // Use parameterized query to prevent SQL injection
                await pool.query("DELETE FROM roles r WHERE r.id = $1", values);
                // Inform the user that the role was deleted successfully
                console.log("Role deleted successfully");
            }
        }
        else if (option === "delete employee") {
            // Query to retrieve the list of all employees from the database
            const employeeList = await pool.query("SELECT e.id, CONCAT(e.first_name, ' ',e.last_name) AS name FROM employee e");
            // Prompt the user to select an employee to delete
            const res = await inquirer.prompt([
                {
                    type: "list", // Specify the type of prompt as a list selection
                    name: "employee", // Name the prompt 'employee', which will be used to access the user's selection
                    message: "choose the employee", // Message to display to the user for the employee selection prompt
                    choices: employeeList.rows, // Provide the list of employees as choices
                }
            ]);
            // Find the employee ID that matches the employee name selected by the user
            const employeeId = employeeList.rows.find(employee => employee.name === res.employee).id;
            // Store the employee ID in an array to be used as values in the query
            const values = [employeeId];
            // Execute an SQL query to set the manager ID to NULL for employees managed by the employee being deleted
            // Use parameterized query to prevent SQL injection
            await pool.query("UPDATE employee SET manager_id = NULL WHERE manager_id = $1", values);
            // Execute an SQL query to delete the selected employee
            // Use parameterized query to prevent SQL injection
            await pool.query("DELETE FROM employee e WHERE e.id = $1", values);
            // Inform the user that the employee was deleted successfully
            console.log("Employee deleted successfully");

        }
        else if (option === "total utilized budget") {
            // Query to retrieve the list of all departments from the database
            const departmentList = await pool.query("SELECT * FROM departments d");
            // Prompt the user to select a department to view its total utilized budget
            const res = await inquirer.prompt([

                {
                    type: "list", // Specify the type of prompt as a list selection
                    name: "department", // Name the prompt 'department', which will be used to access the user's selection
                    message: "choose the department", // Message to display to the user for the department selection prompt
                    choices: departmentList.rows, // Provide the list of departments as choices
                }

            ]);
            // Find the department ID that matches the department name selected by the user
            const departmentId = departmentList.rows.find(department => department.name === res.department).id;
            // Store the department ID in an array to be used as values in the query
            const values = [departmentId];
            // Execute an SQL query to retrieve the list of employees and their salaries in the selected department
            // Use parameterized query to prevent SQL injection
            const employeeList = await pool.query("SELECT e.id, CONCAT(e.first_name, ' ',e.last_name) AS name, r.salary  FROM employee e JOIN roles r ON e.role_id = r.id JOIN departments d ON r.department_id = d.id WHERE d.id = $1", values);
            // console.log(JSON.stringify(employeeList.rows));

             // Initialize an array to store the salaries of the employees
            const salary = [];
             // Iterate over the list of employees and add their salaries to the array
            employeeList.rows.forEach(employee => {
                salary.push(parseFloat(employee.salary));

            });
            // Calculate the total utilized budget by summing up the salaries
            const totalBudget = salary.reduce((acc, currentSalary) => acc + currentSalary, 0);
             // Display the list of employees and their details in a table format
            console.table(employeeList.rows);
            // Display the total utilized budget for the selected department
            console.log(`The total utilized budget for ${res.department} is ${totalBudget}`)
        }
        // If the selected option does not match any case, set running to false to exit the loop
        else { running = false; }
        // Log the selected option to the console
        console.log(option);
    }
}
// Initialize the application
init();
