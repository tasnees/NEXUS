# Ensure the latest LTS version of Node.js for Vite compatibility
FROM node:20

# Set the working directory to /frontend
WORKDIR /frontend

# Install dependencies separately to leverage Docker layer caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Run the development server, explicitly binding to 0.0.0.0 and ensuring port 5173
EXPOSE 5173
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]
