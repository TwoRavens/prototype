import m from 'mithril';
import {heightHeader, mergeAttributes, setDarkTheme, setLightTheme, theme} from '../common';
import Popper from './Popper.js'
import * as common from "../common";

// ```
// m(Header, {
//         image: src image,
//         aboutText: 'string',
//         attrsInterface: {optional object of attributes}
//     }, content)
// ```

// Creates a header bar at the top of the screen
// The TwoRavens logo and about text must be passed in
// Resizes automatically for mobile formatting


export default class Header {
    oninit() {
        this.mobileHeader = false;
    }

    view(vnode) {
        let {aboutText, attrsInterface} = vnode.attrs;

        return m('nav.navbar.navbar-expand-lg.fixed-top', mergeAttributes({
            style: {
                'min-height': heightHeader,
                'box-shadow': '0 0 4px #888',
                'z-index': 1000,
                'height': 'auto',
                'margin-bottom': '0px',
                padding: '0px 1rem',
                'background': common.colors.menu
            }
        }, attrsInterface), [

            m(Popper, {
                content: () => m('div[style=max-width:500px]', aboutText)
            }, m("img.navbar-brand[alt=TwoRavens]", {
                style: {
                    height: '100%',
                    'max-height': `calc(${heightHeader} - 16px)`,
                    'max-width': '140px',
                    filter: `invert(${{light: 0, dark: .9}[common.theme]})`
                },
                onclick: () => {
                    m.route.set('/')
                },
                src: 'TwoRavens.png'
            })),

            // This styling is partially and conditionally overwritten via common.css @media queries for mobile formatting
            m('div#hamburger.show-mobile', {
                onclick: () => this.mobileHeader = !this.mobileHeader,
                style: {
                    display: 'none',
                    float: 'right',
                    'margin-top': `calc(calc(${heightHeader} - 16px) / 2)`,
                    'margin-bottom': `calc(-calc(${heightHeader} - 16px) / 2)`,
                    'margin-right': '1em',
                    transform: 'translateY(-50%)',
                    position: 'relative',
                    'z-index': 100
                }
            }, m('div.header-icon', {
                style: {
                    transform: 'scale(1.75, 1.5)',
                    'margin-right': '0.5em'
                }
            }, m.trust('&#9776;'))),

            m('div#headerMenu', {
                    class: !this.mobileHeader && ['hide-mobile'],
                    style: {
                        width: 'calc(100% - 140px)',
                        display: 'inline-grid',
                        float: 'right',
                        'margin-top': `calc(${heightHeader} / 2 - 8px)`,
                        'margin-bottom': `calc(-${heightHeader} / 2 + 24px)`,
                        transform: 'translateY(-50%)'
                    }
                },
                m('div#headerContent', {
                        style: {
                            display: 'flex',
                            'justify-content': 'flex-end',
                            'align-items': 'center'
                        }
                    },
                    vnode.children
                ))
        ]);
    }
}
