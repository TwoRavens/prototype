import * as m from 'mithril';
import {RequestOptions} from 'mithril';
import {unwrap} from "../utils";

export interface Ok<T> {
    success: true,
    data: T
}

export interface Err<E> {
    success: false,
    data: E
}

export type Result<T, E=any> = Ok<T> | Err<E>;
// export type Option<T> = T | null;

export let Auth = {
    locked: false,
    get token() {return localStorage.getItem("token")},
    get email() {return localStorage.getItem("email")},

    register: function (email: string, password: string): Promise<void> {
        return m.request<Result<string>>('/auth/register', {
            method: 'POST', body: {email, password}
        }).then(unwrap).then(res => {
            localStorage.setItem("token", res);
            localStorage.setItem("email", email);
        });
    },
    login: function (email: string, password: string): Promise<void> {
        return m.request<Result<string>>('/auth/login', {
            method: 'POST', body: {email, password}
        }).then(unwrap).then(res => {
            localStorage.setItem("token", res);
            localStorage.setItem("email", email);
        });
    },
    logout: function () {
        localStorage.removeItem('token');
        localStorage.removeItem('email');
    },
    // make an authenticated request
    post: async function<T>(url: string, body?: any, options?: RequestOptions<T>): Promise<T> {
        await loginPromise;
        if (!Auth.token) {
            m.route.set('/login');
            return
        }
        options = options || {};
        options.method = 'POST';
        options.headers = options.headers || {};
        options.headers.Authorization = "Bearer " + Auth.token;
        options.headers['Last-Modified'] = (new Date()).toUTCString()
        options.extract = xhr => {
            // exit to login screen if credentials are invalid
            if (xhr.status === 401) {
                Auth.logout();
                m.route.set('/login');
                return {success: false, data: 'Invalid token.'}
            }
            return JSON.parse(xhr.response)
        }
        options.body = body || {};
        return m.request(url, options).then(unwrap);
    }
};

export let loginPromise = undefined;
if (process.env.CLIENTSIDE_EMAIL && process.env.CLIENTSIDE_PASSWORD) {
    loginPromise = Auth.login(process.env.CLIENTSIDE_EMAIL, process.env.CLIENTSIDE_PASSWORD)
        .then(() => Auth.locked = true);
}
