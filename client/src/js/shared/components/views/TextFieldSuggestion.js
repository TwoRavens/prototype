import m from 'mithril';
import {mergeAttributes} from "../common";
import distance from 'jaro-winkler'

// NOTE this requires jaro-winkler to be installed from npm. Tested with version 1.1.3.
// npm install --save jaro-winkler

// ```
// m(TextField, {
//     id: string,
//     suggestions: ['possibility 1', 'possibility 2'],
//     enforce: boolean,
//     oninput: called with value of field
//     *: any attribute may be passed
//     })
// ```

// suggestions are shown below the text box.
// if enforce is true, then the value must be one of the suggestions
// Can pass attributes directly, for example 'placeholder' or 'oninput'


let distanceSort = (array, value) => {
    array = array.map(item => Array.isArray(item) ? item : [item, item]);
    if (value.length === 0) return array
    value = value.toLowerCase();
    return array
        .map(item => Array.isArray(item) ? item : [item, item])
        .map(([id, display]) => [[id, display], distance(id.toLowerCase(), value)])
        .sort((a, b) => b[1] - a[1])
        .map(item => item[0]);
}

export default class TextFieldSuggestion {
    oninit(vnode) {
        this.value = vnode.attrs.defaultValue || '';
        this.isDropped = vnode.attrs.isDropped;
        this.selectIndex = 0;
    }

    view(vnode) {
        let {id, suggestions, value, enforce, limit, dropWidth, attrsAll, attrsDropped} = vnode.attrs;

        // overwrite internal value if passed
        this.value = value === undefined ? this.value : value;

        return [
            m(`input#${id}.form-control`, mergeAttributes({
                    value: this.value,
                    style: {'margin': '5px 0', 'width': '100%'},
                    autocomplete: 'off',
                    onfocus: function () {
                        vnode.state.isDropped = true;
                        vnode.state.dropSelected = false;
                        if ('onfocus' in vnode.attrs)
                            vnode.attrs.onfocus(this.value)
                    },
                    oninput: function () {
                        vnode.state.value = this.value;
                        vnode.state.selectIndex = 0;
                        (vnode.attrs.oninput || Function)(this.value)
                    },
                    onblur: function() {
                        setTimeout(() => {
                            vnode.state.isDropped = false;
                            m.redraw()
                        }, 100);
                        if (vnode.state.dropSelected) return;
                        if (enforce && this.value !== '') {
                            vnode.state.value = this.value = distanceSort(suggestions, this.value)[0][0];
                        }
                        vnode.state.selectIndex = 0;
                        (vnode.attrs.onblur || Function)(this.value);
                    },
                    onkeydown: function(e) {
                        // key up
                        if (e.key === 'ArrowUp') {
                            vnode.state.selectIndex = Math.max(0, vnode.state.selectIndex - 1);
                        }
                        // key down
                        if (e.key === 'ArrowDown') {
                            vnode.state.selectIndex = Math.min(
                                limit || suggestions.length,
                                suggestions.length - 1,
                                vnode.state.selectIndex + 1);
                        }
                        if (e.key === 'Enter') {
                            vnode.state.value = this.value = distanceSort(suggestions, this.value)[vnode.state.selectIndex][0];
                            vnode.state.selectIndex = 0;
                            e.target.blur()
                        }
                        if (e.key === 'Escape') {
                            vnode.state.selectIndex = 0;
                            e.target.blur();
                        }
                    }
                }, attrsAll)
            ),
            m('ul.dropdown-menu', mergeAttributes({
                    'aria-labelledby': id,
                    style: {
                        top: 'auto',
                        left: 'auto',
                        width: dropWidth,
                        'min-width': 0,
                        display: this.isDropped ? 'block' : 'none'
                    }
                }, attrsDropped),
                distanceSort(suggestions, this.value).slice(0, limit).map(([id, display], i) =>
                    m('li.dropdown-item', {
                        value: id,
                        onmousedown: () => {
                            this.value = id;
                            this.dropSelected = true;
                            (vnode.attrs.onblur || Function)(id);
                        },
                        style: {'padding-left': '10px', 'z-index': 200, 'font-weight': this.selectIndex === i ? 'bold' : 'normal'}
                    }, display))
            )
        ];
    }
}
