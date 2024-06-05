const { Sequelize } = require('sequelize');
const fs = require('fs');
const csv = require('csv-parser');

const connectionConfig = {
    host: 'deptraiqua',
    user: 'root',
    password: 'rootpassword',
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

async function createTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS movies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            year INT,
            runtime INT,
            rating FLOAT,
            director VARCHAR(255),
            genre VARCHAR(100)
        );
    `;
    await sequelize.query(createTableQuery);
    console.log('Movies table has been created.');
}

async function main() {
    try {
        // Wait 5 seconds before trying to connect, wait for sql container
        await new Promise((resolve, reject) => setTimeout(resolve, 5000));
        await connectWithRetries();

        await createTable();

        const dirPath = "./data/movie_by_genres";
        const fileNames = fs.readdirSync(dirPath);

        for (const fileName of fileNames) {
            let genre = fileName.split(".")[0];
            fs.createReadStream(dirPath + "/" + fileName)
                .pipe(csv())
                .on('data', async (data) => {
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
                        const insertQuery = `
                            INSERT INTO movies (name, year, runtime, rating, director, genre)
                            VALUES (?, ?, ?, ?, ?, ?);
                        `;
                        try {
                            await sequelize.query(insertQuery, {
                                replacements: [name, year, runtime, rating, director, genre]
                            });
                        } catch (error) {
                            console.error('Error inserting record:', error);
                        }
                    } else {
                        console.error('Skipped record due to missing data:', { name, year, runtime, rating, director, genre });
                    }
                })
                .on('end', () => {
                    console.log(`Finished processing ${fileName}`);
                });

            break
        }

        console.log("FINISHED");
    } catch (error) {
        console.log("Error occurred:", error);
    }
}

main();
