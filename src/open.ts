import { spawnSync, SpawnOptions } from 'child_process'

class OpenErr extends Error {
    constructor(msg: string) {
        super(msg)
    }
}

type OpenOptions = {
    browserPath: string
    browserOptions: string[]
}

const openWith = (url: string, options: OpenOptions) => {
    const spawnArgs: string[] = []
    const spawnOpt = {} as SpawnOptions

    spawnArgs.push(options.browserPath)
    options.browserOptions.forEach((a) => spawnArgs.push(a))

    spawnArgs.push(url)

    spawnSync(spawnArgs[0], spawnArgs.slice(1), {
        ...{ stdio: 'ignore' },
        ...spawnOpt,
    })
}

export { openWith, OpenErr, OpenOptions }
