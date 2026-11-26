export function moveWorkCardHighlight(event) {
  if (event.pointerType !== 'mouse') return
  const card = event.target.closest('.work-card')
  if (!card) return
  const bounds = card.getBoundingClientRect()
  card.style.setProperty('--control-x', `${event.clientX - bounds.left}px`)
  card.style.setProperty('--control-y', `${event.clientY - bounds.top}px`)
}
