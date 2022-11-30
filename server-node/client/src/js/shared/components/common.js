// Global configuration

import m from "mithril";

export let panelMargin = '10px';
export let heightHeader = '88px';
export let heightFooter = '50px';

export let theme = 'light';
export let colors = {
    text: '#444',
    base: '#f0f0f0',
    menu: '#f9f9f9',
    border: '1px solid #bfbfbf',
    gray: '#c0c0c0',
    lightGray: '#eee',

    tagged: '#f5f5f5', // d3.rgb("whitesmoke");
    varColor: '#f7f7f7', // d3.rgb("aliceblue"); // #f0f8ff

    d3: '#50a1db', // d3's default blue
    steelBlue: '#1f77b4',
    selVar: '#fa8072', // d3.rgb("salmon");

    success: '#419641',
    warn: '#ffd442',
    error: '#fa8072',
}

export let themes = {
    light: Object.assign({}, colors),
    dark: {
        text: '#f5f5f5',
        base: 'dimgray',
        menu: '#474747',
        border: '1px solid #393939',

        gray: '#c0c0c0',
        lightGray: '#545454',

        tagged: '#f5f5f5',
        varColor: '#606366',
        d3: '#50a1db',
        steelBlue: '#1f77b4',
        selVar: '#d26c60',
    }
}

export let colorPalette = [
    "#3cb44b",
    "#4363d8",
    "#f58231",
    "#42d4f4",
    "#e6194B",
    "#911eb4",
    "#9A6324",
    "#ffe119",
    "#f032e6",
    "#469990",
    "#fabebe",
    "#bfef45"
];

// Global features

export let panelOpen = {
    'left': true,
    'right': true
};

// If you invoke from outside a mithril context, run m.redraw() to trigger the visual update
export function setPanelOpen(side, state=true) {
    panelOpen[side] = state;
    panelCallback[side](state);
}

export function togglePanelOpen(side) {
    panelOpen[side] = !panelOpen[side];
    panelCallback[side](panelOpen[side])
}

// Optionally trigger callback after setting panel state (but before redraw)
export let panelCallback = {
    'left': Function,
    'right': Function
};
export function setPanelCallback(side, callback) {panelCallback[side] = callback}

// Number of pixels occluded by the panels. Left at zero if panels are hovering
export let panelOcclusion = {
    'left': '0px',
    'right': '0px'
};
export function setPanelOcclusion(side, state) {panelOcclusion[side] = state}

export const scrollbarWidth = getScrollbarWidth();
export let canvasScroll = {
    vertical: false,
    horizontal: false
};

// If scroll bar has been added or removed from canvas, update state and return true.
export function scrollBarChanged() {
    let canvas = document.getElementById('canvas');
    if (canvas === null) return false;

    let newState = {
        vertical: canvas.scrollHeight > canvas.clientHeight,
        horizontal: canvas.scrollWidth > canvas.clientWidth
    };

    if (newState['vertical'] !== canvasScroll['vertical'] || newState['horizontal'] !== canvasScroll['horizontal']) {
        canvasScroll = newState;
        return true;
    } else return false;
}

// Merge arrays and objects up to one layer deep
export function mergeAttributes(target, ...sources) {
    if ('class' in target && Array.isArray(target['class'])) target['class'] = target['class'].join(' ');
    if (!sources.length) return target;
    const source = sources.shift();

    for (const key in source) {
        // special case to collapse class lists into a space-delimited string
        if (key === 'class') {
            if (Array.isArray(source[key])) source[key] = source[key].join(' ');
            target[key] += ` ${source[key]}`;
        }
        else if (Array.isArray(source[key]) && Array.isArray(target[key]))
            target[key].concat(source[key]);

        else if (typeof target[key] === 'object' && typeof source[key] === 'object')
            Object.assign(target[key], source[key]);

        else target[key] = source[key];
    }
    return mergeAttributes(target, ...sources);
}

// https://stackoverflow.com/a/13382873
function getScrollbarWidth() {
    let outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.width = "100px";
    outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

    document.body.appendChild(outer);

    let widthNoScroll = outer.offsetWidth;
    // force scrollbars
    outer.style.overflow = "scroll";

    // add innerdiv
    let inner = document.createElement("div");
    inner.style.width = "100%";
    outer.appendChild(inner);

    let widthWithScroll = inner.offsetWidth;

    // remove divs
    outer.parentNode.removeChild(outer);

    return widthNoScroll - widthWithScroll;
}


export let deepCopy = value => {
    if (['undefined', 'number', 'string', 'boolean'].includes(typeof value))
        return value;
    if (value == null)
        return value

    if (value instanceof Set) return new Set([...value].map(deepCopy));
    if (Array.isArray(value)) return value.map(deepCopy);
    if (typeof value === 'object') return Object.keys(value)
        .reduce((out, key) => Object.assign(out, {[key]: deepCopy(value[key])}), {});
};


/**
 * Simple object check.
 * https://stackoverflow.com/a/34749873
 * @param item
 * @returns {boolean}
 */
export function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge two objects.
 * https://stackoverflow.com/a/34749873
 * @param target
 * @param ...sources
 */
export function deepMerge(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, {[key]: {}});
                deepMerge(target[key], source[key]);
            } else {
                Object.assign(target, {[key]: source[key]});
            }
        }
    }

    return deepMerge(target, ...sources);
}


export let loader = id => m('div', {
        style: {height: '120px', margin: 'auto calc(50% - 60px)'}
    },
    m(`#loading${id}.loader`, {
        style: {position: 'relative', transform: 'translateY(-50%)'}
    }));

export let loaderSmall = id => m(`#loading${id}.loader-small`, {
    style: {
        display: 'inline-block',
        margin: 'auto',
        position: 'relative',
        top: '40%',
        transform: 'translateY(-50%)'
    }
});

export let setDarkTheme = () => {
    theme = 'dark';
    Object.assign(colors, themes[theme])

    localStorage.setItem('plotTheme', 'dark');
    document.documentElement.style.setProperty('--btn-background', colors.lightGray);
    document.documentElement.style.setProperty('--text-color', colors.text);
    document.documentElement.style.setProperty('--pre-color', '#d2d2d2');
    document.documentElement.style.setProperty('--card-background-color', colors.lightGray);
    document.documentElement.style.setProperty('--btn-active-background', '#999');
    document.documentElement.style.setProperty('--btn-active-box-shadow', 'inset 0px 0px 8px #606060', 'important');
}
if (localStorage.getItem('plotTheme') === 'dark')
    setDarkTheme()

export let setLightTheme = () => {
    theme = 'light';
    Object.assign(colors, themes[theme])

    localStorage.setItem('plotTheme', 'default');
    document.documentElement.style.setProperty('--btn-background', '#f6f6f6');
    document.documentElement.style.setProperty('--text-color', colors.text);
    document.documentElement.style.setProperty('--pre-color', '#212121');
    document.documentElement.style.setProperty('--card-background-color', "#fff");
    document.documentElement.style.setProperty('--btn-active-background', '#e6e5e5');
    document.documentElement.style.setProperty('--btn-active-box-shadow', 'inset 0px 0px 8px #b0b0b0', 'important');
}
