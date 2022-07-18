type Optional<T> = T | undefined

enum Platform {
    Unknown = 'unknown',
    Linux = 'linux',
    Mac = 'mac',
    Win = 'win',
}

enum Modifier {
    Alt = 'alt',
    Ctrl = 'ctrl',
    Meta = 'meta',
    Shift = 'shift',
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
    auxClickOnly: boolean
}

interface ProfileDisplay {
    val: string
    display?: string
}

type Clickable = Record<
    string,
    {
        popout?: boolean
    }
>

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
    Clickable,
    LOG_TYPE,
    Modifier,
    ModifierBinding,
    MouseButton,
    Optional,
    Platform,
    ProfileDisplay,
    ValidModifier,
}
