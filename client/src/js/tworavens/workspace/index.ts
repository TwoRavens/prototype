import * as app from "../../app";
import * as tworavens from "../tworavens";
import * as m from "mithril";
import {Auth} from "../../shared/account";
import {workspace} from "../tworavens";
import {getAbstractPipeline, getSelectedProblem} from "../problem";
import * as model from "./model/index";
import * as common from "../../shared/components/common";
import * as manipulate from "../../shared/manipulations/manipulate";
import * as dataset from "./dataset/index";
import * as explore from "./explore/index";
import * as results from "./results/index";
import Icon from "../../shared/components/views/Icon";
import ButtonRadio from "../../shared/components/views/ButtonRadio";
import Dropdown from "../../shared/components/views/Dropdown";
import Header from "../../shared/components/views/Header";
import Table from "../../shared/components/views/Table";
import Footer from "../../shared/components/views/Footer";
import Button from "../../shared/components/views/Button";
import ButtonPlain from "../../shared/components/views/ButtonPlain";
import Popper from "../../shared/components/views/Popper";
import {QueryTracker} from "../../shared/components-contrib/QueryTracker";

import * as utils from "../../shared/utils";
import hopscotch from 'hopscotch';
import ModalWorkspace from "../../shared/components-contrib/ModalWorkspace";
import ModalVanilla from "../../shared/components/views/ModalVanilla";
import Modal from "../../shared/components/views/Modal";
import {italicize} from "../../shared/utils";
import TextField from "../../shared/components/views/TextField";
import {ProblemList} from "../../shared/components-contrib/ProblemList";


export default class WorkspacePage {
    private previousMode: any;

    oninit() {
        tworavens.setRightTab('Problem');
        tworavens.setSelectedMode('workspace');
        m.route.set('/workspace');
    }

    onupdate(vnode) {
        this.previousMode = vnode.attrs.mode;
    }

    oncreate() {tworavens.load();}

    view(vnode) {

        let {mode, exploreMode, vars} = vnode.attrs;
        // after calling m.route.set, the params for mode, variate, vars don't update in the first redraw.
        // checking window.location.href is a workaround, permits changing mode from url bar
        if (window.location.href.includes(mode) && mode !== tworavens.selectedMode)
            tworavens.setSelectedMode(mode);

        let exploreVariables = (vars ? vars.split('/') : [])
            .map(decodeURIComponent)
            .filter(variable => variable in tworavens.variableSummaries);

        let overflow = tworavens.isExploreMode ? 'auto' : 'hidden';

        let selectedProblem = getSelectedProblem();

        let drawForceDiagram = (tworavens.isModelMode || tworavens.isExploreMode) && selectedProblem && Object.keys(tworavens.variableSummaries).length > 0;
        let forceData = drawForceDiagram && model.buildForceData(selectedProblem);

        let backgroundColor = tworavens.swandive ? 'grey'
            : tworavens.isExploreMode ? {"light": '#ffffff', "dark": "#474747"}[common.theme]
                : common.colors.base;

        return m('main',

            this.constructModals(),
            this.header(),
            this.footer(),
            tworavens.workspace && WorkspacePage.leftpanel(tworavens.selectedMode, forceData),
            tworavens.workspace && WorkspacePage.rightpanel(tworavens.selectedMode),
            tworavens.workspace && manipulate.constraintMenu && WorkspacePage.manipulations(),
            tworavens.peekInlineShown && this.peekTable(),


            m(`#main`, {
                    style: {
                        overflow,
                        top: common.heightHeader,
                        height: `calc(100% - ${common.heightHeader} - ${common.heightFooter})`,
                        bottom: common.heightFooter,
                        display: (tworavens.rightTab === 'Manipulate' && manipulate.constraintMenu) ? 'none' : 'block',
                        'background-color': backgroundColor,
                        color: common.colors.text
                    }
                },

                m('div', {
                        style: {width: '100%', height: '100%', position: 'relative'},
                    },
                    tworavens.isDatasetMode && m(MainCarousel, {previousMode: this.previousMode}, m(dataset.CanvasDataset, {})),
                    tworavens.isResultsMode && m(MainCarousel, {previousMode: this.previousMode}, m(results.CanvasSolutions, {problem: selectedProblem})),
                    tworavens.isExploreMode && m(MainCarousel, {previousMode: this.previousMode}, m(explore.CanvasExplore, {variables: exploreVariables, exploreMode})),
                    tworavens.isModelMode && m(MainCarousel, {previousMode: this.previousMode}, m(model.CanvasModel, {drawForceDiagram, forceData}))
                )
            )
        );
    }

    header() {
        let userlinks = Auth.email === '' ? [
            // {title: "Log in", url: login_url, newWin: false},
            // {title: "Sign up", url: signup_url, newWin: false}
        ] : [
            //{title: [m('span', {}, "Workspaces "), m(Icon, {name: 'link-external'})], url: workspaces_url, newWin: true},
            // {title: [m('span', {}, "Settings "), m(Icon, {name: 'link-external'})], url: settings_url, newWin: true},
            // {title: [m('span', {}, "Links "), m(Icon, {name: 'link-external'})], url: devlinks_url, newWin: true},
            // {title: [m('span', {}, "Behavioral Logs "), m(Icon, {name: 'link-external'})], url: behavioral_log_url, newWin: true},
            // {title: [m('span', {}, "Reset "), m(Icon, {name: 'alert'})], url: clear_user_workspaces_url, newWin: false},
            // {title: [m('span', {}, "Switch Datasets"), m(Icon, {name: 'alert'})], url: switch_dataset_url, newWin: false},
            // {title: "Logout", url: logout_url, newWin: false}
        ];

        let openUserLink = linkInfo =>
            linkInfo.newWin === true ? window.open(linkInfo.url) : window.location.href = linkInfo.url;

        let selectedProblem = getSelectedProblem();

        let createBreadcrumb = () => {
            let path = [
                m('h4#dataName', {
                        style: {display: 'inline-block', margin: '.25em 1em'},
                        onclick: () => {
                            tworavens.setSelectedMode('dataset')
                        }
                    },
                    tworavens.workspace.name || 'Dataset Name', m('br'),
                    tworavens.workspace.name !== tworavens.workspace.name && m('div', {
                        style: {
                            'font-style': 'italic', float: 'right', 'font-size': '14px',
                        }
                    }, `workspace: ${tworavens.workspace.name}`)
                )
            ];

            if (selectedProblem) path.push(
                m(Icon, {name: 'chevron-right'}),
                m('h4[style=display: inline-block; margin: .25em 1em]', {
                    onclick: () => {
                        tworavens.setSelectedMode('model');
                    }
                }, m.trust(selectedProblem?.name || selectedProblem.problemId)));

            let selectedSolutions = results.getSelectedSolutions(selectedProblem);
            if (tworavens.isResultsMode && selectedSolutions.length === 1 && selectedSolutions[0]) {
                path.push(
                    m(Icon, {name: 'chevron-right'}),
                    m('h4[style=display: inline-block; margin: .25em 1em]',
                        'solution ' + results.getSolutionAdapter(selectedProblem, selectedSolutions[0]).getSolutionId()))
            }

            return path;
        };

        return m(Header, {
                image: '/TwoRavens.png',
                aboutText: 'TwoRavens v0.2 "Marina del Ray" -- ' +
                    'The Norse god Odin had two talking ravens as advisors, who would fly out into the world and report back all they observed. ' +
                    'In the Norse, their names were "Thought" and "Memory". ' +
                    'In our coming release, our thought-raven automatically advises on statistical model selection, ' +
                    'while our memory-raven accumulates previous statistical models from Dataverse, to provide cumulative guidance and meta-analysis.',
                attrsInterface: {style: tworavens.isExploreMode && common.theme === "light" ? {'background-image': '-webkit-linear-gradient(top, #fff 0, rgb(227, 242, 254) 100%)'} : {}}
            },
            m('div', {style: {'flex-grow': 1}}),

            tworavens.workspace && createBreadcrumb(),

            m('div', {style: {'flex-grow': 1}}),

            m(ButtonRadio, {
                id: 'modeButtonBar',
                attrsAll: {style: {margin: '0px 1em', width: 'auto'}, class: 'navbar-left'},
                attrsButtons: {
                    // class: 'btn-sm',
                    style: {width: "auto"}},
                onclick: tworavens.setSelectedMode,
                activeSection: tworavens.selectedMode || 'model',
                sections: [
                    {value: 'Dataset'},
                    {value: 'Model'},
                    {value: 'Explore'},
                    {value: 'Results'}
                ],

                // attrsButtons: {class: ['btn-sm']}, // if you'd like small buttons (btn-sm should be applied to individual buttons, not the entire component)
                // attrsButtons: {style: {width: 'auto'}}
            }),

            m(Dropdown, {
                id: 'loginDropdown',
                items: userlinks.map(link => link.title),
                activeItem: Auth.email,
                onclickChild: child => openUserLink(userlinks.find(link => link.title === child))
            })

        );
    }

    peekTable() {
        let selectedProblem = getSelectedProblem();
        if (!selectedProblem) return;

        let abstractQuery = tworavens.isModelMode
            ? getAbstractPipeline(selectedProblem)
            : [...tworavens.workspace.ravenConfig.hardManipulations];
        if (tworavens.peekInlineShown && !tworavens.peekData && !tworavens.peekIsExhausted) tworavens.resetPeek(abstractQuery);

        return m('div#previewTable', {
                style: {
                    "position": "fixed",
                    "bottom": common.heightFooter,
                    "height": tworavens.peekInlineHeight,
                    "width": "100%",
                    "border-top": "1px solid #ADADAD",
                    "overflow-y": "scroll",
                    "overflow-x": "auto",
                    'z-index': 100,
                    'background': {'light': 'rgba(255,255,255,.8)', 'dark': 'rgba(115,115,115,0.8)'}[common.theme]
                },
                onscroll: () => {
                    // don't apply infinite scrolling when list is empty
                    if ((tworavens.peekData || []).length === 0) return;

                    let container = document.querySelector<HTMLElement>('#previewTable');
                    let scrollHeight = container.scrollHeight - container.scrollTop;
                    if (scrollHeight < container.offsetHeight + 100) tworavens.updatePeek(abstractQuery);
                }
            },
            m('#horizontalDrag', {
                style: {
                    position: 'absolute',
                    top: '-4px',
                    left: 0,
                    right: 0,
                    height: '12px',
                    cursor: 'h-resize',
                    'z-index': 1000
                },
                onmousedown: (e) => {
                    tworavens.setPeekInlineIsResizing(true);
                    document.body.classList.add('no-select');
                    tworavens.peekMouseMove(e);
                }
            }),
            m(Table, {
                id: 'previewTable',
                data: tworavens.peekData || []
            })
        );
    }

    footer() {

        return m(Footer, {style: {'z-index': 100}},[
            m('div.btn-group[style=margin:5px;padding:0px]',
                m(Button, {id: 'btnTA2', class: 'btn-sm', onclick: _ => hopscotch.startTour(tworavens.initialTour(), 0)}, 'Help Tour ', m(Icon, {name: 'milestone'})),
                m(Button, {id: 'btnTA2', class: 'btn-sm', onclick: _ => tworavens.helpmaterials('video')}, 'Video ', m(Icon, {name: 'file-media'})),
                m(Button, {id: 'btnTA2', class: 'btn-sm', onclick: _ => tworavens.helpmaterials('manual')}, 'Manual ', m(Icon, {name: 'file-pdf'})),
                m(Button, {
                        id: 'btnAPIInfoWindow',
                        class: `btn-sm ${tworavens.isAPIInfoWindowOpen ? 'active' : ''}`,
                        onclick: _ => {
                            tworavens.setAPIInfoWindowOpen(true);
                            m.redraw();
                        },
                    },
                    `Basic Info (id: ${tworavens.getCurrentWorkspaceId()})`
                )
            ),
            tworavens.workspace && m('div.btn-group[style=margin:5px;padding:0px]',
                !tworavens.workspace.is_original_workspace && m(ButtonPlain, {
                        id: 'btnSaveWorkspace',
                        class: `btn-sm btn-secondary ${tworavens.saveCurrentWorkspaceWindowOpen ? 'active' : ''}`,
                        onclick: tworavens.saveUserWorkspace
                    },
                    'Save '),

                m(ButtonPlain, {
                        id: 'btnSaveAsNewWorkspace',
                        // 'aria-pressed': `${tworavens.isSaveNameModelOpen ? 'true' : 'false'}`,
                        class: `btn-sm btn-secondary ${tworavens.showModalSaveName ? 'active' : ''}`,
                        onclick: _ => tworavens.setShowModalSaveName(true)
                    },
                    'Save As New ',
                ),
                m(ButtonPlain, {
                        id: 'btnLoadWorkspace',
                        // 'aria-pressed': `${tworavens.isSaveNameModelOpen ? 'true' : 'false'}`,
                        class: `btn-sm btn-secondary ${tworavens.showModalWorkspace? 'active' : ''}`,
                        onclick: () => tworavens.setShowModalWorkspace(true)
                    },
                    'Load',
                )
            ),
            m(Button, {
                style: {'margin': '8px'},
                title: 'alerts',
                class: 'btn-sm',
                onclick: () => app.setShowModalAlerts(true)
            }, m(Icon, {name: 'bell', style: `color: ${app.alerts.length > 0 && app.alerts[0].time > app.alertsLastViewed ? common.colors.selVar : '#818181'}`})),
            m(Button, {
                style: {'margin': '8px'},
                title: 'alerts',
                class: 'btn-sm'
            }, m(Popper, {
                content: () => m(QueryTracker)
            }, m(Icon, {name: 'clock'}))),

            [
                // m(Button, {
                //     style: {'margin': '8px'},
                //     title: 'ta2 debugger',
                //     class: 'btn-sm',
                //     onclick: () => tworavens.setShowModalTA2Debug(true)
                // }, m(Icon, {name: 'bug'})),

                // tworavens.isResultsMode && m(Button, {
                //     style: {'margin': '8px'},
                //     title: 'ta2 stop searches',
                //     class: 'btn-sm',
                //     onclick: () => {
                //         solverD3M.endAllSearches();
                //         solverD3M.stopAllSearches();
                //         // solverD3M.endsession();
                //         // solverD3M.handleENDGetSearchSolutionsResults();
                //     }
                // }, m(Icon, {name: 'stop'}))
            ],

            // m("span", {"class": "footer-info-break"}, "|"),
            // m("a", {"href" : "/dev-raven-links", "target": "=_blank"}, "raven-links"),
            tworavens.peekInlineShown && utils.italicize(tworavens.peekLabel),

            m('div.btn-group', {style: 'float: right; padding: 0px;margin:5px;margin-top:7px'},


                m(Button, {
                    class: 'btn-sm',
                    onclick: () => tworavens.setShowModalDownload(true)
                }, 'Download'),
                m(Button, {
                    class: 'btn-sm' + (tworavens.peekInlineShown ? ' active' : ''),
                    onclick: () => tworavens.setPeekInlineShown(!tworavens.peekInlineShown)
                }, 'Peek'),
                m(Button,{
                    onclick: () => window.open('#!/data', 'data') && tworavens.logEntryPeekUsed(true),
                    class: 'btn-sm'
                }, m(Icon, {name: 'link-external'}))),
            manipulate.totalSubsetRecords !== undefined && m("span.badge.badge-pill.badge-secondary#recordCount", {
                style: {
                    float: 'right',
                    "margin-left": "5px",
                    "margin-top": "1.4em",
                    "margin-right": "2em"
                }
            }, manipulate.totalSubsetRecords + ' Records')
        ]);
    }

    /*
     * Start: Construct potential modal boxes for the page.
     */
    constructModals() {
        let modals = [
            m(Modal),
            this.modalSaveCurrentWorkspace(),
            tworavens.showModalWorkspace && m(ModalWorkspace, {
                    workspace: tworavens.workspace,
                    setDisplay: tworavens.setShowModalWorkspace,
                    loadWorkspace: tworavens.loadWorkspace
                }
            ),

            results.showFinalPipelineModal && results.finalPipelineModal(),

            tworavens.showModalDownload && m(ModalVanilla, {
                    id: 'downloadModal',
                    setDisplay: tworavens.setShowModalDownload
                },
                m('h4', 'Downloads'),

                m(Table, {
                    data: [
                        [
                            'Original Dataset',
                            m(Button, {
                                class: 'btn-sm',
                                onclick: () => tworavens.downloadFile(tworavens.workspace.datasetPath)
                            }, 'Download'),
                            italicize('Retrieve the original, raw file. No alterations applied.')
                        ],
                        manipulate.constraintMenu && [
                            'Peek Dataset',
                            m(Button, {
                                class: 'btn-sm',
                                onclick: async () => {
                                    let problem = getSelectedProblem();
                                    let datasetUrl = await tworavens.buildCsvPath(problem, manipulate.constraintMenu.step);
                                    if (!datasetUrl) app.alertWarn('Unable to prepare dataset for download.');
                                    tworavens.downloadFile(datasetUrl)
                                }
                            }, 'Download'),
                            italicize('Retrieve full dataset currently shown in Peek. Peek shows data at intermediate manipulation stages.')
                        ],
                        [
                            'Modeling Dataset',
                            m(Button, {
                                class: 'btn-sm',
                                onclick: async () => {
                                    let problem = getSelectedProblem();
                                    let datasetUrl = await tworavens.buildCsvPath(problem);
                                    if (!datasetUrl) app.alertWarn('Unable to prepare dataset for download.');
                                    tworavens.downloadFile(datasetUrl);
                                }
                            }, 'Download'),
                            italicize('Retrieve the dataset used for modeling, with casting, manipulations and column drops applied.')
                        ]
                    ]
                })),
            /*
             * Alerts modal.  Displays the list of alerts, if any.
             */
            app.showModalAlerts && m(ModalVanilla, {
                id: 'alertsModal',
                setDisplay: () => {
                    app.alertsLastViewed.setTime(new Date().getTime());
                    app.setShowModalAlerts(false)
                }
            }, [
                m('h4[style=width:3em;display:inline-block;margin-right:.25em]', 'Alerts'),
                app.alerts.length > 0 && m(Button, {
                    title: 'Clear Alerts',
                    style: {display: 'inline-block', 'margin-right': '0.75em'},
                    onclick: () => app.alerts.length = 0,
                    disabled: app.alerts.length === 0
                }, m(Icon, {name: 'check'})),
                app.alerts.length === 0 && italicize('No alerts recorded.'),
                app.alerts.length > 0 && m(Table, {
                    data: [...app.alerts].reverse().map(alert => [
                        alert.time > app.alertsLastViewed && m(Icon, {name: 'primitive-dot'}),
                        m(`div[style=white-space:nowrap;text-align:center;padding:.2em .7em;border-radius:1em;background:${utils.hexToRgba({
                            'log': common.colors.menu,
                            'warn': common.colors.warn,
                            'error': common.colors.error
                        }[alert.type], .5)}]`, alert.time.toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3")),
                        alert.description
                    ]),
                    style: {'margin-top': '1em'},
                    tableTags: m('colgroup',
                        m('col', {span: 1, width: '10px'}),
                        m('col', {span: 1, width: '75px'}),
                        m('col', {span: 1}))
                })
            ]),

            // Show basic API and Workspace Info
            this.modalBasicInfo(),

            /*
             * Save as new workspace modal.
             *  - prompt user for new workspace name
             */
            tworavens.showModalSaveName && m(ModalVanilla, {
                    id: "modalNewWorkspacename",
                    setDisplay: () => {
                        tworavens.setShowModalSaveName(false);
                    },
                },
                m('div', {'class': 'row'},
                    m('div', {'class': 'col-sm'},

                        m('h3', tworavens.workspace.is_original_workspace
                            ? 'Save Workspace.' : 'Save as a New Workspace.'),

                        m('p', {}, 'Please enter a workspace name.'),

                        m('p', {},
                            m('b', '- Current workspace name: '),
                            m('span', `"${tworavens.getCurrentWorkspaceName()}"`),
                            m('span', ` (id: ${tworavens.getCurrentWorkspaceId()})`),
                        ),

                        // Text field to enter new workspace name
                        m(TextField, {
                            id: 'newNameModal',
                            placeholder: 'New Workspace Name',
                            oninput: tworavens.setNewWorkspaceName,
                            onblur: tworavens.setNewWorkspaceName,
                            value: tworavens.newWorkspaceName
                        }),

                        // Display user messages
                        m('div', {
                                id: 'newNameMessage',
                                style: 'padding:20px 0;'
                            },
                            m('p', {class: "lead"}, tworavens.newWorkspaceMessage)
                        ),
                        // Close Button Row - used if save is successful
                        tworavens.displayCloseButtonRow && m('div', {
                                id: 'rowCloseModalButton',
                                class: 'row',
                            },
                            m('div', {'class': 'col-sm'},
                                // Close
                                m(ButtonPlain, {
                                    id: 'btnRowCloseModalButton',
                                    class: 'btn-sm btn-primary',
                                    onclick: _ => tworavens.setShowModalSaveName(false)
                                }, 'Close'))
                        ),


                        // Button Row
                        tworavens.displaySaveNameButtonRow && m('div', {
                                id: 'rowSaveWorkspaceButtons',
                                class: 'row',
                            },
                            m('div', {'class': 'col-sm'},

                                // Cancel button
                                m(ButtonPlain, {
                                    id: 'btnModalCancelSaveAsNewWorkspace',
                                    class: 'btn-sm btn-secondary',
                                    style: 'margin-right: 15px;',
                                    onclick: _ => {
                                        tworavens.setNewWorkspaceName('');
                                        tworavens.setShowModalSaveName(false);
                                    },
                                }, 'Cancel'),

                                // Save Button
                                m(ButtonPlain, {
                                    id: 'btnModalSaveAsNewWorkspace',
                                    class: 'btn-sm btn-primary',
                                    onclick: _ => {
                                        // console.log('save clicked...');

                                        // clear any error messages
                                        tworavens.setNewWorkspaceMessageSuccess('Attempting to save...')

                                        // attempt to save the name
                                        tworavens.saveAsNewWorkspace();
                                    },
                                }, 'Save'),
                            )
                        )
                        /*
                         * END: Save as new workspace modal.
                         */
                    ),
                )
            ),
        ]

        if (tworavens.showModalProblems) modals.push(m(ModalVanilla, {
            id: 'problemsModal',
            setDisplay: tworavens.setShowModalProblems
        }, m(ProblemList, {
            problems: workspace.ravenConfig.problems
        })))
        return modals;
    }

    /*
     * Show basic API and Workspace Info
     */
    modalBasicInfo(){

        return tworavens.isAPIInfoWindowOpen && m(ModalVanilla, {
                id: "modalAPIInfo",
                setDisplay: () => {
                    tworavens.setAPIInfoWindowOpen(false);
                },
            },
            // Row 1 - info
            m('div', {'class': 'row'},
                m('div', {'class': 'col-sm'},
                    [
                        m('h3', {}, 'Basic Information'),
                        m('hr'),
                        m('p', [
                            m('b', 'Workspace Id: '),
                            m('span', tworavens.getCurrentWorkspaceId())
                        ]),
                        m('p', [
                            m('b', 'Workspace Name: '),
                            m('span', tworavens.getCurrentWorkspaceName())
                        ]),
                        m('p', [
                            m('b', 'DOCKER_BUILD_TIMESTAMP: '),
                            m('span', `${process.env.DOCKER_BUILD_TIMESTAMP}`),
                        ]),
                        m('hr'),
                        m('p', [
                            m('b', 'TA2_D3M_SOLVER_ENABLED: '),
                            m('span', `${process.env.TA2_D3M_SOLVER_ENABLED}`),
                        ]),
                        m('p', [
                            m('b', 'TA2_WRAPPED_SOLVERS: '),
                            m('span', `${process.env.TA2_WRAPPED_SOLVERS}`),
                        ]),
                        m('hr'),
                        m('p', [
                            m('b', 'DATA_UPLOAD_MAX_MEMORY_SIZE: '),
                            m('span', `${process.env.DATA_UPLOAD_MAX_MEMORY_SIZE}`),
                        ]),
                        m('p', [
                            m('b', 'NGINX_MAX_UPLOAD_SIZE: '),
                            m('span', `${process.env.NGINX_MAX_UPLOAD_SIZE}`),
                        ]),
                        m('hr'),
                        m('p', [
                            m('b', 'tworavens.workspace.datasetUrl: '),
                            m('span', `${tworavens.workspace.datasetPath}`)
                        ]),
                        m('hr'),
                        m('div', [
                            m('b', 'Workspace: '),
                            m('div',
                                m('pre', `${JSON.stringify(tworavens.workspace, null, 4)}`)
                            ),
                        ]),
                        m('hr'),
                    ]
                ),
            ),
            // Row 2 - info
            m('div', {'class': 'row'},
                m('div', {'class': 'col-sm text-left'},
                    // Close
                    m(ButtonPlain, {
                            id: 'btnInfoCloseModalButton',
                            class: 'btn-sm btn-primary',
                            onclick: _ => {
                                tworavens.setAPIInfoWindowOpen(false);},
                        },
                        'Close'),
                )
            )
        )
    } // end: modalBasicInfo

    /*
     * Save current workspace modal.
     */
    modalSaveCurrentWorkspace(){

        return tworavens.saveCurrentWorkspaceWindowOpen && m(ModalVanilla, {
                id: "modalCurrentWorkspaceMessage",
                setDisplay: () => {
                    tworavens.setSaveCurrentWorkspaceWindowOpen(false);
                },
            },
            m('div', {'class': 'row'},
                m('div', {'class': 'col-sm'},
                    [
                        m('h3', {}, 'Save Current Workspace'),
                        m('hr'),
                        m('p', {},
                            m('b', '- Current workspace name: '),
                            m('span', `"${tworavens.getCurrentWorkspaceName()}"`),
                            m('span', ` (id: ${tworavens.getCurrentWorkspaceId()})`),
                        ),

                        // Display user messages
                        m('div', {
                                id: 'divSaveCurrentMessage',
                                style: 'padding:20px 0;'
                            },
                            m('p', {class: "lead"}, tworavens.getCurrentWorkspaceMessage())
                        ),
                        m('hr'),
                    ]
                )
            ),
            // Close Button Row
            m('div', {
                    id: 'rowCloseModalButton',
                    class: 'row',
                },
                m('div', {'class': 'col-sm'},
                    // Close
                    m(ButtonPlain, {
                            id: 'btnRowCloseModalButton',
                            class: 'btn-sm btn-primary',
                            onclick: _ => {
                                tworavens.setSaveCurrentWorkspaceWindowOpen(false);},
                        },
                        'Close'),
                )
            ),
        );
        /*
         * END: Save current workspace modal.
         */

    }

    /*
     * End: Construct potential modal boxes for the page.
     */

    static leftpanel(mode, forceData) {
        if (mode === 'dataset')
            return manipulate.leftpanel();
        if (mode === 'model')
            return model.leftpanel(forceData);
        if (['results', 'explore'].includes(mode) && manipulate.constraintMenu)
            return manipulate.leftpanel()
        if (mode === 'results')
            return results.leftpanel();
    }

    static rightpanel(mode) {
        if (mode === 'model') return model.rightpanel();
    }

    static manipulations() {
        let selectedProblem = getSelectedProblem();
        return (tworavens.isDatasetMode || (tworavens.isModelMode && tworavens.rightTab === 'Manipulate') || tworavens.isResultsMode || tworavens.isExploreMode)
            && manipulate.menu(tworavens.isResultsMode
                ? [...getAbstractPipeline(selectedProblem), ...results.resultsQuery]
                : [
                    ...tworavens.workspace.ravenConfig.hardManipulations,
                    ...(tworavens.isModelMode ? selectedProblem.manipulations : [])
                ])
    }
}


class MainCarousel {
    private modeOrder: any;
    oninit(){
        this.modeOrder = ['dataset', 'model', 'explore', 'results']
    }
    // NOTE: onbeforeremove must be leaky, because the state is not updated before passing
    onbeforeremove(vnode) {
        vnode.dom.classList.add(
            this.modeOrder.indexOf(vnode.attrs.previousMode) < this.modeOrder.indexOf(tworavens.selectedMode)
                ? 'exit-left' : 'exit-right');
        return new Promise(function (resolve) {
            vnode.dom.addEventListener("animationend", resolve)
        })
    }
    oncreate(vnode) {
        vnode.dom.classList.add(
            this.modeOrder.indexOf(vnode.attrs.previousMode) < this.modeOrder.indexOf(tworavens.selectedMode)
                ? 'enter-right' : 'enter-left');
    }
    view(vnode) {
        return m('div', {
            style: {
                position: 'absolute',
                width: '100%',
                height: '100%',
                'padding-left': `calc(${common.panelOcclusion['left']} - ${common.panelMargin})`,
                'padding-right': `calc(${common.panelOcclusion['right']} - ${common.panelMargin})`,
                overflow: 'auto'
            }}, vnode.children)
    }
}