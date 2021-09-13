import {LambdaClient, InvokeCommand, InvokeCommandOutput} from '@aws-sdk/client-lambda';
import {TextEncoder, TextDecoder} from 'util';
import {Err, Ok, Result} from "../constants";

export interface LambdaErr {
    errorMessage: string,
    errorType?: string,
    stackTrace?: any
}

export async function invoke_command<T>(name: string, payload?: any): Promise<Result<T, LambdaErr>> {
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
            let payload = JSON.parse(new TextDecoder().decode(data.Payload));
            return !!data.FunctionError ? {
                success: false,
                body: payload
            } as Err<LambdaErr> : {
                success: true,
                body: JSON.parse(payload.body)
            } as Ok<T>
        })
}