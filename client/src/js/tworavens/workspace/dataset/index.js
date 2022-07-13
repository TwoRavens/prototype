/*
  UI for TwoRavens Dataset Mode
*/
import m from 'mithril';

import * as tworavens from "../../tworavens";
import * as manipulate from "../../../shared/manipulations/manipulate";

import * as common from "../../../shared/components/common";
import MenuHeaders from "../../../shared/components/views/MenuHeaders";


export class CanvasDataset {

    view() {
        if (manipulate.constraintMenu) return;

        // workspace required for this view
        if (!tworavens.workspace) return;

        // The Overall Dataset Component
        //

        let manipulationsMenu = m(MenuHeaders, {
            id: 'manipulationsMenu',
            attrsAll: {style: {height: '100%', overflow: 'auto'}},
            sections: [
                (workspace.ravenConfig.priorManipulations || []).length !== 0 && {
                    value: 'Prior Pipeline',
                    contents: m(manipulate.PipelineFlowchart, {
                        compoundPipeline: workspace.ravenConfig.priorManipulations,
                        pipeline: workspace.ravenConfig.priorManipulations,
                        editable: false
                    })
                },
                {
                    value: 'Dataset Pipeline',
                    contents: m(manipulate.PipelineFlowchart, {
                        compoundPipeline: tworavens.workspace.ravenConfig.hardManipulations,
                        pipeline: tworavens.workspace.ravenConfig.hardManipulations,
                        editable: true,
                        hard: true
                    })
                }
            ]
        });

        return m('div', {
                style: {
                    'max-width': '800px',
                    'margin': 'auto'
                }
            },
            card('Manipulations', manipulationsMenu),
        );
    }
}

let card = (name, content) => m('div',
    {
        style: {
            'border-radius': '5px',
            'box-shadow': '1px 1px 4px rgba(0, 0, 0, 0.4)',
            margin: '1em',
            padding: '1em',
            'background-color': common.colors.menu,
        }
    },
    m('h4[style=margin:.75em]', name),
    content
);
