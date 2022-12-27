import { LogLevels, Modifier, MWindow, Platform, ValidModifier } from './types'

class WindowUtils {
    private _windows: Record<string, MWindow>
    constructor() {
        this._windows = {}
    }
    initWindow(win: MWindow) {
        win.mid = genRandomStr(8)
        return win
    }
    registerWindow(win: MWindow) {
        if (typeof win.mid === 'undefined') {
            win = this.initWindow(win)
            log('info', 'window registered', { mid: win.mid, window: win })
            this._windows[win.mid] = win
        } else {
            // panic
            // log('warn', 'existing window registered', {
            //     mid: win.mid,
            //     window: win,
            // })
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
            if (['http:', 'https:'].indexOf(new URL(url).protocol) != -1) {
                return url
            } else {
                return null
            }
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
    WindowUtils,
}
