FROM node:22-alpine
WORKDIR /app
RUN npm install pg
COPY cleanup.mjs .
# Run daily at 02:00 UTC via Alpine crond
RUN echo "0 2 * * * node /app/cleanup.mjs >> /var/log/cleanup.log 2>&1" > /etc/crontabs/root
CMD ["crond", "-f", "-l", "2"]
