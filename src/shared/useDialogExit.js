import { useEffect, useState } from 'react'

export function useDialogExit(dialog, animationName, onClose, playSound) {
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!closing) return
    const element = dialog.current
    const animation = element.getAnimations({ subtree: true }).find(item => item.animationName === animationName)
    let active = true
    async function finish() {
      await animation?.finished.catch(() => {})
      if (active && element.open) element.close()
    }
    finish()
    return () => { active = false }
  }, [animationName, closing, dialog])

  function requestClose(event) {
    event.preventDefault()
    if (closing) return
    playSound('close')
    setClosing(true)
  }

  function handleClose() {
    setClosing(false)
    onClose()
  }

  return { closing, requestClose, handleClose }
}
