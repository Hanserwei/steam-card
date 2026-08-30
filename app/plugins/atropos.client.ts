export default defineNuxtPlugin(async () => {
  // Atropos 2 exports this constructor at runtime, but its declaration currently marks the default export as type-only.
  // @ts-expect-error upstream declaration mismatch: https://github.com/nolimits4web/atropos
  const AtroposElement = (await import('atropos/element')).default as unknown as CustomElementConstructor

  if (!customElements.get('atropos-component'))
    customElements.define('atropos-component', AtroposElement)
})
