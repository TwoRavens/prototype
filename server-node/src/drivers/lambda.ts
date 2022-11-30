import {LambdaClient, InvokeCommand, InvokeCommandOutput} from '@aws-sdk/client-lambda';
import {TextEncoder, TextDecoder} from 'util';
import {Result} from "../constants";


class LambdaError extends Error {
    errorType?: string
    stackTrace?: any
    constructor(err) {
        super(err.errorMessage);
        this.name = "LambdaError";
        this.errorType = err.errorType;
        this.stackTrace = err.stackTrace;
    }

    pretty() {
        return `${this.name}: ${this.stackTrace}`
    }
}

export async function invokeCommand<T>(name: string, payload?: any): Promise<T> {
    return new LambdaClient({
        endpoint: process.env.NODE_ENV === 'development' ? "http://127.0.0.1:3001/" : undefined,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        },
        region: process.env.AWS_ACCESS_REGION
    })
        .send(new InvokeCommand({
            FunctionName: name,
            Payload: new TextEncoder().encode(JSON.stringify(payload))
        }))
        .then((data: InvokeCommandOutput) => {
            let response = JSON.parse(new TextDecoder().decode(data.Payload)) as Result<T, any>;
            if (response.success) return response.data;
            throw new LambdaError(response)
        })
}