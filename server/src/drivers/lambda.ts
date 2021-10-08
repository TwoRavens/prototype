import {LambdaClient, InvokeCommand, InvokeCommandOutput} from '@aws-sdk/client-lambda';
import {TextEncoder, TextDecoder} from 'util';
import {Err, Ok, Result} from "../constants";

export interface LambdaErr {
    errorMessage: string,
    errorType?: string,
    stackTrace?: any
}

export async function invoke_command<T>(name: string, payload?: any): Promise<T> {
    return new LambdaClient({
        endpoint: process.env.NODE_ENV === 'development' ? "http://127.0.0.1:3001/" : undefined,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        },
        region: "us-east-1"
    })
        .send(new InvokeCommand({
            FunctionName: name,
            Payload: new TextEncoder().encode(JSON.stringify(payload))
        }))
        .then((data: InvokeCommandOutput) => {
            let response = JSON.parse(new TextDecoder().decode(data.Payload)) as Result<T, LambdaErr>;
            console.log("lambda response", response);
            if (response.success) return response.data;
            throw response.data
        })
}