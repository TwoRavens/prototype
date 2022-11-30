import m from 'mithril';
import Table from "../components/views/Table";
import Header from "../components/views/Header";
import Canvas from "../components/views/Canvas";
import {heightHeader} from "../components/common";
import * as app from '../../app';
import * as tworavens from '../../tworavens/tworavens';
import * as results from '../../tworavens/workspace/results/index';
import {customDatasets, getSolutionAdapter, resultsPreferences, uploadForModelRun} from '../../tworavens/workspace/results/index';

import TextField from "../components/views/TextField";
import Button from "../components/views/Button";
import {generateProblemID, setSelectedProblem} from "../../tworavens/problem";

export default class DeployPage {
    async oninit(vnode) {
        await tworavens.load({awaitPreprocess: false});

        let {problem} = vnode.attrs;

        let problemId = generateProblemID()
        problem.problemId = problemId;
        workspace.ravenConfig.problems[problemId] = problem;
        setSelectedProblem(problemId);
    }

    view(vnode) {
        let {id, problem} = vnode.attrs;

        console.log({'test': problem});
        problem = JSON.parse(problem);

        if (!tworavens.workspace) return;

        let solution = results.getSelectedSolutions(problem, 'd3m')[0];
        let adapter = results.getSolutionAdapter(problem, solution);

        return [
            m(Header, tworavens.workspace && [
                m('div', {style: {'flex-grow': 1}}),
                m("h4#dataName", tworavens.workspace.name),
                m('div', {style: {'flex-grow': 1}}),
            ]),
            m(Canvas, {
                    attrsAll: {
                        id: 'canvas' + id,
                        style: {
                            'padding-left': 0,
                            'padding-right': 0,
                            'margin-top': heightHeader + 'px',
                            height: `calc(100% - ${heightHeader})`
                        }
                    }
                },
                m('div', {
                        style: {
                            'max-width': '1000px',
                            'box-shadow': '0px 5px 10px rgba(0, 0, 0, .1)',
                            margin: '1em auto'
                        }
                    },


                    m('div',
                        m('h5', 'Data Split Name:'),
                        m(TextField, {
                            style: {width: 'auto', display: 'inline-block'},
                            id: 'datasetNameTextField',
                            value: resultsPreferences.upload.name,
                            oninput: value => resultsPreferences.upload.name = value,
                            onblur: value => resultsPreferences.upload.name = value
                        }),
                        m('label.btn.btn-secondary', {style: {display: 'inline-block', margin: '1em'}}, [
                            m('input', {
                                hidden: true,
                                type: 'file',
                                onchange: e => {
                                    resultsPreferences. upload.file = e.target.files[0];
                                    // resets the event, so that the second upload works
                                    e.target.value = ''
                                }
                            })
                        ], 'Browse'),
                        resultsPreferences.upload?.file?.name),

                    m(Button, {
                        onclick: () => {
                            if (!resultsPreferences.upload.file) {
                                app.alertError("No dataset is supplied.");
                                return;
                            }
                            if ((resultsPreferences.upload?.name?.length ?? 0) === 0) {
                                app.alertError("No dataset name is supplied.");
                                return;
                            }

                            uploadForModelRun(
                                resultsPreferences.upload.file,
                                resultsPreferences.upload.name,
                                problem.results.d3mDatasetId,
                            ).then(({customDataset, manipulatedInfo}) => {
                                // clear form, upload was successful
                                resultsPreferences.upload = {};
                                results.produceOnSolution(
                                    getSolutionAdapter(problem, solution),
                                    customDataset.name,
                                    manipulatedInfo.data_path,
                                    manipulatedInfo.metadata_path)
                            })
                        },
                        disabled: !resultsPreferences.upload.file || resultsPreferences.upload.name.length === 0
                    }, "Produce"),

                    Object.keys(customDatasets).length > 0 && [
                        m('h4[style=margin:1em]', 'Custom Datasets'),
                        "Set the current data split from the top of the left panel, or via the 'Select' button below. If your dataset contains actual values for the target variable, the Prediction Summary, Variable Importance, and Empirical First Differences will update to reflect the new dataset. Predictions are produced for all known solutions when your dataset is uploaded.",
                        m(Table, {
                            data: Object.keys(customDatasets).map(evaluationId => {
                                let dataPointer = adapter.getProduceDataPath(customDatasets[evaluationId].name);
                                return [
                                    customDatasets[evaluationId].name,
                                    m(Button, {
                                        onclick: () => resultsPreferences.dataSplit = customDatasets[evaluationId].name
                                    }, "Select"),
                                    m(Button, {
                                        disabled: !dataPointer,
                                        onclick: () => tworavens.downloadFile(dataPointer)
                                    }, "Download Predictions")
                                ]
                            })
                        })
                    ]
                ))
        ]
    }
}
