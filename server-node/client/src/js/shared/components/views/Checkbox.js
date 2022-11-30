import m from 'mithril';
import {mergeAttributes} from "../common";


// let specification = {
//     checked: boolean,
//     onclick: function
// }

export default class Checkbox {
    view({attrs}) {
        return m('input[type=checkbox]', mergeAttributes({}, attrs, {
            onclick: () => (attrs.onclick || (_ => _))(!attrs.checked)
        }))
    }
}
