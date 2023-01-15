import {
    LogLevels,
    Modifier,
    MWindow,
    Platform,
    Rule as MR,
    ValidModifier,
    OpenLinkPluginITF,
} from './types'

class RulesChecker<R, V> {
    constructor(private _rules: MR._Rule<R, V>[] = []) {}
    addRule(rule: MR._Rule<R, V>) {
        this._rules.push(rule)
    }
    check(input: R[], options: { breakOnFirstSuccess?: boolean } = {}): V[] {
        const matched: V[] = []
        for (const rule of this._rules) {
            if (
                (options?.breakOnFirstSuccess ?? false) &&
                matched.length > 0
            ) {
                break
            }
            const { items } = rule
            if (rule instanceof MR.Exact || rule instanceof MR.NotExact) {
                let ok = false
                if (items.length === input.length) {
                    ok = items.every((item) => input.contains(item))
                }
                if (rule instanceof MR.Exact ? ok : !ok) {
                    matched.push(rule.value)
                }
            } else if (
                rule instanceof MR.Contains ||
                rule instanceof MR.NotContains
            ) {
                let ok = false
                if (items.length <= input.length) {
                    ok = items.every((item) => input.contains(item))
                }
                if (rule instanceof MR.Contains ? ok : !ok) {
                    matched.push(rule.value)
                }
            } else if (rule instanceof MR.Empty) {
                if (input.length === 0) {
                    matched.push(rule.value)
                }
            } else {
                throw new TypeError(
                    `invalid rule type: ${rule.constructor.name}`
                )
            }
        }
        return matched
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
