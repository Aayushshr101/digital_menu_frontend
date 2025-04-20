"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { statsApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

// Import FusionCharts
import FusionCharts from "fusioncharts"
import Charts from "fusioncharts/fusioncharts.charts"
import FusionTheme from "fusioncharts/themes/fusioncharts.theme.fusion"
import ReactFC from "react-fusioncharts"

// Initialize FusionCharts
ReactFC.fcRoot(FusionCharts, Charts, FusionTheme)

export default function AdminDashboardPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [dailyRevenue, setDailyRevenue] = useState<any>(null)
  const [weeklyRevenue, setWeeklyRevenue] = useState<any>(null)
  const [monthlyRevenue, setMonthlyRevenue] = useState<any>(null)
  const [mostSoldItems, setMostSoldItems] = useState<any>(null)
  const [revenueByCategory, setRevenueByCategory] = useState<any>(null)
  const [yearOverYear, setYearOverYear] = useState<any>(null)
  const [orderStatus, setOrderStatus] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<any>(null)
  const [hourlyDistribution, setHourlyDistribution] = useState<any>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        // Fetch dashboard overview stats
        const dashboardData = await statsApi.getDashboardStats()
        setDashboardStats(dashboardData)

        // Fetch chart data
        const [
          dailyData,
          weeklyData,
          monthlyData,
          mostSoldData,
          categoryData,
          yearOverYearData,
          orderStatusData,
          paymentData,
          hourlyData,
        ] = await Promise.all([
          statsApi.getDailyRevenue(),
          statsApi.getWeeklyRevenue(),
          statsApi.getMonthlyRevenue(),
          statsApi.getMostSoldItems(),
          statsApi.getRevenueByCategory(),
          statsApi.getYearOverYearGrowth(),
          statsApi.getOrderStatusDistribution(),
          statsApi.getPaymentMethodDistribution(),
          statsApi.getHourlyOrderDistribution(),
        ])

        setDailyRevenue(dailyData)
        setWeeklyRevenue(weeklyData)
        setMonthlyRevenue(monthlyData)
        setMostSoldItems(mostSoldData)
        setRevenueByCategory(categoryData)
        setYearOverYear(yearOverYearData)
        setOrderStatus(orderStatusData)
        setPaymentMethods(paymentData)
        setHourlyDistribution(hourlyData)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [toast])

  // Update the dashboard component to match the backend data structure

  // For getDashboardStats
  const dashboardStatsConfig = {
    totalRevenue: dashboardStats?.totalRevenue || 0,
    totalOrders: dashboardStats?.totalOrders || 0,
    averageOrderValue: dashboardStats?.avgOrderValue || 0,
    activeTables: dashboardStats?.activeTables || 0,
    totalTables: dashboardStats?.totalTables || 0,
    revenueChange: dashboardStats?.revenueGrowth || 0,
    ordersChange: dashboardStats?.ordersGrowth || 0,
  }

  // For dailyRevenue chart
  const dailyRevenueConfig = {
    type: "line",
    width: "100%",
    height: "400",
    dataFormat: "json",
    dataSource: {
      chart: {
        caption: "Daily Revenue",
        subCaption: "Revenue for the past 7 days",
        xAxisName: "Day",
        yAxisName: "Revenue (Rs)",
        theme: "fusion",
        lineThickness: "2",
        showValues: "0",
        formatNumberScale: "0",
        numberPrefix: "Rs",
      },
      data:
        dailyRevenue?.map((item) => ({
          label: new Date(item.date).toLocaleDateString("en-US", { weekday: "short" }),
          value: item.revenue,
        })) || [],
    },
  }

  // For weeklyRevenue chart
  const weeklyRevenueConfig = {
    type: "column2d",
    width: "100%",
    height: "400",
    dataFormat: "json",
    dataSource: {
      chart: {
        caption: "Weekly Revenue",
        subCaption: "Revenue for the past 4 weeks",
        xAxisName: "Week",
        yAxisName: "Revenue (Rs)",
        theme: "fusion",
        showValues: "1",
        formatNumberScale: "0",
        numberPrefix: "Rs",
      },
      data:
        weeklyRevenue?.map((item) => ({
          label: item.week,
          value: item.revenue,
        })) || [],
    },
  }

  // For monthlyRevenue chart
  const monthlyRevenueConfig = {
    type: "line",
    width: "100%",
    height: "400",
    dataFormat: "json",
    dataSource: {
      chart: {
        caption: "Monthly Revenue",
        subCaption: "Revenue for the past 12 months",
        xAxisName: "Month",
        yAxisName: "Revenue (Rs)",
        theme: "fusion",
        lineThickness: "2",
        showValues: "0",
        formatNumberScale: "0",
        numberPrefix: "Rs",
      },
      data:
        monthlyRevenue?.map((item) => ({
          label: `${item.month} ${item.year}`,
          value: item.revenue,
        })) || [],
    },
  }

  // For mostSoldItems chart
  const mostSoldItemsConfig = {
    type: "bar2d",
    width: "100%",
    height: "400",
    dataFormat: "json",
    dataSource: {
      chart: {
        caption: "Most Sold Items",
        subCaption: "Top items by quantity sold",
        xAxisName: "Item",
        yAxisName: "Quantity",
        theme: "fusion",
        showValues: "1",
        formatNumberScale: "0",
      },
      data:
        mostSoldItems?.map((item) => ({
          label: item.name,
          value: item.totalQuantity,
        })) || [],
    },
  }

  // For revenueByCategory chart
  const revenueByCategoryConfig = {
    type: "pie2d",
    width: "100%",
    height: "400",
    dataFormat: "json",
    dataSource: {
      chart: {
        caption: "Revenue by Category",
        subCaption: "Distribution of revenue by menu category",
        showPercentValues: "1",
        showPercentInTooltip: "1",
        decimals: "1",
        useDataPlotColorForLabels: "1",
        theme: "fusion",
        numberPrefix: "Rs",
      },
      data:
        revenueByCategory?.map((item) => ({
          label: item.name,
          value: item.revenue,
        })) || [],
    },
  }

  // For yearOverYear chart
  const yearOverYearConfig = {
    type: "mscolumn2d",
    width: "100%",
    height: "400",
    dataFormat: "json",
    dataSource: {
      chart: {
        caption: "Year-over-Year Growth",
        subCaption: `Growth: ${yearOverYear?.growthPercentage?.toFixed(1)}%`,
        xAxisName: "Year",
        yAxisName: "Revenue (Rs)",
        theme: "fusion",
        showValues: "0",
        formatNumberScale: "0",
        numberPrefix: "Rs",
      },
      categories: [
        {
          category: [{ label: "Previous Year" }, { label: "Current Year" }],
        },
      ],
      dataset: [
        {
          seriesname: "Revenue",
          data: [{ value: yearOverYear?.previousYearRevenue || 0 }, { value: yearOverYear?.currentYearRevenue || 0 }],
        },
      ],
    },
  }

  // For orderStatus chart
  const orderStatusConfig = {
    type: "doughnut2d",
    width: "100%",
    height: "400",
    dataFormat: "json",
    dataSource: {
      chart: {
        caption: "Order Status Distribution",
        subCaption: "Distribution of orders by status",
        showPercentValues: "1",
        showPercentInTooltip: "1",
        decimals: "1",
        useDataPlotColorForLabels: "1",
        theme: "fusion",
        doughnutRadius: "60%",
        centerLabel: "$label: $value",
      },
      data:
        orderStatus?.map((item) => ({
          label: item.status.charAt(0).toUpperCase() + item.status.slice(1),
          value: item.count,
        })) || [],
    },
  }

  // For paymentMethods chart
  const paymentMethodsConfig = {
    type: "pie2d",
    width: "100%",
    height: "400",
    dataFormat: "json",
    dataSource: {
      chart: {
        caption: "Payment Methods",
        subCaption: "Distribution of payment methods",
        showPercentValues: "1",
        showPercentInTooltip: "1",
        decimals: "1",
        useDataPlotColorForLabels: "1",
        theme: "fusion",
      },
      data:
        paymentMethods?.map((item) => ({
          label: item.method.charAt(0).toUpperCase() + item.method.slice(1),
          value: item.count,
        })) || [],
    },
  }

  // For hourlyDistribution chart
  const hourlyDistributionConfig = {
    type: "column2d",
    width: "100%",
    height: "400",
    dataFormat: "json",
    dataSource: {
      chart: {
        caption: "Hourly Order Distribution",
        subCaption: "Number of orders by hour of day",
        xAxisName: "Hour",
        yAxisName: "Number of Orders",
        theme: "fusion",
        showValues: "1",
        formatNumberScale: "0",
      },
      data:
        hourlyDistribution?.map((item) => ({
          label: `${item.hour}:00`,
          value: item.count,
        })) || [],
    },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your restaurant's performance</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 w-24 bg-muted rounded"></div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-muted rounded mb-1"></div>
                <div className="h-4 w-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs{dashboardStats?.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats?.revenueGrowth > 0 ? "+" : ""}
                {dashboardStats?.revenueGrowth.toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{dashboardStats?.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats?.ordersGrowth > 0 ? "+" : ""}
                {dashboardStats?.ordersGrowth.toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs{dashboardStats?.avgOrderValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {/* We don't have AOV growth in the backend data */}
                Based on {dashboardStats?.totalOrders} orders
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats?.activeTables}</div>
              <p className="text-xs text-muted-foreground">Currently occupied tables</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue</CardTitle>
                <CardDescription>Revenue for the past 7 days</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="h-full w-full bg-muted/20 animate-pulse rounded-md flex items-center justify-center">
                    Loading chart...
                  </div>
                ) : dailyRevenue ? (
                  <ReactFC {...dailyRevenueConfig} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Most Sold Items</CardTitle>
                <CardDescription>Top 5 items by quantity sold</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="h-full w-full bg-muted/20 animate-pulse rounded-md flex items-center justify-center">
                    Loading chart...
                  </div>
                ) : mostSoldItems ? (
                  <ReactFC {...mostSoldItemsConfig} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="weekly" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Revenue</CardTitle>
                <CardDescription>Revenue for the past 4 weeks</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="h-full w-full bg-muted/20 animate-pulse rounded-md flex items-center justify-center">
                    Loading chart...
                  </div>
                ) : weeklyRevenue ? (
                  <ReactFC {...weeklyRevenueConfig} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Distribution of revenue by menu category</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="h-full w-full bg-muted/20 animate-pulse rounded-md flex items-center justify-center">
                    Loading chart...
                  </div>
                ) : revenueByCategory ? (
                  <ReactFC {...revenueByCategoryConfig} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="monthly" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Revenue for the past 12 months</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="h-full w-full bg-muted/20 animate-pulse rounded-md flex items-center justify-center">
                    Loading chart...
                  </div>
                ) : monthlyRevenue ? (
                  <ReactFC {...monthlyRevenueConfig} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Year-over-Year Growth</CardTitle>
                <CardDescription>Comparing current year with previous year</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="h-full w-full bg-muted/20 animate-pulse rounded-md flex items-center justify-center">
                    Loading chart...
                  </div>
                ) : yearOverYear ? (
                  <ReactFC {...yearOverYearConfig} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>Distribution of orders by status</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="h-full w-full bg-muted/20 animate-pulse rounded-md flex items-center justify-center">
                    Loading chart...
                  </div>
                ) : orderStatus ? (
                  <ReactFC {...orderStatusConfig} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Distribution of payment methods</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="h-full w-full bg-muted/20 animate-pulse rounded-md flex items-center justify-center">
                    Loading chart...
                  </div>
                ) : paymentMethods ? (
                  <ReactFC {...paymentMethodsConfig} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Hourly Order Distribution</CardTitle>
                <CardDescription>Number of orders by hour of day</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="h-full w-full bg-muted/20 animate-pulse rounded-md flex items-center justify-center">
                    Loading chart...
                  </div>
                ) : hourlyDistribution ? (
                  <ReactFC {...hourlyDistributionConfig} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
