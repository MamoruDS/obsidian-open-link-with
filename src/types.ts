type Optional<T> = T | undefined

enum Platform {
    Unknown = 'unknown',
    Linux = 'linux',
    Mac = 'mac',
    Win = 'win',
}

enum MouseButton {
    Main,
    Auxiliary,
    Secondary,
    Fourth,
    Fifth,
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

interface ModifierBinding {
    id: string
    browser?: string
    platform: Platform
    modifier: ValidModifier
    allowAuxClick: boolean
}

interface ProfileDisplay {
    val: string
    display?: string
}

type LOG_TYPE = 'info' | 'warn' | 'error'

type ValidModifier =
    | 'none'
    | 'ctrl'
    | 'meta'
    | 'alt'
    | 'shift'

export {
    Browser,
    BrowserOptions,
    BrowserProfile,
    LOG_TYPE,
    ModifierBinding,
    MouseButton,
    Optional,
    Platform,
    ProfileDisplay,
    ValidModifier,
}
