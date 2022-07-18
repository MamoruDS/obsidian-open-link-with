import { LOG_TYPE, Platform, ValidModifier } from './types'

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

const getValidHttpURL = (
    url?: string | URL
): string | null => {
    if (typeof url === 'undefined') {
        return null
    } else if (url instanceof URL) {
        return ['http:', 'https:'].indexOf(url.protocol) !=
            -1
            ? url.toString()
            : null
    } else {
        try {
            if (
                ['http:', 'https:'].indexOf(
                    new URL(url).protocol
                ) != -1
            ) {
                return url
            } else {
                return null
            }
        } catch (TypeError) {
            return null
        }
    }
}

const getValidModifiers = (
    platform: Platform
): ValidModifier[] => {
    if (platform == Platform.Unknown) {
        return ['none']
    } else {
        return ['none', 'ctrl', 'meta', 'alt', 'shift']
    }
}

const globalWindowFunc = (cb: (win: Window) => void) => {
    cb(activeWindow)
    app.workspace.on('window-open', (ww, win) => {
        cb(win)
    })
}

const log = (
    msg_type: LOG_TYPE,
    title: string,
    message: any
) => {
    let wrapper: (msg: string) => any
    if (msg_type === 'warn') {
        wrapper = console.warn
    } else if (msg_type === 'error') {
        wrapper = console.error
    } else {
        wrapper = console.info
    }
    if (typeof message === 'string') {
        wrapper(
            '[open-link-with] ' + title + ':\n' + message
        )
    } else {
        wrapper('[open-link-with] ' + title)
        wrapper(message)
    }
}

export {
    getPlatform,
    genRandomStr,
    getValidModifiers,
    getValidHttpURL,
    globalWindowFunc,
    log,
}
