import { spawn } from 'child_process'
import { platform } from 'os'

import {
    Browser as _Browser,
    BrowserProfile,
} from './types'
import { PRESET_BROWSERS } from './constant'
import { log } from './utils'

class OpenErr extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

class Browser implements _Browser {
    name: string
    profiles: Partial<
        Record<NodeJS.Platform, BrowserProfile>
    >
    customCMD: string
    constructor(
        name: string,
        defaultCMD?: Partial<
            Record<NodeJS.Platform, BrowserProfile>
        >
    ) {
        this.name = name
        this.profiles = defaultCMD
    }
}

const openWith = async (
    url: string,
    cmd: string[],
    options: Partial<{
        enableLog: boolean
        timeout: number
    }> = {}
): Promise<number> => {
    const _spawn = async (
        args: string[]
    ): Promise<number> => {
        return new Promise((res) => {
            const _args: string[] = [...args]
            const reg = RegExp(/^[^"|'](.+)(?<!\\)(\ ){1}/)
            const match = reg.exec(_args[0])
            if (match !== null) {
                // TODO: may have potential issues
                _args[0] = `"${_args[0]}"`
            }
            reg.exec(_args[0])
            if (options?.enableLog ?? false) {
                log('info', 'opening', _args.join(' '))
            }
            const child = spawn(_args[0], args.slice(1), {
                stdio: 'ignore',
                shell: true,
            })
            child.on('exit', (code) => {
                res(code)
            })
            setTimeout(() => {
                res(0)
            }, options?.timeout ?? 250)
        })
    }
    const target = '$TARGET_URL'
    let match = false
    const _cmd = cmd.map((arg) => {
        const idx = arg.indexOf(target)
        if (idx !== -1) {
            match = true
            return (
                arg.substr(0, idx) +
                encodeURIComponent(url) +
                arg.substr(idx + target.length)
            )
        } else {
            return arg
        }
    })
    if (!match) {
        _cmd.push(url)
    }
    return await _spawn(_cmd)
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
    const os = platform()
    const preset = {} as Record<string, string[]>
    browser.forEach(async ({ profiles, name }) => {
        let app = profiles[os]
        if (
            typeof app !== 'undefined' &&
            app.test &&
            (await app.test(app))
        ) {
            for (const pvt of [0, 1]) {
                const cmds = []
                if (pvt) {
                    if (!app?.optional?.private) {
                        continue
                    }
                    app = {
                        ...app,
                        ...(app.optional.private ?? {}),
                    }
                }
                if (app.sysCmd) {
                    cmds.push(app.sysCmd)
                }
                if (app.sysArgs) {
                    app.sysArgs.forEach((arg) =>
                        cmds.push(arg)
                    )
                }
                cmds.push(app.cmd)
                if (app.args) {
                    app.args.forEach((arg) =>
                        cmds.push(arg)
                    )
                }
                preset[name + (pvt ? '-private' : '')] =
                    cmds
            }
        }
    })
    return preset
}

export { Browser, BrowserProfile, openWith, OpenErr }
