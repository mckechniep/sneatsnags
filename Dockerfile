# Use an official node.js runtime as a parent image
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and the package-lock.json files to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema before generating the client
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Expose the port that the app runs on
EXPOSE 5001

# Define the command to run your application
CMD ["npm", "dev"]
