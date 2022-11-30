import 'bootstrap';
import 'bootswatch/dist/materia/bootstrap.css';
import '../css/app.css';
import '../../node_modules/hopscotch/dist/css/hopscotch.css';

import * as m from 'mithril';

import 'core-js';
import 'regenerator-runtime/runtime';

import * as tworavens from './tworavens/tworavens';

import PeekPage from './shared/components/views/PeekPage';

// ALTERNATE WINDOWS
import EventDataPage from './eventdata/index';
import DeployPage from "./shared/components-contrib/DeployPage";

import LoginPage from "./shared/account/LoginPage";

import HomePage from "./HomePage";
import ProfilePage from "./shared/account/ProfilePage";
import ResourcesPage from "./tworavens/resources/index";
import WorkspacePage from "./tworavens/workspace";
import SignupPage from "./shared/account/SignupPage";

// forward-declare the process var that will hold environment variables
declare var process: { env: any }

export let setDomain = d => domain = d;
let domain = process.env.CLIENTSIDE_DOMAIN;

m.route(document.body, '/', {
    // '/test': {render: () => m()},
    '/': HomePage,
    '/login': LoginPage,
    '/signup': SignupPage,
    '/profile': ProfilePage,

    '/deploy': {render: vnode => m(DeployPage, {...vnode.attrs, id: 'deploy'})},
    '/data': {
        render: () => m(PeekPage, {
            id: {tworavens: tworavens.peekId, eventdata: 'eventdata'}[domain],
            image: 'TwoRavens.png'
        })
    },

    '/eventdata/': EventDataPage,
    '/eventdata/:mode': EventDataPage,

    '/resources/': ResourcesPage,
    '/resources/:mode': ResourcesPage,

    '/workspace/': WorkspacePage,
    '/workspace/explore/:exploreMode/:vars...': WorkspacePage,
    '/workspace/:mode': WorkspacePage,
});

// auto-reload tab every 10 seconds when unfocused. If focused, wait a minute

// if (process.env.CLIENTSIDE_DEV_RELOAD === "true") {
//     let reloadTimer;
//     let devReload = () => {
//         clearTimeout(reloadTimer);
//         reloadTimer = setTimeout(
//             () => document.hasFocus() ? devReload() : window.location.reload(),
//             (document.hasFocus() ? 60 : 10) * 1000)
//     }
//     devReload();
//     window.addEventListener('focus', devReload as any)
// }