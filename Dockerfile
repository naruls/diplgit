FROM node:17.1

WORKDIR /home/diplgit

COPY package*.json ./


RUN npm install

COPY . .

EXPOSE 3002

CMD [ "npm", "start" ]