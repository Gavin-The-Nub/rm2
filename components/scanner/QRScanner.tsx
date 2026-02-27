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
      const stopScanner = async () => {
        if (scannerRef.current?.isScanning) {
          try {
            await scannerRef.current.stop()
          } catch (err) {
            console.warn("Error stopping scanner:", err)
          }
        }
      }
      stopScanner()
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

          if (!mounted) return

          await scannerRef.current.start(
            { facingMode: "environment" }, // Prefer back camera on mobile
            {
              fps: 20, // Increased for smoother detection
              aspectRatio: 1.0,
              disableFlip: false,
              videoConstraints: {
                facingMode: "environment",
                focusMode: "continuous", // Modern browsers on Android support this
                // Point of interest for focus can be helpful if supported
                // @ts-ignore - experimental constraints
                advanced: [{ focusMode: "continuous" }]
              },
              qrbox: (viewfinderWidth, viewfinderHeight) => {
                const width = viewfinderWidth || window.innerWidth || 300;
                const height = viewfinderHeight || window.innerHeight || 300;
                const minEdgeSize = Math.min(width, height);
                // Slightly larger box for easier alignment
                const qrboxSize = Math.max(200, Math.floor(minEdgeSize * 0.75));
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
      const cleanup = async () => {
        if (scannerRef.current?.isScanning) {
          try {
            await scannerRef.current.stop()
          } catch (err) {
            console.error("Cleanup error:", err)
          }
        }
      }
      cleanup()
    }
  }, [isScanning, onScanSuccess])

  if (!isScanning) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 border border-white/5 p-0 bg-card text-center min-h-[500px] w-full max-w-4xl mx-auto">
        <Loader2 className="w-8 h-8 text-accent-primary animate-spin mb-4" />
        <p className="text-primary font-medium">Processing Scan...</p>
      </Card>
    )
  }

  if (hasPermission === false || error) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 border border-accent-warning/20 bg-accent-warning/5 text-center min-h-[500px] w-full max-w-4xl mx-auto">
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
    <Card className="w-full overflow-hidden border border-white/5 p-0 bg-black flex flex-col items-center relative min-h-[500px]">
      <div id="reader" className="w-full h-full min-h-[500px]"></div>
      
      {/* Scanning Animation / Border Overlay */}
      {!isInitializing && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <div className="w-[70%] h-[70%] border border-white/5 rounded-[32px] relative overflow-hidden backdrop-blur-[2px]">
            {/* Corner Accents - Liquid Style */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-[#0A84FF] rounded-tl-2xl shadow-[0_0_15px_rgba(10,132,255,0.5)]"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-[#0A84FF] rounded-tr-2xl shadow-[0_0_15px_rgba(10,132,255,0.5)]"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-[#0A84FF] rounded-bl-2xl shadow-[0_0_15px_rgba(10,132,255,0.5)]"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-[#0A84FF] rounded-br-2xl shadow-[0_0_15px_rgba(10,132,255,0.5)]"></div>
            
            {/* Scanning Line - Liquid Style */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#0A84FF] to-transparent shadow-[0_0_20px_#0A84FF] animate-[scan_3s_ease-in-out_infinite]"></div>
            
            {/* Ambient Inner Glow */}
            <div className="absolute inset-0 border border-white/5 rounded-[32px] shadow-[inset_0_0_50px_rgba(10,132,255,0.05)]"></div>
          </div>
        </div>
      )}

      {/* Overlay UI - Glassmorphic Instructions */}
      <div className="absolute top-8 left-0 right-0 px-6 flex justify-center z-30 pointer-events-none">
         <div className="flex items-center gap-3 text-white/90 bg-white/[0.05] backdrop-blur-[24px] px-5 py-2.5 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-500">
            {isInitializing ? (
               <><Loader2 className="w-4 h-4 animate-spin text-[#0A84FF]" /> <span className="text-[13px] font-medium tracking-wide">Calibrating Lens...</span></>
            ) : (
               <><Camera className="w-4 h-4 text-[#0A84FF]" /> <span className="text-[13px] font-medium tracking-wide">Position QR Code within frame</span></>
            )}
         </div>
      </div>

      <style jsx global>{`
        #reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 0px !important;
        }
        #reader {
          border: none !important;
          padding: 0 !important;
        }
        #reader__scan_region {
           background: black !important;
        }
        #reader__dashboard {
           display: none !important; /* Hide the default library UI */
        }
        @keyframes scan {
          0%, 100% { top: 10%; opacity: 0.5; }
          50% { top: 90%; opacity: 1; }
        }
      `}</style>
    </Card>
  )
}
