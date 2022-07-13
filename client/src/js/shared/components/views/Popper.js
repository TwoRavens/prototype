import m from "mithril";
import Popper from 'popper.js';
import * as common from '../common';

// Construct/place a popper upon hover of child content

// ```
// m(Popper, {
//         content: () => 'popper content',
//         options: {placement: 'left', ...}, // specification for options: https://popper.js.org/popper-documentation.html#Popper.Defaults
//         popperDuration: 100 // time in ms to delay load/unload
//     }, 'child content')
// ```

// only display one popper at a time
let globalPopperId;
let popperCount = 0;

export default class PopperWrapper {
    constructor() {
        this.popper = undefined;
        this.popperDom = undefined;
        this.popperRoot = undefined;
        this.timeout = undefined;
        this.popperId = popperCount++;
    }

    onupdate() {
        // recompute best position of popper
        // deterministic, will only find better location if page layout has changed
        if (this.popper) this.popper.update()
    }

    onremove() {
        if (this.popper) this.popper.destroy()
    }

    view({attrs, children}) {
        attrs.popperDuration = attrs.popperDuration || 200;

        // don't bother setting up the popper if the popper has no content
        if (!attrs.content) return children;

        return [
            // ACTUAL POPPER
            m('div#popper', {
                style: {
                    // animations
                    position: 'absolute',
                    visibility: this.popperId === globalPopperId && this.popper ? 'visible' : 'hidden',
                    opacity: this.popperId === globalPopperId && this.popper ? 1 : 0,
                    'margin-top': this.popper ? '0px' : '10px',
                    'transition': 'opacity 0.4s ease, margin-top 0.4s ease',

                    // popover styling
                    'background-color': common.colors.menu,
                    padding: '.5em',
                    'border-radius': '.5em',
                    'box-shadow': '0 1px 4px rgba(0, 0, 0, 0.4)',
                    'z-index': 10000
                },
                oncreate: ({dom}) => this.popperDom = dom,
                // don't clear popper if mouse is over popper
                onmouseover: () => clearTimeout(this.timeout),
                onmouseout: () => this.timeout = setTimeout(() => {
                    this.popper = undefined;
                    m.redraw()
                }, attrs.popperDuration)
            }, this.popper && attrs.content()),

            // WRAPPED ELEMENT, popper appears when hovered over
            m('div#popperWrapper', {
                oncreate: ({dom}) => this.popperRoot = dom,
                onmouseover: () => {
                    // potentially disable pending timer for turning off popup
                    clearTimeout(this.timeout);
                    // wait to enable popper, because immediately showing popper is annoying
                    this.timeout = setTimeout(
                        () => {
                            globalPopperId = this.popperId;
                            this.popper = this.popper || new Popper(this.popperRoot, this.popperDom, attrs.options);
                            m.redraw()
                        }, attrs.popperDuration)
                },
                onmouseout: () => {
                    // potentially disable pending timer for turning on popup
                    clearTimeout(this.timeout);
                    // wait to disable popper, for moving cursor to popper diagonally
                    this.timeout = setTimeout(() => {
                        this.popper = undefined;
                        m.redraw()
                    }, attrs.popperDuration)
                }
            }, children)
        ]
    }
}