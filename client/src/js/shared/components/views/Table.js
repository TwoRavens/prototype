import m from 'mithril';

import {mergeAttributes, colors} from "../common";
import Icon from "./Icon";

// Interface specification
//
// ```
// m(Table, {
//     id: id (string),
//     headers: ['col1Header', 'col2Header'],
//     data: [['row1col1', 'row1col2'], ['row2col1', 'row2col2']], or function
//     activeRow: 'row1col1', (optional, may also be a set)
//     onclick: (uid, colID) => console.log(uid + " row was clicked, column number " + colID + " was clicked"), (optional)
//     showUID: true | false, (optional)

//     attrsRows: { apply attributes to each row }, (optional)
//     attrsCells: { apply attributes to each cell } (optional)
//     tableTags: [ m('colgroup', ...), m('caption', ...), m('tfoot', ...)] // these must have a key attribute for mithril
//     rowClasses: {[class]: ['id1', 'id2']}, (optional)
//     abbreviation: (int),
//     sortable: (boolean)
//     })
// ```

// The UID for the table is the key for identifying a certain row.
// The UID is the first column, and its value is passed in the onclick callback.
// The first column may be hidden via showUID: false. This does not remove the first header

// The data parameter attempts to render anything it gets. Feel free to pass Arrays of Arrays, Arrays of Objects, Objects, and Arrays of mixed Objects and Arrays. It should just render.
//     Passing an Object will be rendered as a column for keys and a column for values
//     Passing an Array of Objects will render the value for a key under the header column with the same name
//     Passing an Array of Objects without a header will infer the header names from the unique keys in the objects

// Table tags allows passing colgroups, captions, etc. into the table manually. Can be a single element or list

// When abbreviation is set, strings are shortened to int number of characters

// When sortable is true, clicking on a header will sort the data by that column

let natives = new Set(['number', 'string', 'boolean']);
let nestedStyle = {
    style: {
        background: 'rgba(0,0,0,.05)',
        'border-radius': '.5em',
        'box-shadow': '0px 5px 10px rgba(0, 0, 0, .1)',
        margin: '10px 0'
    }
};

export default class Table {
    view(vnode) {
        let {
            id, data, headers, activeRow, onclick, showUID, abbreviation, keyed,
            // Interface custom attributes
            attrsRows, attrsCells, tableTags, rowClasses, ...attrsAll
        } = vnode.attrs;

        // sorting
        let {sortable, sortHeader, setSortHeader, sortDescending, setSortDescending, sortFunction} = vnode.attrs;
        sortFunction = sortFunction || omniSort;

        if (sortHeader !== undefined) this.sortHeader = sortHeader;
        this.setSortHeader = setSortHeader || (header => this.sortHeader = header);

        if (sortDescending !== undefined) this.sortDescending = sortDescending;
        this.setSortDescending = setSortDescending || (state => this.sortDescending = state);

        let viewClass = Object.create(null); // need object without default prototypal inheritance
        for (let css of Object.keys(rowClasses || {}))
            for (let item of rowClasses[css])
                viewClass[item] ? viewClass[item].push(css) : viewClass[item] = [css];

        // optionally evaluate function to get data
        if (typeof data === 'function') data = data();

        // ignore if invalid
        if (data === undefined || data === null) return;

        // optionally render Objects as tables of key and value columns
        if (!Array.isArray(data)) data = Object.keys(data).map(key => [key, data[key]]);

        // drop invalid rows
        data = data.filter(row => row !== undefined && row !== null && row !== false);

        // deduce headers if passed an array of objects
        if (headers === undefined && data.some(row => !Array.isArray(row))) {
            let headersTemp = new Set();
            data.forEach(row => Object.keys(row).forEach(key => headersTemp.add(key)));
            headers = [...headersTemp];
        }

        showUID = showUID !== false; // Default is 'true'

        let sortIcon = header => {
            if (header !== this.sortHeader) return header;
            return m('[style=text-align:center]', header, m('br'),
                m(Icon, {name: `triangle-${this.sortDescending ? 'up' : 'down'}`, style: 'color: #818181; font-size: 1em; pointer-events: none'}));
        };

        let valueHeader = header => m('th.table-header-sticky', {
            // sticky css applied on `th` for chrome compatibility https://bugs.chromium.org/p/chromium/issues/detail?id=702927
            style: {'font-weight': 'bold', 'z-index': 5, background: colors.lightGray, padding: '0 .5em', 'border-top': '1px'},
            onclick: () => {
                if (!sortable) return;
                if (header === this.sortHeader) {
                    if (!this.sortDescending) this.setSortDescending(true);
                    else {
                        this.setSortDescending(undefined);
                        this.setSortHeader(undefined);
                    }
                }
                else this.setSortHeader(header)
            }
        }, sortIcon(value(header)));

        let value = item => {
            if (item === null) return null;

            if (Array.isArray(item))
                return m(Table, {
                    data: item.map(elem => natives.has(typeof elem) ? [elem] : elem),
                    abbreviation, attrsRows, attrsCells, sortable,
                    ...nestedStyle
                });

            if (typeof item === 'object') {
                // detect if already a vnode
                if (Object.keys(m('')).every(virtual => virtual in item)) return item;

                return m(Table, {
                    data: item,
                    abbreviation, attrsRows, attrsCells, sortable,
                    ...nestedStyle
                });
            }

            // if abbreviation is not undefined, and string is too long, then shorten the string and add a tooltip
            if (typeof(item) === 'string' && item.length > abbreviation) {
                return m('div', {'data-toggle': 'tooltip', title: item},
                    item.substring(0, abbreviation - 3).trim() + '...')
            }
            else return item;
        };

        if (headers && this.sortHeader) {
            let index = data.some(row => !Array.isArray(row)) ? this.sortHeader : headers.indexOf(this.sortHeader);
            if (typeof index === 'string' || index >= 0) {
                data = data.sort((a, b) => sortFunction(a[index], b[index]));
                if (this.sortDescending) data = data.slice().reverse();
            }
        }

        return m(`table.table${id ? '#' + id : ''}`, mergeAttributes({style: {width: '100%'}}, attrsAll), [
            // ensure vnode.tag of each tableTag(s) are at root level, not behind a pseudo vnode array element
            ...Array.isArray(tableTags) ? tableTags : tableTags ? [tableTags] : [],

            headers && m('thead', Object.assign({style: {width: '100%'}}, keyed ? {key: '__header'} : {}), [
                ...(showUID ? headers : headers.slice(1)).map(valueHeader)
            ]),

            ...data.map((row, i) => {
                    // if a row is an Object of "header": "value" items, then convert to array with proper spacing
                    if (headers && !Array.isArray(row)) row = headers.map(header => row[header]);

                    // permit selecting multiple rows
                    let isActive = activeRow instanceof Set ? activeRow.has(row[0]) : row[0] === activeRow;

                    return m('tr', mergeAttributes(
                        i % 2 === 1 ? {style: {background: 'rgba(0,0,0,.02)'}} : {},
                        isActive ? {style: {'background': colors.selVar}} : {}, attrsRows,
                        (row[0] in viewClass) ? {class: viewClass[row[0]]} : {},
                        keyed ? {key: JSON.stringify(row[0])} : {}),
                        row.filter((item, j) => j !== 0 || showUID).map((item, j) =>
                            m('td', mergeAttributes(onclick ? {onclick: () => onclick(row[0], j)} : {}, attrsCells), value(item)))
                    )
                }
            )].filter(_=>_)
        );
    };
}


let omniSort = (a, b) => {
    if (a === undefined && b !== undefined) return -1;
    if (b === undefined && a !== undefined) return 1;
    if (a === b) return 0;
    if (typeof a === 'number') return a - b;
    if (typeof a === 'string') return  a.localeCompare(b);
    return (a < b) ? -1 : 1;
};