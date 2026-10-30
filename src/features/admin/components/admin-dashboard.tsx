import { Activity, Eye, MousePointerClick, Users } from "lucide-react"
import Link from "next/link"

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { AnalyticsResult, RankedMetric, VisitHeatmap } from "@/features/admin/analytics/types"
import { AdminPageHeading } from "@/features/admin/components/admin-page-heading"
import { cn } from "@/lib/utils"

const numberFormat = new Intl.NumberFormat("en-US")

function formatCount(value: number) {
  return numberFormat.format(value)
}

function formatChange(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0 ? "No traffic in the previous 30 days" : "Same as the previous 30 days"
  }

  const percent = Math.round(((current - previous) / previous) * 1000) / 10
  const sign = percent > 0 ? "+" : ""
  return `${sign}${percent}% from the previous 30 days`
}

const heatClasses = [
  "bg-muted",
  "bg-[color-mix(in_oklch,var(--chart-2)_28%,var(--muted))]",
  "bg-[color-mix(in_oklch,var(--chart-2)_52%,var(--muted))]",
  "bg-[color-mix(in_oklch,var(--chart-2)_76%,var(--muted))]",
  "bg-chart-2",
] as const

function heatLevel(value: number, max: number) {
  if (value <= 0 || max <= 0) {
    return 0
  }

  return Math.min(4, Math.max(1, Math.ceil((value / max) * 4)))
}

function HeatLegend() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span>Less</span>
      {heatClasses.map((className) => (
        <span key={className} className={cn("size-3.5 rounded-sm", className)} />
      ))}
      <span>More</span>
    </div>
  )
}

function PageviewHeatmap({ heatmap }: { heatmap: VisitHeatmap }) {
  const max = Math.max(...heatmap.days.flatMap((day) => day.counts), 0)

  return (
    <div className="overflow-x-auto">
      <div className="flex w-full min-w-max items-start gap-3">
        <div className="flex flex-col gap-1 pt-5">
          {heatmap.bands.map((band) => (
            <span key={band.label} className="flex h-4 items-center text-xs whitespace-nowrap text-muted-foreground">
              {band.label}
            </span>
          ))}
        </div>
        <div className="flex min-w-max flex-1 justify-between gap-1">
          {heatmap.days.map((day) => (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <span className="relative h-4 w-4">
                {day.showMonth ? (
                  <span className="absolute top-0 left-0 text-[10px] whitespace-nowrap text-muted-foreground">
                    {day.monthLabel}
                  </span>
                ) : null}
              </span>
              {day.counts.map((count, index) => (
                <span
                  key={heatmap.bands[index]?.label ?? index}
                  title={`${day.monthLabel} ${day.dayLabel}, ${heatmap.bands[index]?.label ?? ""} · ${formatCount(count)} pageviews`}
                  className={cn("size-4 shrink-0 rounded-sm", heatClasses[heatLevel(count, max)])}
                />
              ))}
              <span className="text-[10px] text-muted-foreground tabular-nums">{day.dayLabel}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RankList({ rows }: { rows: RankedMetric[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No data for this period.</p>
  }

  const max = Math.max(...rows.map((row) => row.value), 1)

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, index) => (
        <div key={`${row.name}-${index}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm">{row.name}</p>
            <div className="mt-1 h-1.5 rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(row.value / max) * 100}%` }} />
            </div>
          </div>
          <span className="text-sm text-muted-foreground tabular-nums">{formatCount(row.value)}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({
  title,
  value,
  detail,
  icon: Icon,
  href,
}: {
  title: string
  value: string
  detail: string
  icon: typeof Eye
  href?: string
}) {
  const card = (
    <Card className={href ? "h-full transition-colors hover:bg-muted/40" : undefined}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardAction>
          <Icon className="size-4 text-muted-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )

  if (!href) {
    return card
  }

  return (
    <Link href={href} className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring">
      {card}
    </Link>
  )
}

export function AdminDashboard({ analytics }: { analytics: AnalyticsResult }) {
  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeading title="Dashboard" description="Site traffic from Umami for the last 30 days." />
      {analytics.ok ? <AnalyticsOverview data={analytics.data} /> : <AnalyticsError message={analytics.error} />}
    </div>
  )
}

function AnalyticsError({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics unavailable</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
    </Card>
  )
}

function AnalyticsOverview({ data }: { data: Extract<AnalyticsResult, { ok: true }>["data"] }) {
  const cards = [
    {
      title: "Pageviews",
      value: formatCount(data.stats.pageviews),
      detail: formatChange(data.stats.pageviews, data.previous.pageviews),
      icon: Eye,
    },
    {
      title: "Visitors",
      value: formatCount(data.stats.visitors),
      detail: formatChange(data.stats.visitors, data.previous.visitors),
      icon: Users,
      href: "/admin/visitors",
    },
    {
      title: "Visits",
      value: formatCount(data.stats.visits),
      detail: formatChange(data.stats.visits, data.previous.visits),
      icon: MousePointerClick,
    },
    {
      title: "Active now",
      value: formatCount(data.activeVisitors),
      detail: "Visitors in the last 5 minutes",
      icon: Activity,
    },
  ]

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pageviews</CardTitle>
          <CardDescription>
            {data.heatmap.rangeLabel} · {formatCount(data.heatmap.total)} pageviews
          </CardDescription>
          <CardAction>
            <HeatLegend />
          </CardAction>
        </CardHeader>
        <CardContent>
          <PageviewHeatmap heatmap={data.heatmap} />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle>Top pages</CardTitle>
            <CardDescription>Most viewed paths</CardDescription>
          </CardHeader>
          <CardContent>
            <RankList rows={data.pages} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <RankList rows={data.referrers} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Browsers</CardTitle>
          </CardHeader>
          <CardContent>
            <RankList rows={data.browsers} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <RankList rows={data.countries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <RankList rows={data.devices} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
