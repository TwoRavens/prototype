import m from 'mithril';

// ```
// m(MenuHeaders, {
//     id: id,
//     sections: [...,
//         {
//             value: 'string',
//             contents: m(...),
//             idSuffix: (optional) suffix to add to generated id strings
//             attrsAll: {optional object of attributes}
//         }]
//     })
// ```

export default class MenuHeaders {
    view(vnode) {
        let {id, attrsAll, sections} = vnode.attrs;

        return m(`#${id.replace(/\W/g, '_')}`, attrsAll, sections
            .filter(section => section) // ignore undefined sections
            .map(section => m(`div#bin${section['idSuffix'] || String(section.value).replace(/\W/g, '_')}`,
                m(`#header${section['idSuffix'] || String(section.value).replace(/\W/g, '_')}.card-header`,
                    m("h4.card-title", section.value)),
                section.contents))
        )
    }
}
