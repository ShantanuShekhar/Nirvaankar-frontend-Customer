type UspItem = { title: string; text: string }

export function UspRowBlock({ props }: { props?: Record<string, unknown> }) {
  const title = String(props?.title ?? '')
  const items = (props?.items as UspItem[] | undefined) ?? []

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {title ? <h2 className="font-display text-3xl text-[var(--color-brand)]">{title}</h2> : null}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.title}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5"
          >
            <h3 className="font-display text-2xl text-[var(--color-brand)]">{item.title}</h3>
            <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
