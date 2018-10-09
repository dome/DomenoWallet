FROM ety001/stellar-node-server
ADD . /app
RUN npm install
EXPOSE 8877
WORKDIR /app

CMD ["node", "/app/index.js"]
