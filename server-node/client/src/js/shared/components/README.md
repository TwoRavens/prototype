# How to use the Mithril Common library
Each component is a self-contained menu element. To use one of these components in your menu:
1. import the component `import Classname from "./shared/components/views/Classname";`
2. create a new instance `m(Classname, {interface options}, children)`

...where 'Classname' refers to the name of the component and {interface options} are specified below (and in the class' .js file).

## Button
```
m(Button, {
    onclick: () => console.log("buttonID was clicked"),
    *: any attribute may be passed
    }, contents)
```

## ButtonRadio

```
m(ButtonRadio, {
    sections: [
            {
                value: 'Button 1',
                title: 'Hover text',
                attrsInterface: {optional object of attributes}
            },
            ...
        ],
    defaultSection: string (optional),
    activeSection: string (optional),
    onclick: (value) => console.log(value + " was clicked.")
    attrsAll: {optional object of attributes to apply to the bar}
    attrsButtons: {optional object of attributes to apply to all buttons}
    selectWidth: 20 (optional int),
    hoverBonus: 10 (optional int),
    vertical: boolean (optional)
    })
```

The selectWidth option forces the selected button to be n percent wide.
The other buttons on the bar compensate.
If not included, then every button has even spacing.

The hoverBonus option makes the hovered button n percent larger when hovered.
Both hoverBonus and selectWidth may be used together. On both, don't pass a string%, pass the numeric.

defaultSection sets which element is selected on page load
activeSelection forces the selected element. This is for convenience when external events change the selected button

## Canvas
```
m(Canvas, {
    attrsAll: { additional attributes to apply to the outer div }
    }, contents)
```

Purpose:
1. if a left or right panel is not permitted to occlude the content on the canvas, this class resizes the contents to maintain a margin away from the panels
2. if the contents of the canvas overflow and cause a scroll bar, the left and right panel are shifted to maintain a margin
 
## Dropdown
```
m(Dropdown, {
    id: 'dropdownID' (applied to button and selectors)
    items: ['Item 1', 'Item 2', 'Item 3'],
    activeItem: 'Item 1', (optional)
    onclickChild: (value) => console.log(value + " was clicked.")
    dropWidth: 100px (sets the width of the dropdown)
    *: any attribute may be passed
    })
 ```

## DropdownPopup

```
m(DropdownPopup, {
    header: "my header",
    sections: [
        {
            name: "option 1",
            content: m(...)
        },
        {
            name: "option 2",
            content: m(...)
        }
    ],
    callback: (value) => console.log(value + " was selected.")
    attrsAll: {} (optional)
    })
```

When clicked, a menu pops up with a list of buttons. Click a button to enter a sub-menu.

## Footer
```
m(Footer, {
    *: any attribute may be passed
    }, contents)
```
Takes on the display settings defined in common.js.

## Header
```
m(Header, {
        image: src image,
        aboutText: 'string',
        attrsInterface: {optional object of attributes}
    }, content)
```

Creates a header bar at the top of the screen
The TwoRavens logo and about text must be passed in
Resizes automatically for mobile formatting

## JSONSchema
Generic component that constructs menus that mutate an instance of a JSON schema
There are a number of features in the JSON schema spec that aren't supported... but this is a good start

```
m(JSONSchema, {
    schema: JSON object
    data: JSON object
    })
 ```

## ListTags
```
m(ListTags, {
    tags: ['value 1', 'value 2', 'value 3'],
    attrsTags: {}, (attributes to apply to each tag)
    ondelete: (tag) => console.log(tag + " was deleted"),
    reorderable: bool
})
```

Returns an inline array of elements with bubbles around them
Each bubble contains the tag. If onremove passed, then a cancel button. 
If reorderable is true, then dragging the pills mutates the tag array. 


## MenuHeaders
Separate a list of elements with headers. Interchangeable with MenuTabbed.
```
m(MenuHeaders, {
    id: id,
    sections: [...,
        {
            value: 'string',
            contents: m(...),
            idSuffix: (optional) suffix to add to generated id strings
            attrsAll: {optional object of attributes}
        }]
    })
```

## MenuTabbed
Separate a list of elements with tabs. Interchangeable with MenuHeaders.
```
m(MenuTabbed, {
    id: string,
    sections: [..., 
        {
            value: string
            title: text to use on hover,
            idSuffix: suffix to add to generated id strings
            contents: m(...)
            display: if 'none', then the button won't be visible on the button bar
        }],
    callback: (value) => console.log(value + " was clicked!"),
    attrsAll: {attributes to apply to the menu, EG height style}
    })
```
The ids for the generated buttons and content areas are generated via 'idSuffix' passed into sections.
For example if idSuffix is 'Type', then there will be html objects with 'btnType' and 'tabType' ids.


## ModalVanilla
Pop-up modal window that covers the entire page.
```
m(ModalVanilla, {
    id: string,
    setDisplay: (state) => display = state, (called when × or background clicked)
}, content)
```


## Panel
```
m(Panel, {
    side: 'left' || 'right',
    label: 'text at top of header',
    hover: Bool
    width: css string width,
    attrsAll: { apply attributes to the outer div }
    }, contents)
```

If hover is true, then the canvas is occluded by the panels.
If hover is false, then the canvas is resized to maintain a margin as panels are opened/closed or canvas contents overflow.

## PanelList
```
m(PanelList, {
        id: 'id of container',
        items: ['Clickable 1', 'Clickable 2', 'Clickable 3'],

        colors: { app.selVarColor: ['Clickable 1'] }, (optional)
        classes: { 'item-lineout': ['Clickable 1', 'Clickable 3'] }, (optional)

        callback: (item) => console.log(item + " clicked."),
        popup: (item) => { return 'PopupContent'}, (optional)

        attrsItems: {... additional attributes for each item}
    })
```

colors is an object that maps a color to a list or set of items with that color. Order colors by increasing priority.
classes acts similarly, but one item may have several classes. Standard css rules apply for stacking css classes.
popup returns the popup contents when called with the item. If not set, then popup is not drawn

## Peek
Widget for displaying a full-page data preview. Handle all logic for loading and preparing the data from within your app. There is code within Peek.js that belongs in the app you're implementing the preview for.


## Popper
Construct/place a popper upon hover of child content

```
m(Popper, {
        content: () => 'popper content',
        options: {placement: 'left', ...}, // specification for options: https://popper.js.org/popper-documentation.html#Popper.Defaults
        popperDuration: 100 // time in ms to delay load/unload
    }, 'child content')
```


## Subpanel
```
m(Subpanel, {
    id: 'string',
    header: 'string'
    attrsAll: {any attribute may be passed}
}, contents)
```

A box with a header. The header has a glyphicon chevron that shows/hides the contents. Bootstrap required.


## Table
```
m(Table, {
    id: id (string),
    headers: ['col1Header', 'col2Header'],
    data: [['row1col1', 'row1col2'], ['row2col1', 'row2col2']], or function
    activeRow: 'row1col1', (optional)
    onclick: (uid, colID) => console.log(uid + " row was clicked, column number " + colID + " was clicked"), (optional)
    showUID: true | false, (optional)

    attrsRows: { apply attributes to each row }, (optional)
    attrsCells: { apply attributes to each cell } (optional)
    tableTags: [ m('colgroup', ...), m('caption', ...), m('tfoot', ...)]
    abbreviation: (int),
    sortable: (boolean)
    })
```

The UID for the table is the key for identifying a certain row.
The UID is the first column, and its value is passed in the onclick callback.
The first column may be hidden via showUID: false. This does not remove the first header

The data parameter attempts to render anything it gets. Feel free to pass Arrays of Arrays, Arrays of Objects, Objects, and Arrays of mixed Objects and Arrays. It should just render.
    Passing an Object will be rendered as a column for keys and a column for values
    Passing an Array of Objects will render the value for a key under the header column with the same name
    Passing an Array of Objects without a header will infer the header names from the unique keys in the objects

Table tags allows passing colgroups, captions, etc. into the table manually. Can be a single element or list

When abbreviation is set, strings are shortened to int number of characters

When sortable is true, clicking on a header will sort the data by that column

## TextField
```
m(TextField, {
    id: string,
    oninput: value => console.log(value),
    textarea: (optional boolean),
    *: any attribute may be passed
    })
```

Can pass attributes directly, for example 'placeholder' or 'oninput'

## TextFieldSuggestion
NOTE this requires js-levenshtein to be installed from npm. Tested with version 1.1.3.
Install with: `npm install --save js-levenshtein`

```
m(TextField, {
    id: string,
    suggestions: ['possibility 1', 'possibility 2'],
    enforce: boolean,
    oninput: called with value of field
    *: any attribute may be passed
    })
```

suggestions are shown below the text box.
if enforce is true, then the value must be one of the suggestions
Can pass attributes directly, for example 'placeholder' or 'oninput'

## TwoPanel
a menu with left and right components.
On desktop, the center is draggable
On mobile, can switch between left and right menus on click

```
m(TwoPanel, {
    left: m(...),
    right: m(...),
    })
```