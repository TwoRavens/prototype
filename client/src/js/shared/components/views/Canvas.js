import m from 'mithril';
import * as common from '../common';

// Interface specification

// ```
// m(Canvas, {
//     attrsAll: { additional attributes to apply to the outer div }
//     }, contents)
// ```

// Purpose:
// 1. if a left or right panel is not permitted to occlude the content on the canvas,
//      this class resizes the contents to maintain a margin away from the panels
// 2. if the contents of the canvas overflow and cause a scroll bar,
//      the left and right panel are shifted to maintain a margin

export default class Canvas {
    oncreate() {
        // Redraw if scroll bar status has changed
        window.addEventListener('resize', () => {if (common.scrollBarChanged()) m.redraw()});
    }

    view(vnode) {
        let {attrsAll} = vnode.attrs;
        return m('div', common.mergeAttributes({
            id: 'canvas',
            style: {
                width: '100%',
                height: `calc(100% - ${common.heightHeader} - ${common.heightFooter})`,
                'padding-left': common.panelOcclusion['left'],
                'padding-right': common.panelOcclusion['right'],
                position: 'fixed',
                overflow: 'auto',
                top: common.heightHeader
            }
        }, attrsAll), vnode.children)
    }
}
