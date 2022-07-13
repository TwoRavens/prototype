import m from 'mithril';
import * as common from '../common';

// ```
// m(ModalVanilla, {
//     id: string,
//     setDisplay: (state) => display = state, (called when × or background clicked)
// }, content)
// ```

// I wrote this because I wanted a non-jquery alternative with a less-specific specification -Michael Shoemate
// The content within is also part of the mithril redraw loop, instead of being static

export default class ModalVanilla {
    oninit(vnode) {
        this.setDisplay = vnode.attrs.setDisplay;
        this.escapeKeyCallback = e => {
            if (!['Escape', 'Esc'].includes(e.key)) return;
            this.setDisplay(false);
            m.redraw()
        };
        window.addEventListener('keydown', this.escapeKeyCallback, true);
    }

    onbeforeremove() {
        window.removeEventListener("keydown", this.escapeKeyCallback, true);
    }

    view(vnode) {
        let {id} = vnode.attrs;

        return m(`div#modalBackground${id}`, {
            style: {
                animation: 'opacity 0.5s',
                position: 'fixed',
                'z-index': 2000,
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                overflow: 'auto',
                'background-color': 'rgba(0,0,0,0.4)'
            },
            onclick: () => this.setDisplay(false)
        }, m(`div#modalBox${id}`, {
            style: {
                'background-color': common.colors.menu,
                margin: '5% auto 0 auto',
                padding: '20px',
                border: common.colors.border,
                width: '80%',
                'box-shadow': '0 5px 20px rgba(0,0,0,.4)'
            },
            onclick: (e) => e.stopPropagation()
        }, m(`div#modalCancel${id}`, {
            onclick: () => this.setDisplay(false),
            style: {
                display: 'inline-block',
                'margin-right': '0.5em',
                transform: 'scale(2, 2)',
                float: 'right',
                'font-weight': 'bold',
                'line-height': '14px'
            }
        }, '×'), vnode.children));
    }
}