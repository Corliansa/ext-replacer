FROM node:alpine

WORKDIR /usr/app

COPY package.json .

COPY yarn.lock .

RUN corepack enable

RUN yarn set version berry

RUN yarn install --immutable

COPY . .

RUN yarn

RUN yarn build

RUN npm i -g pm2

USER node

EXPOSE 8080

CMD ["pm2-runtime", "start", "yarn", "--", "start"]