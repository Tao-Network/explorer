FROM node:latest

COPY . /

RUN npm i

EXPOSE 80 3000

ENTRYPOINT ["npm"]
