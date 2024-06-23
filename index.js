const inquirer = require("inquirer");
const { Pool } = require("pg");
const pool = new Pool({ user: "postgres", password: "faiza", host: "localhost", database: "employee_db" });

const options = ["view all departments", "view all roles", "view all employees", "add a department", "add a role", "add an employee", "update an employee role", "update employee managers", "exit"];

const menu = async () => {
    const res = await inquirer.prompt([
        {
            type: "list",
            name: "option",
            message: "What would you like to do?",
            choices: options

        }
    ]);
    return res.option;
}

const init = async () => {
    let running = true;
    while (running) {
        const option = await menu();
        if (option === "view all departments") {
            const { rows } = await pool.query("SELECT departments.name FROM departments");
            console.table(rows);
        }
        else if (option === "view all roles") {
            const { rows } = await pool.query("SELECT roles.title, roles.salary, departments.name FROM roles JOIN departments ON roles.department_id = departments.id");
            console.table(rows);
        }
        else if (option === "view all employees") {
            const { rows } = await pool.query("SELECT e.first_name, e.last_name, r.title, r.salary, d.name AS department, COALESCE(m.first_name || ' ' || m.last_name, 'NULL') AS manager FROM employee e JOIN roles r ON e.role_id = r.id JOIN departments d ON r.department_id = d.id LEFT JOIN employee m ON e.manager_id = m.id");
            console.table(rows);
        }
        else if (option === "add a department") {

            const res = await inquirer.prompt([
                {
                    type: "input",
                    name: "department",
                    message: "Enter the department name",
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
                    message: "Enter the salary",
                    validate: async (input) => {
                        return !isNaN(parseFloat(input));
                    }
                },
                {
                    type: "list",
                    name: "department",
                    message: "Choose the department",
                    choices: departmentList.rows

                }

            ]);
            const departmentId = departmentList.rows.find(department => department.name = res.department).id;
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
                message: "Choose the role",
                choices: roleList.rows,
            }, {
                type: "list",
                name: "manager",
                message: "Choose the manager",
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
                    message: "Choose the employee",
                    choices: employeeList.rows,
                },
                {
                    type: "list",
                    name: "role",
                    message: "Choose the new role",
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
                    message: "Choose the employee",
                    choices: employeeList.rows,
                }, {
                    type: "list",
                    name: "manager",
                    message: "Choose the new manager",
                    choices: managerList,
                }
            ]);
            const managerId = managerList.find(manager => manager.name === res.manager).id;
            const employeeId = employeeList.rows.find(employee => employee.name === res.employee).id;
            const values = [managerId, employeeId];
            await pool.query(`UPDATE employee SET manager_id = $1 WHERE id = $2`, values);
            console.log(`${res.employee} updated`);
        }
        else { running = false; }
        console.log(option);
    }
}
init();
