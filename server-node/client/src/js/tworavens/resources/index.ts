import * as common from '../../shared/components/common';
import * as m from "mithril";
import Header from "../../shared/components/views/Header";
import CanvasDatasets from "./datasets";
import CanvasWorkspaces from "./workspaces";
import ButtonRadio from "../../shared/components/views/ButtonRadio";
import AccountWidget from "../../shared/account/AccountWidget";
import ModalVanilla from "../../shared/components/views/ModalVanilla";
import Footer from "../../shared/components/views/Footer";


export default class ResourcesPage {
    view(vnode) {
        let {mode} = vnode.attrs;

        // after calling m.route.set, the params for mode, variate, vars don't update in the first redraw.
        // checking window.location.href is a workaround, permits changing mode from url bar
        if (!mode)
            m.route.set(`/resources/${state.selectedMode}`)

        if (window.location.href.includes(mode) && mode !== state.selectedMode)
            setSelectedResourceMode(mode);

        return m('main',

            m(Header,
                m('div', {style: {'flex-grow': 1}}),

                m(ButtonRadio, {
                    id: 'modeButtonBar',
                    attrsAll: {style: {margin: '0px 1em', width: 'auto'}, class: 'navbar-left'},
                    attrsButtons: {
                        // class: 'btn-sm',
                        style: {width: "auto"}},
                    onclick: setSelectedResourceMode,
                    activeSection: state.selectedMode || 'datasets',
                    sections: [
                        {value: 'Datasets'},
                        {value: 'Workspaces'}
                    ],
                }),

                m('div', {style: {'flex-grow': 1}}),
                m(AccountWidget)),

            state.makeModal && m(ModalVanilla, {
                id: 'resources',
                setDisplay: () => delete state.makeModal
            }, state.makeModal()),

            m(`#main`, {
                    style: {
                        top: common.heightHeader,
                        height: `calc(100% - ${common.heightHeader} - ${common.heightFooter})`,
                        bottom: common.heightFooter,
                        'background-color': common.colors.base,
                        color: common.colors.text
                    }
                },
                m('div', {
                        style: {
                            width: '100%', height: '100%',
                            position: 'relative',
                            'max-width': '1000px',
                            margin: 'auto',
                            'margin-top': '1em'
                        }
                    },
                    m(state.selectedMode === "datasets" ? CanvasDatasets : CanvasWorkspaces, {setMakeModal: maker => state.makeModal = maker}))),

            m(Footer)
        );
    }
}

let setSelectedResourceMode = mode => {
    state.selectedMode = mode;
    m.route.set('/resources/' + mode.toLowerCase());
}

let state = {
    selectedMode: 'datasets',
    makeModal: undefined
}


export let makeCell = content => m('div', {
    style: {
        display: 'flex',
        'flex-direction': 'column',
        height: '200px',
        'background-color': common.colors.menu,
        'box-shadow': '0 1px 4px rgba(0, 0, 0, 0.4)'
    },
}, m('h5[style=margin:1em]', content.name), m('div', {
    style: {
        width: '100%', 'flex-grow': 1, 'background-color': common.colors.lightGray
    }
}, content.inner?.()));