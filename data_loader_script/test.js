const fs = require('fs');
const csv = require('csv-parser')

const dirPath = "./data/movie_by_genres"
const fileNames = fs.readdirSync(dirPath);

for (const fileName of fileNames) {
    const genre = fileName.split(".")[0]
    console.log(genre)
    // fs.createReadStream(dirPath + "/" + fileName)
    //     .pipe(csv())
    //     .on('data', (data) => console.log(data));
}