FROM node:alpine

WORKDIR /usr/app

COPY package.json yarn.lock ./

RUN corepack enable

RUN yarn set version berry

RUN yarn install --immutable --check-cache

COPY ./ ./

RUN yarn

RUN yarn build

RUN npm i -g pm2

USER node

EXPOSE 8080

CMD ["pm2-runtime", "start", "yarn", "--max-memory-restart", "300M", "--", "start"]
