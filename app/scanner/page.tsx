"use client"

import { useState } from "react"
import { supabase } from "@/utils/supabase/client"
import { QRScanner } from "@/components/scanner/QRScanner"
import { ScanResultModal, ScanResultStatus } from "@/components/scanner/ScanResultModal"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Loader2 } from "lucide-react"

export default function ScannerPage() {
  const [isScanning, setIsScanning] = useState(true)
  const [scanResult, setScanResult] = useState<{ member: any, status: ScanResultStatus } | null>(null)

  const [manualId, setManualId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleScanSuccess = async (decodedText: string) => {
    // Only process one scan at a time
    if (!isScanning) return
    setIsScanning(false)
    setIsSubmitting(true)
    
    try {
      // 1. Lookup member by QR code
      const { data: member, error: lookupError } = await supabase
        .from('members')
        .select('*, attendance(check_in_date)')
        .eq('qr_code', decodedText)
        .single()

      if (lookupError || !member) {
         setScanResult({ member: null, status: 'invalid_qr' })
         return
      }

      // 2. Check Status
      if (member.status === 'suspended') {
         setScanResult({ member, status: 'suspended' })
         return
      }

      // 3. Check Date Validity
      const todayNode = new Date()
      // Use local timezone midnight
      const todayDateOnly = new Date(todayNode.getFullYear(), todayNode.getMonth(), todayNode.getDate()).getTime()
      
      // We parse the string bounds ensuring they are treated as local midnight 
      const startParts = member.start_date.split('-').map(Number)
      const endParts = member.end_date.split('-').map(Number)
      
      const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]).getTime()
      const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]).getTime()

      if (todayDateOnly < startDate || todayDateOnly > endDate) {
         setScanResult({ member, status: 'expired' })
         return
      }

      // 4. Check Attendance for today
      // Formatting today's date to match DB (YYYY-MM-DD)
      const todayStr = todayNode.toISOString().split('T')[0]
      const hasCheckedInToday = member.attendance?.some((record: any) => record.check_in_date === todayStr)

      if (hasCheckedInToday) {
         setScanResult({ member, status: 'already_checked_in' })
         return
      }

      // 5. Success - record attendance
      const { error: insertError } = await supabase
        .from('attendance')
        .insert({
          member_id: member.id,
          check_in_date: todayStr
        })

      if (insertError) {
         console.error("Failed to insert attendance:", insertError)
         throw insertError
      }

      setScanResult({ member, status: 'success' })

    } catch (err) {
      console.error("Scanning Error:", err)
      setScanResult({ member: null, status: 'invalid_qr' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualId.trim() || !isScanning) return
    handleScanSuccess(manualId.trim())
    setManualId("") // Clear after success attempt
  }

  const handleModalClose = () => {
    setScanResult(null)
    // Add a slight delay before re-enabling scanner to ensure the user has moved the code away
    setTimeout(() => {
       setIsScanning(true)
    }, 1500)
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto h-[calc(100vh-80px)]">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">QR Scanner</h1>
          <p className="text-sm text-secondary mt-1 tracking-wide">Validate memberships and track attendance</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full max-w-4xl mx-auto relative px-4">
          <QRScanner 
            onScanSuccess={handleScanSuccess} 
            isScanning={isScanning} 
          />
          
          <div className="mt-8 grid gap-4 w-full">
            <Card className="bg-card/50 border-white/5 w-full text-center">
              <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-2">Manual Input</h3>
              <form onSubmit={handleManualSubmit} className="flex gap-2 max-w-md mx-auto">
                <Input 
                  placeholder="Enter Scan ID (e.g. RM1234)" 
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  disabled={!isScanning || isSubmitting}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={!isScanning || isSubmitting || !manualId.trim()}
                  className="px-6"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check In"}
                </Button>
              </form>
            </Card>

            <Card className="bg-card/30 border-white/5 w-full text-center p-4">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Instructions</h3>
              <p className="text-xs text-muted/80">
                Align the member's QR code within the frame above or enter the Scan ID manually if the camera is unavailable.
              </p>
            </Card>
          </div>
      </div>

      {scanResult && (
        <ScanResultModal 
          member={scanResult.member} 
          status={scanResult.status} 
          onClose={handleModalClose} 
        />
      )}
    </div>
  )
}
