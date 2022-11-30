import m from 'mithril';

import Table from "./Table";
import TextField from "./TextField";
import Dropdown from "./Dropdown";
import TextFieldSuggestion from "./TextFieldSuggestion";
import {deepCopy} from '../common.js';
import Icon from "./Icon";

// Generic component that constructs menus that mutate an instance of a JSON schema
// There are a number of features in the JSON schema spec that aren't supported... but this is a good start

// Interface specification

// ```
// m(JSONSchema, {
//     schema: JSON object
//     data: JSON object
//     })
//  ```

let nestedStyle = {
    style: {
        background: 'rgba(0,0,0,.05)',
        'border-radius': '.5em',
        'box-shadow': '0px 5px 10px rgba(0, 0, 0, .1)',
        margin: '10px 0'
    }
};

let capitalizeFirst = text => text.slice(0, 1).toUpperCase() + text.slice(1);
let prettifyText = text => text.replace(/_/g, ' ').split(' ').map(capitalizeFirst).join(' ');

export default class Schema {
    oninit(vnode) {
        this.schema = deepCopy(vnode.attrs.schema);
    }

    view(vnode) {
        let {data} = vnode.attrs;
        return this.recurse(this.schema.properties, data);
    }

    recurse(schema, data) {
        // construct values for the current tree
        let value = key => {
            if (typeof data[key] === 'object' && 'type' in data[key] && data[key].type in this.schema.definitions)
                return this.recurse(this.schema.definitions[data[key].type].properties, data[key]);

            // sometimes the type is a list, support either case
            let types = Array.isArray(schema[key].type) ? schema[key].type : [schema[key].type];

            if (types.includes('string')) {
                if ('enum' in schema[key]) {
                    if (schema[key].enum.length === 1) data[key] = schema[key].enum[0];
                    return m(TextFieldSuggestion, {
                        value: data[key],
                        suggestions: schema[key].enum,
                        enforce: true,
                        oninput: val => data[key] = val,
                        onblur: val => data[key] = val
                    });
                }
                return m(TextField, {
                    value: data[key],
                    placeholder: {
                        'date-time': 'YYYY-MM-DDThh:mm:ssZ',
                        'date': 'YYYY-MM-DD',
                        'time': 'hh:mm:ss',
                        'utc-millisec': 'milliseconds since epoch'
                    }[schema[key].format] || '',
                    oninput: val => data[key] = val,
                    onblur: val => data[key] = val
                });
            }
            if (types.includes('number')) return m(TextField, {
                value: data[key],
                class: typeof data[key] !== 'number' && 'is-invalid',
                oninput: val => data[key] = parseFloat(val) || val,
                onblur: val => data[key] = parseFloat(val) || val
            });
            if (types.includes('array')) return this.recurse(schema[key], data[key]);
            if (types.includes('object')) {
                // when the json schema is underspecified for objects, default to a string
                if (!('properties' in schema[key])){
                    schema[key].type = 'string';
                    data[key] = typeof data[key] !== 'string' ? '' : data[key];
                    return value(key)
                }
                return this.recurse(schema[key].properties, data[key]);
            }
        };

        // construct keys for the current tree
        if (Array.isArray(data)) {

            return m(Table, {
                attrsCells: {valign: "top"},
                data: schema.type === 'array' && 'items' in schema ? [
                    ...data.map((elem, i) => [
                        value(i),
                        m('div', {onclick: () => data.splice(i, 1)}, m(Icon, {name: 'x', style: {margin: '1em 1em 1em 0em'}}))
                    ]),
                    [
                        m(Dropdown, {
                            style: {float: 'left'},
                            items: [
                                'Add',
                                ...(schema.items.oneOf || [])
                                    .map(item => item.$ref.split('/').slice(-1)[0]),
                                ...(schema.items.anyOf || [])
                                    .map(item => item.$ref.split('/').slice(-1)[0]),
                                ...Object.keys(schema.items || {})
                            ],
                            activeItem: 'Add',
                            onclickChild: child => {
                                if (child === 'Add') return;
                                data.push({
                                    type: child
                                })
                            }
                        }),
                        undefined
                    ]
                ] : [
                    ...data.map((elem, i) => [
                        m(TextField, {value: elem, oninput: val => data[i] = val}),
                        m('div', {onclick: () => data.splice(i, 1)}, m(Icon, {name: 'x', style: {margin: '1em 1em 1em 0em'}}))
                    ]),
                    [m(TextField, {value: '', oninput: val => data.push(val)}), undefined]
                ],
                ...nestedStyle
            });
        }

        if (typeof data === 'object') return m(Table, {
            attrsCells: {valign: "top"},
            data: Object.keys(data).filter(key => key in schema).map(key => [
                m('div', {
                    title: schema[key].description || '',
                    style: {'margin-top': '1em', 'font-weight': 'bold'}
                }, prettifyText(key)),
                value(key),
                m('div', {onclick: () => delete data[key]}, m(Icon, {name: 'x', style: {margin: '1em 1em 1em 0em'}}))
            ]).concat(Object.keys(data).length === Object.keys(schema).length ? [] : [[
                m(Dropdown, {
                    style: {float: 'left'},
                    items: ['Add', ...Object.keys(schema).filter(key => !(key in data))],
                    activeItem: 'Add',
                    onclickChild: child => {
                        if (!(child in schema)) return;

                        // TODO: better handling of multiple potential schemas. In this case, only the first non-null is used
                        if (!schema[child].type && 'anyOf' in schema[child]) {
                            Object.assign(schema[child], schema[child].anyOf.find(childOpt => childOpt.type !== 'null'));
                            delete schema[child].anyOf
                        }
                        // sometimes the type is a list, support the most general form
                        let type = Array.isArray(schema[child].type)
                            ? schema[child].type.find(elem => elem !== 'null')
                            : schema[child].type;

                        data[child] = {
                            'string': '',
                            'object': {},
                            'array': [],
                            'number': ''
                        }[type]
                    }
                }), undefined, undefined
            ]]),
            ...nestedStyle
        });
    }
}