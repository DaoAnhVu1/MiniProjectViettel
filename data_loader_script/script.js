const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'mysql_database_1',
    user: 'root',
    password: 'root_password',
    database: 'sample_db'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to the database');
});

// Close the connection when done
connection.end();
