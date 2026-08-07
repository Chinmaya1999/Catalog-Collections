# Use Node.js 20 LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies - use npm install if no package-lock.json
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --only=production; fi

# Copy the rest of the application
COPY . .

# Create uploads directory if it doesn't exist
RUN mkdir -p uploads

# Expose the port
EXPOSE 5002

# Start the server
CMD ["npm", "start"]