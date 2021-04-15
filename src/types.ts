import { VALID_OS } from './constant'

type OS = keyof typeof VALID_OS

interface BrowserOptions {
    private: Partial<Omit<BrowserProfile, 'optional'>>
    background: boolean
}

interface BrowserProfile {
    sysCmd?: string
    sysArgs?: string[]
    cmd: string
    args?: string[]
    optional: Partial<BrowserOptions>
    test: (b: BrowserProfile) => Promise<boolean>
}

interface Browser {
    name: string
    profiles: Partial<Record<OS, BrowserProfile>>
}

export { OS, Browser, BrowserOptions, BrowserProfile }
