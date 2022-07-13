import m from 'mithril';
import {mergeAttributes, colors} from "../common";

// a menu with left and right components.
// On desktop, the center is draggable
// On mobile, can switch between left and right menus on click

// ```
// m(TwoPanel, {
//     left: m(...),
//     right: m(...),
//     })
// ```


export default class TwoPanel {
    oninit({rightPanelSize}) {
        this.focus = 'left';
        this.previous = this.focus;
        this.isResizingMenu = false;

        // window resizing
        if (rightPanelSize !== undefined)
            this.rightPanelSize = rightPanelSize;
        else this.rightPanelSize = 50;
    }


    resizeMenu(e, dom, setRightPanelSize) {
        this.isResizingMenu = true;
        document.body.classList.add('no-select');
        this.resizeMenuTick(e, dom, setRightPanelSize);
    }

    resizeMenuTick(e, dom, setRightPanelSize) {
        if (!dom) return;
        this.rightPanelSize = (1 - e.clientX / dom.clientWidth) * 100;
        if (setRightPanelSize) setRightPanelSize(this.rightPanelSize);

        document.getElementById('leftView').style.right = this.rightPanelSize + "%";
        document.getElementById('rightView').style.width = this.rightPanelSize + "%";
        m.redraw();
    }

    oncreate({dom, attrs}) {
        dom.addEventListener('mousemove', e => this.isResizingMenu && this.resizeMenuTick(e, dom, attrs.setRightPanelSize));

        dom.addEventListener('mouseup', () => {
            if (this.isResizingMenu) {
                this.isResizingMenu = false;
                document.body.classList.remove('no-select');
            }
        })
    }

    view(vnode) {
        let {left, right, rightPanelSize, setRightPanelSize} = vnode.attrs;

        if (rightPanelSize !== undefined)
            this.rightPanelSize = rightPanelSize;

        let animate = this.focus !== this.previous;
        this.previous = this.focus;

        return m('div',
            m('div#leftView', mergeAttributes({
                onclick: () => this.focus = 'left',
                class: {
                    'left': ['focused-left'],
                    'right': ['unfocused-left']
                }[this.focus],
                style: {
                    'border-right': colors.border,
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    right: this.rightPanelSize + '%',
                    'overflow-y': 'auto',
                    'animation-duration': '.4s'
                }
            }, animate && {style: {'animation-name': 'twopanel-' + this.focus}}), left),
            m('div#rightView', mergeAttributes({
                onclick: () => this.focus = 'right',
                class: {
                    'left': ['unfocused-right'],
                    'right': ['focused-right']
                }[this.focus],
                style: {
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: this.rightPanelSize + '%',
                    'overflow-y': 'auto',
                    'animation-duration': '.4s'
                }
            }, animate && {style: {'animation-name': 'twopanel-' + this.focus}}), [
                m('#horizontalDrag', {
                    class: ['hide-mobile'],
                    style: {
                        position: 'absolute',
                        left: '-4px',
                        top: 0,
                        bottom: 0,
                        width: '12px',
                        cursor: 'w-resize'
                    },
                    onmousedown: e => this.resizeMenu(e, vnode.dom, setRightPanelSize)
                }),
                right
            ])
        )
    }
}
