import m from 'mithril'

/*
  The main button defaults to bootstrap 4 style "btn-secondary"
  This one does not.
*/
export default class ButtonPlain {
    view({attrs, children}) {
        return m(`button.btn`, attrs, children)
    }
}
