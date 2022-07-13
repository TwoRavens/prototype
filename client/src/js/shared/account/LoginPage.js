import m from 'mithril';
import Header from "../components/views/Header";
import Button from "../components/views/Button";
import Canvas from "../components/views/Canvas";
import TextField from "../components/views/TextField";
import {heightHeader} from "../components/common";
import {Auth} from ".";
import {warn} from "../utils";


export default class LoginPage {
    view() {
        return [
            m(Header, [
                m('div', {style: {'flex-grow': 1}}),
                m("h3", "Login"),
                m('div', {style: {'flex-grow': 1}}),
                m(Button, {onclick: () => m.route.set('/signup')}, "Signup"),
            ]),
            m(Canvas, {
                    attrsAll: {
                        id: 'canvasLogin',
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
                            'max-width': '25em',
                            'box-shadow': '0px 5px 10px rgba(0, 0, 0, .1)',
                            margin: '1em auto'
                        }
                    },

                    m("div",
                        {style: {padding: '2em'}},

                        m('h4', "Email"),
                        m(TextField, {
                            id: 'emailTextfield',
                            oninput: email => this.email = email,
                            onblur: email => this.email = email,
                            value: this.email,
                            style: this.err?.email && {'border-bottom': '1px solid #dc3545'},
                        }),
                        this.err?.email && warn(this.err.email.msg, {float: 'right'}),
                        m('br'),


                        m('h4', "Password"),
                        m(TextField, {
                            id: 'passwordTextfield',
                            type: "password",
                            oninput: password => this.password = password,
                            onblur: password => this.password = password,
                            value: this.password,
                            style: this.err?.password && {'border-bottom': '1px solid #dc3545'},
                        }),
                        this.err?.password && warn(this.err.password.msg, {float: 'right'}),
                        m('br'),

                        m(Button, {
                            style: {width: '100%'},
                            onclick: () => Auth.login(this.email, this.password)
                                .then(() => m.route.set("/"))
                                .catch(err => this.err = err)
                        }, "Submit"),
                        typeof this.err === 'string' && warn(this.err, {float: 'right'}),
                    )),
            )
        ]
    }
}
