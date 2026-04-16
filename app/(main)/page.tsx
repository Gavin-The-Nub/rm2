import { StatCard } from "@/components/dashboard/StatCard"
import { MiniChart } from "@/components/dashboard/MiniChart"
import { PeakHoursChart } from "@/components/dashboard/PeakHoursChart"
import { createClient } from "@/utils/supabase/server"
import { startOfDay, startOfMonth, subDays, format, isAfter, parseISO, isSameDay } from "date-fns"
import { isSubscriptionCountedActive, memberSubscriptionCategory } from "@/lib/memberSubscription"
import { PH_TIME_ZONE, phTodayISO } from "@/lib/phTime"

// Ensure dynamic rendering because we fetch live database
export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: membersResponse } = await supabase.from('members').select('*')
  const { data: renewalsResponse } = await supabase.from('renewals').select('*')
  const attendanceWindowStart = format(subDays(new Date(), 29), "yyyy-MM-dd")
  const { data: attendanceResponse } = await supabase
    .from("attendance")
    .select("check_in_date, created_at")
    .gte("check_in_date", attendanceWindowStart)

  const members = membersResponse || []
  const renewals = renewalsResponse || []
  const attendance = attendanceResponse || []
  const renewalDate = (r: any) => r.created_at || r.renewal_date
  const renewalAmount = (r: any) => Number(r.payment_amount ?? r.amount ?? 0)

  const today = new Date()
  const todayStart = startOfDay(today)
  const thisMonthStart = startOfMonth(today)
  const todayInPH = phTodayISO()
  
  // Keep status logic aligned with Members page (considers end_date + raw status)
  const activeMembers = members.filter((m) => isSubscriptionCountedActive(m))
  const totalActiveMembers = activeMembers.length

  // Today's New Members
  const todaysNewMembers = members.filter(m => m.created_at && isSameDay(parseISO(m.created_at), todayStart))
  
  // Today's Revenue
  const todaysMemberSales = members.filter(m => m.created_at && isSameDay(parseISO(m.created_at), todayStart)).reduce((sum, m) => sum + (m.payment_amount || 0), 0)
  const todaysRenewalSales = renewals
    .filter(r => renewalDate(r) && isSameDay(parseISO(renewalDate(r)), todayStart))
    .reduce((sum, r) => sum + renewalAmount(r), 0)
  const todaysRevenue = todaysMemberSales + todaysRenewalSales
  
  // Monthly Revenue
  const monthlyMemberSales = members.filter(m => m.created_at && (isAfter(parseISO(m.created_at), thisMonthStart) || isSameDay(parseISO(m.created_at), thisMonthStart))).reduce((sum, m) => sum + (m.payment_amount || 0), 0)
  const monthlyRenewalSales = renewals
    .filter(r => renewalDate(r) && (isAfter(parseISO(renewalDate(r)), thisMonthStart) || isSameDay(parseISO(renewalDate(r)), thisMonthStart)))
    .reduce((sum, r) => sum + renewalAmount(r), 0)
  const monthlyRevenue = monthlyMemberSales + monthlyRenewalSales
  
  const expiringSoonCount = members.filter(
    (m) => memberSubscriptionCategory(m) === "expiring_soon"
  ).length

  const isSameISODate = (value: string | null | undefined, isoDate: string) => {
    if (!value) return false
    return value.slice(0, 10) === isoDate
  }

  const todaysCheckIns = attendance.filter((a) =>
    isSameISODate(a.check_in_date, todayInPH)
  ).length

  const todayAttendance = attendance.filter((a) =>
    isSameISODate(a.check_in_date, todayInPH)
  )

  const hourLabels = ["6AM", "9AM", "12PM", "3PM", "6PM", "9PM"]
  const hourBuckets: Record<string, number> = {
    "6AM": 0,
    "9AM": 0,
    "12PM": 0,
    "3PM": 0,
    "6PM": 0,
    "9PM": 0,
  }
  const getHourInPH = (value: string): number | null => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    const hourPart = new Intl.DateTimeFormat("en-US", {
      timeZone: PH_TIME_ZONE,
      hour: "2-digit",
      hour12: false,
    })
      .formatToParts(date)
      .find((p) => p.type === "hour")?.value
    if (!hourPart) return null
    const parsed = Number(hourPart)
    return Number.isNaN(parsed) ? null : parsed
  }

  todayAttendance.forEach((record) => {
    if (!record.created_at) return
    const hour = getHourInPH(record.created_at)
    if (hour === null) return
    if (hour >= 6 && hour < 9) hourBuckets["6AM"] += 1
    else if (hour >= 9 && hour < 12) hourBuckets["9AM"] += 1
    else if (hour >= 12 && hour < 15) hourBuckets["12PM"] += 1
    else if (hour >= 15 && hour < 18) hourBuckets["3PM"] += 1
    else if (hour >= 18 && hour < 21) hourBuckets["6PM"] += 1
    else if (hour >= 21) hourBuckets["9PM"] += 1
  })

  const peakHoursData = hourLabels.map((label) => ({
    hour: label,
    value: hourBuckets[label],
  }))
  const peakHourEntry = peakHoursData.reduce(
    (max, current) => (current.value > max.value ? current : max),
    { hour: "N/A", value: 0 }
  )
  const totalCheckInsToday = todayAttendance.length

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
    renewals.filter(r => renewalDate(r) && isDay(renewalDate(r))).forEach(r => {
      const parentMember = members.find(mx => mx.id === r.member_id)
      processPayment(r.membership_type || parentMember?.membership_type || '1_month', renewalAmount(r))
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
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Today's Check-Ins"
          value={todaysCheckIns.toString()}
          className="min-h-[160px]"
          chart={<MiniChart data={peakHoursData.map((item) => item.value)} color="#10B981" />}
        />
        <StatCard
          title="Today's Peak Hour"
          value={peakHourEntry.hour === "N/A" ? "N/A" : `${peakHourEntry.hour} (${peakHourEntry.value})`}
          className="min-h-[160px]"
          chart={<MiniChart data={peakHoursData.map((item) => item.value)} color="#F97316" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <PeakHoursChart
          data={peakHoursData}
          totalCheckIns={totalCheckInsToday}
          windowLabel="Today"
        />
      </div>
    </div>
  )
}
