FROM node:13.14.0

RUN mkdir -p /code
WORKDIR /code

ADD package.json /code/package.json
ADD package-lock.json /code/package-lock.json
RUN npm install

ADD config-overrides.js /code/config-overrides.js
ADD public/ /code/public/
ADD migrations/ /code/migrations/
ADD src/ /code/src/

EXPOSE 3000/tcp
CMD npm start
