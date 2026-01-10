FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Ensure uploads directory exists
RUN mkdir -p public/uploads

EXPOSE 5000
CMD ["node", "index.js"]
