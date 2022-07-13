import m from 'mithril';
import {heightFooter, mergeAttributes} from '../common';
import * as common from "../common";

// ```
// m(Footer, {
//     *: any attribute may be passed
// }, contents)
// ```

export default class Footer {
    view(vnode) {
        return m('#footer', mergeAttributes({
            style: {
                background: common.colors.menu,
                'border-top': common.colors.border,
                bottom: 0,
                height: heightFooter,
                position: 'fixed',
                width: '100%'
            }
        }, vnode.attrs), vnode.children);
    }
}
