import { StatCard } from "@/components/dashboard/StatCard"
import { MiniChart } from "@/components/dashboard/MiniChart"
import { WeeklyAttendanceChart, WeeklySalesChart } from "@/components/dashboard/WeeklyCharts"

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Active Members" 
          value="4,365" 
          delta={12.4} 
          deltaLabel="vs last month"
          className="md:col-span-2 min-h-[160px]"
          chart={<MiniChart data={[30, 40, 35, 50, 49, 60, 70, 91, 125]} color="#3B82F6" />}
        />
        <StatCard 
          title="Today's Check-Ins" 
          value="284" 
          delta={5.2} 
          className="min-h-[160px]"
          chart={<MiniChart data={[10, 20, 15, 25, 22, 30, 40]} color="#10B981" />}
        />
        <StatCard 
          title="Walk-in Count" 
          value="42" 
          delta={-2.1} 
          className="min-h-[160px]"
          chart={<MiniChart data={[5, 12, 8, 15, 10, 14, 9]} color="#F59E0B" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Today's Revenue" 
          value="₱1,250" 
          className="min-h-[160px]"
          chart={<MiniChart data={[200, 300, 250, 400, 350, 500, 600]} color="#10B981" />}
        />
        <StatCard 
          title="Monthly Revenue" 
          value="₱45,020" 
          delta={14.6} 
          className="min-h-[160px]"
          chart={<MiniChart data={[5000, 10000, 15000, 12000, 18000, 22000, 30000]} color="#3B82F6" />}
        />
        <StatCard 
          title="Expiring in 7 Days" 
          value="156" 
          delta={-8.4} 
          deltaLabel="Needs attention"
          className="md:col-span-2 min-h-[160px]"
          chart={<MiniChart data={[50, 40, 45, 30, 35, 20, 15]} color="#EF4444" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
        <WeeklyAttendanceChart />
        <WeeklySalesChart />
      </div>
    </div>
  )
}
