import { Platform } from 'obsidian'

import {
    Clickable,
    _MatchRule,
    MRExact,
    MRContains,
    MRNotExact,
    MRNotContains,
    Modifier,
    MWindow,
} from './types'
import {
    genRandomStr,
    getModifiersFromMouseEvt,
    getValidHttpURL,
    log,
    RulesChecker,
    WindowUtils,
} from './utils'

const checkClickable = (el: Element): Clickable => {
    const res = {
        is_clickable: false,
        url: null, // url is safe to be null when `oolwPendingUrls` is not empty
        popout: false,
        modifier_rules: [],
    } as Clickable
    // example of el with `external-link`:
    //  - links in preview mode
    if (el.classList.contains('external-link')) {
        res.is_clickable = true
        res.url = el.getAttribute('href')
    }
    // example of el with `clickable-icon`:
    //  -
    if (el.classList.contains('clickable-icon')) {
        // res.is_clickable = true
        // res.popout = true
    }
    // example of el with `cm-underline`:
    //  - links in live preview mode
    if (el.classList.contains('cm-underline')) {
        res.is_clickable = true
        // res.url = // determined by `window._builtInOpen`
        res.modifier_rules = [
            new MRNotExact([Modifier.Alt]),
            new MRNotExact([Modifier.Shift]),
            new MRNotExact([Modifier.Alt, Modifier.Shift]),
        ]
    }
    // example of el with `cm-url`:
    //  - links in editing mode
    if (el.classList.contains('cm-url')) {
        res.is_clickable = true
        res.url = el.innerHTML.trim()
        res.modifier_rules = Platform.isMacOS
            ? [new MRContains([Modifier.Meta])]
            : [new MRContains([Modifier.Ctrl])]
    }
    if (!res.is_clickable && el.tagName === 'A') {
        let p = el
        while (p.tagName !== 'BODY') {
            if (p.classList.contains('community-modal-info')) {
                res.is_clickable = true
                res.url = el.getAttribute('href')
                res.popout = el.getAttribute('target') === '_blank'
            }
            p = p.parentElement
        }
    }
    return res
}

class LocalDocClickHandler {
    private _enabled: boolean
    private _handleAuxClick: boolean
    constructor() {
        this._enabled = false
        this._handleAuxClick = false
    }
    get enabled(): boolean {
        return this._enabled
    }
    set enabled(val: boolean) {
        this._enabled = val
    }
    get handleAuxClick(): boolean {
        return this._handleAuxClick
    }
    set handleAuxClick(val: boolean) {
        this._handleAuxClick = val
    }
    call(evt: MouseEvent) {
        const win = evt.doc.win as MWindow
        if (typeof win.mid !== 'undefined' && this._enabled) {
            this._handler(evt)
        } else {
            // plugin has been unloaded
            // or
            // click handler is disabled
        }
    }
    protected _handler(evt: MouseEvent) {
        const el = evt.target as Element
        const win = evt.doc.win as MWindow
        const modifiers = getModifiersFromMouseEvt(evt)
        const clickable = checkClickable(el)
        if (!clickable.is_clickable) {
            return false
        }
        let fire = true // mark click will be fired
        if (clickable.modifier_rules.length > 0) {
            const match = new RulesChecker(clickable.modifier_rules)
            if (!match.check(modifiers)) {
                fire = false
            }
        }
        // apply on middle click only
        if (this.handleAuxClick && evt.button === 2) {
            fire = false
        }
        evt.preventDefault()
        let url: string = clickable.url
        if (win.oolwPendingUrls.length > 0) {
            // win.oolwPendingUrls have higher priority
            // e.g., live preview links
            url = win.oolwPendingUrls.pop()
        }
        if (url === null) {
            fire = false
        }
        log('info', 'click event (LocalDocClickHandler)', {
            is_aux: this.handleAuxClick,
            clickable,
            url,
            modifiers,
            btn: evt.button,
        })
        if (!fire) {
            return false
        }
        const dummy = evt.doc.createElement('a')
        const cid = genRandomStr(4)
        dummy.setAttribute('href', url)
        dummy.setAttribute('target', clickable.popout ? '_blank' : '_self')
        dummy.setAttribute('oolw-cid', cid)
        dummy.addClass('oolw-external-link-dummy')
        evt.doc.body.appendChild(dummy)
        //
        const e_cp = new MouseEvent(evt.type, evt)
        dummy.dispatchEvent(e_cp)
        dummy.remove()
    }
}

class ClickUtils {
    private _windowUtils: WindowUtils
    private _localHandlers: Record<
        string,
        {
            click: LocalDocClickHandler
            auxclick: LocalDocClickHandler
        }
    >
    constructor(windowUtils: WindowUtils) {
        this._windowUtils = windowUtils
        this._localHandlers = {}
    }
    initDocClickHandler(win: MWindow) {
        if (!this._localHandlers.hasOwnProperty(win.mid)) {
            const clickHandler = new LocalDocClickHandler()
            clickHandler.enabled = true
            const auxclickHandler = new LocalDocClickHandler()
            auxclickHandler.enabled = true
            auxclickHandler.handleAuxClick = true
            //
            win.document.addEventListener(
                'click',
                clickHandler.call.bind(clickHandler)
            )
            win.document.addEventListener(
                'auxclick',
                auxclickHandler.call.bind(auxclickHandler)
            )
            //
            this._localHandlers[win.mid] = {
                click: clickHandler,
                auxclick: auxclickHandler,
            }
        }
    }
    removeDocClickHandler(win: MWindow) {
        if (this._localHandlers.hasOwnProperty(win.mid)) {
            const handlers = this._localHandlers[win.mid]
            handlers.click.enabled = false
            handlers.auxclick.enabled = false

            win.document.removeEventListener(
                'click',
                handlers.click.call.bind(handlers.click)
            )
            win.document.removeEventListener(
                'auxclick',
                handlers.auxclick.call.bind(handlers.auxclick)
            )
            delete this._localHandlers[win.mid]
        }
    }
    overrideDefaultWindowOpen(win: MWindow, enabled: boolean = true) {
        if (enabled && typeof win._builtInOpen === 'undefined') {
            win._builtInOpen = win.open
            win.oolwCIDs = []
            win.oolwPendingUrls = []
            win.open = (url, target, feature) => {
                const validUrl = getValidHttpURL(url)
                if (validUrl === null) {
                    return win._builtInOpen(url, target, feature)
                } else {
                    win.oolwPendingUrls.push(validUrl)
                    return win
                }
            }
        } else if (!enabled && typeof win._builtInOpen !== 'undefined') {
            win.open = win._builtInOpen
            delete win._builtInOpen
            delete win.oolwCIDs
            delete win.oolwPendingUrls
        }
    }
}

export { ClickUtils }
