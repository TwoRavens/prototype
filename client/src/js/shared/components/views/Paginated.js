import m from 'mithril';
import Button from "./Button";
import Icon from "./Icon";

// pagination for arbitrary components
export default class Paginated {
    oninit() {
        this.page = 0;
    }
    view(vnode) {
        let {data, makePage} = vnode.attrs;
        let {limit, page, setPage} = vnode.attrs;

        if (!data) data = [];

        if (!limit) limit = data.length;
        let setPageDefault = index => {
            if (setPage) setPage(index);
            this.page = index;
            m.redraw();
        };
        if (page === undefined) page = this.page;

        let pageContent = makePage(data.slice(limit * page, limit * (page + 1)));
        let pageCount = Math.ceil(data.length / limit);

        let switches = [
            {index: 0, content: m(Icon, {name: 'chevron-left'}), visible: page > 1},
            {index: Math.max(0, page - 1), content: String(Math.max(1, page)), visible: page > 0},
            {index: page, content: String(page + 1), visible: true, active: true},
            {index: Math.min(pageCount - 1, page + 1), content: String(Math.min(pageCount, page + 2)), visible: page < pageCount - 1},
            {index: pageCount - 1, content: m(Icon, {name: 'chevron-right'}), visible: page < pageCount - 2}
        ];

        let pageSwitcher = m('div', {
            class: 'btn-group', role: 'group', style: {'margin-left': '1em'}
        }, switches.map(btn => m(Button, {
            class: btn.active ? 'active' : '',
            title: 'Go to page ' + (btn.index + 1),
            style: {visibility: btn.visible ? 'visible' : 'hidden'},
            onclick: () => setPageDefault(btn.index)
        }, btn.content)));

        return m('div', pageContent, pageCount > 1 && m('div', {class: 'text-center'}, pageSwitcher))
    }
}