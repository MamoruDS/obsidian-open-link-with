enum Platform {
    Unknown = 'unknown',
    Linux = 'linux',
    Mac = 'mac',
    Win = 'win',
}
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
    profiles: Partial<
        Record<NodeJS.Platform, BrowserProfile>
    >
}

type ValidModifier =
    | 'none'
    | 'ctrl'
    | 'meta'
    | 'alt'
    | 'shift'

interface ModifierBinding {
    id: string
    browser?: string
    platform: Platform
    modifier: ValidModifier
    allowAuxClick: boolean
}

type LOG_TYPE = 'info' | 'warn' | 'error'

export {
    Browser,
    BrowserOptions,
    BrowserProfile,
    LOG_TYPE,
    ModifierBinding,
    ValidModifier,
    Platform,
}
