FROM node:alpine

WORKDIR /usr/app

RUN corepack enable

RUN yarn set version berry

COPY .yarn ./.yarn

COPY package.json yarn.lock .yarnrc.yml ./

RUN yarn install --immutable --check-cache

COPY ./ ./

RUN yarn build

RUN npm i -g pm2

USER node

EXPOSE 8080

CMD ["pm2-runtime", "start", "yarn", "--max-memory-restart", "300M", "--", "start"]
