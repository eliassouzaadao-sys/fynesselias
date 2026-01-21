"use client"

export function PageHeader({ title, description, actions, breadcrumb }) {
  return (
    <div className="mb-6">
      {breadcrumb && (
        <nav className="mb-2 flex items-center gap-1.5 text-sm text-fyn-text-muted">
          {breadcrumb.map((item, idx) => (
            <span key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <span className="text-fyn-text-light">/</span>}
              {item.href ? (
                <a href={item.href} className="hover:text-fyn-accent">
                  {item.label}
                </a>
              ) : (
                <span className="text-fyn-text">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fyn-text">{title}</h1>
          {description && <p className="mt-1 text-sm text-fyn-text-muted">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
