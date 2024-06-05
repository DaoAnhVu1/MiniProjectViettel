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

# Copy the wait-for-dremio.sh script to the working directory
COPY wait-for-dremio.sh /usr/local/bin/wait-for-dremio.sh

# Ensure the wait-for-dremio.sh script is executable
RUN chmod +x /usr/local/bin/wait-for-dremio.sh

# Command to run the script.js, but use the wait-for-dremio.sh as the entrypoint
ENTRYPOINT ["/usr/local/bin/wait-for-dremio.sh", "node", "script.js"]
