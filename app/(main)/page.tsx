import { StatCard } from "@/components/dashboard/StatCard"
import { MiniChart } from "@/components/dashboard/MiniChart"
import { WeeklySalesChart } from "@/components/dashboard/WeeklyCharts"
import { createClient } from "@/utils/supabase/server"
import { startOfDay, startOfMonth, subDays, format, isAfter, parseISO, isSameDay } from "date-fns"
import { memberSubscriptionCategory } from "@/lib/memberSubscription"

// Ensure dynamic rendering because we fetch live database
export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: membersResponse } = await supabase.from('members').select('*')
  const { data: renewalsResponse } = await supabase.from('renewals').select('*')

  const members = membersResponse || []
  const renewals = renewalsResponse || []

  const today = new Date()
  const todayStart = startOfDay(today)
  const thisMonthStart = startOfMonth(today)
  
  // Total Active Members
  const activeMembers = members.filter(m => m.status === 'active')
  const totalActiveMembers = activeMembers.length

  // Walk-in Count (1_day memberships created today)
  const walkInToday = members.filter(m => m.membership_type === '1_day' && m.created_at && isSameDay(parseISO(m.created_at), todayStart))
  
  // Today's New Members
  const todaysNewMembers = members.filter(m => m.created_at && isSameDay(parseISO(m.created_at), todayStart))
  
  // Today's Revenue
  const todaysMemberSales = members.filter(m => m.created_at && isSameDay(parseISO(m.created_at), todayStart)).reduce((sum, m) => sum + (m.payment_amount || 0), 0)
  const todaysRenewalSales = renewals.filter(r => r.renewal_date && isSameDay(parseISO(r.renewal_date), todayStart)).reduce((sum, r) => sum + (r.amount || 0), 0)
  const todaysRevenue = todaysMemberSales + todaysRenewalSales
  
  // Monthly Revenue
  const monthlyMemberSales = members.filter(m => m.created_at && (isAfter(parseISO(m.created_at), thisMonthStart) || isSameDay(parseISO(m.created_at), thisMonthStart))).reduce((sum, m) => sum + (m.payment_amount || 0), 0)
  const monthlyRenewalSales = renewals.filter(r => r.renewal_date && (isAfter(parseISO(r.renewal_date), thisMonthStart) || isSameDay(parseISO(r.renewal_date), thisMonthStart))).reduce((sum, r) => sum + (r.amount || 0), 0)
  const monthlyRevenue = monthlyMemberSales + monthlyRenewalSales
  
  const expiringSoonCount = members.filter(
    (m) => memberSubscriptionCategory(m) === "expiring_soon"
  ).length

  // WEEKLY CHARTS DATA PREP
  // Last 7 days including today
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(todayStart, 6 - i)
    return {
      date: d,
      name: format(d, 'EEE MMM d'), // Mon Apr 7, etc.
    }
  })

  const weeklySalesData = last7Days.map(day => {
    const isDay = (dateString: string) => isSameDay(parseISO(dateString), day.date)
    
    let oneDaySales = 0
    let weeklySales = 0
    let monthlySales = 0

    const processPayment = (type: string, amount: number) => {
      if (type === '1_day') oneDaySales += amount
      else if (type === '1_week') weeklySales += amount
      else if (type === '1_month' || type === 'student_1_month') monthlySales += amount
    }

    // Members created on this day
    members.filter(m => m.created_at && isDay(m.created_at)).forEach(m => {
      processPayment(m.membership_type, m.payment_amount || 0)
    })

    // Renewals on this day
    renewals.filter(r => r.renewal_date && isDay(r.renewal_date)).forEach(r => {
      const parentMember = members.find(mx => mx.id === r.member_id)
      processPayment(parentMember?.membership_type || '1_month', r.amount || 0)
    })

    return {
      name: day.name,
      '1 Day': oneDaySales,
      'Weekly': weeklySales,
      'Monthly': monthlySales,
      total: oneDaySales + weeklySales + monthlySales
    }
  })

  const salesTotals = weeklySalesData.map(d => d.total)
  const walkinTotals = weeklySalesData.map(d => d['1 Day'])

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Active Members" 
          value={totalActiveMembers.toLocaleString()} 
          delta={0} // Kept for layout, could be calculated against last month
          deltaLabel="vs last month"
          className="md:col-span-2 min-h-[160px]"
          chart={<MiniChart data={salesTotals.length > 0 ? salesTotals : [0,0,0,0,0,0,0]} color="#3B82F6" />}
        />
        <StatCard 
          title="Today's New Members" 
          value={todaysNewMembers.length.toString()} 
          delta={0} 
          className="min-h-[160px]"
          chart={<MiniChart data={salesTotals.length > 0 ? salesTotals : [0,0,0,0,0,0,0]} color="#10B981" />}
        />
        <StatCard 
          title="Walk-in Count" 
          value={walkInToday.length.toString()} 
          delta={0} 
          className="min-h-[160px]"
          chart={<MiniChart data={walkinTotals.length > 0 ? walkinTotals : [0,0,0,0,0,0,0]} color="#F59E0B" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Today's Revenue" 
          value={`₱${todaysRevenue.toLocaleString()}`} 
          className="min-h-[160px]"
          chart={<MiniChart data={salesTotals.length > 0 ? salesTotals : [0,0,0,0,0,0,0]} color="#10B981" />}
        />
        <StatCard 
          title="Monthly Revenue" 
          value={`₱${monthlyRevenue.toLocaleString()}`} 
          delta={0} 
          className="min-h-[160px]"
          chart={<MiniChart data={salesTotals.length > 0 ? salesTotals : [0,0,0,0,0,0,0]} color="#3B82F6" />}
        />
        <StatCard 
          title="Expiring in 3 Days" 
          value={expiringSoonCount.toString()} 
          delta={0} 
          deltaLabel="Needs attention"
          className="md:col-span-2 min-h-[160px]"
          chart={<MiniChart data={[0,0,0,0,0,0,0]} color="#F97316" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 mt-2">
        <WeeklySalesChart data={weeklySalesData} />
      </div>
    </div>
  )
}
