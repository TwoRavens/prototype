FROM node:18

# generate node_modules first, so that layering is optimized
WORKDIR /home/tworavens/
COPY package*.json ./
RUN npm install

WORKDIR /home/tworavens/client
COPY client/package*.json ./
RUN cd client && npm install

# then copy everything outside of .dockerignore (all sources) in
WORKDIR /home/tworavens/
COPY . .

EXPOSE 3750
