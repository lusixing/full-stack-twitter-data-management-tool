
FROM node:16.14.2

# Set working directory
WORKDIR /app

# Add /app/node_modules/.bin to environment variables
ENV PATH /app/node_modules/.bin:$PATH

# Copy package files and install app dependencies
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
RUN npm install 

# Add React app to working directory
ADD . /app

# Start the React app
CMD ["npm", "start"]