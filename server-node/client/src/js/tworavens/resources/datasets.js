import m from "mithril";

import {Auth} from "../../shared/account";

import Paginated from "../../shared/components/views/Paginated";
import MenuTabbed from "../../shared/components/views/MenuTabbed";
import TextField from "../../shared/components/views/TextField";
import Button from "../../shared/components/views/Button";
import {NewWorkspace} from "./workspaces";
import {makeCell} from "./index";
import Icon from "../../shared/components/views/Icon";
import {state as workspacesState} from './workspaces';


export let state = {
    search: '',  // 'Ethiopia',
    datasets: undefined,

    newDataset: {
        tab: 'File',
        file: undefined,
        url: undefined,
        name: undefined,
        message: undefined,
    },
    editDataset: {},

    userPage: undefined,
    publicPage: undefined
};

export default class CanvasDatasets {
    view(vnode) {
        let {setMakeModal} = vnode.attrs;

        // load datasets if not loaded
        getDatasets();

        return [
            m('h4', 'User Datasets'),
            makeDatasetsList(
                state.datasets?.user ?? [],
                state.userPage || 0, index => state.userPage = index,
                setMakeModal),
            state.datasets?.public?.length > 0 && [
                m('h4', 'Public Datasets'),
                makeDatasetsList(
                    state.datasets.user,
                    state.publicPage || 0, index => state.publicPage = index,
                    setMakeModal),
            ]
        ]
    }
}

class NewDataset {
    view(vnode) {
        let {setMakeModal} = vnode.attrs;
        return m('div',
            m('h3', 'New Dataset'),
            m('', {style: {'max-width': '40em', margin: 'auto'}},
                m(MenuTabbed, {
                    currentTab: state.newDataset.tab,
                    callback: tab => state.newDataset.tab = tab,
                    sections: [
                        {
                            value: 'File',
                            title: 'upload a new dataset from a file on your computer',
                            contents: m('label.btn.btn-secondary', {
                                    style: {width: 'calc(100% - 1em)', margin: '0.5em'}
                                },
                                m('input', {
                                    hidden: true,
                                    type: 'file',
                                    onchange: e => state.newDataset.file = e.target.files[0],
                                }), state.newDataset.file?.name ?? "Browse"),
                        },
                        {
                            value: 'URL',
                            title: 'retrieve dataset from a URL',
                            contents: m(TextField, {
                                placeholder: 'https://example.com/baseball.csv',
                                id: 'datasetUrlTextfield',
                                value: state.newDataset.url,
                                oninput: value => state.newDataset.url = value,
                                onblur: value => state.newDataset.url = value,
                                style: Object.assign(
                                    {'margin': '0.5em', width: 'calc(100% - 1em)'},
                                    this?.err?.url && {'border-bottom': '1px solid #dc3545'})
                            }),
                        }
                    ]
                }),
                m('br'),
                m('h5', "Name"),
                m(TextField, {
                    id: 'datasetNameTextField',
                    value: state.newDataset.name,
                    placeholder: (state.newDataset.tab === 'File' && state.newDataset.file?.name) || '',
                    oninput: value => state.newDataset.name = value,
                    onblur: value => state.newDataset.name = value
                }),
                m('br'),
                m(Button, {
                    style: {width: '100%'},
                    onclick: () => ({
                        File: newFromFile,
                        URL: newFromUrl
                    }[state.newDataset.tab](this, setMakeModal))
                }, 'Submit'),
                state.newDataset.message
            ))
    }
}

class EditDataset {
    view(vnode) {
        let {datasetId, setMakeModal} = vnode.attrs;
        if (!getDatasets()) return;
        let datasets = [...state.datasets.user, ...state.datasets.public];
        let selectedDataset = datasets.find(d => d._id === datasetId);
        return [
            m('h3', 'Dataset: ' + selectedDataset.name),
            m('', {style: {'max-width': '40em', margin: 'auto'}},
                this.err,
                m(Button, {
                    style: {width: '100%', 'margin-bottom': '1em'},
                    onclick: () => {
                        workspacesState.newWorkspace.datasetId = datasetId;
                        setMakeModal(() => m(NewWorkspace, {setMakeModal}))
                        m.route.set('/resources/workspaces')
                    }
                }, 'Use in New Workspace', m(Icon, {style: 'margin-left:0.5em', name: 'arrow-right'})),
                m(Button, {
                    style: {width: '100%', 'margin-bottom': '2em'},
                    onclick: () => {
                        workspacesState.searchDataset = datasetId;
                        m.route.set('/resources/workspaces');
                        setMakeModal(undefined)
                    }
                }, 'Find Usages', m(Icon, {style: 'margin-left:0.5em', name: 'arrow-right'})),
                m(Button, {
                    style: {width: '100%', 'margin-bottom': '1em'},
                    onclick: () => Auth.post('/dataset/delete', {_id: datasetId})
                        .then(() => {
                            delete state.datasets;
                            delete workspacesState.workspaces;
                            setMakeModal(undefined)
                        })
                }, 'Delete Dataset', m(Icon, {style: 'margin-left:0.5em', name: 'trashcan'})),
                m('br'),
                m('h3', "Edit"),
                m('h5', "Name"),
                m(TextField, {
                    id: 'datasetNameTextField',
                    value: selectedDataset.newName ?? selectedDataset.name,
                    oninput: value => selectedDataset.newName = value,
                    onblur: value => selectedDataset.newName = value
                }),
                m('br'),
                m(Button, {
                    style: {width: '100%'},
                    onclick: () => Auth.post('/dataset/save', {
                        _id: datasetId,
                        name: selectedDataset.newName ?? selectedDataset.name
                    }).then(() => {
                        delete selectedDataset.newName;
                        delete state.datasets;
                    }).catch(err => this.err = err)
                }, 'Save'),
            )
        ]
    }
}


async function newFromFile(comp, setMakeModal) {
    if (!state.newDataset.file) {
        comp.err = {file: 'No file attached.'};
        return
    }

    let body = new FormData();
    body.append('name', state.newDataset.name || (state.newDataset.file?.name ?? ''));
    body.append('file', state.newDataset.file);

    // initial upload
    let result = await Auth.post("/dataset/new-file", body);
    if (result.success) {
        delete state.newDataset.name;
        delete state.newDataset.file;
        state.newDataset.message = 'Dataset Uploaded!'
        setTimeout(() => delete state.newDataset.message, 10000);
    } else {
        comp.err = result.data;
    }
    delete state.datasets
    setMakeModal(undefined);
    m.redraw();
}

async function newFromUrl(comp, setMakeModal) {
    if (!checkIsValidUrl(state.newDataset.url)) {
        comp.err = {url: 'URL is not valid.'};
        return;
    }
    let result = await Auth.post("/dataset/new-url", {
        name: state.newDataset.name,
        url: state.newDataset.url
    });

    if (result.success) {
        delete state.newDataset.name;
        delete state.newDataset.url;
        state.newDataset.message = 'Dataset Uploaded!'
        setTimeout(() => delete state.newDataset.message, 10000);
    } else {
        comp.err = result.data;
    }
    delete state.datasets;
    setMakeModal(undefined)
    m.redraw();
}

let checkIsValidUrl = url => {
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
}

let datasetsPromise = undefined;
export let getDatasets = () => {
    if (state.datasets) return state.datasets;

    if (!datasetsPromise) datasetsPromise = Auth.post('/dataset/list')
        .then(datasets => {
            state.datasets = datasets;
            datasetsPromise = undefined;
        })
}

let makeDatasetsList = (datasets, page, setPage, setMakeModal) => m(Paginated, {
    data: datasets,
    makePage: datasets => m('div', {
            style: {
                display: 'grid',
                gap: '1em',
                'grid-template-columns': 'repeat( auto-fit, minmax(250px, 1fr) )',
                'margin-bottom': '1em'
            }
        },
        ...datasets.map(dataset => makeCell({
            name: dataset.name,
            inner: () => m('div', {
                style: {width: '100%', height: '100%'},
                onclick: () => {
                    setMakeModal(() => m(EditDataset, {datasetId: dataset._id, setMakeModal}))
                },
            })
        })),
        !process.env.CLIENTSIDE_TRIAL_MODE && makeCell({
            name: 'New Dataset',
            inner: () => m('span', {
                    onclick: () => setMakeModal(() => m(NewDataset, {setMakeModal})),
                    style: {
                        width: '100%', height: '100%',
                        opacity: '0.7'
                    }
                },
                m('div', {
                    style: {
                        position: 'relative',
                        width: '70px', height: '70px',
                        display: 'block',
                        top: 'calc(50% - 45px)',
                        left: 'calc(50% - 35px)',
                    }
                }, m('.plus-bar.plus-horizontal'), m('.plus-bar.plus-vertical')))
        })),
    limit: 30,
    page, setPage
});
