import * as m from 'mithril';
import {RequestOptions} from 'mithril';

export async function importCsv() {
    return await Auth.post(`/data/import`, {body: {
        database: 'tworavens',
        collection: 'baseball',
        data_path: "/Users/michael/TwoRavens/ravens_volume/test_data/185_baseball/TRAIN/dataset_TRAIN/tables/learningData.csv"
    }}).then(console.log)
}

export async function importS3Csv() {
    return await Auth.post(`/data/import-s3`, {body: {
            database: 'tworavens',
            collection: 'baseball-s3',
            bucket: 'tworavens-prototype',
            key: 'learningData.csv'
        }}).then(console.log)
}

export async function invokeLambda() {
    return await Auth.post("/solve/search", {
        body: {
            arbitrary: 'data',
            here: '!'
        }
    }).then(console.log);
}

let aggregate: any = '';

export function getAggregate() {
    return aggregate;
}

export async function fetchAggregate() {
    return await Auth.post('/data/aggregate', {body: {
        database: 'tworavens',
        collection: 'baseball',
        aggregation: []
    }})
        .then(response => {aggregate = response})
        .catch(() => aggregate = 'Error fetching data')
}

interface Response<T> {
    success: boolean,
    data?: T
}
export let Auth = {
    token: '',
    register: function (email: string, password: string): Promise<void> {
        return m.request<Response<string>>('/auth/register', {
            method: 'POST', body: {email, password}
        }).then(res => {Auth.token = res.data;});
    },
    login: function (email: string, password: string): Promise<void> {
        return m.request<Response<string>>('/auth/login', {
            method: 'POST', body: {email, password}
        }).then(res => {Auth.token = res.data;});
    },
    logout: function () {
        delete Auth.token;
    },
    // make an authenticated request
    post: function<T>(url: string, options?: RequestOptions<T>): Promise<T> {
        if (!Auth.token) {throw "User is not logged in!"}
        options = options || {};
        options.method = 'POST';
        options.headers = options.headers || {};
        options.headers.Authorization = "Bearer " + Auth.token;
        options.headers['Last-Modified'] = (new Date()).toUTCString()
        return m.request(url, options)
    }
};