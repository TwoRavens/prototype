import m from 'mithril';
import Header from "../components/views/Header";
import Button from "../components/views/Button";
import Canvas from "../components/views/Canvas";
import {heightHeader, setDarkTheme, setLightTheme, theme} from "../components/common";
import {Auth} from ".";
import TwoPanel from "../components/views/TwoPanel";
import PanelList from "../components/views/PanelList";
import * as common from "../components/common";
import ButtonRadio from "../components/views/ButtonRadio";
import Dropdown from "../components/views/Dropdown";
import TextField from "../components/views/TextField";


export default class ProfilePage {
    view() {
        if (!Auth.email) m.route.set('/')
        return [

            m(Header, [
                m('div', {style: {'flex-grow': 1}}),
                m("h3", "Profile"),
                m('div', {style: {'flex-grow': 1}}),
            ]),
            m(Canvas, {
                    attrsAll: {
                        id: 'canvasProfile',
                        style: {
                            'padding-left': 0,
                            'padding-right': 0,
                            'margin-top': heightHeader + 'px',
                            height: `calc(100% - ${heightHeader})`
                        }
                    }
                },
                m(TwoPanel, {
                    rightPanelSize: 80,
                    left: m(PanelList, {
                        id: 'profileSections',
                        items: ['Account', 'S3 Keys', 'Visualizations'],
                        colors: {[common.colors.selVar]: state.selectedMenu},
                        callback: menu => state.selectedMenu = menu,
                    }),
                    right: m('div[style=padding:1em; max-width:400px]', [
                        state.selectedMenu === "Account" && [
                            m('h3', "Change Email"),
                            m(TextField, {
                                id: 'changeEmailTextField',
                                value: state.newEmail,
                                oninput: pass => state.newEmail = pass,
                                onblur: pass => state.newEmail = pass,
                                style: {width: '50%', display: 'inline'}
                            }),
                            m(Button, "Submit"),
                            m('h3', "Change Password"),
                            m(TextField, {
                                id: 'changePasswordTextField',
                                value: state.newPassword,
                                oninput: pass => state.newPassword = pass,
                                onblur: pass => state.newPassword = pass,
                                style: {width: '50%', display: 'inline'}
                            }),
                            m(Button, "Submit"),

                            m('h3', 'Email Verification'),
                            m(Button, "Re-Send Verification Email")
                        ],
                        state.selectedMenu === "Visualizations" && [
                            m('h3', "UI Theme"),
                            m(ButtonRadio, {
                                id: 'themeButtonRadio',
                                onclick: theme => ({light: setLightTheme, dark: setDarkTheme}[theme]()),
                                activeSection: theme,
                                sections: [{value: 'light'}, {value: 'dark'}]
                            }),

                            m('h3', "Plot Theme"),
                            m(Dropdown, {
                                items: ['default', 'excel', 'ggplot2', 'quartz', 'vox', 'fivethirtyeight', 'latimes', 'dark'],
                                activeItem: getVegaTheme(),
                                onclickChild: value => setVegaTheme(value)
                            })
                        ]
                    ])
                })
            )
        ]
    }
}

let setVegaTheme = theme => localStorage.setItem('plotTheme', theme);
let getVegaTheme = () => localStorage.getItem('plotTheme') ?? 'default';

let state = {
    selectedMenu: 'Account',
    newPassword: undefined,
    newEmail: undefined
}