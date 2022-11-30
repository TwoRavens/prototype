import m from 'mithril'
import {mergeAttributes} from "../common";

// Specification


// ```
// m(Slider, {
//     oninput: value => console.log("slider is now at " + value),
//     *: any attribute may be passed
//     })
// ```

export default class Slider {
    view(vnode) {
        return m(`input[type=range]`, mergeAttributes(
            {},
            vnode.attrs,
            {
                oninput: vnode.attrs.oninput && function () {
                    vnode.attrs.oninput(this.value)
                },
            }))
    }
}
