"use client"

import { useState } from "react"
import { supabase } from "@/utils/supabase/client"
import { QRScanner } from "@/components/scanner/QRScanner"
import { ScanResultModal, ScanResultStatus } from "@/components/scanner/ScanResultModal"
import { Card } from "@/components/ui/Card"

export default function ScannerPage() {
  const [isScanning, setIsScanning] = useState(true)
  const [scanResult, setScanResult] = useState<{ member: any, status: ScanResultStatus } | null>(null)

  const handleScanSuccess = async (decodedText: string) => {
    // Only process one scan at a time
    if (!isScanning) return
    setIsScanning(false)
    
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
    }
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

      <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full max-w-2xl mx-auto relative px-4">
          <QRScanner 
            onScanSuccess={handleScanSuccess} 
            isScanning={isScanning} 
          />
          
          <Card className="mt-8 bg-card/50 border-white/5 w-full text-center">
            <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-2">Instructions</h3>
            <p className="text-sm text-muted">
              Align the member's QR code within the frame above. The system will automatically detect the code and validate the membership.
            </p>
          </Card>
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
