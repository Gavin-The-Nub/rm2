"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/Input"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { supabase } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"
import { isSubscriptionCountedActive, memberStatusLabel } from "@/lib/memberSubscription"
import { phTodayISO, parseISODateAtPHMidnight } from "@/lib/phTime"

type SearchMember = {
  id: string
  name: string
  end_date: string
  status: "active" | "suspended" | "cancelled" | "expired"
  membership_type: "1_day" | "weekly" | "monthly"
}

type CheckInResult = {
  memberName: string
  remaining: string
  attendanceCount: number
  isSuccess: boolean
  message: string
}

function getRemainingLabel(endDateISO: string): string {
  const today = parseISODateAtPHMidnight(phTodayISO())
  const end = parseISODateAtPHMidnight(endDateISO)
  const dayDiff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (dayDiff < 0) return "Expired"
  if (dayDiff === 0) return "Expires today"
  if (dayDiff === 1) return "1 day remaining"
  return `${dayDiff} days remaining`
}

export function KioskCheckIn() {
  const [query, setQuery] = useState("")
  const [members, setMembers] = useState<SearchMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [pendingMember, setPendingMember] = useState<SearchMember | null>(null)
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setMembers([])
      setActiveIndex(0)
      return
    }

    const timer = window.setTimeout(async () => {
      setIsLoading(true)
      setErrorText(null)

      const { data, error } = await supabase
        .from("members")
        .select("id, name, end_date, status, membership_type")
        .ilike("name", `%${trimmed}%`)
        .order("name", { ascending: true })
        .limit(8)

      if (error) {
        console.error("Failed to search members:", error)
        setMembers([])
        setErrorText("Could not search members. Please try again.")
      } else {
        setMembers((data ?? []) as SearchMember[])
        setActiveIndex(0)
      }

      setIsLoading(false)
    }, 220)

    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!result) return
    const timer = window.setTimeout(() => {
      setResult(null)
      inputRef.current?.focus()
    }, 7000)
    return () => window.clearTimeout(timer)
  }, [result])

  useEffect(() => {
    if (!pendingMember) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPendingMember(null)
        inputRef.current?.focus()
      }
      if (event.key === "Enter" && !isSubmitting) {
        event.preventDefault()
        void runCheckIn(pendingMember)
        setPendingMember(null)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isSubmitting, pendingMember])

  const hintText = useMemo(() => {
    if (query.trim().length < 2) return "Type at least 2 letters to search."
    if (isLoading) return "Searching members..."
    if (pendingMember) return `Confirm identity for ${pendingMember.name}.`
    if (members.length === 0) return "No matching members."
    return "Use arrow keys and press Enter, then confirm."
  }, [isLoading, members.length, pendingMember, query])

  const requestCheckIn = (member: SearchMember) => {
    setPendingMember(member)
    setResult(null)
    setErrorText(null)
  }

  const selectedMember = members[activeIndex] ?? members[0] ?? null

  const runCheckIn = async (member: SearchMember) => {
    setIsSubmitting(true)
    setErrorText(null)

    const attendanceCountReq = supabase
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("member_id", member.id)

    const countFrom = async () => {
      const { count } = await attendanceCountReq
      return count ?? 0
    }

    if (!isSubscriptionCountedActive(member)) {
      const attendanceCount = await countFrom()
      setResult({
        memberName: member.name,
        remaining: getRemainingLabel(member.end_date),
        attendanceCount,
        isSuccess: false,
        message: `${memberStatusLabel(member)} membership cannot check in.`,
      })
      setIsSubmitting(false)
      return
    }

    const today = phTodayISO()
    const { error: insertError } = await supabase.from("attendance").insert({
      member_id: member.id,
      check_in_date: today,
    })

    const duplicate = insertError?.code === "23505"
    const unexpectedError = !!insertError && !duplicate

    if (unexpectedError) {
      console.error("Failed to check in member:", insertError)
      setErrorText("Check-in failed. Please try again.")
      setIsSubmitting(false)
      return
    }

    const attendanceCount = await countFrom()
    setResult({
      memberName: member.name,
      remaining: getRemainingLabel(member.end_date),
      attendanceCount,
      isSuccess: !duplicate,
      message: duplicate ? "Already checked in today." : "Check-in successful.",
    })

    setQuery("")
    setMembers([])
    setActiveIndex(0)
    setIsSubmitting(false)
    inputRef.current?.focus()
  }

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-base)] text-primary px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Image src="/rmlogo.png" alt="RM Fitness Gym" width={260} height={72} className="h-14 md:h-16 w-auto" priority />
          </div>
          <p className="text-secondary">Enter your name and press Enter to check in.</p>
        </div>

        <Card className="p-5 md:p-6 space-y-4">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (isSubmitting || pendingMember || !selectedMember) return
              requestCheckIn(selectedMember)
            }}
          >
            <div className="space-y-2">
              <Input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Type member name..."
                className="h-12 text-lg"
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault()
                    if (members.length === 0) return
                    setActiveIndex((prev) => (prev + 1) % members.length)
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault()
                    if (members.length === 0) return
                    setActiveIndex((prev) => (prev - 1 + members.length) % members.length)
                  }
                }}
              />
              <p className="text-xs text-muted">{hintText}</p>
              {errorText ? <p className="text-xs text-red-400">{errorText}</p> : null}
            </div>

            {members.length > 0 ? (
              <div className="border border-white/10 rounded-lg overflow-hidden">
                {members.map((member, index) => (
                  <button
                    type="button"
                    key={member.id}
                    onClick={() => requestCheckIn(member)}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b border-white/5 last:border-b-0 transition-colors",
                      "hover:bg-white/5 focus-visible:outline-none focus-visible:bg-white/5",
                      index === activeIndex && "bg-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-primary">{member.name}</span>
                      <Badge variant="neutral">{memberStatusLabel(member)}</Badge>
                    </div>
                    <div className="text-xs text-muted mt-1">{getRemainingLabel(member.end_date)}</div>
                  </button>
                ))}
              </div>
            ) : null}

            <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1}>
              submit
            </button>
          </form>
        </Card>

        {result ? (
          <Card
            className={cn(
              "p-5 md:p-6 border transition-all",
              result.isSuccess ? "border-emerald-500/30" : "border-amber-500/30"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className={cn("text-lg font-semibold", result.isSuccess ? "text-emerald-300" : "text-amber-300")}>
                  {result.message}
                </p>
                <p className="text-primary">
                  <span className="text-secondary">Member:</span> {result.memberName}
                </p>
                <p className="text-primary">
                  <span className="text-secondary">Remaining time:</span> {result.remaining}
                </p>
                <p className="text-primary">
                  <span className="text-secondary">Attendance:</span> {result.attendanceCount} total check-ins
                </p>
              </div>
              <Button variant="secondary" onClick={() => setResult(null)}>
                Close
              </Button>
            </div>
          </Card>
        ) : null}
      </div>

      {pendingMember ? (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 border border-white/10">
            <div className="space-y-5">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-primary">Confirm check-in</h2>
                <p className="text-sm text-secondary">
                  You are about to check in as <span className="text-primary font-medium">{pendingMember.name}</span>.
                </p>
                <p className="text-sm text-secondary">Is this correct?</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPendingMember(null)
                    inputRef.current?.focus()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    void runCheckIn(pendingMember)
                    setPendingMember(null)
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Checking in..." : "Yes, check in"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
