import m from 'mithril';
import Header from "./shared/components/views/Header";
import Canvas from "./shared/components/views/Canvas";
import {heightHeader} from "./shared/components/common";
import AccountWidget from "./shared/account/AccountWidget";
import * as model from './tworavens/workspace/model';
import {mutateNodes} from './tworavens/workspace/model';
import {bold, italicize} from "./shared/utils";
import ForceDiagram, {
    groupBuilder,
    groupLinkBuilder,
    linkBuilder,
    pebbleBuilder,
} from "./shared/components-contrib/ForceDiagram";
import {buildEmptyProblem} from "./tworavens/problem";
import TwoPanel from "./shared/components/views/TwoPanel";
import * as jStat from 'jstat';
import PlotVegaLite from "./shared/components-contrib/PlotVegaLite";
import Icon from "./shared/components/views/Icon";
import Button from "./shared/components/views/Button";
import {Auth} from "./shared/account";

export default class HomePage {

    view(vnode) {
        return [
            m(Header, [
                m('div', {style: {'flex-grow': 1}}),
                // m("h3", "TwoRavens"),
                m('div', {style: {'flex-grow': 1}}),
                m(AccountWidget)
            ]),
            m(Canvas, {
                    attrsAll: {
                        id: 'canvasHome',
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
                            margin: '1em auto'
                        }
                    },
                    Auth.email
                        ? this.viewLoggedIn(vnode)
                        : this.viewNotLoggedIn(vnode)))
        ]
    }

    viewLoggedIn(vnode) {
        return [
            m(Button, {
                onclick: () => m.route.set('/resources/')
            }, 'Resources'),
            m(Button, {
                onclick: () => m.route.set('/eventdata/')
            }, 'Event Data')
        ]
    }

    viewNotLoggedIn(vnode) {

        let plot;
        let variable = summaries[homeForceDiagramState.hoverPebble ?? homeForceDiagramState.selectedPebble];
        let continuousSpecification = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "mark": "area",
            "encoding": {
                "x": {
                    "field": "x", "type": "quantitative", "title": variable.name
                },
                "y": {
                    "field": "y", "type": "quantitative",
                    "axis": {"title": "density"}
                },
                "tooltip": [
                    {"field": "x", "type": "quantitative", "title": variable.name},
                    {"field": "y", "type": "quantitative", "title": "density"}
                ]
            }
        };

        let barSpecification = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "mark": "bar",
            "encoding": {
                "y": {
                    "field": "x", "type": "ordinal", "sort": "none", "title": variable.name
                },
                "x": {
                    "field": "y", "type": "quantitative", "title": "count"
                },
                "tooltip": [
                    {"field": "x", "type": "ordinal", "title": variable.name},
                    {"field": "y", "type": "quantitative", "title": "count"}
                ]
            }
        };

        if (variable.pdfPlotType === 'continuous') plot = m(PlotVegaLite, {
            data: variable.pdfPlotX.map((_, i) => ({x: variable.pdfPlotX[i], y: variable.pdfPlotY[i]})),
            specification: continuousSpecification,
            identifier: 'x'
        });

        if (!variable.pdfPlotType || variable.pdfPlotType === 'bar') {
            let barLimit = 15;
            let keys = Object.keys(variable.plotValues);

            plot = m(PlotVegaLite, {
                data: Object.keys(variable.plotValues)
                    .filter((key, i) => keys.length < barLimit || !(i % parseInt(keys.length / barLimit)) || i === keys.length - 1)
                    .map(value => ({x: value, y: variable.plotValues[value]})),
                specification: barSpecification,
                identifier: 'x'
            })
        }
        return [
            m('h3', 'A web-based system of interlocking tools for quantitative analysis.'),
            'TwoRavens is a platform for machine learning that helps you build high-quality, predictive, interpretable models. ' +
            'TwoRavens expedites your data analysis work with automated tools for model interpretation, model discovery, and data exploration. ' +
            'The software learns with you, through an interactive paradigm we call ', italicize('human-guided machine learning'), '. ' +
            'Your role is to impart substantive knowledge about your data and research questions to guide the automated processes. ',
            m('br'),

            m(Button, {onclick: () => m.route.set('/signup'), style: {margin: '1em'}},
                m('div[style=margin-right:0.4em;display:inline]', 'Get Started'), m(Icon, {name: 'arrow-right'})),

            m('br'),

            'Render your learning problems graphically! ' +
            'In the snippet below, columns "A", "B" and "C" are regressors for column "D". ',

            m('div', {
                style: {
                    height: '300px',
                    position: 'relative',
                    border: '1px solid rgb(191, 191, 191)',
                    'border-radius': '4px'
                }
            }, m(TwoPanel, {
                left: m(ForceDiagram, Object.assign(
                    homeForceDiagramState,
                    model.buildForceData(homeProblem),
                    {
                        mutateNodes: mutateNodes(homeProblem),
                        pebbleEvents: {
                            click: (_, pebble) => homeForceDiagramState.selectedPebble = pebble ?? "D",
                            mouseover: (_, pebble) => {
                                homeForceDiagramState.hoverPebble = pebble;
                                m.redraw()
                            },
                            mouseout: () => {
                                homeForceDiagramState.hoverPebble = undefined;
                                m.redraw()
                            },
                        },
                        summaries
                    })),
                right: plot
            })),
            "With TwoRavens, you can interactively tune and solve the learning problem to find deep insights about your data.",

            m('br'),

            m('h3', 'Philosophy'),
            'In the very best research settings, where there are collaborations between domain experts and data scientists or statistical experts, exploration into the data is a joint venture where statisticians drive the computational machinery of analysis, but are directed to the interesting features by the knowledge of the domain expert. ' +
            'Our belief is that you can automate much of what the statistician brings, but the domain expert remains central to the task. ' +
            'Thus, our goal is to augment the domain expert, leading to the construction of high quality, impactful and interpretable models. ',
            m('br'),
            m('h3', 'Applications'),
            bold('Machine Learning'),
            m('br'),
            'The goal of the machine learning application is to allow the domain expert, in concert with our system, to complete a high quality, predictive and interpretable model without a statistical expert or data scientists. ',
            m('br'),
            bold('Event Data'),
            m('br'),
            'The event data module is designed for researchers to easily structure raw event data into usable time series formats. ' +
            'Researchers can browse openly available event datasets, construct queries to select types of events and sets of actors, view and download resulting time-series data, and export data to our main system for AI assisted analysis. ',

        ]
    }
}

let homeProblem = buildEmptyProblem();
homeProblem.groups.find(group => group.name === "Predictors").nodes = ["A", "B", "C"];
homeProblem.groups.find(group => group.name === "Targets").nodes = ["D"];

let homeForceDiagramState = {
    builders: [pebbleBuilder, groupBuilder, linkBuilder, groupLinkBuilder],
    hoverPebble: undefined,
    contextPebble: undefined,
    contextGroup: undefined,
    selectedPebble: "D",
    hoverTimeout: undefined,
    isPinned: false,
    hullRadius: 35,
    defaultPebbleRadius: 30,
    hoverTimeoutDuration: 150, // milliseconds to wait before showing/hiding the pebble handles
    selectTransitionDuration: 300, // milliseconds of pebble resizing animations
    arcHeight: 16,
    pebbleForceScale: 0.5,
    arcGap: 1,
    nodes: {},
};

let summaries = {
    A: {
        pdfPlotType: 'continuous',
        pdfPlotX: Array(20).fill(undefined).map((_, i) => i - 10),
        pdfPlotY: Array(20).fill(undefined).map((_, i) =>
            jStat.normal.pdf(i - 10, 0., 5) + Math.random() * 0.01),
    },
    B: {
        pdfPlotType: 'bar',
        nature: 'nominal',
        plotValues: ['A', 'B', 'C', 'D', 'E']
            .reduce((obj, v) => Object.assign(obj, {[v]: Math.random()}), {})
    },
    C: {
        pdfPlotType: 'bar',
        nature: 'nominal',
        plotValues: ['A', 'B', 'C']
            .reduce((obj, v) => Object.assign(obj, {[v]: Math.random()}), {})
    },
    D: {
        pdfPlotType: 'continuous',
        pdfPlotX: Array(30).fill(undefined).map((_, i) => i / 1.5),
        pdfPlotY: Array(30).fill(undefined).map((_, i) =>
            jStat.lognormal.pdf(i / 1.5, 3, 5) + Math.random() * 0.008),
    },
};
Object.keys(summaries).forEach(k => summaries[k].name = k);
