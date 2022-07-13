// code corresponding to endpoints that do not exist
export const MOCKED = false;


import {Auth} from "./shared/account";

// ~~~~ MANIPULATIONS STATE ~~~~
export let mongoURL = '/data/';

// Holds steps that aren't part of a pipeline (for example, pending subset or aggregation in eventdata)
export let looseSteps = {};

export let formattingData = {};
export let alignmentData = {};
window.alignmentData = alignmentData;


/**
 *  Send mongo query params to server and retrieve data
 *
 */
export let getData = async body => Auth.post(mongoURL, Object.assign({
    datafile: workspace.datasetPath, // location of the dataset csv
    collection_name: workspace.name // collection/dataset name
}, body)).then(response => {
    // console.log('-- getData --');
    if (!response.success) throw response;

    // parse Infinity, -Infinity, NaN from unambiguous string literals. Coding handled in python function 'json_comply'
    let jsonParseLiteral = obj => {
        if (obj === undefined || obj === null) return obj;
        if (Array.isArray(obj)) return obj.map(jsonParseLiteral);

        if (typeof obj === 'object') return Object.keys(obj).reduce((acc, key) => {
            acc[key] = jsonParseLiteral(obj[key]);
            return acc;
        }, {});

        if (typeof obj === 'string') {
            if (obj === '***TWORAVENS_INFINITY***') return Infinity;
            if (obj === '***TWORAVENS_NEGATIVE_INFINITY***') return -Infinity;
            if (obj === '***TWORAVENS_NAN***') return NaN;
        }

        return obj;
    };
    return jsonParseLiteral(response.data);
});


// replacement for javascript's blocking 'alert' function, draws a popup similar to 'alert'
export let alertLog = (value, shown) => {
    alerts.push({type: 'log', time: new Date(), description: value});
    showModalAlerts = shown !== false; // Default is 'true'
};
export let alertWarn = (value, shown) => {
    alerts.push({type: 'warn', time: new Date(), description: value});
    showModalAlerts = shown !== false; // Default is 'true'
    // console.trace('warning: ', value);
};
export let alertError = (value, shown) => {
    alerts.push({type: 'error', time: new Date(), description: value});
    showModalAlerts = shown !== false; // Default is 'true'
    // console.trace('error: ', value);
};

// alerts popup internals
export let alerts = [];
export let alertsLastViewed = new Date();

export let showModalAlerts = false;
export let setShowModalAlerts = state => showModalAlerts = state;
