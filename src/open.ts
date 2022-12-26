import { spawn } from 'child_process'

import { log } from './utils'

class OpenErr extends Error {
    constructor(msg: string) {
        super(msg)
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
    const _spawn = async (args: string[]): Promise<number> => {
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
                arg.slice(0, idx) +
                encodeURIComponent(url) +
                arg.slice(idx + target.length)
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

export { openWith, OpenErr }
