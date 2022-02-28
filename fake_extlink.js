window._open = window.open
window.open = (e, t, n) => {
    let isExternalLink = false
    try {
        if (
            ['http:', 'https:'].indexOf(
                new URL(e).protocol
            ) != -1
        ) {
            isExternalLink = true
        }
    } catch (TypeError) {}
    if (isExternalLink) {
        const url = e
        const fakeID = 'fake_extlink'
        let fake = document.getElementById(fakeID)
        if (fake == null) {
            fake = document.createElement('span')
            fake.classList.add('fake-external-link')
            fake.setAttribute('id', fakeID)
            document.body.append(fake)
        }
        fake.setAttr('href', url)
    } else {
        window._open(e, t, n)
    }
}
window.document.addEventListener('click', (e) => {
    const fakeId = 'fake_extlink'
    if (e.target.classList == 'external-link') {
        const fake = document.getElementById(fakeId)
        if (fake != null) {
            e.preventDefault()
            const e_cp = new MouseEvent(e.type, e)
            fake.dispatchEvent(e_cp)
            fake.remove()
        } else {
            console.error(
                '[open-link-with] fake-el with "' +
                    fakeId +
                    '" not found'
            )
        }
    }
})
