import * as m from "mithril";
import Dropdown from "../components/views/Dropdown";
import Button from "../components/views/Button";
import {Auth} from "./index";


export default class AccountWidget {
    view() {
        if (Auth.locked) return;

        return Auth.email
            ? m(Dropdown, {
                id: `userDropdown`,
                items: ['Profile', 'Logout'],
                activeItem: Auth.email,
                onclickChild: child => ({
                    'Profile': () => m.route.set('/profile'),
                    'Logout': () => {
                        Auth.logout();
                        location.reload();
                    }
                }[child]())
            })
            : [
                m(Button, {
                    style: {'margin-right':"1em"},
                    onclick: () => m.route.set('/login')
                }, "Login"),

                m(Button, {
                    onclick: () => m.route.set('/signup')
                }, "Signup")
            ]
    }
}
