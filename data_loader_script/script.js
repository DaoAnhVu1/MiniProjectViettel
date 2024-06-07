const { Sequelize } = require('sequelize');
const fs = require('fs');
const csv = require('csv-parser');

const connectionConfig = {
    host: 'mysql_database',
    user: 'user',
    password: 'password',
    database: 'movies'
};

const sequelize = new Sequelize(connectionConfig.database, connectionConfig.user, connectionConfig.password, {
    host: connectionConfig.host,
    dialect: 'mysql'
});

async function connectWithRetries() {
    for (let index = 0; index < 5; index++) {
        try {
            await sequelize.authenticate();
            console.log('Connection has been established successfully.');
            return;
        } catch (error) {
            console.error('Failed to connect to the database:', error);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    console.error('Maximum number of connection retries reached. Exiting...');
}

async function createTables() {
    const createDirectorsTableQuery = `
        CREATE TABLE IF NOT EXISTS directors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) UNIQUE
        );
    `;
    const createMoviesTableQuery = `
        CREATE TABLE IF NOT EXISTS movies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            year INT,
            runtime INT,
            rating FLOAT,
            director_id INT,
            genre VARCHAR(100),
            FOREIGN KEY (director_id) REFERENCES directors(id)
        );
    `;
    await sequelize.query(createDirectorsTableQuery);
    await sequelize.query(createMoviesTableQuery);
    console.log('Tables have been created.');
}

async function getRecordCount() {
    const countQuery = `
        SELECT COUNT(*) AS count FROM movies;
    `;
    const [results] = await sequelize.query(countQuery);
    return results[0].count;
}

async function getDirectorId(name) {
    const selectQuery = `
        SELECT id FROM directors WHERE name = ?;
    `;
    const [results] = await sequelize.query(selectQuery, {
        replacements: [name]
    });
    if (results.length > 0) {
        return results[0].id;
    } else {
        const insertQuery = `
            INSERT INTO directors (name) VALUES (?);
        `;
        const [result] = await sequelize.query(insertQuery, {
            replacements: [name]
        });
        return result;
    }
}

async function main() {
    try {
        // Wait 5 seconds before trying to connect, wait for sql container
        await new Promise((resolve, reject) => setTimeout(resolve, 5000));
        await connectWithRetries();

        await createTables();

        const recordCount = await getRecordCount();
        if (recordCount > 10000) {
            console.log('There are already more than 10000 records in the database. Data load aborted.');
            return;
        }

        const dirPath = "./data/movie_by_genres";
        const fileNames = fs.readdirSync(dirPath);

        for (const fileName of fileNames) {
            let genre = fileName.split(".")[0];
            
            const stream = fs.createReadStream(dirPath + "/" + fileName).pipe(csv());
            
            for await (const data of stream) {
                console.log()
                let name = data["movie_name"];
                let year = parseInt(data["year"]);
                let runtime = parseInt(data["runtime"]);
                let rating = parseFloat(data["rating"]);
                let director = data["director"];

                if (
                    name &&
                    !isNaN(year) && year !== null &&
                    !isNaN(runtime) && runtime !== null &&
                    !isNaN(rating) && rating !== null &&
                    director &&
                    genre
                ) {
                    try {
                        const directorId = await getDirectorId(director);
                        const insertQuery = `
                            INSERT INTO movies (name, year, runtime, rating, director_id, genre)
                            VALUES (?, ?, ?, ?, ?, ?);
                        `;
                        await sequelize.query(insertQuery, {
                            replacements: [name, year, runtime, rating, directorId, genre]
                        });
                    } catch (error) {
                        console.error('Error inserting record:', error);
                    }
                } else {
                    console.error('Skipped record due to missing data:', { name, year, runtime, rating, director, genre });
                }
                console.log()
            }
            
            console.log(`Finished processing ${fileName}`);
        }

        console.log("FINISHED");
    } catch (error) {
        console.log("Error occurred:", error);
    }
}

main();
