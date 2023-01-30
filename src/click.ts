import { Platform } from 'obsidian'

import {
    Clickable,
    Modifier,
    MWindow,
    OpenLinkPluginITF,
    Rule as MR,
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
        paneType: undefined,
        modifier_rules: [],
    } as Clickable
    const CTRL = Platform.isMacOS ? Modifier.Meta : Modifier.Ctrl
    const ALT = Modifier.Alt
    const SHIFT = Modifier.Shift
    //  - links in read mode
    if (el.classList.contains('external-link')) {
        res.is_clickable = true
        res.url = el.getAttribute('href')
        res.modifier_rules = [
            new MR.Exact([CTRL], 'tab'),
            new MR.Exact([CTRL, ALT], 'split'),
            new MR.Exact([CTRL, SHIFT], 'tab'),
            new MR.Exact([CTRL, ALT, SHIFT], 'window'),
            new MR.Contains([], undefined), // fallback
        ]
    }
    //  -
    if (el.classList.contains('clickable-icon')) {
        // res.is_clickable = true
        // res.paneType = 'window'
    }
    //  - links in live preview mode
    if (el.classList.contains('cm-underline')) {
        res.is_clickable = null
        // res.url = // determined by `window._builtInOpen`
        res.modifier_rules = [
            new MR.Empty(undefined),
            new MR.Exact([CTRL], 'tab'),
            new MR.Exact([CTRL, ALT], 'split'),
            new MR.Exact([CTRL, SHIFT], 'tab'),
            new MR.Exact([CTRL, ALT, SHIFT], 'window'),
        ]
    }
    //  - links in edit mode
    if (el.classList.contains('cm-url')) {
        res.is_clickable = null
        // res.url = // determined by `window._builtInOpen`
        res.modifier_rules = [
            new MR.Exact([CTRL], undefined),
            new MR.Exact([CTRL, ALT], 'split'),
            new MR.Exact([CTRL, SHIFT], 'tab'),
            new MR.Exact([CTRL, ALT, SHIFT], 'window'),
        ]
    }
    // - links in community plugins' readme
    if (res.is_clickable === false && el.tagName === 'A') {
        let p = el
        while (p.tagName !== 'BODY') {
            if (p.classList.contains('internal-link')) {
                break
            } else if (p.classList.contains('community-modal-info')) {
                res.is_clickable = true
                res.url = el.getAttribute('href')
                res.paneType =
                    el.getAttribute('target') === '_blank'
                        ? 'window'
                        : res.paneType
                break
            }
            p = p.parentElement
        }
    }
    return res
}

class LocalDocClickHandler {
    private _enabled: boolean
    private _handleAuxClick: boolean
    constructor(public clickUilts: ClickUtils) {
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
        let fire = true
        let url: string = clickable.url
        if (win.oolwPendingUrls.length > 0) {
            // win.oolwPendingUrls for getting correct urls from default open API
            url = win.oolwPendingUrls.pop()
        } else {
            // for urls could be invalid (inner links)
            if (url !== null && !getValidHttpURL(url)) {
                fire = false
                win._builtInOpen(url)
            }
        }
        if (clickable.is_clickable === false && url === null) {
            return false
        }
        let { paneType } = clickable
        if (url === null) {
            fire = false
        }
        if (clickable.modifier_rules.length > 0) {
            const checker = new RulesChecker(clickable.modifier_rules)
            const matched = checker.check(modifiers, {
                breakOnFirstSuccess: true,
            })
            if (matched.length == 0) {
                if (clickable.is_clickable) {
                    //
                } else {
                    fire = false
                }
            } else if (matched[0] === false) {
                fire = false
            } else if (typeof matched[0] === 'undefined') {
                paneType = undefined
            } else {
                paneType = matched[0]
            }
        }
        // apply on middle click only
        if (this.handleAuxClick && evt.button === 2) {
            fire = false
        }
        evt.preventDefault()
        if (this.clickUilts._plugin.settings.enableLog) {
            log('info', 'click event (LocalDocClickHandler)', {
                is_aux: this.handleAuxClick,
                clickable,
                url,
                modifiers,
                btn: evt.button,
            })
        }
        if (!fire) {
            return false
        }
        const dummy = evt.doc.createElement('a')
        const cid = genRandomStr(4)
        dummy.setAttribute('href', url)
        dummy.setAttribute('oolw-pane-type', paneType || '')
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
    private _localHandlers: Record<
        string,
        {
            click: LocalDocClickHandler
            auxclick: LocalDocClickHandler
        }
    >
    constructor(
        public _plugin: OpenLinkPluginITF,
        private _windowUtils: WindowUtils
    ) {
        this._localHandlers = {}
    }
    initDocClickHandler(win: MWindow) {
        if (!this._localHandlers.hasOwnProperty(win.mid)) {
            const clickHandler = new LocalDocClickHandler(this)
            clickHandler.enabled = true
            const auxclickHandler = new LocalDocClickHandler(this)
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
                if (this._plugin.settings.enableLog) {
                    log('info', 'Obsidian.window._builtInOpen', {
                        url,
                        target,
                        feature,
                    })
                }
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
