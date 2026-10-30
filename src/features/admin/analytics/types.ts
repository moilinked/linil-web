export interface RankedMetric {
  name: string
  value: number
}

export interface AnalyticsCounts {
  pageviews: number
  visitors: number
  visits: number
  bounces: number
  totaltime: number
}

export interface HeatmapDay {
  date: string
  monthLabel: string
  dayLabel: string
  showMonth: boolean
  counts: number[]
}

export interface VisitHeatmap {
  rangeLabel: string
  total: number
  bands: { label: string }[]
  days: HeatmapDay[]
}

export interface AnalyticsSnapshot {
  activeVisitors: number
  stats: AnalyticsCounts
  previous: AnalyticsCounts
  heatmap: VisitHeatmap
  pages: RankedMetric[]
  referrers: RankedMetric[]
  browsers: RankedMetric[]
  countries: RankedMetric[]
  devices: RankedMetric[]
}

export type AnalyticsResult = { ok: true; data: AnalyticsSnapshot } | { ok: false; error: string }

export interface VisitorSession {
  id: string
  browser: string
  os: string
  device: string
  screen: string
  language: string
  country: string
  region: string
  city: string
  firstAt: string
  lastAt: string
  visits: number
  views: number
  distinctIds: string[]
}

export interface SessionPageView {
  createdAt: string
  urlPath: string
  referrerDomain: string
  eventName: string
}

export interface VisitorSessionList {
  sessions: VisitorSession[]
  total: number
}

export type VisitorSessionsResult = { ok: true; data: VisitorSessionList } | { ok: false; error: string }

export interface VisitorSessionDetail {
  session: VisitorSession
  activity: SessionPageView[]
}

export type VisitorSessionResult = { ok: true; data: VisitorSessionDetail } | { ok: false; error: string }
