import "server-only"

import { getUmamiApiConfig } from "@/config/umami"

import type { AnalyticsCounts, AnalyticsResult, HeatmapDay, RankedMetric, VisitHeatmap } from "./types"
import { umamiFailure, umamiGet } from "./umami-request"

const rangeDays = 30
const timezone = "Asia/Shanghai"
const metricLimit = 8
const hourBands = [18, 12, 6, 0]
const hourBandHours = 6

const shanghaiStamp = new Intl.DateTimeFormat("en-US", {
  timeZone: timezone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
})

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: timezone,
  month: "short",
  day: "numeric",
})

const shortMonthFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: timezone,
  month: "short",
})

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: timezone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function readCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function readCounts(value: unknown): AnalyticsCounts {
  const record = isRecord(value) ? value : {}

  return {
    pageviews: readCount(record.pageviews),
    visitors: readCount(record.visitors),
    visits: readCount(record.visits),
    bounces: readCount(record.bounces),
    totaltime: readCount(record.totaltime),
  }
}

function shanghaiDay(value: number | string) {
  return dayFormatter.format(new Date(value))
}

function shiftDay(day: string, amount: number) {
  const [year, month, date] = day.split("-").map(Number)
  const next = new Date(Date.UTC(year, month - 1, date + amount))
  const nextYear = next.getUTCFullYear()
  const nextMonth = String(next.getUTCMonth() + 1).padStart(2, "0")
  const nextDate = String(next.getUTCDate()).padStart(2, "0")

  return `${nextYear}-${nextMonth}-${nextDate}`
}

function eachDay(startAt: number, endAt: number) {
  const start = shanghaiDay(startAt)
  const end = shanghaiDay(endAt)
  const days: string[] = []
  let cursor = start

  while (cursor <= end && days.length < 400) {
    days.push(cursor)
    cursor = shiftDay(cursor, 1)
  }

  return days
}

function shanghaiParts(value: number | string) {
  const parts = shanghaiStamp.formatToParts(new Date(value))
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? ""
  const hour = Number(read("hour"))

  return {
    day: `${read("year")}-${read("month")}-${read("day")}`,
    hour: Number.isFinite(hour) ? hour % 24 : 0,
  }
}

function bandIndex(hour: number) {
  return hourBands.indexOf(Math.floor(hour / hourBandHours) * hourBandHours)
}

function readHourlyPageviews(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.pageviews)) {
    return []
  }

  return value.pageviews.flatMap((point) => {
    if (!isRecord(point) || typeof point.x !== "string") {
      return []
    }

    const stamp = shanghaiParts(point.x)
    return [{ day: stamp.day, band: bandIndex(stamp.hour), total: readCount(point.y) }]
  })
}

function buildHeatmap(points: { day: string; band: number; total: number }[], days: string[]): VisitHeatmap {
  const totals = new Map<string, number>()
  for (const point of points) {
    if (point.band < 0) {
      continue
    }
    const key = `${point.day}:${point.band}`
    totals.set(key, (totals.get(key) ?? 0) + point.total)
  }

  const columns: HeatmapDay[] = days.map((day, index) => {
    const previous = index > 0 ? days[index - 1].slice(0, 7) : ""
    const noon = new Date(`${day}T12:00:00+08:00`)

    return {
      date: day,
      monthLabel: shortMonthFormatter.format(noon),
      dayLabel: String(Number(day.slice(8))),
      showMonth: day.slice(0, 7) !== previous,
      counts: hourBands.map((_, band) => totals.get(`${day}:${band}`) ?? 0),
    }
  })
  const total = columns.reduce((sum, day) => sum + day.counts.reduce((daySum, count) => daySum + count, 0), 0)
  const first = days[0]
  const last = days[days.length - 1]
  const rangeLabel =
    first && last
      ? `${monthFormatter.format(new Date(`${first}T12:00:00+08:00`))} – ${monthFormatter.format(new Date(`${last}T12:00:00+08:00`))}`
      : ""

  return {
    rangeLabel,
    total,
    bands: hourBands.map((start) => ({ label: `${start}–${start + hourBandHours}h` })),
    days: columns,
  }
}

function readMetrics(value: unknown, emptyLabel: string): RankedMetric[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return []
    }

    const name = typeof item.x === "string" && item.x.trim() ? item.x.trim() : emptyLabel
    return [{ name, value: readCount(item.y) }]
  })
}

export async function loadAdminAnalytics(): Promise<AnalyticsResult> {
  if (!getUmamiApiConfig()) {
    return { ok: false, error: "UMAMI_API_KEY is not set" }
  }

  const endAt = Date.now()
  const startAt = endAt - rangeDays * 24 * 60 * 60 * 1000
  const heatmapStart = Date.parse(`${shiftDay(shanghaiDay(endAt), -(rangeDays - 1))}T00:00:00+08:00`)
  const heatmapDays = eachDay(heatmapStart, endAt)
  const range = {
    startAt: String(startAt),
    endAt: String(endAt),
    timezone,
  }
  const heatmapRange = {
    startAt: String(heatmapStart),
    endAt: String(endAt),
    timezone,
  }
  const metrics = (type: string) => new URLSearchParams({ ...range, type, limit: String(metricLimit) })

  try {
    const [statsBody, activeBody, pageviewsBody, pagesBody, referrersBody, browsersBody, countriesBody, devicesBody] =
      await Promise.all([
        umamiGet("/stats", new URLSearchParams(range)),
        umamiGet("/active", new URLSearchParams()),
        umamiGet("/pageviews", new URLSearchParams({ ...heatmapRange, unit: "hour" })),
        umamiGet("/metrics", metrics("path")),
        umamiGet("/metrics", metrics("referrer")),
        umamiGet("/metrics", metrics("browser")),
        umamiGet("/metrics", metrics("country")),
        umamiGet("/metrics", metrics("device")),
      ])

    const stats = readCounts(statsBody)
    const previous = readCounts(isRecord(statsBody) ? statsBody.comparison : null)

    return {
      ok: true,
      data: {
        activeVisitors: isRecord(activeBody) ? readCount(activeBody.visitors) : 0,
        stats,
        previous,
        heatmap: buildHeatmap(readHourlyPageviews(pageviewsBody), heatmapDays),
        pages: readMetrics(pagesBody, "Unknown"),
        referrers: readMetrics(referrersBody, "Direct"),
        browsers: readMetrics(browsersBody, "Unknown"),
        countries: readMetrics(countriesBody, "Unknown"),
        devices: readMetrics(devicesBody, "Unknown"),
      },
    }
  } catch (error) {
    return { ok: false, error: umamiFailure(error) }
  }
}
