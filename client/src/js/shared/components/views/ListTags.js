import m from 'mithril';

import * as common from '../common';
import {mergeAttributes} from "../common";

// ```
// m(ListTags, {
//     tags: ['value 1', 'value 2', 'value 3'],
//     attrsTags: {}, (attributes to apply to each tag)
//     ondelete: (tag) => console.log(tag + " was deleted"),
//     reorderable: bool
// })
// ```

// Returns an inline array of elements with bubbles around them
// Each bubble contains the tag and a cancel button (if not readonly)

export default class ListTags {
    view(vnode) {
        let {tags, attrsTags, onclick, ondelete, reorderable, onreorder} = vnode.attrs;

        return tags.map((tag, dataId) => m('div', mergeAttributes({
                style: {
                    display: 'inline-block',
                    margin: '5px',
                    'border-radius': '5px',
                    padding: '4px 8px',
                    background: common.colors.gray
                }
            },
            onclick && {
                onclick: () => onclick(tag)
            },
            reorderable && {
                dataId,
                draggable: true,
                ondragstart: e => {
                    this.from = Number(e.currentTarget.getAttribute("dataid"));
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/html', null);
                },
                ondragover: e => {
                    e.preventDefault();
                    this.to = Number(e.currentTarget.getAttribute("dataid"))
                },
                ondragend: () => {
                    tags.splice(this.to, 0, tags.splice(this.from, 1)[0])
                    (onreorder || Function)()
                    m.redraw()
                },
            },
            attrsTags), [
                ondelete && m('div', {
                    onclick: () => ondelete(tag),
                    style: {
                        display: 'inline-block',
                        'margin-right': '0.5em',
                        transform: 'scale(1.3, 1.3)'
                    }
                }, '×'),
                m('div', {style: {display: 'inline-block'}}, tag)
            ])
        )
    }
}