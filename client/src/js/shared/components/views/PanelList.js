import m from 'mithril';
import {mergeAttributes} from '../common';
import Popper from './Popper';

// ```
// m(PanelList, {
//         id: 'id of container',
//         items: ['Clickable 1', 'Clickable 2', 'Clickable 3'],
//
//         colors: { common.colors.selVar: ['Clickable 1'] }, (optional)
//         classes: { 'item-lineout': ['Clickable 1', 'Clickable 3'] }, (optional)
//
//         callback: (item) => console.log(item + " clicked."),
//         popup: (item) => { return 'PopupContent'}, (optional)
//
//         attrsItems: {... additional attributes for each item}
//     })
// ```

// colors is an object that maps a color to a list or set of items with that color. Order colors by increasing priority.
// classes acts similarly, but one item may have several classes. Standard css rules apply for stacking css classes.
// popup returns the popup contents when called with the item. If not set, then popup is not drawn

export default class PanelList {
    view(vnode) {
        let {id, items, colors, classes, callback, popup, popupOptions, attrsItems, eventsItems, ...attrsAll} = vnode.attrs;

        // set alternate background-color if defined
        let viewColor = Object.create(null); // need object without default prototypal inheritance (avoids collisions)
        for (let color in colors || [])
            for (let item of colors[color])
                viewColor[item] = color;

        // invert the class -> item object
        let viewClass = Object.create(null); // need object without default prototypal inheritance
        for (let css in classes || [])
            for (let item of classes[css])
                viewClass[item] ? viewClass[item].push(css) : viewClass[item] = [css];

        let wrapPopper = (item, children) => popup
            ? m(Popper, {content: () => popup(item), options: popupOptions}, children)
            : children;

        return m(`div#${id}`, attrsAll, items.map((item) =>
            wrapPopper(item, m(`div#${id + item.replace(/\W/g, '_')}`, mergeAttributes({
                    style: {
                        'margin-top': '5px',
                        'text-align': "center",
                        'background-color': viewColor[item] || colors.varColor,
                        'border-radius': '5px',
                        'box-shadow': '0px 1px 1px rgba(0, 0, 0, .1)'
                    },
                    'class': (viewClass[item] || []).join(' '),
                    onclick: () => (callback || Function)(item)
                },
                Object.entries(eventsItems || {})
                    .reduce((out, entry) =>
                        Object.assign(out, {[entry[0]]: () => entry[1](item)}),
                        {}),
                // add any additional attributes if passed
                attrsItems
            ), item))));
    }
}
