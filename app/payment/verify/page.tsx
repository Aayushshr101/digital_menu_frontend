"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { paymentApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function PaymentVerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [isVerifying, setIsVerifying] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    const verifyPayment = async () => {
      // Get parameters from URL according to eSewa documentation
      // eSewa V2 returns a data parameter with base64 encoded data
      const data = searchParams.get("data")

      // For debugging
      console.log("Payment verification data:", data)
      console.log("All search params:", Object.fromEntries(searchParams.entries()))

      if (!data) {
        toast({
          title: "Verification Failed",
          description: "Missing payment data. Please try again.",
          variant: "destructive",
        })
        setIsVerifying(false)
        setIsSuccess(false)
        return
      }

      try {
        // Call the backend to verify the payment
        const result = await paymentApi.verifyPayment(data)

        if (result.success) {
          setIsSuccess(true)

          // Extract order ID from the response
          if (result.order && result.order._id) {
            setOrderId(result.order._id)
          } else {
            // Try to extract order ID from transaction_uuid in the decoded data
            // Format is typically "order_ORDERID_TIMESTAMP"
            const decodedData = result.payment?.paymentData?.decodedData
            if (decodedData && decodedData.transaction_uuid) {
              const parts = decodedData.transaction_uuid.split("_")
              if (parts.length >= 2) {
                setOrderId(parts[1])
              }
            }
          }

          toast({
            title: "Payment Verified",
            description: "Your payment has been verified successfully.",
          })
        } else {
          throw new Error(result.msg || "Payment verification failed")
        }
      } catch (error) {
        console.error("Payment verification error:", error)
        setIsSuccess(false)
        toast({
          title: "Verification Failed",
          description: error instanceof Error ? error.message : "Failed to verify payment",
          variant: "destructive",
        })
      } finally {
        setIsVerifying(false)
      }
    }

    verifyPayment()
  }, [searchParams, toast])

  // Handle redirect after verification is complete
  useEffect(() => {
    if (!isVerifying) {
      const timer = setTimeout(() => {
        if (orderId) {
          router.push(`/order-confirmation?orderId=${orderId}&status=${isSuccess ? "success" : "failed"}`)
        } else {
          // If we don't have an order ID, redirect to home
          router.push("/")
        }
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isVerifying, isSuccess, orderId, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {isVerifying ? "Verifying Payment..." : isSuccess ? "Payment Successful" : "Payment Verification Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {isVerifying ? (
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
          ) : isSuccess ? (
            <CheckCircle className="h-16 w-16 text-green-500" />
          ) : (
            <XCircle className="h-16 w-16 text-red-500" />
          )}

          <p className="mt-4 text-center">
            {isVerifying
              ? "Please wait while we verify your payment..."
              : isSuccess
                ? "Your payment has been verified successfully. You will be redirected to the order confirmation page."
                : "We couldn't verify your payment. You will be redirected to the order confirmation page."}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          {!isVerifying && (
            <Button
              onClick={() => {
                if (orderId) {
                  router.push(`/order-confirmation?orderId=${orderId}&status=${isSuccess ? "success" : "failed"}`)
                } else {
                  router.push("/")
                }
              }}
            >
              {orderId ? "View Order" : "Return to Home"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
