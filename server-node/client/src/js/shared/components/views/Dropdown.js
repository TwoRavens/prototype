import m from 'mithril';

import {mergeAttributes} from "../common";

// Interface specification

// ```
// m(Dropdown, {
//     id: 'dropdownID' (applied to button and selectors)
//     items: ['Item 1', 'Item 2', 'Item 3'],
//     activeItem: 'Item 1', (optional)
//     onclickChild: (value) => console.log(value + " was clicked.")
//     dropWidth: 100px (sets the width of the dropdown)
//     *: any attribute may be passed
//     })
//  ```

export default class Dropdown {
    oninit(vnode) {
        let {activeItem, items} = vnode.attrs;
        this.isDropped = false;
        if (activeItem === undefined) this.activeItem = items?.[0];
        else this.activeItem = activeItem
    }

    view(vnode) {
        let {id, items, activeItem, onclickChild, dropWidth} = vnode.attrs;
        items = items ?? []
        if (activeItem !== undefined) this.activeItem = activeItem;

        return m('.dropdown[style=display: block]', [
            m('button.btn.btn-secondary.dropdown-toggle',
                mergeAttributes(vnode.attrs, {
                    onclick: () => {
                        this.isDropped = !this.isDropped;
                    },
                    onblur: () => {
                        setTimeout(() => {
                            this.isDropped = false;
                            m.redraw();
                        }, 100);
                    },
                    'data-toggle': 'dropdown'
                }), [
                    this.activeItem,
                    m('b.caret', {style: {'margin-left': '5px'}})
                ]),

            m('ul.dropdown-menu', {
                    'aria-labelledby': id,
                    style: {
                        width: dropWidth,
                        'min-width': 0,
                        display: this.isDropped ? 'block' : 'none'
                    }
                },
                items.map((item) => m('li.dropdown-item', {
                    value: item,
                    // using mousedown because onclick stopped registering clicks?
                    onmousedown: () => {
                        this.activeItem = item;
                        this.isDropped = false;
                        onclickChild(item);
                    },
                    style: {'padding-left': '10px', 'z-index': 200}
                }, item))
            )
        ]);
    }
}
