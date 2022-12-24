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

interface BrowserProfileBase {
    sysCmd?: string
    sysArgs?: string[]
    cmd: string
    args?: string[]
}

interface BrowserProfile extends BrowserProfileBase {
    optional: Partial<BrowserOptions>
    test: (b: BrowserProfile) => Promise<boolean>
}

interface Browser {
    name: string
    profiles: Partial<
        Record<NodeJS.Platform, BrowserProfile>
    >
    getExecCommands: (platform: NodeJS.Platform) => {
        main: string[]
        private?: string[]
    }
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

interface MWindow extends Window {
    mid: string
    oolwCIDs: string[]
    oolwPendingUrls: string[]
    _builtInOpen: (
        url?: string | URL,
        target?: any,
        features?: any
    ) => Window
}

type Clickable = {
    is_clickable: boolean
    url: string | undefined
    popout: boolean
    require_modifier?: Modifier[]
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
    BrowserProfileBase,
    Clickable,
    LOG_TYPE,
    Modifier,
    ModifierBinding,
    MouseButton,
    MWindow,
    Optional,
    Platform,
    ProfileDisplay,
    ValidModifier,
}
