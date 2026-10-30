import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type {
  SessionPageView,
  VisitorSession,
  VisitorSessionResult,
  VisitorSessionsResult,
} from "@/features/admin/analytics/types"
import { AdminPageHeading } from "@/features/admin/components/admin-page-heading"

const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Shanghai",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

function formatWhen(value: string) {
  const time = Date.parse(value)
  if (!Number.isFinite(time)) {
    return "Unknown time"
  }

  return dateTimeFormat.format(time)
}

function placeLabel(session: VisitorSession) {
  const place = [session.city, session.region, session.country].filter(Boolean)
  return place.length > 0 ? place.join(", ") : "Unknown location"
}

function deviceLabel(session: VisitorSession) {
  const device = [session.browser, session.os, session.device].filter(Boolean)
  return device.length > 0 ? device.join(" · ") : "Unknown device"
}

function pageLabel(view: SessionPageView) {
  return view.eventName || view.urlPath
}

export function VisitorSessionList({ result }: { result: VisitorSessionsResult }) {
  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/admin" label="Dashboard" />
      <AdminPageHeading
        title="Visitors"
        description="Anonymous sessions from the last 30 days. Umami records the device and location, not a name or account."
      />
      {result.ok ? (
        <SessionTable sessions={result.data.sessions} total={result.data.total} />
      ) : (
        <ResultError message={result.error} />
      )}
    </div>
  )
}

function ResultError({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions unavailable</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
    </Card>
  )
}

function SessionTable({ sessions, total }: { sessions: VisitorSession[]; total: number }) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No sessions</CardTitle>
          <CardDescription>No visits were recorded in the last 30 days.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {sessions.length} session{sessions.length === 1 ? "" : "s"}
        </CardTitle>
        <CardDescription>
          {total > sessions.length ? `Showing the latest ${sessions.length} of ${total}.` : "Most recent visit first."}
        </CardDescription>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Last seen</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Device</TableHead>
            <TableHead className="text-right">Views</TableHead>
            <TableHead className="text-right">Visits</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell>
                <Link href={`/admin/visitors/${session.id}`} className="font-medium hover:underline">
                  {formatWhen(session.lastAt)}
                </Link>
              </TableCell>
              <TableCell>{placeLabel(session)}</TableCell>
              <TableCell>{deviceLabel(session)}</TableCell>
              <TableCell className="text-right tabular-nums">{session.views}</TableCell>
              <TableCell className="text-right tabular-nums">{session.visits}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

export function VisitorSessionDetail({ result }: { result: VisitorSessionResult }) {
  if (!result.ok) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink href="/admin/visitors" label="Visitors" />
        <ResultError message={result.error} />
      </div>
    )
  }

  const { session, activity } = result.data

  return (
    <div className="flex flex-col gap-4">
      <BackLink href="/admin/visitors" label="Visitors" />
      <AdminPageHeading title={placeLabel(session)} description={deviceLabel(session)} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Last seen" value={formatWhen(session.lastAt)} />
        <Fact label="First seen" value={formatWhen(session.firstAt)} />
        <Fact label="Views" value={String(session.views)} />
        <Fact label="Visits" value={String(session.visits)} />
      </div>
      {session.distinctIds.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Identified as</CardTitle>
            <CardDescription>{session.distinctIds.join(", ")}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Pages</CardTitle>
          <CardDescription>
            {session.language || "Unknown language"}
            {session.screen ? ` · ${session.screen}` : ""}
          </CardDescription>
        </CardHeader>
        {activity.length === 0 ? (
          <p className="px-(--card-spacing) text-sm text-muted-foreground">
            No page views were recorded for this session.
          </p>
        ) : (
          <ol className="flex flex-col">
            {activity.map((view, index) => (
              <li
                key={`${view.createdAt}-${index}`}
                className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 border-t px-(--card-spacing) py-3"
              >
                <time className="text-sm text-muted-foreground">{formatWhen(view.createdAt)}</time>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{pageLabel(view)}</p>
                  {view.referrerDomain ? (
                    <p className="truncate text-xs text-muted-foreground">from {view.referrerDomain}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <CardDescription className="text-base text-foreground">{value}</CardDescription>
      </CardHeader>
    </Card>
  )
}

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      {label}
    </Link>
  )
}
