import {deepCopy} from "../common";

import Table from "./Table";
import TextField from "./TextField";
import Dropdown from "./Dropdown";
import {deepCopy} from '../common.js';
import m from "mithril";
import Icon from "./Icon";

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

    // dereference a pointer into a json schema that may contain pointers
    get(schema, ptr) {
        if (schema === undefined) return;

        if ('$ref' in schema)
            schema = this.get(this.schema, ptr.replace('#/', ''));

        ptr = ptr.replace(/^\//, '');
        let [first, rest] = ptr.split(/\//);

        if (first === '#') {
            schema = this.schema;
            return this.get(schema, rest)
        }
        first = first.replace(/~1/g, '/').replace(/~0/g, '~');
        return first in schema && this.get(schema[first], rest);
    }

    recurse(schema, data) {

        let value = key => {
            if (Array.isArray(key)) key = key.find(elem => elem !== 'null')

        };


        if (Array.isArray(data)) {
            let content;
            if ('items' in schema) {
                content = [
                    ...data.map((elem, i) => [
                        value(i),
                        m('div', {onclick: () => data.splice(i, 1), style: {margin: '1em 1em 1em 0em'}},
                            m(Icon, {name: 'x'}))
                    ]),
                    [
                        m(Dropdown, {
                            style: {float: 'left'},
                            items: [
                                'Add',
                                ...(schema.items.oneOf || [])
                                    .map(item => item.$ref.split('/').slice(-1)[0]),
                                ...(schema.items.anyOf || [])
                                    .map(item => item.$ref.split('/').slice(-1)[0])
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
                ]
            } else content = [
                ...data.map((elem, i) => [
                    m(TextField, {value: elem, oninput: val => data[i] = val}),
                    m('div', {onclick: () => data.splice(i, 1), style: {margin: '1em 1em 1em 0em'}},
                        m(Icon, {name: 'x'}))
                ]),
                [
                    m(TextField, {value: '', oninput: val => data.push(val)}),
                    undefined
                ]
            ];

            return m(Table, {
                data: content,
                attrsCells: {valign: "top"},
                ...nestedStyle
            })
        }
    }
}