import { Link } from 'react-router'

type Category = { name: string; slug: string }

export function CategoryStripBlock({ props }: { props?: Record<string, unknown> }) {
  const title = String(props?.title ?? 'Categories')
  const categories = (props?.categories as Category[] | undefined) ?? []

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="font-display text-3xl text-[var(--color-brand)]">{title}</h2>
      <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Link
            key={category.slug}
            to={`/category/${category.slug}`}
            className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-5 py-2.5 text-sm text-[var(--color-brand)] transition hover:border-[var(--color-brand)]"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </section>
  )
}
