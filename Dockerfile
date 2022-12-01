FROM node:16.14.0-alpine
WORKDIR /usr/app
COPY package*.json .
RUN npm install && apk add curl
COPY . .
ENV PORT=5000
CMD ["npm", "run", "start"]
EXPOSE "5000"
