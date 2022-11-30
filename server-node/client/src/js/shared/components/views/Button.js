import m from 'mithril'

// Specification


// ```
// m(Button, {
//     onclick: () => console.log("buttonID was clicked"),
//     *: any attribute may be passed
//     }, contents)
// ```

export default class Button {
    view({attrs, children}) {
        return m(`button.btn.btn-secondary`, attrs, children)
    }
}
