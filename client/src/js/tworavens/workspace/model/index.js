import * as d3 from "d3";
import m from "mithril";
import hopscotch from 'hopscotch';

import * as app from "../../../app";
import * as tworavens from "../../tworavens";
import {workspace} from "../../tworavens";
import * as utils from "../../../shared/utils";
import * as manipulate from "../../../shared/manipulations/manipulate";
import * as explore from "../explore/index";

import * as common from "../../../shared/components/common";
import Button from "../../../shared/components/views/Button";
import Icon from "../../../shared/components/views/Icon";
import Subpanel from "../../../shared/components/views/Subpanel";
import TextField from "../../../shared/components/views/TextField";
import PanelList from "../../../shared/components/views/PanelList";
import Table from "../../../shared/components/views/Table";
import ListTags from "../../../shared/components/views/ListTags";
import Panel from "../../../shared/components/views/Panel";
import MenuTabbed from "../../../shared/components/views/MenuTabbed";
import Dropdown from "../../../shared/components/views/Dropdown";
import ButtonRadio from "../../../shared/components/views/ButtonRadio";
import MenuHeaders from "../../../shared/components/views/MenuHeaders";
import Popper from '../../../shared/components/views/Popper';

import ForceDiagram, {groupBuilder, groupLinkBuilder, linkBuilder, pebbleBuilderLabeled} from "../../../shared/components-contrib/ForceDiagram";
import VariableSummary, {formatVariableSummary} from "../../../shared/components-contrib/VariableSummary";
import Flowchart from "../../../shared/components-contrib/Flowchart";

import {add, bold, generateID, italicize, linkURLwithText, omniSort, remove, toggle} from "../../../shared/utils";
import {
    buildEmptyProblem,
    defaultGroupDescriptions,
    erase,
    generateProblemID,
    getDescription,
    getGeographicVariables,
    getCategoricalVariables,
    getOrderingTimeUnit,
    getOrdinalVariables,
    getPredictorVariables,
    getProblemCopy,
    getProblemTrees,
    getSelectedProblem,
    getSubtask,
    getTargetGroups,
    getTargetVariables,
    loadProblemPreprocess,
    setMetric,
    setSelectedProblem,
    setSubTask,
    setTask
} from "../../problem";
import ForceDiagramGroup, {ForceDiagramLabel} from "../../../shared/components-contrib/ForceDiagramGroup";
import TreeRender from "../../../shared/components-contrib/TreeRender";


export class CanvasModel {

    view(vnode) {
        let {drawForceDiagram, forceData} = vnode.attrs;
        let selectedProblem = getSelectedProblem();

        if (Object.keys(tworavens.variableSummaries).length === 0)
            return m('div[style=height:100%;position:relative]',
                m('div[style=top:calc(50% - 60px);left:calc(50% - 60px);position:fixed]',
                    common.loader('forceDiagramLoader')))

        let selectedLinks = [];
        if (tworavens.isModelMode && selectedProblem)
            selectedLinks = [
                ...(selectedProblem.pebbleLinks || []).filter(link => link.selected),
                ...selectedProblem.groupLinks.filter(link => link.selected)
            ];

        let linkIcons = {
            minus: m(Icon, {name: 'dash'}),
            none: undefined,
            plus: m(Icon, {name: 'plus'}),
        }

        return [
            drawForceDiagram && m(ForceDiagram, Object.assign(forceDiagramState, {
                nodes: forceDiagramNodesReadOnly,
                // these attributes may change dynamically, (the problem could change)
                // drag pebble out of screen
                onDragOut: pebble => {
                    let pebbles = forceData.summaries[pebble] && forceData.summaries[pebble].pdfPlotType === 'collapsed'
                        ? forceData.summaries[pebble].childNodes : [pebble];
                    pebbles.forEach(pebble => toggleGroup(selectedProblem, 'None', pebble));
                    selectedProblem.pebbleLinks = (selectedProblem.pebbleLinks || [])
                        .filter(link => link.target !== pebble && link.source !== pebble);
                    tworavens.resetPeek();
                    m.redraw();
                },
                onDragOver: (pebble, groupId) => {
                    if (groupId === 'Loose') return;
                    let pebbles = forceData.summaries[pebble.name].pdfPlotType === 'collapsed'
                        ? forceData.summaries[pebble.name].childNodes : [pebble.name];
                    pebbles.forEach(pebble => toggleGroup(selectedProblem, groupId, pebble));
                    tworavens.resetPeek();
                    m.redraw();
                },
                // drag pebble away from group, but not out of screen
                onDragAway: (pebble, groupId) => {
                    let pebbles = forceData.summaries[pebble.name] && forceData.summaries[pebble.name].pdfPlotType === 'collapsed'
                        ? forceData.summaries[pebble.name].childNodes : [pebble.name];
                    let selectedProblem = getSelectedProblem();
                    pebbles.forEach(pebble => {
                        if (groupId !== 'Loose') toggleGroup(selectedProblem, 'Loose', pebble)
                    });
                    tworavens.resetPeek();
                    m.redraw();
                },

                labels: forceDiagramLabels(selectedProblem),
                mutateNodes: mutateNodes(selectedProblem),
                pebbleLinks: selectedProblem.pebbleLinks,
                onclickLink: (e, d) => {
                    let originalLink = selectedProblem.pebbleLinks.find(link => d.source === link.source && d.target === link.target);
                    if (!originalLink) return;
                    originalLink.selected = !originalLink.selected
                    tworavens.resetPeek();
                },
                onclickGroupLink: (e, d) => {
                    let originalLink = selectedProblem.groupLinks.find(link => d.source === link.source && d.target === link.target);
                    if (!originalLink) return;
                    originalLink.selected = !originalLink.selected
                    tworavens.resetPeek();
                }
            }, forceData)),


            tworavens.isModelMode && !tworavens.swandive && m("#spacetools.spaceTool", {
                    style: {right: tworavens.panelWidth.right, 'z-index': 16}
                },
                // m(Button, {
                //     id: 'btnAdd', style: {margin: '0px .5em'},
                //     onclick: addProblemFromForceDiagram,
                //     title: 'copy this problem'
                // }, m(Icon, {name: 'plus'})),
                m(Button, {
                    id: 'btnJoin', style: {margin: '0px .5em'},
                    onclick: () => {
                        if (selectedProblem.system === "solved") {
                            alertEditCopy();
                            return;
                        }
                        connectAllForceDiagram();
                    },
                    title: 'make all possible connections between nodes'
                }, m(Icon, {name: 'link'})),
                m(Button, {
                    id: 'btnDisconnect', style: {margin: '0px .5em'},
                    onclick: () => {
                        if (selectedProblem.system === "solved") {
                            alertEditCopy();
                            return;
                        }
                        selectedProblem.pebbleLinks = []
                    },
                    title: 'delete all connections between nodes'
                }, m(Icon, {name: 'circle-slash'})),
                m(Button, {
                    id: 'btnForce', style: {margin: '0px .5em'},
                    onclick: () => forceDiagramState.isPinned = !forceDiagramState.isPinned,
                    title: 'pin the variable pebbles to the page',
                    class: forceDiagramState.isPinned && 'active'
                }, m(Icon, {name: 'pin'})),
                m(Button, {
                    id: 'btnEraser', style: {margin: '0px .5em'},
                    onclick: () => {
                        if (selectedProblem.system === "solved") {
                            alertEditCopy();
                            return;
                        }
                        erase(selectedProblem)
                    },
                    title: 'wipe all variables from the modeling space'
                }, m(Icon, {name: 'trashcan'}))),

            selectedLinks.length > 0 && m(Subpanel, {
                id: 'selectedLinksSubpanel', header: 'Selected Link' + (selectedLinks.length > 1 ? 's' : ''),
                shown: true,
                setShown: () => selectedLinks.forEach(link => delete link.selected),
                style: {
                    left: tworavens.panelWidth['left'],
                    bottom: `calc(${common.panelMargin} + ${tworavens.peekInlineShown ? tworavens.peekInlineHeight + ' + 23px' : '0px'})`,
                    position: 'absolute',
                    width: '200px'
                }
            },
                m('div', {style: {width: '110px', display: 'inline-block'}},
                    m(ButtonRadio, {
                        id: 'pebbleLinkButtonBar',
                        onclick: linkIcon => {
                            let action = Object.entries(linkIcons).find(([name, icon]) => linkIcon === icon)[0];
                            selectedLinks.forEach(selectedLink => {
                                if (action === "none") {delete selectedLink.sign} else selectedLink.sign = action;
                            })
                        },
                        activeSection: selectedLinks.every(link => link.sign === selectedLinks[0].sign) && selectedLinks[0].sign || 'none',
                        sections: Object.entries(linkIcons).map(([key, icon]) => ({id: key, value: icon}))
                    })),
                m(Button, {
                    style: {display: 'inline-block', 'margin-left': '.8em'},
                    onclick: () => {
                        selectedProblem.pebbleLinks = (selectedProblem.pebbleLinks || []).filter(link => !selectedLinks.includes(link))
                        selectedProblem.groupLinks = selectedProblem.groupLinks.filter(link => !selectedLinks.includes(link))
                    }
                }, m(Icon, {name: 'trashcan'}))
            ),

            tworavens.isModelMode && selectedProblem && m(Subpanel, {
                    id: 'legend', header: 'Legend', class: 'legend',
                    style: {
                        right: tworavens.panelWidth['right'],
                        bottom: `calc(${common.panelMargin} + ${tworavens.peekInlineShown ? tworavens.peekInlineHeight + ' + 23px' : '0px'})`,
                        position: 'absolute',
                        width: '150px'
                    }
                }, variableTagMetadata(selectedProblem).filter(row => row && row.nodes.length > 0 && row.legend !== false).map(row =>
                    m(`#${String(row.name).replace(/\\W/g, '_')}Button[style=width:100% !important]`, {
                            onclick: (() => {
                                tworavens.setLeftTab("Groups")
                                m.redraw.sync();
                                document.getElementById(`${String(row.name).replace(/\W/g, '_')}TextField`)?.focus?.()
                            })
                        },
                        m(".rectColor[style=display:inline-block]", m("svg[style=width: 20px; height: 20px]",
                            m('circle', common.mergeAttributes({
                                cx: 10, cy: 10, r: 8.75,
                            }, row.group && {
                                fill: row.color, 'fill-opacity': 0.6
                            }, !row.group && {
                                stroke: row.color, 'fill-opacity': 0, 'stroke-opacity': 1, 'stroke-width': 2.5
                            })))),
                        m(".rectLabel[style=display:inline-block;vertical-align:text-bottom;margin-left:.5em]", row.name)))
            ),

            selectedProblem && selectedProblem.manipulations.filter(step => step.type === 'subset').length !== 0 && m(Subpanel, {
                id: 'subsetSubpanel',
                header: 'Subsets',
                style: {
                    left: tworavens.panelWidth['left'],
                    top: common.panelMargin,
                    position: 'absolute'
                }
            }, selectedProblem.manipulations
                .filter(step => step.type === 'subset')
                .map(step => m('div', step.id))
                .concat([`${manipulate.totalSubsetRecords} Records`])),
        ]
    }
}

export let renderProblemNode = (problem, _parentArray) => {
    let selectedProblem = getSelectedProblem();
    let baseProblem = workspace.ravenConfig.problems[problem.problemId];

    return m('div', {
            onclick: () => {
                let problems = workspace.ravenConfig.problems;
                let problemId = problem.problemId;

                if (selectedProblem.problemId === problemId) return;

                // delete current problem if no changes were made
                if (selectedProblem.pending) {
                    if (selectedProblem.unedited)
                        delete problems[selectedProblem.problemId];
                    else if (confirm(`You have unsaved changes in the previous problem, ${selectedProblem.problemId}. Would you like to save ${selectedProblem.problemId}?`))
                        selectedProblem.pending = false;
                    else delete problems[selectedProblem.problemId];
                }

                if (['user', 'solved'].includes(problem.system)) {
                    setSelectedProblem(problemId);
                    return;
                }

                // create a copy of the autogenerated problem
                if (problem.system === 'discovered') {
                    let copiedProblem = getProblemCopy(problem);
                    problems[copiedProblem.problemId] = copiedProblem;
                    setSelectedProblem(copiedProblem.problemId);
                }
            },
            oncreate({dom}) {
                dom.style.border = '3px solid transparent'
            }
        },

        m('div', {
                style: {
                    'border-bottom': selectedProblem.problemId === problem.problemId ? `2px solid ${common.colors.selVar}` : 'transparent',
                    outline: '0px solid transparent',
                },
            },
            // problem name
            !problem.pending && m('div[style=display:inline]', {
                contenteditable: true,
                oninput: v => baseProblem.name = v.target.innerHTML
            }, m.trust(baseProblem.name || baseProblem.problemId)),
            // indicator for solved or discovered problem
            baseProblem.system !== 'user' && m('div[style=margin-left:.5em;font-style:italic;display:inline;float:right]', baseProblem.system),
            // don't show the problem id if this is a floating problem
            baseProblem.pending && m('div[style=font-style:italic;display:inline]', 'floating problem', m(Button, {
                class: 'btn-xs',
                style: 'margin-left:.5em',
                onclick: () => delete workspace.ravenConfig.problems[problem.problemId].pending
            }, 'save'))),
    );
}

export let leftPanelWidths = {
    'Variables': '300px',
    'Problems': '300px',
    'Groups': '300px',
    'Summary': '300px'
};

export let rightPanelWidths = {
    Problem: '300px',
    Manipulate: '485px'
};

let leftpanelState = {
    problemLineageState: {}
}
window.leftpanelState = leftpanelState;

export let leftpanel = forceData => {

    let ravenConfig = tworavens.workspace.ravenConfig;
    let selectedProblem = getSelectedProblem();

    if (!ravenConfig) return;

    let sections = [];
    // base dataset variables, then transformed variables from the problem
    let leftpanelVariables = Object.keys(tworavens.variableSummaries)
        .filter(variable => tworavens.variableSummaries[variable].validCount > 0);

    // VARIABLES TAB
    if (selectedProblem) {

        // if no search string, match nothing
        let matchedVariables = variableSearchText.length === 0 ? []
            : leftpanelVariables.filter(variable => variable.toLowerCase().includes(variableSearchText)
                || (tworavens.variableSummaries?.[variable]?.label ?? "").toLowerCase().includes(variableSearchText));

        // reorder leftpanel variables
        leftpanelVariables = [
            ...matchedVariables,
            ...leftpanelVariables.filter(variable => !matchedVariables.includes(variable))
        ];

        sections.push({
            value: 'Variables',
            title: 'Click variable name to add or remove the variable pebble from the modeling space.',
            contents: tworavens.isModelMode && tworavens.rightTab === 'Manipulate' && manipulate.constraintMenu
                ? manipulate.varList()
                : [
                    m(TextField, {
                        id: 'searchVar',
                        placeholder: 'Search variables and labels',
                        autocomplete: "off",
                        oninput: setVariableSearchText,
                        onblur: setVariableSearchText,
                        value: variableSearchText
                    }),
                    m('div', {style: {height: 'calc(100% - 62px)', overflow: 'auto'}},
                    m(PanelList, {
                        id: 'varList',
                        items: leftpanelVariables,
                        colors: variableTagMetadata(selectedProblem)
                            .filter(tag => tag?.group)
                            .reduce((out, group) => Object.assign(out, {[utils.hexToRgba(group.color, group.opacity)]: group.nodes}), {}),
                        classes: variableTagMetadata(selectedProblem)
                            .filter(tag => tag && !tag.group)
                            .reduce((out, tag) => Object.assign(out, {[tag.class_]: tag.nodes}), {
                                'item-hovered': [leftpanelHoveredVariableName, forceDiagramState.selectedPebble].filter(_ => _)
                            }),
                        eventsItems: {
                            onclick: varName => {
                                let diagramPebbles = [
                                    ...selectedProblem.groups.flatMap(group => group.nodes),
                                    ...selectedProblem.tags.loose,
                                    ...selectedProblem.tags.crossSection,
                                    ...selectedProblem.tags.ordering
                                ]
                                toggleGroup(selectedProblem, diagramPebbles.includes(varName) ? 'None' : 'Loose', varName);
                                tworavens.resetPeek();
                            },
                            onmouseover: varName => leftpanelHoveredVariableName = varName,
                            onmouseout: () => leftpanelHoveredVariableName = undefined,
                        },
                        popup: variableName => m('div', {
                                onmouseover: () => leftpanelHoveredVariableName = variableName,
                                onmouseout: () => leftpanelHoveredVariableName = undefined
                            },
                            m('div',
                                // m('div', {
                                //     style: {'margin': '0.5em', 'display': 'inline-block', width: 'auto'},
                                //     onclick: () => setSelectedPebble(variableName)
                                // }, m(Icon, {name: "info"})),
                                m(ButtonRadio, {
                                    id: 'summaryPopupButtonRadio',
                                    style: {width: 'auto', display: 'inline'},
                                    activeSection: leftpanelHoveredVariablePopper,
                                    onclick: state => leftpanelHoveredVariablePopper = state,
                                    sections: [
                                        {value: 'Groups'},
                                        {value: 'Summary'},
                                    ]
                                })
                            ),
                            leftpanelHoveredVariablePopper === 'Groups' && [
                                ...variableTagMetadata(selectedProblem).map(tag =>
                                    m('div', {
                                        style: {'margin': '0.5em', 'display': 'inline-block', width: 'auto'}
                                    }, m(Button, {
                                        style: Object.assign({width: 'auto'}, tag.group ? {
                                            'background-color': utils.hexToRgba(tag.color, tag.opacity)
                                        } : {
                                            'border': `4px solid ${utils.hexToRgba(tag.color, tag.opacity)}`
                                        }),
                                        onclick: tag.toggleNode && (() => tag.toggleNode(variableName)),
                                        class: (tag.nodes.includes(variableName) ? 'active' : '') + ' btn-sm'
                                    }, tag.name)))
                            ],
                            leftpanelHoveredVariablePopper === 'Summary' && [
                                m('div',
                                    // m('h4', 'Summary Statistics'),
                                    m(Table, {
                                        class: 'table-sm',
                                        style: {height: "250px", overflow: 'auto', display: 'inline-block', margin: 0},
                                        data: formatVariableSummary(tworavens.variableSummaries[variableName])
                                    }))
                            ]
                        ),
                        popupOptions: {placement: 'right', modifiers: {preventOverflow: {escapeWithReference: true}}},
                    }),
                    m(Button, {
                        id: 'btnCreateVariable',
                        style: {width: '90%', 'margin-top': '10px', 'margin-bottom': '10px', 'margin-left': '5%'},
                        onclick: async () => {

                            let problemPipeline = getSelectedProblem().manipulations;
                            if ((problemPipeline[problemPipeline.length - 1] || {}).type !== 'transform') {
                                problemPipeline.push({
                                    type: 'transform',
                                    id: 'transform ' + problemPipeline.length,
                                    transforms: [],
                                    expansions: [],
                                    binnings: [],
                                    manual: []
                                })
                            }
                            tworavens.setRightTab('Manipulate');
                            manipulate.setConstraintMenu({
                                type: 'transform',
                                step: problemPipeline[problemPipeline.length - 1],
                                pipeline: problemPipeline
                            });
                            common.setPanelOpen('left');
                            tworavens.setLeftTab(tworavens.LEFT_TAB_NAME_VARIABLES);
                        }
                    }, 'Create New Variable')),
                ]
        })
    }

    if (selectedProblem) {
        // TODO: groupLinks
        let {groups, groupLinks} = buildGroupingState(selectedProblem);

        sections.push({
            value: 'Groups',
            contents: [
                m(Button, {
                    style: {margin: '.5em', width: 'calc(100% - 1em)'},
                    onclick: () => selectedProblem.groups.unshift({
                        id: selectedProblem.groupCount++,
                        name: '',
                        description: '',
                        nodes: [],
                        color: common.colorPalette[(selectedProblem.groupCount + 1) % common.colorPalette.length],
                        opacity: 0.3,
                        editable: true
                    })
                }, m(Icon, {name: 'plus'}), ' Group'),
                groups.map(group => m(ForceDiagramGroup, {
                    group, variables: leftpanelVariables, problem: selectedProblem
                })),
                m('h4[style=padding:1em]', 'Labels'),
                variableTagMetadata(selectedProblem)
                    .filter(tag => tag && !tag.group)
                    .map(label => m(ForceDiagramLabel, {label, variables: leftpanelVariables, problem: selectedProblem}))
            ]
        })
    }

    // PROBLEMS TAB
    selectedProblem && sections.push({
        value: 'Problems',
        contents: [
            m('h4.card-header', 'Problem Lineage'),
            "Problems that are active in the current workspace.",
            m(TreeRender, {
                data: getProblemTrees(),
                state: leftpanelState.problemLineageState,
                renderNode: renderProblemNode
            }),
            m('[style=margin:.5em 0]',
                m(Button, {
                    style: {'margin-left': '.5em', 'display': 'inline'},
                    onclick: () => {
                        let problems = workspace.ravenConfig.problems;
                        // delete current problem if no changes were made
                        if (selectedProblem.pending) {
                            if (selectedProblem.unedited)
                                delete problems[selectedProblem.problemId];
                            else if (confirm(`You have unsaved changes in the previous problem, ${selectedProblem.problemId}. Would you like to save ${selectedProblem.problemId}?`))
                                selectedProblem.pending = false;
                            else delete problems[selectedProblem.problemId];
                        }

                        let problemId = 'base ' + generateProblemID();
                        let newProblem = buildEmptyProblem(problemId);
                        workspace.ravenConfig.problems[problemId] = newProblem;
                        setSelectedProblem(newProblem.problemId);
                    }
                }, 'new empty ', m(Icon, {name: 'plus'})),
                m(Button, {
                    style: {'margin-left': '.5em', 'display': 'inline'},
                    onclick: () => {
                        if (selectedProblem.pending) {
                            alert("Please save the current problem before branching.")
                            return
                        }
                        addProblemFromForceDiagram()
                    }
                }, 'new child ', m(Icon, {name: 'git-branch'}))),
            m('h4.card-header', 'Discover Problems'),
            "Preset problems that show interesting relationships mined from the dataset.",
            m(Button, {
                style: {'margin-left': '.5em'},
                onclick: () => tworavens.setShowModalProblems(true)
            }, 'Browse Presets')
        ]
    });

    let summaryPebble = forceDiagramState.hoverPebble || forceDiagramState.selectedPebble;
    let summaryContent;

    if (summaryPebble && forceData) {
        // if hovered over a collapsed pebble, then expand summaryPebble into all children pebbles
        let summaryPebbles = forceData.summaries?.[summaryPebble]?.pdfPlotType === 'collapsed'
            ? [...forceData.summaries[summaryPebble].childNodes]
            : [summaryPebble];

        summaryContent = summaryPebbles.sort(omniSort)
            .map(variableName => m(Subpanel, {
                    id: 'subpanel' + variableName,
                    header: variableName,
                    defaultShown: false,
                    shown: summaryPebbles.length === 1 || undefined,
                    attrsBody: {style: {padding: '.25em'}}
                },

                variableTagMetadata(selectedProblem).map(tag =>
                    m('div', {
                        style: {'margin': '0.5em', 'display': 'inline-block', width: 'auto'},
                    }, m(Popper, {
                        content: () => tag.description,
                        popperDuration: 10
                    }, m(Button, {
                        style: Object.assign({width: 'auto'}, tag.group ? {
                            'background-color': utils.hexToRgba(tag.color, tag.opacity)
                        } : {
                            'border': `4px solid ${utils.hexToRgba(tag.color, tag.opacity)}`
                        }),
                        onclick: tag.toggleNode && (() => tag.toggleNode(variableName)),
                        class: (tag.nodes.includes(variableName) ? 'active' : '') + ' btn-sm'
                    }, tag.name)))),

                (selectedProblem.tags.ordering.includes(variableName) || tworavens.variableSummaries[variableName].timeUnit) && m('div', {
                    style: {
                        'text-align': 'left',
                        'margin-left': '.5em'
                    }
                },

                bold('Time Format'), m('br'),
                'Data units in ', linkURLwithText('https://strftime.org/', 'strftime'), ' format',
                m(TextField, {
                    id: 'timeFormatTextField',
                    value: tworavens.variableSummaries[variableName].timeUnit,
                    oninput: value => tworavens.setVariableSummaryAttr(variableName, 'timeUnit', value),
                    onblur: value => tworavens.setVariableSummaryAttr(variableName, 'timeUnit', value),
                })),

                (selectedProblem.tags.location.includes(variableName) || tworavens.variableSummaries[variableName].locationUnit) && m('div', {
                    style: {
                        'text-align': 'left',
                        'margin-left': '.5em'
                    }
                },

                m('', {style: 'margin: 0.5em'},
                    bold('Location Format'), m('br'),
                    'Units',
                    m(Dropdown, {
                        id: 'locationUnitsDropdown',
                        items: Object.keys(tworavens.locationUnits).concat(tworavens.variableSummaries[variableName].locationUnit ? ['none'] : []),
                        activeItem: tworavens.variableSummaries[variableName].locationUnit || 'unknown',
                        onclickChild: value => {
                            if (value === 'none') {
                                delete tworavens.variableSummaries[variableName].locationUnit
                                return
                            }
                            if (value === tworavens.variableSummaries[variableName].locationUnit) return;
                            tworavens.setVariableSummaryAttr(variableName, 'locationUnit', value)
                            tworavens.setVariableSummaryAttr(variableName, 'locationFormat', undefined);
                            tworavens.inferLocationFormat(variableName)
                        }
                    }),
                    tworavens.variableSummaries[variableName].locationUnit && m('div',
                        {style: 'margin-bottom: 1em'},
                        'Format',
                        m(Dropdown, {
                            id: 'locationFormatDropdown',
                            items: tworavens.locationUnits[tworavens.variableSummaries[variableName].locationUnit],
                            activeItem: tworavens.variableSummaries[variableName].locationFormat,
                            onclickChild: value => tworavens.setVariableSummaryAttr(variableName, 'locationFormat', value)
                        }),
                    ))),

                m(VariableSummary, {variable: tworavens.variableSummaries[variableName]})));
    }

    sections.push({
        value: 'Summary',
        title: "Select" + " a variable from within the visualization in the center panel to view its summary statistics.",
        display: 'none',
        contents: summaryContent
    });

    return m(Panel, {
        side: 'left',
        label: 'Data Selection',
        hover: false, // tworavens.isModelMode && !manipulate.constraintMenu,
        width: tworavens.isExploreMode && tworavens.leftTab === 'Discover' ? '900px' : leftPanelWidths[tworavens.leftTab],
        attrsAll: {
            onclick: () => tworavens.setFocusedPanel('left'),
            style: {
                'z-index': 100 + (tworavens.focusedPanel === 'left'),
                background: utils.hexToRgba(common.colors.menu, .9),
                height: `calc(100% - ${common.heightHeader} - 2*${common.panelMargin} - ${tworavens.peekInlineShown ? tworavens.peekInlineHeight : '0px'} - ${common.heightFooter})`
            }
        }
    }, m(MenuTabbed, {
        id: 'leftpanelMenu',
        attrsAll: {style: {height: 'calc(100% - 50px)'}},
        currentTab: tworavens.leftTab,
        callback: tworavens.setLeftTab,
        sections: sections
    }));
};

export let rightpanel = () => {

    let sections = [];

    let ravenConfig = tworavens.workspace.ravenConfig;
    if (!ravenConfig) return;
    let selectedProblem = getSelectedProblem();
    if (!selectedProblem) return

    let isLocked = tworavens.isLocked(selectedProblem);

    // PROBLEM TAB
    selectedProblem && sections.push({
        value: 'Problem',
        idSuffix: 'Type',
        contents: [
            isLocked && m(Button, {
                id: 'btnLock',
                class: isLocked ? 'active' : '',
                onclick: () => {
                    if (selectedProblem.system === 'solved') {
                        alertEditCopy();
                        return;
                    }
                    tworavens.setLockToggle(!isLocked)
                },
                title: 'Lock selection of problem description',
                style: 'right:2em;position:fixed;z-index:1000;margin:0.5em',
                disabled: selectedProblem.system === 'solved'
            }, m(Icon, {name: isLocked ? 'lock' : 'pencil'})),
            m('div#problemConfiguration', {
                    onclick: () => {
                        if (selectedProblem.system === 'solved') {
                            alertEditCopy();
                            return;
                        }
                        isLocked && hopscotch.startTour(tworavens.lockTour())
                    }, style: 'float: left'
                },
                m('label[style=margin-right:1em]', 'Name'),
                m(TextField, {
                    id: 'problemNameTextField',
                    value: selectedProblem?.name || selectedProblem.problemId,
                    oninput: value => selectedProblem.name = value,
                    onblur: value => {
                        selectedProblem.name = value;
                        if (selectedProblem.name === selectedProblem.problemId)
                            delete selectedProblem.name
                    },
                    style: {
                        'margin-bottom': '1em',
                        width: 'calc(100% - 150px)',
                        display: 'inline-block'
                    }
                }),
                m('br'),
                m('label', 'Description'),
                m('p', {
                    id: 'problemDescription',
                    style: {
                        'max-height': '200px',
                        'overflow': 'auto',
                        'background': isLocked ? 'transparent' : '#e6e5e5',
                        'border-radius': '.5em',
                        'padding': '1em',
                    },
                }, m('pre', {
                    style: 'margin:0',
                    contenteditable: !isLocked,
                    oninput: v => {
                        selectedProblem.description = v.target.innerHTML
                        selectedProblem.unedited = false
                    }
                }, m.trust(getDescription(selectedProblem)))),
                m('label', 'Modeling Mode'),
                m(ButtonRadio, {
                    id: 'modelingModeButtonBar',
                    attrsAll: {style: 'width:180px;margin:1em;margin-top:0'},
                    onclick: !isLocked && (mode => selectedProblem.modelingMode = mode),
                    activeSection: selectedProblem.modelingMode || "predict",
                    sections: [
                        {value: 'predict', attrsInterface: {disabled: isLocked}},
                        {value: 'causal', attrsInterface: {disabled: isLocked}},
                    ]
                }),
                m('br'),
                m('label', 'Task Type'),
                m(Dropdown, {
                    id: 'taskType',
                    items: Object.keys(tworavens.d3mTaskType),
                    // items: tworavens.workspace.ravenConfig.advancedMode
                    //     ? Object.keys(tworavens.d3mTaskType)
                    //     : ['classification', 'regression', 'forecasting'],
                    activeItem: selectedProblem.task,
                    onclickChild: task => setTask(task, selectedProblem),
                    style: {'margin': '1em', 'margin-top': '0'},
                    disabled: isLocked
                }),
                Object.keys(tworavens.applicableMetrics[selectedProblem.task]).length !== 1 && [
                    m('label', 'Task Subtype'),
                    m(Dropdown, {
                        id: 'taskSubType',
                        items: Object.keys(tworavens.applicableMetrics[selectedProblem.task]),
                        activeItem: getSubtask(selectedProblem),
                        onclickChild: subTask => setSubTask(subTask, selectedProblem),
                        style: {'margin': '1em', 'margin-top': '0'},
                        disabled: isLocked
                    })
                ],

                selectedProblem.task === 'forecasting' && [

                    m('label', 'Time Granularity (optional). Specify the gap between observations.'),
                    m(TextField, {
                        id: 'timeGranularityValueTextField',
                        value: selectedProblem.timeGranularity?.value || '',
                        oninput: value => selectedProblem.timeGranularity.value =
                            value.replace(/[^\d.-]/g, ''),
                        onblur: value => selectedProblem.timeGranularity.value =
                            Math.max(0, parseFloat(value.replace(/[^\d.-]/g, ''))) || undefined,
                        style: {
                            'margin-bottom': '1em',
                            width: 'calc(100% - 150px)',
                            display: 'inline-block'
                        }
                    }),
                    m('div', {style: {display: 'inline-block', width: '92px'}},
                        m(Dropdown, {
                            id: 'timeGranularityUnitsDropdown',
                            items: ["seconds", "minutes", "days", "weeks", "years", "unspecified"],
                            activeItem: selectedProblem.timeGranularity.units || 'unspecified',
                            onclickChild: granularity => selectedProblem.timeGranularity.units = granularity
                        })),
                    m('label', 'Horizon value. Choose how many granular steps to forecast.'),
                    m(TextField, {
                        id: 'horizonValueTextField',
                        disabled: isLocked,
                        placeholder: 10,
                        value: selectedProblem.forecastingHorizon || '',
                        oninput: !isLocked && (value => selectedProblem.forecastingHorizon =
                            Math.max(0, parseInt(value.replace(/\D/g, ''))) || undefined),
                        style: {'margin-bottom': '1em'}
                    })
                ],

                selectedProblem.task === 'clustering' && [
                    m('label', 'Number of Clusters (optional)'),
                    m(TextField, {
                        id: 'numClustersTextField',
                        disabled: isLocked,
                        value: selectedProblem.numClusters,
                        oninput: !isLocked && (value => selectedProblem.numClusters = Math.max(0, parseInt(value.replace(/\D/g, ''))) || undefined),
                        style: {'margin-bottom': '1em'}
                    })
                ],

                m('label', 'Primary Performance Metric. Models are trained to maximize this metric.'),
                m(Dropdown, {
                    id: 'performanceMetric',
                    // TODO: filter based on https://datadrivendiscovery.org/wiki/display/work/Matrix+of+metrics
                    items: tworavens.applicableMetrics[selectedProblem.task][getSubtask(selectedProblem)],
                    activeItem: selectedProblem.metric,
                    onclickChild: metric => setMetric(metric, selectedProblem),
                    style: {'margin': '1em', 'margin-top': '0'},
                    disabled: isLocked
                }),

                // m('label[style=margin:0.5em]', 'Advanced Options. If enabled, then more problem types, splitting, search and score options may be configured.'),
                // m(ButtonRadio, {
                //     id: 'advancedModeOption',
                //     attrsAll: {style: {margin: '1em', width: 'calc(100% - 2em)'}},
                //     onclick: !isLocked && (value => tworavens.workspace.ravenConfig.advancedMode = value === 'True'),
                //     activeSection: tworavens.workspace.ravenConfig.advancedMode ? 'True' : 'False',
                //     sections: ['True', 'False'].map(type => ({value: type, attrsInterface: {disabled: isLocked}}))
                // }),

                // tworavens.workspace.ravenConfig.advancedMode &&
                tworavens.applicableMetrics[selectedProblem.task][getSubtask(selectedProblem)].length - 1 > selectedProblem.metrics.length && m(Dropdown, {
                    id: 'performanceMetrics',
                    items: tworavens.applicableMetrics[selectedProblem.task][getSubtask(selectedProblem)]
                        .filter(metric => metric !== selectedProblem.metric && !selectedProblem.metrics.includes(metric)),
                    activeItem: 'Add Secondary Metric',
                    onclickChild: metric => {
                        selectedProblem.metrics = [...selectedProblem.metrics, metric].sort(omniSort);
                        delete selectedProblem.unedited;
                    },
                    style: {'margin': '1em', 'margin-top': '0'},
                    disabled: isLocked
                }),
                // tworavens.workspace.ravenConfig.advancedMode &&
                m(ListTags, {
                    tags: selectedProblem.metrics,
                    ondelete: !isLocked && (metric => remove(selectedProblem.metrics, metric))
                }),

                // tworavens.workspace.ravenConfig.advancedMode &&
                [selectedProblem.metric, ...selectedProblem.metrics].find(metric => ['f1', 'precision', 'recall'].includes(metric)) && getTargetVariables(selectedProblem).length > 0 && [
                    m('label', 'Positive Class. Used for f1, precision, and recall metrics.'),
                    m(Dropdown, {
                        id: 'positiveClass',
                        items: Object.keys(tworavens.variableSummaries[getTargetVariables(selectedProblem)[0]]?.plotValues || {}),
                        activeItem: selectedProblem.positiveLabel,
                        onclickChild: label => selectedProblem.positiveLabel = label,
                        style: {'margin': '1em', 'margin-top': '0'},
                        disabled: isLocked
                    }),
                ],

                // tworavens.workspace.ravenConfig.advancedMode &&
                [selectedProblem.metric, ...selectedProblem.metrics].find(metric => metric === 'precisionAtTopK') && [
                    m('label', 'K, for Precision at top K'),
                    m(TextField, {
                        id: 'precisionAtTopKTextField',
                        disabled: isLocked,
                        value: selectedProblem.precisionAtTopK === undefined ? '' : selectedProblem.precisionAtTopK,
                        oninput: !isLocked && (value => selectedProblem.precisionAtTopK = Math.max(0, parseInt(value.replace(/\D/g, ''))) || undefined),
                        style: {'margin-bottom': '1em'}
                    })
                ],

                // tworavens.workspace.ravenConfig.advancedMode &&
                m(Subpanel, {
                        header: 'Split Options',
                        defaultShown: false,
                        style: {margin: '1em'}
                    },
                    m('label', 'Prepare in/out-of-sample splits.'),
                    m(ButtonRadio, {
                        id: 'outOfSampleSplit',
                        onclick: value => {
                            if (isLocked) return;
                            selectedProblem.splitOptions.outOfSampleSplit = value === 'True';
                    },
                    activeSection: selectedProblem.splitOptions.outOfSampleSplit ? 'True' : 'False',
                    sections: ['True', 'False'].map(type => ({value: type, attrsInterface: {disabled: isLocked}}))
                }),
                selectedProblem.splitOptions.outOfSampleSplit && [
                    m('label[style=margin-top:0.5em]', 'In-sample-ratio. This ratio is used for model training, the rest is used for out-of-sample scoring and diagnostics.'),
                    m(TextField, {
                        id: 'ratioSplitsOption',
                        disabled: isLocked,
                        value: selectedProblem.splitOptions.trainTestRatio || 0,
                        onblur: !isLocked && (value => selectedProblem.splitOptions.trainTestRatio = Math.max(0, Math.min(1, parseFloat(value.replace(/[^\d.-]/g, '')) || 0))),
                        style: {'margin-bottom': '1em'}
                    }),
                    // m('label[style=margin-top:0.5em]', 'Stratify'),
                    // m(ButtonRadio, {
                    //     id: 'stratifiedSplitOption',
                    //     onclick: value => {
                    //         if (isLocked) return;
                    //         selectedProblem.splitOptions.stratified = value === 'True';
                    //     },
                    //     activeSection: selectedProblem.splitOptions.stratified ? 'True' : 'False',
                    //     sections: ['True', 'False'].map(type => ({value: type, attrsInterface: {disabled: isLocked}}))
                    // }),
                    m('label[style=margin-top:0.5em]', 'Shuffle'),
                    m(ButtonRadio, {
                        id: 'shuffleSplitsOption',
                        onclick: !isLocked && (value => selectedProblem.splitOptions.shuffle = value === 'True'),
                        activeSection: selectedProblem.splitOptions.shuffle ? 'True' : 'False',
                        sections: ['True', 'False'].map(type => ({value: type, attrsInterface: {disabled: isLocked}}))
                    }),
                    selectedProblem.splitOptions.shuffle && [
                        m('label[style=margin-top:0.5em]', 'Random seed'),
                        m(TextField, {
                            id: 'randomSeedSplitsOption',
                            disabled: isLocked,
                            value: selectedProblem.splitOptions.randomSeed || 0,
                            oninput: !isLocked && (value => selectedProblem.splitOptions.randomSeed = parseFloat(value.replace(/\D/g, '')) || undefined),
                            style: {'margin-bottom': '1em'}
                        })
                    ],
                        // m('label[style=margin-top:0.5em]', 'Splits file (optional)'),
                        // m(TextField, {
                        //     id: 'textFieldSampleSplitsFile',
                        //     disabled: isLocked,
                        //     value: selectedProblem.splitOptions.splitsFile,
                        //     onblur: !isLocked && (value => selectedProblem.splitOptions.splitsFile = value),
                        //     style: {'margin-bottom': '1em'}
                        // }),
                        m('label', 'Maximum record count per data split'),
                        m(TextField, {
                            id: 'maxRecordCountOption',
                            disabled: isLocked,
                            value: selectedProblem.splitOptions.maxRecordCount || '',
                            oninput: !isLocked && (value => selectedProblem.splitOptions.maxRecordCount = value.replace(/[^\d.-]/g, '')),
                            onblur: !isLocked && (value => selectedProblem.splitOptions.maxRecordCount = parseFloat(value.replace(/[^\d.-]/g, '')) || undefined),
                            style: {'margin-bottom': '1em'}
                        }),
                    ]),
                // tworavens.workspace.ravenConfig.advancedMode &&
                m(Subpanel, {
                        header: 'Search Options',
                        defaultShown: false,
                        style: {margin: '1em'}
                    },
                    m('label', 'Approximate time bound for overall pipeline search, in minutes.'), //  Leave empty for unlimited time.
                    m(TextField, {
                        id: 'timeBoundOption',
                        value: selectedProblem.searchOptions.timeBoundSearch || '',
                        disabled: isLocked,
                        oninput: !isLocked && (value => selectedProblem.searchOptions.timeBoundSearch = value.replace(/[^\d.-]/g, '')),
                    onblur: !isLocked && (value => selectedProblem.searchOptions.timeBoundSearch = Math.max(0, parseFloat(value.replace(/[^\d.-]/g, ''))) || undefined),
                    style: {'margin-bottom': '1em'}
                }),
                m('label', 'Approximate time bound for predicting with a single pipeline, in minutes. Leave empty for unlimited time.'),
                m(TextField, {
                    id: 'timeBoundRunOption',
                    disabled: isLocked,
                    value: selectedProblem.searchOptions.timeBoundRun || '',
                    oninput: !isLocked && (value => selectedProblem.searchOptions.timeBoundRun = value.replace(/[^\d.-]/g, '')),
                    onblur: !isLocked && (value => selectedProblem.searchOptions.timeBoundRun = Math.max(0, parseFloat(value.replace(/[^\d.-]/g, ''))) || undefined),
                    style: {'margin-bottom': '1em'}
                }),
                m('label', 'Priority'),
                m(TextField, {
                    id: 'priorityOption',
                    disabled: isLocked,
                    value: selectedProblem.searchOptions.priority || '',
                    oninput: !isLocked && (value => selectedProblem.searchOptions.priority = value.replace(/[^\d.-]/g, '')),
                    onblur: !isLocked && (value => selectedProblem.searchOptions.priority = parseFloat(value.replace(/[^\d.-]/g, '')) || undefined),
                    style: {'margin-bottom': '1em'}
                }),
                    m('label', 'Limit on number of solutions'),
                    m(TextField, {
                        id: 'solutionsLimitOption',
                        disabled: isLocked,
                        value: selectedProblem.searchOptions.solutionsLimit || '',
                        oninput: !isLocked && (value => selectedProblem.searchOptions.solutionsLimit = Math.max(0, parseInt(value.replace(/\D/g, ''))) || undefined),
                        style: {'margin-bottom': '1em'}
                    })),
                // tworavens.workspace.ravenConfig.advancedMode &&
                m(Subpanel, {
                        header: 'Score Options',
                        defaultShown: false,
                        style: {margin: '1em'},
                    },
                    m('label[style=margin-top:0.5em]', 'Custom Scoring Configuration'),
                    m(ButtonRadio, {
                        id: 'customScoringConfiguration',
                        onclick: !isLocked && (value => selectedProblem.scoreOptions.userSpecified = value === 'True'),
                        activeSection: selectedProblem.scoreOptions.userSpecified ? 'True' : 'False',
                        sections: ['True', 'False'].map(type => ({value: type, attrsInterface: {disabled: isLocked}}))
                    }),
                    selectedProblem.scoreOptions.userSpecified && [
                        m('label', 'Evaluation Method'),
                        m(Dropdown, {
                            id: 'evaluationMethodScoreOption',
                            items: Object.keys(tworavens.d3mEvaluationMethods),
                            activeItem: selectedProblem.scoreOptions.evaluationMethod,
                            onclickChild: child => {
                                selectedProblem.scoreOptions.evaluationMethod = child;
                                delete selectedProblem.unedited;
                            },
                            style: {'margin-bottom': '1em'},
                            disabled: isLocked
                        }),
                        selectedProblem.scoreOptions.evaluationMethod === 'kFold' && [
                            m('label[style=margin-top:0.5em]', 'Number of Folds'),
                            m(TextField, {
                                id: 'foldsScoreOption',
                                disabled: isLocked,
                                value: selectedProblem.scoreOptions.folds || '',
                                oninput: !isLocked && (value => selectedProblem.scoreOptions.folds = parseFloat(value.replace(/\D/g, '')) || undefined),
                                style: {'margin-bottom': '1em'}
                            }),
                        ],
                        selectedProblem.scoreOptions.evaluationMethod === 'holdOut' && [
                            m('label[style=margin-top:0.5em]', 'Train/Test Ratio'),
                            m(TextField, {
                                id: 'ratioScoreOption',
                                disabled: isLocked,
                                value: selectedProblem.scoreOptions.trainTestRatio || 0,
                                onblur: !isLocked && (value => selectedProblem.scoreOptions.trainTestRatio = Math.max(0, Math.min(1, parseFloat(value.replace(/[^\d.-]/g, '')) || 0))),
                                style: {'margin-bottom': '1em'}
                            })
                        ],
                        // m('label', 'Stratify'),
                        // m(ButtonRadio, {
                        //     id: 'stratifiedScoreOption',
                        //     onclick: value => {
                        //         if (isLocked) return;
                        //         selectedProblem.scoreOptions.stratified = value === 'True';
                        //     },
                        //     activeSection: selectedProblem.scoreOptions.stratified ? 'True' : 'False',
                        //     sections: ['True', 'False'].map(type => ({value: type, attrsInterface: {disabled: isLocked}}))
                        // }),
                        m('label[style=margin-top:0.5em]', 'Shuffle'),
                        m(ButtonRadio, {
                            id: 'shuffleScoreOption',
                            onclick: !isLocked && (value => selectedProblem.scoreOptions.shuffle = value === 'True'),
                            activeSection: selectedProblem.scoreOptions.shuffle ? 'True' : 'False',
                            sections: ['True', 'False'].map(type => ({value: type, attrsInterface: {disabled: isLocked}}))
                        }),
                        selectedProblem.scoreOptions.shuffle && [
                            m('label[style=margin-top:0.5em]', 'Random seed'),
                            m(TextField, {
                                id: 'randomSeedScoreOption',
                                disabled: isLocked,
                                value: selectedProblem.scoreOptions.randomSeed || 0,
                                oninput: !isLocked && (value => selectedProblem.scoreOptions.randomSeed = parseFloat(value.replace(/\D/g, '')) || undefined),
                                style: {'margin-bottom': '1em'}
                            })
                        ],
                    ]
                ),
            )
        ]
    });

    // MANIPULATE TAB
    selectedProblem && sections.push({
        value: 'Manipulate',
        title: 'Apply transformations and subsets to a problem',
        contents: m(MenuHeaders, {
            id: 'aggregateMenu',
            attrsAll: {style: {height: '100%', overflow: 'auto'}},
            sections: [
                (ravenConfig.priorManipulations || []).length !== 0 && {
                    value: 'Prior Pipeline',
                    contents: m(manipulate.PipelineFlowchart, {
                        compoundPipeline: ravenConfig.priorManipulations,
                        pipeline: ravenConfig.priorManipulations,
                        editable: false
                    })
                },
                ravenConfig.hardManipulations.length !== 0 && {
                    value: 'Dataset Pipeline',
                    contents: m(manipulate.PipelineFlowchart, {
                        compoundPipeline: ravenConfig.hardManipulations,
                        pipeline: ravenConfig.hardManipulations,
                        editable: false
                    })
                },
                {
                    value: 'Problem Pipeline',
                    contents: [
                        m(manipulate.PipelineFlowchart, {
                            compoundPipeline: [
                                ...ravenConfig.hardManipulations,
                                ...selectedProblem.manipulations
                            ],
                            pipeline: selectedProblem.manipulations,
                            editable: selectedProblem.systemId !== 'solved',
                            hard: false
                        }),
                        selectedProblem.tags.categorical.length > 0 && m(Flowchart, {
                            attrsAll: {style: {height: 'calc(100% - 87px)', overflow: 'auto'}},
                            labelWidth: '5em',
                            steps: [{
                                key: 'Categorical',
                                color: utils.hexToRgba(tworavens.colors.categorical, .5),
                                content: m('div', {style: {'text-align': 'left', 'white-space': 'normal'}},
                                    m(ListTags, {
                                        tags: selectedProblem.tags.categorical,
                                        ondelete: name => remove(selectedProblem.tags.categorical, name)
                                    }))
                            }]
                        }),
                        selectedProblem.tags.ordering.length > 1 && m(Flowchart, {
                            attrsAll: {style: {height: 'calc(100% - 87px)', overflow: 'auto'}},
                            labelWidth: '5em',
                            steps: [{
                                key: 'Ordering',
                                color: utils.hexToRgba(tworavens.colors.order, .5),
                                content: m(Table, {
                                    style: {margin: '-4px', width: 'calc(100% + 8px)'},
                                    data: [
                                        [
                                            m(Popper, {content: () => "Drag to reorder. Click to select the pebble and customize the format."}, "Unit Ordering"),
                                            m(ListTags, {
                                                tags: selectedProblem.tags.ordering,
                                                reorderable: true,
                                                onreorder: () =>     // update preprocess
                                                    loadProblemPreprocess(selectedProblem)
                                                        .then(tworavens.setPreprocess)
                                                        .then(m.redraw),
                                                onclick: setSelectedPebble
                                            })
                                        ],
                                        [
                                            "Output Time Units",
                                            italicize(getOrderingTimeUnit(selectedProblem))
                                        ],
                                        [
                                            "Output Name",
                                            m(TextField, {
                                                value: selectedProblem.orderingName,
                                                placeholder: selectedProblem.tags.ordering.join("-"),
                                                oninput: value => {
                                                    if (value === selectedProblem.tags.ordering.join("-") || !value)
                                                        delete selectedProblem.orderingName
                                                    else selectedProblem.orderingName = value
                                                },
                                                onblur: value => {
                                                    if (value === selectedProblem.tags.ordering.join("-") || !value)
                                                        delete selectedProblem.orderingName
                                                    else selectedProblem.orderingName = value;

                                                    loadProblemPreprocess(selectedProblem)
                                                        .then(tworavens.setPreprocess)
                                                        .then(m.redraw)
                                                }
                                            })
                                        ]
                                    ]
                                })
                            }]
                        })
                    ]
                },
            ]
        })
    });

    return m(Panel, {
            side: 'right',
            label: 'Problem Configuration',
            hover: tworavens.isExploreMode,
            width: rightPanelWidths[tworavens.rightTab],
            attrsAll: {
                onclick: () => tworavens.setFocusedPanel('right'),
                style: {
                    'z-index': 100 + (tworavens.focusedPanel === 'right'),
                    height: `calc(100% - ${common.heightHeader} - 2*${common.panelMargin} - ${tworavens.peekInlineShown ? tworavens.peekInlineHeight : '0px'} - ${common.heightFooter})`,
                }
            }
        },
        sections.length > 0 && m(MenuTabbed, {
            id: 'rightpanelMenu',
            currentTab: tworavens.rightTab,
            callback: tworavens.setRightTab,
            sections,
            attrsAll: {style: {height: 'calc(100% - 50px)'}}
        })
    );
}

// initial color scale used to establish the initial colors of nodes
// allNodes.push() below establishes a field for the master node array allNodes called "nodeCol" and assigns a color from this scale to that field
// everything there after should refer to the nodeCol and not the color scale, this enables us to update colors and pass the variable type to R based on its coloring
export let colors = d3.scaleOrdinal(d3.schemeCategory10);

const intersect = sets => sets.reduce((a, b) => new Set([...a].filter(x => b.has(x))));


let buildGroupingState = problem => {
    return {
        groups: variableTagMetadata(problem)
            .filter(tag => tag?.group)
            .map(group => Object.assign(group, {
                id: group.id ?? group.name,
                nodes: new Set(group.nodes)
            })),
        groupLinks: [
            ...problem.groupLinks,
            ...getTargetGroups(problem).flatMap(group => [
                {
                    color: tworavens.colors.order,
                    source: 'Ordering',
                    target: group.id
                },
                {
                    color: tworavens.colors.crossSection,
                    source: 'Cross-Sectional',
                    target: group.id
                },
            ])
        ]
    }
};

export let buildForceData = problem => {

    if (!problem) return;

    let summaries = Object.assign({}, tworavens.variableSummaries);

    // collapse group intersections with more than maxNodes into a single node
    let maxNodes = 30;

    let removedPebbles = new Set();
    let addedPebbles = new Set();

    let {groups, groupLinks} = buildGroupingState(problem);

    groups
        .filter(group => group.keep && group.nodes.size === 0)
        .forEach(group => {
            let placeholderName = `empty-placeholder-${group.id}`;
            group.nodes.add(placeholderName);
            summaries[placeholderName] = {pdfPlotType: 'nonexistent'};
        })

    let combinedGroups = new Map(common.deepCopy(groups).map(group => [group.id, group]));

    // TODO: can be linearized with a hashmap
    // for any combination of groups, collapse their intersection if their intersection is large enough
    // https://stackoverflow.com/questions/12303989/cartesian-product-of-multiple-arrays-in-javascript
    const cartesian = (...a) => a.length === 0 ? []
        : a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())), []);

    cartesian(...groups.map(group => [{group, include: true}, {group, include: false}]))
        .forEach(combination => {

            let includedGroups = combination
                .filter(comb => comb.include)
                .map(comb => comb.group);
            if (includedGroups.length === 0) return;

            let partition = new Set([
                ...intersect(includedGroups.map(group => group.nodes))
            ].filter(pebble => !combination
                .filter(comb => !comb.include)
                .some(comb => comb.group.nodes.has(pebble))));

            let mergedName = includedGroups.map(group => group.name).join(' & ');

            if (partition.size > maxNodes) {

                addedPebbles.add(mergedName);
                let partitionArray = [...partition];
                partitionArray.forEach(pebble => removedPebbles.add(pebble));

                // tworavens.remove pebbles that were collapsed from their parent groups
                includedGroups
                    .forEach(group => combinedGroups.get(group.id).nodes = new Set([...group.nodes].filter(node => !partition.has(node))));
                // add the pebble that represents the merge to each parent group
                includedGroups
                    .forEach(group => combinedGroups.get(group.id).nodes.add(mergedName));

                summaries[mergedName] = {
                    pdfPlotType: 'collapsed',
                    childNodes: partition
                };

                // when merging, attempt to use the positions of existing modes
                if (!(mergedName in forceDiagramNodesReadOnly)) {
                    let preexistingPebbles = partitionArray.filter(pebble => pebble in forceDiagramNodesReadOnly)
                    if (preexistingPebbles.length > 0) forceDiagramNodesReadOnly[mergedName] = {
                        id: mergedName.replace(/\W/g, '_'),
                        name: mergedName,
                        x: preexistingPebbles.reduce((sum, pebble) => sum + forceDiagramNodesReadOnly[pebble].x, 0) / preexistingPebbles.length,
                        y: preexistingPebbles.reduce((sum, pebble) => sum + forceDiagramNodesReadOnly[pebble].y, 0) / preexistingPebbles.length
                    }
                }
            }
        });

    // all pebbles to draw in the plot
    let pebbles = [...new Set([
        ...groups.flatMap(group => [...group.nodes]).filter(pebble => !removedPebbles.has(pebble)),
        ...addedPebbles
    ])];
    groups = [...combinedGroups.values()];

    return {pebbles, groups, groupLinks, summaries};
};


export let forceDiagramNodesReadOnly = {};

export let leftpanelHoveredVariableName;
let leftpanelHoveredVariablePopper = 'Summary';

export let forceDiagramState = {
    builders: [pebbleBuilderLabeled, groupBuilder, linkBuilder, groupLinkBuilder],
    hoverPebble: undefined,
    contextPebble: undefined,
    contextGroup: undefined,
    selectedPebble: undefined,
    hoverTimeout: undefined,
    isPinned: false,
    hullRadius: 50,
    defaultPebbleRadius: 40,
    hoverTimeoutDuration: 150, // milliseconds to wait before showing/hiding the pebble handles
    selectTransitionDuration: 300, // milliseconds of pebble resizing animations
    arcHeight: 16,
    arcGap: 1
};
window.forceDiagramState = forceDiagramState;

let setContextGroup = (e, group) => {

    let selectedProblem = getSelectedProblem();
    if (selectedProblem.system === 'solved') {
        alertEditCopy();
        return;
    }

    delete selectedProblem.unedited;
    if (e) e.preventDefault(); // block browser context menu
    if (forceDiagramState.contextGroup) {

        if (forceDiagramState.contextGroup !== group) {
            let link = {
                source: forceDiagramState.contextGroup.id,
                target: group.id,
                color: forceDiagramState.contextGroup.color
            };
            selectedProblem.groupLinks.push(link);
        }
        forceDiagramState.contextGroup = undefined;
    }
    m.redraw();
};

let setContextPebble = (e, pebble) => {
    let selectedProblem = getSelectedProblem();
    if (selectedProblem.system === 'solved') {
        alertEditCopy();
        return;
    }

    delete selectedProblem.unedited;
    if (e) e.preventDefault(); // block browser context menu
    if (forceDiagramState.contextPebble) {

        if (forceDiagramState.contextPebble !== pebble) {
            selectedProblem.pebbleLinks = selectedProblem.pebbleLinks || [];
            let link = {
                source: forceDiagramState.contextPebble,
                target: pebble,
                right: true,
                selected: true
            };
            selectedProblem.pebbleLinks.push(link);
        }
        forceDiagramState.contextPebble = undefined;
    } else {
        if (getTargetVariables(selectedProblem).includes(pebble)) {
            app.alertWarn("Targets may not be predictors!")
            return
        }
        forceDiagramState.contextPebble = pebble;
    }
    tworavens.resetPeek();
    m.redraw();
};

export let setSelectedPebble = pebble => {
    forceDiagramState.selectedPebble = pebble;

    if (pebble) {
        tworavens.setLeftTabHidden(tworavens.leftTab);
        tworavens.setLeftTab('Summary');
    } else if (tworavens.leftTabHidden) {
        tworavens.setLeftTab(tworavens.leftTabHidden);
    }
    m.redraw();
};

Object.assign(forceDiagramState, {
    setSelectedPebble,
    groupEvents: {
        click: setContextGroup,
        contextmenu: (e, group) => {
            if (e) e.preventDefault(); // block browser context menu
            forceDiagramState.contextGroup = group;

            m.redraw();
        }
    },
    pebbleEvents: {
        click: (e, pebble) => {
            if (forceDiagramState.contextPebble)
                setContextPebble(e, pebble);
            else if (forceDiagramState.contextGroup)
                setContextGroup(e, buildGroupingState(getSelectedProblem()).groups.find(group => group.nodes.has(pebble)))
            else setSelectedPebble(pebble)
        },
        mouseover: (e, pebble) => {
            if (firstSummaryMouseover && tworavens.tutorial_mode && !hopscotch.getCurrTour())
                hopscotch.startTour(summaryTour());
            clearTimeout(forceDiagramState.hoverTimeout);
            forceDiagramState.hoverTimeout = setTimeout(() => {
                if (!forceDiagramState.contextPebble && !forceDiagramState.contextGroup)
                    forceDiagramState.hoverPebble = pebble;
                if (tworavens.leftTab !== 'Summary') tworavens.setLeftTabHidden(tworavens.leftTab);
                tworavens.setLeftTab('Summary');
                m.redraw()
            }, forceDiagramState.hoverTimeoutDuration)
        },
        mouseout: () => {
            clearTimeout(forceDiagramState.hoverTimeout);
            forceDiagramState.hoverTimeout = setTimeout(() => {
                forceDiagramState.hoverPebble = undefined;
                if (!forceDiagramState.selectedPebble)
                    tworavens.setLeftTab(tworavens.leftTabHidden)

                m.redraw()
            }, forceDiagramState.hoverTimeoutDuration)
        },
        contextmenu: setContextPebble
    }
});

let variableTagMetadata = selectedProblem => [
    variableSearchText?.length > 0 && {
        id: 'Matched',
        name: `Search: ${variableSearchText}`,
        group: true,
        nodes: variableSearchText.length === 0 ? []
            : Object.keys(tworavens.variableSummaries)
                .filter(variable => variable.toLowerCase().includes(variableSearchText)),
        color: tworavens.colors.matched,
        opacity: 0.3,
        description: `Snapshot of variables containing "${variableSearchText}".`
    },
    ...selectedProblem.groups.map(group => Object.assign({}, group, {
        group: true,
        toggleNode: variableName => toggleGroup(selectedProblem, group.nodes.includes(variableName) ? 'Loose' : group.id, variableName),
        editable: true,
        keep: true
    })),
    {
        name: 'Loose',
        group: true,
        nodes: tworavens.isExploreMode ? explore.explorePreferences.variables : selectedProblem.tags.loose,
        toggleNode: variableName => toggleGroup(selectedProblem, selectedProblem.tags.loose.includes(variableName) ? 'None' : 'Loose', variableName),
        opacity: 0.,
        description: defaultGroupDescriptions.loose,
        legend: false
    },
    {
        name: 'Cross Section',
        group: true,
        nodes: selectedProblem.tags.crossSection,
        toggleNode: variableName => toggleGroup(selectedProblem, 'crossSection', variableName),
        color: tworavens.colors.crossSection,
        opacity: 0.3,
        description: defaultGroupDescriptions.crossSection
    },
    {
        name: 'Ordering',
        group: true,
        nodes: selectedProblem.tags.ordering,
        toggleNode: variableName => toggleGroup(selectedProblem, 'Ordering', variableName),
        color: tworavens.colors.order,
        opacity: 0.3,
        description: defaultGroupDescriptions.ordering
    },
    {
        name: 'Location',
        group: true,
        nodes: selectedProblem.tags.location,
        toggleNode: variableName => toggleGroup(selectedProblem, 'Location', variableName),
        color: tworavens.colors.location,
        opacity: 0.3,
        description: defaultGroupDescriptions.location
    },
    {
        name: 'Index',
        nodes: selectedProblem.tags.indexes,
        toggleNode: variableName => toggleTag(selectedProblem, 'indexes', variableName),
        color: tworavens.colors.index,
        opacity: 0.7,
        description: defaultGroupDescriptions.index,
        class_: 'item-index'
    },
    {
        name: 'Weight',
        nodes: selectedProblem.tags.weights,
        toggleNode: variableName => toggleTag(selectedProblem, 'weights', variableName),
        color: tworavens.colors.weight,
        opacity: 0.7,
        description: defaultGroupDescriptions.weight,
        class_: 'item-weight'
    },
    {
        name: 'Ordinal',
        nodes: getOrdinalVariables(selectedProblem),
        toggleNode: variableName => toggleGroup(selectedProblem, 'ordinal', variableName),
        color: tworavens.colors.ordinal,
        opacity: 0.7,
        description: defaultGroupDescriptions.ordinal,
        class_: 'item-ordinal'
    },
    {
        name: 'Privileged',
        nodes: selectedProblem.tags.privileged,
        toggleNode: variableName => toggleTag(selectedProblem, 'privileged', variableName),
        color: tworavens.colors.privileged,
        opacity: 0.7,
        description: defaultGroupDescriptions.privileged,
        class_: 'item-privileged'
    },
    selectedProblem.modelingMode !== "causal" && selectedProblem.task === "forecasting" && {
        name: 'Exogenous',
        nodes: selectedProblem.tags.exogenous,
        toggleNode: variableName => toggleTag(selectedProblem, 'exogenous', variableName),
        color: tworavens.colors.exogenous,
        opacity: 0.7,
        description: defaultGroupDescriptions.exogenous,
        class_: 'item-exogenous'
    },
    selectedProblem.modelingMode === "causal" && {
        name: 'Featurize',
        nodes: selectedProblem.tags.featurize,
        toggleNode: variableName => toggleTag(selectedProblem, 'featurize', variableName),
        color: tworavens.colors.featurize,
        opacity: 0.7,
        description: defaultGroupDescriptions.featurize,
        class_: 'item-featurize'
    },
    selectedProblem.modelingMode === "causal" && {
        name: 'Randomize',
        nodes: selectedProblem.tags.randomize,
        toggleNode: variableName => toggleTag(selectedProblem, 'randomize', variableName),
        color: tworavens.colors.randomize,
        opacity: 0.7,
        description: defaultGroupDescriptions.randomize,
        class_: 'item-randomize'
    },
    {
        name: 'Categorical',
        nodes: getCategoricalVariables(selectedProblem),
        toggleNode: variableName => toggleTag(selectedProblem, 'categorical', variableName),
        color: tworavens.colors.categorical,
        opacity: 0.7,
        description: defaultGroupDescriptions.categorical,
        class_: 'item-categorical'
    },
    {
        name: 'Boundary',
        nodes: selectedProblem.tags.boundary,
        toggleNode: variableName => toggleTag(selectedProblem, 'boundary', variableName),
        color: tworavens.colors.boundary,
        opacity: 0.7,
        description: defaultGroupDescriptions.boundary,
        class_: 'item-boundary'
    },
    {
        name: 'Geographic',
        nodes: getGeographicVariables(),
        color: tworavens.colors.geographic,
        opacity: 0.7,
        description: defaultGroupDescriptions.geographic,
        class_: 'item-geographic'
    },
    {
        name: 'Temporal',
        nodes: Object.keys(tworavens.variableSummaries)
            .filter(variable => tworavens.variableSummaries[variable].timeUnit),
        color: tworavens.colors.time,
        opacity: 0.7,
        description: defaultGroupDescriptions.temporal,
        class_: 'item-time'
    },
].filter(_ => _)

// appears when a user attempts to edit when the toggle is set
let firstSummaryMouseover = true;
export let summaryTour = () => ({
    id: "lock_toggle",
    i18n: {doneBtn: 'Ok'},
    showCloseButton: true,
    scrollDuration: 300,
    onEnd: () => firstSummaryMouseover = false,
    steps: [
        tworavens.step("leftpanel", "right", "Variable Summaries",
            `<p>A summary is shown for the pebble you are hovering over. Keep the variable summary open by clicking on its associated pebble.</p>`)
    ]
});

export let mutateNodes = problem => (state, context) => {
    let pebbles = Object.keys(context.nodes);

    // set radius of each node. Members of groups are scaled down if group gets large.
    pebbles.forEach(pebble => {
        let upperSize = 10;
        let maxNodeGroupSize = Math.max(...context.filtered.groups
            .filter(group => group.nodes.has(pebble))
            .map(group => group.nodes.size), upperSize);
        context.nodes[pebble].radius = state.defaultPebbleRadius * Math.sqrt(upperSize / maxNodeGroupSize);

        if (pebble === state.selectedPebble)
            context.nodes[pebble].radius = Math.min(context.nodes[pebble].radius * 1.5, state.defaultPebbleRadius);
    });

    // if no search string, match nothing
    // let matchedVariables = variableSearchText.length === 0 ? []
    //     : pebbles.filter(variable => variable.toLowerCase().includes(variableSearchText));

    // the order of the keys indicates precedence, lower keys are more important
    let params = new Map([
        ...problem.groups.map(group => [group.id, new Set(group.nodes)]),
        ['loose', new Set(problem.tags.loose)],
        ['transformed', new Set(problem.tags.transformed)],
        ['categorical', new Set(getCategoricalVariables(problem))],
        ['geographic', new Set(getGeographicVariables())],
        ['ordinal', new Set(getOrdinalVariables(problem))],
        ['boundary', new Set(problem.tags.boundary)],
        ['temporal', new Set(Object.keys(tworavens.variableSummaries)
            .filter(variable => tworavens.variableSummaries[variable].timeUnit))],
        ['weights', new Set(problem.tags.weights)],
        ['privileged', new Set(problem.tags.privileged)],
        ['exogenous', new Set(problem.tags.exogenous)],
        ['featurize', new Set(problem.tags.featurize)],
        ['randomize', new Set(problem.tags.randomize)],
        ['crossSection', new Set(problem.tags.crossSection)],
        ['indexes', new Set(problem.tags.indexes)],
            // ['matched', new Set(matchedVariables)],
    ]);

    let strokeWidths = Object.assign(
        problem.groups.reduce((out, group) =>
            Object.assign(out, {[group.id]: 4}), {}),
        {
            categorical: 4,
            ordinal: 4,
            crossSection: 4,
            boundary: 4,
            geographic: 4,
            temporal: 4,
            weights: 4,
            privileged: 4,
            exogenous: 4,
            featurize: 4,
            randomize: 4,
            indexes: 4,
            // matched: 4
        });

    let nodeColors = {
        categorical: common.colors.tagged,
        ordinal: common.colors.tagged,
        crossSection: common.colors.tagged,
        boundary: common.colors.tagged,
        geographic: common.colors.tagged,
        temporal: common.colors.tagged,
        weights: common.colors.tagged,
        privileged: common.colors.tagged,
        exogenous: common.colors.tagged,
        featurize: common.colors.tagged,
        randomize: common.colors.tagged,
        indexes: common.colors.tagged,
        // matched: common.colors.tagged,
        loose: common.colors.tagged,
    };

    let strokeColors = {
        categorical: tworavens.colors.categorical,
        ordinal: tworavens.colors.ordinal,
        crossSection: tworavens.colors.crossSection,
        boundary: tworavens.colors.boundary,
        geographic: tworavens.colors.location,
        temporal: tworavens.colors.time,
        weights: tworavens.colors.weight,
        privileged: tworavens.colors.privileged,
        exogenous: tworavens.colors.exogenous,
        featurize: tworavens.colors.featurize,
        randomize: tworavens.colors.randomize,
        indexes: tworavens.colors.index,
        // matched: tworavens.colors.matched
    };

    // set the base color of each node
    pebbles.forEach(pebble => {
        if (state.summaries[pebble] && state.summaries[pebble].pdfPlotType === 'collapsed') {
            context.nodes[pebble].strokeWidth = 0;
            context.nodes[pebble].nodeCol = 'transparent';
            context.nodes[pebble].strokeColor = 'transparent';
        } else {
            context.nodes[pebble].strokeWidth = 1;
            context.nodes[pebble].nodeCol = colors(generateID(pebble));
            context.nodes[pebble].strokeColor = 'transparent';
        }
    });

    // set additional styling for each node
    pebbles.forEach(pebble => params.keys()
        // only apply styles on classes the variable is a member of
        .filter(label => params.get(label).has(pebble))
        .forEach(label => {
            if (label in strokeWidths) context.nodes[pebble].strokeWidth = strokeWidths[label];
            if (label in nodeColors) context.nodes[pebble].nodeCol = nodeColors[label];
            if (label in strokeColors) context.nodes[pebble].strokeColor = strokeColors[label];
        }));
};

const syllableRegex = /[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi;
let truncateText = (text, length) => text.length <= length ? text : (text.match(syllableRegex) ?? [])
    .reduce((out, syll) => out + (out.length + syll.length <= length ? syll : ''), '')

export let forceDiagramLabels = problem => pebble => [
    {
        id: 'Group',
        name: 'Group',
        attrs: {fill: tworavens.colors.predictor},
        onclick: (e, pebble) => {
            forceDiagramState.setSelectedPebble(pebble);
            toggleGroup(problem, 'Loose', pebble);
        },
        children: [
            ...problem.groups.map(group => ({
                id: String(group.id).replace(/\W/g, '_'),
                name: truncateText(group.name, 8),
                title: group.name,
                attrs: {fill: group.color},
                onclick: (_, d) => {
                    toggleGroup(problem, group.nodes.includes(d) ? 'Loose' : group.id, d);
                    forceDiagramState.setSelectedPebble(d);
                    tworavens.resetPeek();
                }
            })),
            {
                id: 'Ordering',
                name: 'Order',
                title: 'Ordering',
                attrs: {fill: tworavens.colors.order},
                onclick: (_, d) => {
                    toggleGroup(problem, 'Ordering', d);
                    forceDiagramState.setSelectedPebble(d);
                }
            },
            problem.task === "forecasting" && {
                id: 'Cross',
                name: 'Cross',
                title: 'Cross-Sectional',
                attrs: {fill: tworavens.colors.crossSection},
                onclick: (_, d) => {
                    toggleGroup(problem, 'crossSection', d);
                    forceDiagramState.setSelectedPebble(d);
                }
            },
            {
                id: 'Location',
                name: 'Loc',
                title: 'Location',
                attrs: {fill: tworavens.colors.location},
                onclick: (_, d) => {
                    toggleGroup(problem, 'Location', d);
                    forceDiagramState.setSelectedPebble(d);
                }
            },
        ].filter(_ => _)
    },
    {
        id: 'Label',
        name: 'Label',
        attrs: {fill: tworavens.colors.categorical},
        onclick: (e, pebble) => {
            forceDiagramState.setSelectedPebble(pebble);
            app.alertLog("Labels are descriptors for individual variables.");
            m.redraw();
        },
        children: [
            // if cross-sectional, then it must be categorical
            !problem.tags.crossSection.includes(pebble) && {
                id: 'Categorical',
                name: 'Cat',
                title: 'Categorical',
                attrs: {fill: tworavens.colors.categorical},
                onclick: (_, d) => {
                    toggleTag(problem, 'categorical', d);
                    forceDiagramState.setSelectedPebble(d);
                }
            },
            {
                id: 'Ordinal',
                name: 'Ord',
                title: 'Ordinal',
                attrs: {fill: tworavens.colors.ordinal},
                onclick: (_, d) => {
                    toggleTag(problem, 'ordinal', d);
                    forceDiagramState.setSelectedPebble(d);
                }
            },
            problem.modelingMode !== "causal" && {
                id: 'Weight',
                name: 'Weight',
                attrs: {fill: tworavens.colors.weight},
                onclick: (_, d) => {
                    toggleTag(problem, 'weights', d);
                    forceDiagramState.setSelectedPebble(d);
                }
            },
            problem.modelingMode !== "causal" && problem.task === "forecasting" && {
                id: 'Exogenous',
                name: 'Exog',
                title: 'Exogenous',
                attrs: {fill: tworavens.colors.exogenous},
                onclick: (_, d) => {
                    toggleTag(problem, 'exogenous', d);
                    forceDiagramState.setSelectedPebble(d);
                }
            },
            problem.modelingMode === "causal" && {
                id: 'Randomize',
                name: 'Rand',
                title: 'Randomize',
                attrs: {fill: tworavens.colors.randomize},
                onclick: (_, d) => {
                    toggleTag(problem, 'randomize', d);
                    forceDiagramState.setSelectedPebble(d);
                }
            },
            problem.modelingMode === "causal" && {
                id: 'Featurize',
                name: 'Feat',
                title: 'Featurize',
                attrs: {fill: tworavens.colors.featurize},
                onclick: (_, d) => {
                    toggleTag(problem, 'featurize', d);
                    forceDiagramState.setSelectedPebble(d);
                }
            }
        ].filter(_ => _)
    }
].filter(_ => _);

export let toggleGroup = (problem, tag, name) => {
    if (problem.system === 'solved') {
        alertEditCopy();
        return;
    }

    delete problem.unedited;

    // behavioral logging
    let logParams = {
        feature_id: `TOGGLE_INCLUSION_IN_${String(tag).toUpperCase()}`,
        activity_l1: 'PROBLEM_DEFINITION',
        activity_l2: 'PROBLEM_SPECIFICATION',
        other: {variable: name, problem: problem.problemId}
    }

    if (tag === 'None') {
        // variable is completely removed from diagram
        problem.groups.forEach(group => remove(group.nodes, name))
        remove(problem.tags.loose, name);
        remove(problem.tags.ordering, name);
        remove(problem.tags.crossSection, name);
        logParams.feature_id = 'MODEL_REMOVE_VARIABLE';
    } else if (tag === "Ordering") {
        // if we are going to include in the ordering group
        if (!(problem.tags.ordering).includes(name)) {
            problem.groups.forEach(group => remove(group.nodes, name))
            remove(problem.tags.location, name);
            remove(problem.tags.boundary, name);
            remove(problem.tags.loose, name);
            remove(problem.tags.crossSection, name);
            add(problem.tags.ordering, name);
            if (problem.task !== 'forecasting')
                setTask('forecasting', problem)
        } else {
            remove(problem.tags.ordering, name);
            add(problem.tags.loose, name);
        }
        loadProblemPreprocess(problem)
            .then(tworavens.setPreprocess)
            .then(m.redraw)
    } else if (tag === "Loose") {
        // if we are going to include in the loose group
        if (!problem.tags.loose.includes(name)) {
            remove(problem.tags.ordering, name);
            remove(problem.tags.crossSection, name);
            problem.groups.forEach(group => remove(group.nodes, name))
        }
        toggle(problem.tags.loose, name);
    } else if (tag === "Location") {
        // if we are going to include in the location group
        if (!(problem.tags.location).includes(name)) {
            remove(problem.tags.ordering, name);
            remove(problem.tags.boundary, name);
            add(problem.tags.location, name);
        } else {
            remove(problem.tags.location, name);
        }
    } else if (tag === "Cross-Sectional" || tag === 'crossSection') {
        // if we are going to add to the cross sectional group
        if (!problem.tags.crossSection.includes(name)) {
            remove(problem.tags.weights, name);
            problem.groups.forEach(group => remove(group.nodes, name))
            remove(problem.tags.ordering, name);
            if (problem.task !== 'forecasting')
                setTask('forecasting', problem)
        }
        toggle(problem.tags.crossSection, name);
    } else {
        logParams.feature_id = `TOGGLE_INCLUSION_IN_${(problem.groups.find(group => group.id === tag)?.name ?? '?').toUpperCase()}`;
        // toggle inclusion in user-defined group, remove from all other groups
        problem.groups.forEach(group => (group.id === tag ? toggle : remove)(group.nodes, name))

        if (problem.groups.some(group => group.nodes.includes(name))) {
            // if in a user-defined group, remove from the special groups
            remove(problem.tags.loose, name);
            remove(problem.tags.ordering, name);
            remove(problem.tags.crossSection, name);
        } else {
            // if no longer in a user-defined group, add to loose
            add(problem.tags.loose, name)
        }
    }
    if ((problem.tags.ordering.length + problem.tags.crossSection.length === 0) && problem.task === 'forecasting')
        setTask('regression', problem)

    tworavens.saveSystemLogEntry(logParams);
}

/**
 * Toggle if a pebble name is present in a problem's tag set
 * @param problem
 * @param tag
 * @param name
 */
export let toggleTag = (problem, tag, name) => {
    if (problem.system === 'solved') {
        app.alertError(m('div', 'This problem already has solutions. Would you like to edit a copy of this problem instead?', m(Button, {
            style: 'margin:1em',
            onclick: () => {
                let problemCopy = getProblemCopy(problem);
                tworavens.workspace.ravenConfig.problems[problemCopy.problemId] = problemCopy;
                app.setShowModalAlerts(false);
                setSelectedProblem(problemCopy.problemId);
                toggleTag(problemCopy, tag, name);
            }
        }, 'Edit Copy')));
        m.redraw();
        return;
    }

    delete problem.unedited;

    // behavioral logging
    let logParams = {
        feature_id: 'blank',
        activity_l1: 'PROBLEM_DEFINITION',
        activity_l2: 'PROBLEM_SPECIFICATION',
        other: {variable: name, problem: problem.problemId}
    }


    // LABELS
    if (tag === 'categorical') {
        // if we are going to add the tag
        if (!getCategoricalVariables(problem).includes(name)) {
            if (tworavens.variableSummaries[name].numchar === 'character') {
                app.alertLog(`Cannot interpret "${name}" as non-categorical, because the column is character-based. Use a manipulation to parse the strings.`);
                return;
            }
            add(problem.tags.categorical, name);
            remove(problem.tags.ordinal, name);
            remove(problem.tags.boundary, name);
            remove(problem.tags.location, name);
            remove(problem.tags.weights, name);
        }
        // we are going to remove
        else {
            // if the tag is at the dataset level
            if (tworavens.variableSummaries[name].nature === 'nominal') {
                if (confirm("Do you want to remove the dataset-level categorical annotation?")) {
                    tworavens.setVariableSummaryAttr(name, 'nature', 'nominal')
                }
            } else {
                remove(problem.tags.crossSection, name);

                remove(problem.tags.categorical, name);
            }
        }
        loadProblemPreprocess(problem)
            .then(tworavens.setPreprocess)
            .then(m.redraw)
    }

    else if (tag === "ordinal") {
        remove(problem.tags.categorical, name);
        if (getCategoricalVariables(problem).includes(name)) {
            if (confirm("Ordinal variables must be orderable. Would you like to define an ordering?")) {
                let pipeline = [...tworavens.workspace.ravenConfig.hardManipulations, problem.manipulations];
                let step = {
                    type: 'transform',
                    id: 'transform ' + pipeline.length,
                    transforms: [],
                    expansions: [],
                    binnings: [],
                    manual: []
                }
                problem.manipulations.push(step);
                pipeline.push(step);

                manipulate.setConstraintMenu({type: 'transform', pipeline, step})
                    .then(() => manipulate.setConstraintPreferences({
                        menus: {
                            "Binning": {},
                            "Equation": {},
                            "Expansion": {},
                            "Manual": {
                                "indicatorKeys": [],
                                "userValues": [],
                                "variableName": name,
                                "variableNameError": false,
                                "variableType": "Numeric",
                                "variableDefault": -1
                            }
                        },
                        "type": "Manual"
                    }))
                    // HACK: wait for .select to be applied to the preferences object
                    .then(m.redraw)
                    .then(() => new Promise(resolve => setTimeout(() => resolve(), 1000)))
                    .then(() => manipulate.constraintPreferences.select(name))
            }
        } else {
            remove(problem.tags.boundary, name);
            remove(problem.tags.location, name);

            toggle(problem.tags.ordinal, name)
        }
    }

    else if (tag === 'boundary') {
        if (!problem.tags.boundary.includes(name)) {
            remove(problem.tags.location, name);
            remove(problem.tags.ordering, name);
            remove(problem.tags.weights, name);
            remove(problem.tags.indexes, name);
            add(problem.tags.categorical, name);
        }
        toggle(problem.tags.boundary, name);
    }

    else if (tag === 'weights') {
        if (tworavens.variableSummaries[name].numchar === 'character') {
            app.alertLog(`Cannot label column "${name}" to weight, because the column is character-based.`);
            return;
        }
        if (!problem.tags.weights.includes(name)) {
            if (getCategoricalVariables(problem).includes(name)) toggleTag(problem, 'categorical', name);
            remove(problem.tags.crossSection, name);
            remove(problem.tags.boundary, name);
            remove(problem.tags.indexes, name);
        }
        if (problem.tags.weights.includes(name))
            problem.tags.weights = [];
        else
            problem.tags.weights = [name];
    }

    else if (tag === 'privileged') {
        if (!problem.tags.privileged.includes(name)) {
            remove(problem.tags.indexes, name);
        }
        toggle(problem.tags.privileged, name);
    }
    else if (tag === 'exogenous') {
        if (!problem.tags.exogenous.includes(name)) {
            remove(problem.tags.indexes, name);
        }
        toggle(problem.tags.exogenous, name);
    }

    else if (tag === 'indexes') {
        if (!problem.tags.indexes.includes(name)) {
            remove(problem.tags.boundary, name);
            remove(problem.tags.location, name);
            remove(problem.tags.weights, name);
            remove(problem.tags.ordering, name);
        }
        if (problem.tags.indexes.includes(name))
            problem.tags.indexes = [];
        else
            problem.tags.indexes = [name];
    }
    else if (tag === 'featurize') {
        if (!problem.tags.featurize.includes(name)) {
            remove(problem.tags.indexes, name);
        }
        toggle(problem.tags.featurize, name);
    }
    else if (tag === 'randomize') {
        if (!problem.tags.randomize.includes(name)) {
            remove(problem.tags.indexes, name);
        }
        toggle(problem.tags.randomize, name);
    }
    tworavens.resetPeek()
    tworavens.saveSystemLogEntry(logParams);
};

// Used for left panel variable search
export let variableSearchText = "";
export let setVariableSearchText = text => variableSearchText = (text ?? '').toLowerCase();


// creates a new problem from the force diagram problem space and adds to disco
export async function addProblemFromForceDiagram() {
    let problemCopy = getProblemCopy(getSelectedProblem());
    tworavens.workspace.ravenConfig.problems[problemCopy.problemId] = problemCopy;

    setSelectedProblem(problemCopy.problemId);
    tworavens.setLeftTab('Problems');
    m.redraw();
}

export function connectAllForceDiagram() {
    let problem = getSelectedProblem();

    let targets = getTargetVariables(problem);
    problem.pebbleLinks = getPredictorVariables(problem)
        .flatMap(source => targets.map(target => ({source, target, right: true})))
    m.redraw();
}

let D3M_problemDoc = problem => ({
    data: {
        "problemId": problem.problemId,
        "problemName": "NULL",
        "taskType": problem.taskType,
        "taskSubType": problem.taskSubType,
        "problemVersion": "2.0",
        "problemSchemaVersion": "3.2.0"
    },
    inputs: {
        data: {
            "datasetID": tworavens.workspace.datasetDoc.about.datasetID,
            "targets": getTargetVariables(problem).map((target, i) => ({
                targetIndex: i,
                resID: problem.resourceId,
                colIndex: Object.keys(tworavens.variableSummaries).indexOf(target),
                colName: target
            }))
        },
        dataSplits: Object.entries({
            method: problem.scoreOptions.evaluationMethod,
            testSize: problem.scoreOptions.trainTestRatio,
            stratified: problem.scoreOptions.stratified,
            shuffle: problem.scoreOptions.shuffle,
            randomSeed: problem.scoreOptions.randomSeed,
            splitsFile: problem.scoreOptions.splitsFile
        })
            // remove keys with undefined values
            .filter(entry => entry[1] !== undefined)
            .reduce((out, entry) => Object.assign(out, {[entry[0]]: entry[1]}), {}),
        performanceMetrics: [problem.metric, ...problem.metrics].map(metric => ({metric})),
    },
    expectedOutputs: {
        predictionsFile: 'predictions.csv'
    }
});


let alertEditCopy = () => {
    let selectedProblem = getSelectedProblem();
    let problemName = selectedProblem?.name || selectedProblem.problemId;
    app.alertError(m('div', italicize(problemName), ` is immutable because it already has solutions.`, m(Button, {
        style: 'margin-left:1em',
        onclick: () => {
            let problemCopy = getProblemCopy(selectedProblem);
            delete problemCopy.pending;
            tworavens.workspace.ravenConfig.problems[problemCopy.problemId] = problemCopy;
            app.setShowModalAlerts(false);
            setSelectedProblem(problemCopy.problemId);
        }
    }, `create new editable child of ${problemName} `, m(Icon, {name: 'git-branch'}))))
    m.redraw();
}
