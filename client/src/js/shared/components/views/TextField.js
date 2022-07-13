import m from 'mithril';
import {mergeAttributes} from "../common";

// ```
// m(TextField, {
//     id: string,
//     oninput: value => console.log(value),
//     textarea: (optional boolean),
//     *: any attribute may be passed
//     })
// ```

// Can pass attributes directly, for example 'placeholder' or 'oninput'

export default class TextField {
    view(vnode) {
        return m(`${vnode.attrs.textarea ? 'textarea' : 'input'}.form-control`, mergeAttributes({
                style: {'margin': '5px 0', 'width': '100%'}
            },
            vnode.attrs,
            {
                oninput: vnode.attrs.oninput && function() {vnode.attrs.oninput(this.value)},
                onblur: vnode.attrs.onblur && function() {vnode.attrs.onblur(this.value)}
            })
        );
    }
}
