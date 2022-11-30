import m from 'mithril';
import ButtonRadio from "./ButtonRadio";
import {mergeAttributes} from "../common";

// ```
// m(MenuTabbed, {
//     id: string,
//     sections: [...,
//         {
//             value: string
//             title: text to use on hover,
//             idSuffix: (optional) suffix to add to generated id strings
//             contents: m(...)
//             display: if 'none', then the button won't be visible on the button bar,
//             selectWidth: int (optional),
//             hoverbonus: int (optional)
//         }],
//     callback: (value) => console.log(value + " was clicked!"),
//     attrsAll: {attributes to apply to the menu, EG height style}
//     })
// ```

// The ids for the generated buttons and content areas are generated via 'idSuffix' passed into sections.
// For example if idSuffix is 'Type', then there will be html objects with 'btnType' and 'tabType' ids. Defaults to value.

export default class MenuTabbed {

    view(vnode) {
        let {id, sections, callback, selectWidth, hoverBonus, currentTab, attrsAll} = vnode.attrs;

        this.currentTab = currentTab || this.currentTab;
        this.callback = callback || (tab => this.currentTab = tab);

        // If a button is not visible, then create the element for the DOM anyways-- but don't let it affect the css
        let visibleButtons = [];
        let invisibleButtons = [];
        for (let section of sections) {
            if (!section) continue;
            if (section.display === 'none') invisibleButtons.push(section);
            else {
                section.onclick = () => callback(section.value);
                visibleButtons.push(section);
            }
            // Automatically build the id
            section.id = 'btn' + (section.idSuffix || section.value);
        }

        if (sections.length === 0) return;

        // Contents to render for the section
        return m('', mergeAttributes( {
            id,
            style: {
                display: 'flex',
                margin: '4px',
                'flex-direction': 'column',
                height: '100%'
            }
        }, attrsAll), [
            visibleButtons.length > 0 && m(ButtonRadio, {
                id: id + 'ButtonBar',
                onclick: callback,
                sections: visibleButtons,
                attrsAll: {style: {'margin-bottom': '5px'}},
                hoverBonus,
                activeSection: this.currentTab,
                selectWidth: selectWidth
            }),
            invisibleButtons.length > 0 && m(ButtonRadio, {
                id: id + 'ButtonBarHidden',
                onclick: callback,
                sections: invisibleButtons,
                attrsAll: {style: {display: 'none'}},
                hoverBonus: hoverBonus,
                selectWidth: selectWidth
            }),
            sections
                .filter(section => section) // ignore undefined sections
                .map(section => m(`div#tab${section.idSuffix || section.value}`, {
                    style: {
                        display: section.value === this.currentTab ? 'block' : 'none',
                        overflow: 'auto',
                        flex: 1
                    }
                }, section.contents))
        ]);
    }
}