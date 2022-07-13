import {Component, Vnode, Children} from "mithril";

export default class Button implements Component<any, any> {
    view(vnode: Vnode<any>): Children;
}