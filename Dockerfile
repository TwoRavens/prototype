FROM node:16

# generate node_modules first, so that layering is optimized
WORKDIR /home/tworavens/server
COPY server/package*.json ./
RUN npm install

WORKDIR /home/tworavens/client
COPY client/package*.json ./
RUN npm install

# then copy everything outside of .dockerignore (all sources) in
WORKDIR /home/tworavens/
COPY . .

EXPOSE 3750
