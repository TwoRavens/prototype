import * as m from "mithril";

import Paginated from "../../shared/components/views/Paginated";
import {Auth, Result} from "../../shared/account";
import {makeCell} from "./index";
import TextField from "../../shared/components/views/TextField";
import {getDatasets, state as datasetState} from './datasets';
import TextFieldSuggestion from "../../shared/components/views/TextFieldSuggestion";
import Button from "../../shared/components/views/Button";
import Icon from "../../shared/components/views/Icon";

export let state = {
    search: '',
    workspaces: undefined,

    newWorkspace: {
        name: undefined,
        datasetId: undefined,
        message: undefined
    },
    editWorkspace: {},

    userPage: undefined,
    publicPage: undefined
};


export default class CanvasWorkspaces {
    view(vnode) {
        let {setMakeModal} = vnode.attrs;

        // load workspaces if not loaded
        getWorkspaces();

        return [
            m('h4', 'User Workspaces'),
            makeWorkspacesList(
                state.workspaces?.user ?? [],
                state.userPage || 0, index => state.userPage = index,
                setMakeModal),

            state.workspaces?.public?.length > 0 && [
                m('h4', 'Public Workspaces'),
                makeWorkspacesList(
                    state.workspaces.user,
                    state.publicPage || 0, index => state.publicPage = index,
                    setMakeModal),
            ]
        ]
    }
}

export class NewWorkspace {
    view(vnode) {
        let {setMakeModal} = vnode.attrs;
        if (!getDatasets()) return;

        let datasets = [...datasetState.datasets.user, ...datasetState.datasets.public];
        let selectedDataset = datasets.find(d => d._id === state.newWorkspace.datasetId);
        return m('div',
            m('h3', 'New Workspace'),
            m('', {style: {'max-width': '40em', margin: 'auto'}},
                m('h5', "Dataset"),
                m(TextFieldSuggestion, {
                    id: 'datasetTextField',
                    suggestions: datasets.map(dataset => [dataset._id, dataset.name]),
                    enforce: true,
                    oninput: _id => state.newWorkspace.datasetId = _id,
                    onblur: _id => state.newWorkspace.datasetId = _id,
                    value: selectedDataset?.name
                }),
                m('br'),
                m('h5', "Name"),
                m(TextField, {
                    id: 'workspaceNameTextField',
                    value: state.newWorkspace.name,
                    placeholder: selectedDataset?.name,
                    oninput: value => state.newWorkspace.name = value,
                    onblur: value => state.newWorkspace.name = value
                }),
                m('br'),
                m('h5', "Name"),
                m(Button, {
                    style: {width: '100%'},
                    onclick: () => newWorkspace(this, setMakeModal)
                }, 'Submit')
            ),
        )
    }
}

export class EditWorkspace {
    err: undefined;

    view(vnode) {
        let {workspace, setMakeModal} = vnode.attrs;
        return [
            m('h3', 'Workspace: ' + workspace.name),
            m('', {style: {'max-width': '40em', margin: 'auto'}},
                this?.err,
                m(Button, {
                    style: {width: '100%', 'margin-bottom': '1em'},
                    onclick: () => Auth.post('/workspace/activate', {_id: workspace._id})
                        .then(setMakeModal)
                        .then(() => m.route.set('/workspace'))
                }, 'Open Workspace', m(Icon, {style: 'margin-left:0.5em', name: 'arrow-right'})),
                m(Button, {
                    style: {width: '100%', 'margin-bottom': '1em'},
                    onclick: () => Auth.post('/workspace/delete', {_id: workspace._id})
                        .then(() => {
                            delete state.workspaces;
                            setMakeModal(undefined)
                        })
                }, 'Delete Workspace', m(Icon, {style: 'margin-left:0.5em', name: 'trashcan'})),
                m('br'),
                m('h3', "Edit"),
                m('h5', "Name"),
                m(TextField, {
                    id: 'workspaceNameTextField',
                    value: workspace.newName ?? workspace.name,
                    oninput: value => workspace.newName = value,
                    onblur: value => workspace.newName = value
                }),
                m('br'),
                m(Button, {
                    style: {width: '100%'},
                    onclick: () => Auth.post('/workspace/save', {
                        _id: workspace._id,
                        name: workspace.newName ?? workspace.name
                    }).catch(err => this.err = err)
                }, 'Save'))
        ]
    }
}

let newWorkspace = async (comp, setMakeModal) => {
    let datasets = [...datasetState.datasets.user, ...datasetState.datasets.public];
    let selectedDataset = datasets.find(d => d._id === state.newWorkspace.datasetId);
    let result: Result<string> = await Auth.post("/workspace/new", {
        name: state.newWorkspace.name || selectedDataset?.name,
        datasetId: state.newWorkspace.datasetId,
        public: false
    });

    if (result.success) {
        delete state.newWorkspace.name;
        delete state.newWorkspace.datasetId;
        state.newWorkspace.message = 'Dataset Uploaded!'
        setTimeout(() => delete state.newWorkspace.message, 10000);
    } else {
        comp.err = result.data;
    }
    delete state.workspaces
    setMakeModal(undefined);
    m.redraw();
}

let workspacesPromise = undefined;
let getWorkspaces = () => {
    if (state.workspaces) return state.workspaces;

    if (!workspacesPromise) workspacesPromise = Auth.post('/workspace/list')
        .then(workspaces => {
            state.workspaces = workspaces;
            workspacesPromise = undefined;
        })
}

let makeWorkspacesList = (workspaces, page, setPage, setMakeModal) => m(Paginated, {
    data: workspaces,
    makePage: workspaces => m('div', {
            style: {
                display: 'grid',
                gap: '1em',
                'grid-template-columns': 'repeat( auto-fit, minmax(250px, 1fr) )',
                'margin-bottom': '1em'
            }
        },
        ...workspaces.map(workspace => makeCell({
            name: workspace.name,
            inner: () => m('div', {
                style: {width: '100%', height: '100%'},
                onclick: () => {
                    setMakeModal(() => m(EditWorkspace, {workspace, setMakeModal}))
                },
            })
        })),
        !process.env.CLIENTSIDE_TRIAL_MODE && makeCell({
            name: 'New Workspace',
            inner: () => m('span', {
                    onclick: () => setMakeModal(() => m(NewWorkspace, {setMakeModal})),
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