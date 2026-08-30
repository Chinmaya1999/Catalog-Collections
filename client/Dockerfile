# Stage 1: Build the React application
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies. Using `npm install` rather than `npm ci` here:
# tailwindcss's nested postcss-load-config pulls in yaml@2.x alongside older
# tooling that needs yaml@1.x, which npm sometimes marks "extraneous" in the
# lockfile depending on npm version — `npm ci`'s strict lockfile-hash check
# then fails on some npm builds (observed failing on this base image's
# bundled npm) even though the tree resolves correctly. `npm install` still
# uses package-lock.json as its resolution base, it just doesn't hard-fail
# on that discrepancy.
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration (ensure this file exists)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]