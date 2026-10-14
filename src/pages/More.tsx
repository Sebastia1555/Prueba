import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { Icon } from '../components/Icon'
import { Badge, PageHeader } from '../components/ui'
import { MORE_LINKS } from '../lib/nav'

export function More() {
  const { can } = useData()
  return (
    <div>
      <PageHeader title="Más" />
      <ul className="grid gap-3 sm:grid-cols-2">
        {MORE_LINKS.filter((l) => !l.perm || can(l.perm)).map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="ap-card flex items-center gap-3 p-4 hover:bg-black/[0.01]">
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px]" style={{ backgroundColor: '#e8f1fb', color: 'var(--ap-blue)' }}>
                <Icon name={l.icon} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[17px] font-semibold">{l.label}</span>
                  {l.badge && <Badge tone="amber">{l.badge}</Badge>}
                </div>
                <div className="text-[14px] text-[color:var(--ap-ink-2)]">{l.description}</div>
              </div>
              <Icon name="chevronRight" size={18} className="text-[color:var(--ap-ink-3)]" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
