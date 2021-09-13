import * as m from 'mithril';
import {MainView} from './MainView';

// forward-declare the process var that will hold environment variables
declare var process: { env: any }

m.mount(document.body, MainView);
