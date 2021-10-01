import { LOG_TYPE } from './types'

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

export { log }
