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
        else if (option === "add a department") {

            const res = await inquirer.prompt([
                {
                    type: "input",
                    name: "department",
                    message: "enter the department name",
                    validate: async (input) => {
                        return input.length <= 30;
                    }
                }
            ]);
            const values = [res.department];
            const newData = await pool.query(`INSERT INTO departments (name) VALUES ($1) RETURNING *`, values);
            console.log(`${newData.rows[0].name} is added`)

        }
        else if (option === "add a role") {
            const departmentList = await pool.query("SELECT * FROM departments");
            const res = await inquirer.prompt([
                {
                    type: "input",
                    name: "title",
                    message: "enter the role title",
                    validate: async (input) => {
                        return input.length <= 30;
                    }
                },
                {
                    type: "input",
                    name: "salary",
                    message: "enter the salary",
                    validate: async (input) => {
                        return !isNaN(parseFloat(input));
                    }
                },
                {
                    type: "list",
                    name: "department",
                    message: "choose the department",
                    choices: departmentList.rows

                }

            ]);
            const departmentId = departmentList.rows.find(department => department.name === res.department).id;
            // console.log(`departmentId: ${departmentId}`);
            const values = [res.title, parseFloat(res.salary), departmentId];
            const newData = await pool.query(`INSERT INTO roles (title, salary, department_id) VALUES ($1,$2,$3) RETURNING *`, values);
            // console.log (`${newData[0].title} is added`)
            console.log(`${res.title} is added`)
        }
        else if (option === "add an employee") {
            const roleList = await pool.query("SELECT r.id, r.title AS name FROM roles r");
            const managerList = [{ id: null, name: "none" }];
            const { rows } = await pool.query("SELECT m.id, CONCAT(m.first_name, ' ', m.last_name ) AS name FROM employee m");
            for (let manager of rows) {
                managerList.push(manager);
            }
            const res = await inquirer.prompt([{
                type: "input",
                name: "firstName",
                message: "what is the first name of the new employee"
            }, {
                type: "input",
                name: "lastName",
                message: "what is the last name of the new employee"

            }, {
                type: "list",
                name: "role",
                message: "choose the role",
                choices: roleList.rows,
            }, {
                type: "list",
                name: "manager",
                message: "choose the manager",
                choices: managerList,
            }
            ]);
            const roleId = roleList.rows.find(role => role.name === res.role).id;
            const managerId = managerList.find(manager => manager.name === res.manager).id;
            const values = [res.firstName, res.lastName, roleId, managerId];
            const newData = await pool.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1,$2,$3,$4)RETURNING *`, values);
            console.log(`${res.firstName} ${res.lastName} is added`)
        }
        else if (option === "update an employee role") {
            const employeeList = await pool.query("SELECT e.id, CONCAT(e.first_name ,' ', e.last_name) AS name FROM employee e");
            const roleList = await pool.query("SELECT r.id, r.title AS name FROM roles r");
            const res = await inquirer.prompt([
                {
                    type: "list",
                    name: "employee",
                    message: "choose the employee",
                    choices: employeeList.rows,
                },
                {
                    type: "list",
                    name: "role",
                    message: "choose the new role",
                    choices: roleList.rows,
                },

            ]);
            const roleId = roleList.rows.find(role => role.name === res.role).id;
            const employeeId = employeeList.rows.find(employee => employee.name === res.employee).id;
            const values = [roleId, employeeId];
            await pool.query(`UPDATE employee SET role_id = $1 WHERE id = $2`, values);
            console.log(`${res.employee} updated`);
        }
        else if (option === "update employee managers") {
            const employeeList = await pool.query("SELECT e.id, CONCAT(e.first_name ,' ', e.last_name) AS name FROM employee e");
            const managerList = [{ id: null, name: "none" }];
            const { rows } = await pool.query("SELECT m.id, CONCAT(m.first_name, ' ', m.last_name ) AS name FROM employee m");
            for (let manager of rows) {
                managerList.push(manager);
            }
            const res = await inquirer.prompt([
                {
                    type: "list",
                    name: "employee",
                    message: "choose the employee",
                    choices: employeeList.rows,
                }, {
                    type: "list",
                    name: "manager",
                    message: "choose the new manager",
                    choices: managerList,
                }
            ]);
            const managerId = managerList.find(manager => manager.name === res.manager).id;
            const employeeId = employeeList.rows.find(employee => employee.name === res.employee).id;
            const values = [managerId, employeeId];
            await pool.query(`UPDATE employee SET manager_id = $1 WHERE id = $2`, values);
            console.log(`${res.employee} updated`);
        }
        else if (option === "view employees by manager") {
            const managerList = await pool.query("SELECT m.id, CONCAT(m.first_name, ' ', m.last_name) AS name FROM employee m");
            const res = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'manager',
                    message: 'choose the manager',
                    choices: managerList.rows,
                }
            ]);
            const managerId = managerList.rows.find(manager => manager.name === res.manager).id;
            const values = [managerId]
            const employeeList = await pool.query("SELECT e.id, CONCAT(e.first_name ,' ', e.last_name) AS name FROM employee e WHERE e.manager_id = $1", values);
            console.table(employeeList.rows)
        }
        else if (option === "view employees by department") {
            const departmentList = await pool.query("SELECT d.id, d.name FROM departments d");
            const res = await inquirer.prompt([
                {
                    type: "list",
                    name: "department",
                    message: "choose the department",
                    choices: departmentList.rows,

                }
            ]);
            const departmentId = departmentList.rows.find(department => department.name === res.department).id;
            const values = [departmentId];
            const employeeList = await pool.query("SELECT e.id, CONCAT(e.first_name, ' ', e.last_name) AS name FROM employee e JOIN roles r ON e.role_id = r.id JOIN departments d ON r.department_id = d.id WHERE d.id = $1", values);
            console.table(employeeList.rows)
        }
        else if (option === "delete department") {

            const departmentList = await pool.query("SELECT d.id, d.name FROM departments d");
            const res = await inquirer.prompt([
                {
                    type: "list",
                    name: "department",
                    message: "choose the department",
                    choices: departmentList.rows,
                }
            ]);
            const departmentId = departmentList.rows.find(department => department.name === res.department).id;
            const values = [departmentId];
            const roleList = await pool.query("SELECT * FROM roles r WHERE r.department_id = $1", values);
            if (roleList.rows.length > 0) {
                console.log("You cannot delete a department with roles assigned to it. Please delete the roles first");
            } else {
                await pool.query("DELETE FROM departments d WHERE d.id = $1", values);
                console.log("Department deleted successfully");
            }
        }
        else if (option === "delete role") {

            const roleList = await pool.query("SELECT r.id, r.title AS name FROM roles r");
            const res = await inquirer.prompt([
                {
                    type: "list",
                    name: "role",
                    message: "choose the role",
                    choices: roleList.rows,
                }
            ]);
            const roleId = roleList.rows.find(role => role.name === res.role).id;
            const values = [roleId];
            const employeeList = await pool.query("SELECT * FROM employee e WHERE e.role_id = $1", values);
            if (employeeList.rows.length > 0) {
                console.log("You cannot delete a role with employees assigned to it. Please delete the employee first");
            } else {
                await pool.query("DELETE FROM roles r WHERE r.id = $1", values);
                console.log("Role deleted successfully");
            }
        }
        else if (option === "delete employee") {

            const employeeList = await pool.query("SELECT e.id, CONCAT(e.first_name, ' ',e.last_name) AS name FROM employee e");
            const res = await inquirer.prompt([
                {
                    type: "list",
                    name: "employee",
                    message: "choose the employee",
                    choices: employeeList.rows,
                }
            ]);
            const employeeId = employeeList.rows.find(employee => employee.name === res.employee).id;
            const values = [employeeId];
            await pool.query("UPDATE employee SET manager_id = NULL WHERE manager_id = $1", values);

            await pool.query("DELETE FROM employee e WHERE e.id = $1", values);
            console.log("Employee deleted successfully");

        }
        else if (option === "total utilized budget") {
            const departmentList = await pool.query("SELECT * FROM departments d");
            const res = await inquirer.prompt([

                {
                    type: "list",
                    name: "department",
                    message: "choose the department",
                    choices: departmentList.rows,
                }

            ]);
            const departmentId = departmentList.rows.find(department => department.name === res.department).id;
            const values = [departmentId];
            const employeeList = await pool.query("SELECT e.id, CONCAT(e.first_name, ' ',e.last_name) AS name, r.salary  FROM employee e JOIN roles r ON e.role_id = r.id JOIN departments d ON r.department_id = d.id WHERE d.id = $1", values);
            // console.log(JSON.stringify(employeeList.rows));
            const salary = [];
            employeeList.rows.forEach(employee => {
                salary.push(parseFloat(employee.salary));

            });
            const totalBudget = salary.reduce((acc, currentSalary) => acc + currentSalary, 0);
            console.table(employeeList.rows);
            console.log(`The total utilized budget for ${res.department} is ${totalBudget}`)
        }
        else { running = false; }
        console.log(option);
    }
}

init();
