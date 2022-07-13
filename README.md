
## Install

1. AWS SAM: [instructions here](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)  
   * skip creating an AWS account and configuring IAM (steps 1 & 2)
   * docker install is required (step 3)
    
## Develop
See also [troubleshooting.md](troubleshooting.md).

1. Lambda (start docker first)
    ```shell
    cd lambda && python env_to_sam.py && sam local start-lambda --env-vars .env-sam.json
    ```
    Run the following in another terminal for function hot-reloading:
    ```shell
    npm i -g nodemon
    nodemon --exec sam build -e py
    ```

3. Mongo and Node.js
    ```shell
    docker-compose up
    ```

   Or start them separately:
    ```shell
    mongod --dbpath=./data/db
    cd server && npm start
    moto_server s3
    ```

## Test

Run `jest` in the `client` or `server` folder.

## Deploy

1. Lambda
    ```shell
    cd lambda
    sam build --use-container
    sam deploy --guided
    ```

