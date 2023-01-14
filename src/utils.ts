import {
    LogLevels,
    _MatchRule,
    MRExact,
    MRContains,
    MRNotExact,
    MRNotContains,
    Modifier,
    MWindow,
    Platform,
    ValidModifier,
    OpenLinkPluginITF,
} from './types'

class RulesChecker<R> {
    private _rules: _MatchRule<R>[]
    constructor(rules: _MatchRule<R>[] = []) {
        this._rules = rules
    }
    addRule(rule: _MatchRule<R>) {
        this._rules.push(rule)
    }
    check(input: R[]): boolean {
        let success = false
        for (const rule of this._rules) {
            const { items } = rule
            if (rule instanceof MRExact || rule instanceof MRNotExact) {
                let res = false
                if (items.length === input.length) {
                    res = items.every((item) => input.contains(item))
                }
                success = success || (rule instanceof MRExact ? res : !res)
            } else if (
                rule instanceof MRContains ||
                rule instanceof MRNotContains
            ) {
                let res = false
                if (items.length <= input.length) {
                    res = items.every((item) => input.contains(item))
                }
                success = success || (rule instanceof MRContains ? res : !res)
            }
        }
        return success
    }
}

class WindowUtils {
    private _windows: Record<string, MWindow>
    constructor(private _plugin: OpenLinkPluginITF) {
        this._windows = {}
    }
    initWindow(win: MWindow) {
        win.mid = genRandomStr(8)
        return win
    }
    registerWindow(win: MWindow) {
        if (typeof win.mid === 'undefined') {
            win = this.initWindow(win)
            if (this._plugin.settings.enableLog) {
                log('info', 'window registered', { mid: win.mid, window: win })
            }
            this._windows[win.mid] = win
        } else {
            // panic
            // if (this._plugin.settings.enableLog) {
            //     log('warn', 'existing window registered', {
            //         mid: win.mid,
            //         window: win,
            //     })
            // }
        }
    }
    unregisterWindow(win: MWindow) {
        if (typeof win.mid !== 'undefined') {
            delete this._windows[win.mid]
            log('info', 'window unregistered', { mid: win.mid, window: win })
            win.mid = undefined
        }
    }
    getRecords(): Record<string, MWindow> {
        return this._windows
    }
    getWindow(mid: string): MWindow {
        return this._windows[mid]
    }
}

const getPlatform = (): Platform => {
    const platform = window.navigator.platform
    switch (platform.slice(0, 3)) {
        case 'Mac':
            return Platform.Mac
        case 'Win':
            return Platform.Win
        default:
            return Platform.Linux
    }
}

const getModifiersFromMouseEvt = (evt: MouseEvent): Modifier[] => {
    const { altKey, ctrlKey, metaKey, shiftKey } = evt
    const mods: Modifier[] = []
    if (altKey) {
        mods.push(Modifier.Alt)
    }
    if (ctrlKey) {
        mods.push(Modifier.Ctrl)
    }
    if (metaKey) {
        mods.push(Modifier.Meta)
    }
    if (shiftKey) {
        mods.push(Modifier.Shift)
    }
    return mods
}

const genRandomChar = (radix: number): string => {
    return Math.floor(Math.random() * radix)
        .toString(radix)
        .toLocaleUpperCase()
}

const genRandomStr = (len: number): string => {
    const id = []
    for (const _ of ' '.repeat(len)) {
        id.push(genRandomChar(36))
    }
    return id.join('')
}

const getValidHttpURL = (url?: string | URL): string | null => {
    if (typeof url === 'undefined') {
        return null
    } else if (url instanceof URL) {
        return ['http:', 'https:'].indexOf(url.protocol) != -1
            ? url.toString()
            : null
    } else {
        try {
            return getValidHttpURL(new URL(url))
        } catch (TypeError) {
            return null
        }
    }
}

const getValidModifiers = (platform: Platform): ValidModifier[] => {
    if (platform === Platform.Unknown) {
        return ['none']
    } else {
        return ['none', 'ctrl', 'meta', 'alt', 'shift']
    }
}

const intersection = <T>(...lists: T[][]): T[] => {
    let lhs: T[] = lists.pop()
    while (lists.length) {
        const rhs = lists.pop()
        lhs = lhs.filter((v) => rhs.contains(v))
    }
    return lhs
}

const log = (level: LogLevels, title: string, message: any) => {
    let logger: (...args: any[]) => any
    if (level === 'warn') {
        logger = console.warn
    } else if (level === 'error') {
        logger = console.error
    } else {
        logger = console.info
    }
    logger(`[open-link-with] ${title}`, message)
}

export {
    getPlatform,
    getModifiersFromMouseEvt,
    genRandomStr,
    getValidModifiers,
    getValidHttpURL,
    intersection,
    log,
    RulesChecker,
    WindowUtils,
}
