import { spawn, spawnSync } from 'child_process'
import * as process from 'process'

import {
    OS,
    Browser as _Browser,
    BrowserProfile,
} from './types'
import { VALID_OS, PRESET_BROWSERS } from './constant'

export const getOS = <O extends string>(): O => {
    const p = process.platform as O
    let _valid = false
    Object.entries(VALID_OS).forEach(([o, v]) => {
        if (p == o && v) _valid = true
    })
    if (_valid) return p
    else throw new OpenErr(`unsupported platform: ${p}`)
}

class OpenErr extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

class Browser implements _Browser {
    name: string
    profiles: Partial<Record<OS, BrowserProfile>>
    customCMD: string
    constructor(
        name: string,
        defaultCMD?: Partial<Record<OS, BrowserProfile>>
    ) {
        this.name = name
        this.profiles = defaultCMD
    }
}

const openWith = async (
    url: string,
    cmd: string[]
): Promise<boolean> => {
    const _spawn = async (
        args: string[]
    ): Promise<boolean> => {
        return new Promise((res) => {
            let failed = false
            const s = spawn(args[0], args.slice(1), {
                stdio: 'ignore',
                shell: true,
            })
            s.on('exit', (code) => {
                failed = code == 0 ? false : true
            })
            setTimeout(() => {
                res(failed)
            }, 100)
        })
    }
    const t = '$TARGET_URL'
    let c = [...cmd]
    let m = false
    c = c.map((a) => {
        const idx = a.indexOf(t)
        if (idx != -1) {
            m = true
            return (
                a.substr(0, idx) +
                encodeURIComponent(url) +
                a.substr(idx + t.length)
            )
        } else {
            return a
        }
    })
    if (!m) c.push(url)
    return await _spawn(c)
}

const getPresetBrowser = (): Browser[] => {
    const presets: Browser[] = []
    presets.push(
        new Browser('safari', PRESET_BROWSERS['safari'])
    )
    presets.push(
        new Browser('firefox', PRESET_BROWSERS['firefox'])
    )
    presets.push(
        new Browser('chrome', PRESET_BROWSERS['chrome'])
    )
    presets.push(
        new Browser('chromium', PRESET_BROWSERS['chromium'])
    )
    presets.push(
        new Browser('edge', PRESET_BROWSERS['edge'])
    )
    return presets
}

export const getValidBrowser = async (): Promise<
    Record<string, string[]>
> => {
    const browser = getPresetBrowser()
    const os = getOS<OS>()
    const p = {} as Record<string, string[]>
    browser.forEach(async ({ profiles, name }) => {
        let { ...b } = profiles[os]
        if (b.test && (await b.test(b))) {
            for (const pvt of [0, 1]) {
                const cmds = []
                if (pvt) {
                    if (!b?.optional?.private) {
                        continue
                    }
                    b = {
                        ...b,
                        ...(b.optional.private ?? {}),
                    }
                }
                if (b.sysCmd) cmds.push(b.sysCmd)
                if (b.sysArgs)
                    b.sysArgs.forEach((a) => cmds.push(a))
                cmds.push(b.cmd)
                if (b.args)
                    b.args.forEach((a) => cmds.push(a))
                p[name + (pvt ? '-private' : '')] = cmds
            }
        }
    })
    return p
}

export { Browser, BrowserProfile, openWith, OpenErr }
