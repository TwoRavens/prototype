import * as m from 'mithril';
import * as model from './model';

export function MainView(): m.Component {

    return {
        view: function view() {
            return m('div', [
                m('h1', 'TwoRavens Prototype'),
                [
                    m('button', {onclick: () => model.Auth.register('dev_admin@gmail.com', 'admin2394'), style: 'font-size: 15pt'}, "create user"),
                    m('button', {onclick: () => model.Auth.login('dev_admin@gmail.com', 'admin2394'), style: 'font-size: 15pt'}, "login"),
                    m('button', {onclick: model.invokeLambda, style: 'font-size: 15pt'}, "invoke lambda"),
                    m('button', {onclick: model.importCsv, style: 'font-size: 15pt'}, "import data"),
                    m('button', {onclick: model.importS3Csv, style: 'font-size: 15pt'}, "import s3 data"),
                    m('button', {onclick: model.fetchAggregate, style: 'font-size: 15pt'}, "get aggregate")
                ].map(v => m('h3', v)),
                JSON.stringify(model.getAggregate(), null, 2)
            ]);
        }
    };
}
