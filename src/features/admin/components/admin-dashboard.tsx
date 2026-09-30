import { Activity, CreditCard, DollarSign, Users } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const overviewData = [
  { name: "Jan", total: 1600 },
  { name: "Feb", total: 2600 },
  { name: "Mar", total: 3300 },
  { name: "Apr", total: 2000 },
  { name: "May", total: 2800 },
  { name: "Jun", total: 2700 },
  { name: "Jul", total: 5900 },
  { name: "Aug", total: 6100 },
  { name: "Sep", total: 3600 },
  { name: "Oct", total: 2100 },
  { name: "Nov", total: 4800 },
  { name: "Dec", total: 4900 },
] as const

const overviewMax = 6000

const recentSales = [
  { name: "Olivia Martin", email: "olivia.martin@email.com", amount: "+$1,999.00", initials: "OM" },
  { name: "Jackson Lee", email: "jackson.lee@email.com", amount: "+$39.00", initials: "JL" },
  { name: "Isabella Nguyen", email: "isabella.nguyen@email.com", amount: "+$299.00", initials: "IN" },
  { name: "William Kim", email: "will@email.com", amount: "+$99.00", initials: "WK" },
  { name: "Sofia Davis", email: "sofia.davis@email.com", amount: "+$39.00", initials: "SD" },
] as const

const statCards = [
  {
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1% from last month",
    icon: DollarSign,
  },
  {
    title: "Subscriptions",
    value: "+2350",
    change: "+180.1% from last month",
    icon: Users,
  },
  {
    title: "Sales",
    value: "+12,234",
    change: "+19% from last month",
    icon: CreditCard,
  },
  {
    title: "Active Now",
    value: "+573",
    change: "+201 since last hour",
    icon: Activity,
  },
] as const

function OverviewChart() {
  return (
    <div className="flex h-[350px] gap-3">
      <div className="flex h-[calc(100%-1.25rem)] flex-col justify-between text-xs text-muted-foreground">
        <span>$6000</span>
        <span>$4500</span>
        <span>$3000</span>
        <span>$1500</span>
        <span>$0</span>
      </div>
      <div className="relative flex min-w-0 flex-1 items-end gap-2">
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-5 flex flex-col justify-between">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="border-t border-border/70" />
          ))}
        </div>
        {overviewData.map((item) => (
          <div key={item.name} className="relative flex h-full min-w-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0" style={{ flexGrow: overviewMax - item.total, flexBasis: 0 }} />
              <div className="min-h-1 rounded-t-md bg-primary" style={{ flexGrow: item.total, flexBasis: 0 }} />
            </div>
            <span className="mt-2 h-4 text-center text-xs text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentSales() {
  return (
    <div className="space-y-8">
      {recentSales.map((sale) => (
        <div key={sale.email} className="flex items-center gap-4">
          <Avatar className="size-9">
            <AvatarFallback>{sale.initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="text-sm leading-none font-medium">{sale.name}</p>
              <p className="truncate text-sm text-muted-foreground">{sale.email}</p>
            </div>
            <div className="text-sm font-medium">{sale.amount}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function AdminDashboard() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <Tabs defaultValue="overview">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports" disabled>
              Reports
            </TabsTrigger>
            <TabsTrigger value="notifications" disabled>
              Notifications
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => (
              <Card key={card.title}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <CardAction>
                    <card.icon className="size-4 text-muted-foreground" />
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <OverviewChart />
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>You made 265 sales this month.</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSales />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Traffic and conversion charts will appear in this tab.</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
