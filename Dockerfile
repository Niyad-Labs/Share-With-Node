FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5147 5173

CMD ["npm", "start"]

# ignore it Because: electron app need GUI window But docker only handle backend services not for desktop GUI