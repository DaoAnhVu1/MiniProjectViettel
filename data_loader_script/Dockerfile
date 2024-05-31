# Use the official Node.js image as base
FROM node:latest

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the data folder to the working directory
COPY data ./data

# Copy the script.js file to the working directory
COPY script.js .

# Command to run the script.js
CMD ["node", "script.js"]
