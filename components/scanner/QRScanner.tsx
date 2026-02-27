"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Card } from "@/components/ui/Card"
import { Loader2, Camera, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void
  isScanning: boolean
}

export function QRScanner({ onScanSuccess, isScanning }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    // Only initialize if we're supposed to be scanning and haven't already
    if (!isScanning) {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error)
      }
      return
    }

    let mounted = true

    const startScanner = async () => {
      try {
        setIsInitializing(true)
        setError(null)

        // Request camera permissions first to check if they exist
        const devices = await Html5Qrcode.getCameras()
        
        if (!mounted) return

        if (devices && devices.length > 0) {
          setHasPermission(true)
          
          if (!scannerRef.current) {
               scannerRef.current = new Html5Qrcode("reader")
          }

          // Stop if already running to prevent overlap when re-enabling
          if (scannerRef.current.isScanning) {
              await scannerRef.current.stop()
          }

          await scannerRef.current.start(
            { facingMode: "environment" }, // Prefer back camera on mobile
            {
              fps: 10,
              // Calculate a responsive qrbox side based on screen width
              qrbox: (viewfinderWidth, viewfinderHeight) => {
                const minEdgePercentage = 0.70; // 70% of the smallest edge
                const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
                return {
                    width: qrboxSize,
                    height: qrboxSize
                }
              },
            },
            (decodedText) => {
              if (mounted) {
                 // Stop the scanner immediately upon successful read to prevent multi-fires
                 if (scannerRef.current?.isScanning) {
                    scannerRef.current.stop().then(() => {
                        onScanSuccess(decodedText)
                    }).catch(console.error)
                 } else {
                    onScanSuccess(decodedText)
                 }
              }
            },
            () => {
               // Handle parse errors silently
            }
          )
        } else {
          setHasPermission(false)
          setError("No cameras found on this device.")
        }
      } catch (err: any) {
        if (mounted) {
          console.error("Scanner Error:", err)
          setHasPermission(false)
          setError(err.message || "Failed to access camera. Please ensure permissions are granted.")
        }
      } finally {
        if (mounted) {
          setIsInitializing(false)
        }
      }
    }

    startScanner()

    return () => {
      mounted = false
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [isScanning, onScanSuccess])

  if (!isScanning) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 border border-white/5 min-h-[400px] bg-card text-center">
        <Loader2 className="w-8 h-8 text-accent-primary animate-spin mb-4" />
        <p className="text-primary font-medium">Processing Scan...</p>
      </Card>
    )
  }

  if (hasPermission === false || error) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 border border-accent-warning/20 bg-accent-warning/5 min-h-[400px] text-center">
        <AlertCircle className="w-12 h-12 text-accent-warning mb-4" />
        <h3 className="text-xl font-bold text-primary mb-2">Camera Access Required</h3>
        <p className="text-secondary text-sm max-w-sm mb-6">
          {error || "We couldn't access your camera. Please ensure you have granted camera permissions in your browser settings."}
        </p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Retry Access
        </Button>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border border-white/5 p-0 bg-black flex flex-col items-center relative min-h-[400px]">
      <div id="reader" className="w-full h-full min-h-[400px]"></div>
      
      {/* Overlay UI */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-center z-10 pointer-events-none">
         <div className="flex items-center gap-2 text-white/90 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium border border-white/10 shadow-lg">
            {isInitializing ? (
               <><Loader2 className="w-4 h-4 animate-spin" /> Starting camera...</>
            ) : (
               <><Camera className="w-4 h-4" /> Align QR code within frame</>
            )}
         </div>
      </div>
    </Card>
  )
}
