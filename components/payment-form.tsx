"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { paymentApi } from "@/lib/api"

interface PaymentFormProps {
  orderId?: string
  amount: number
  onCancel: () => void
  onCreateOrder?: (paymentMethod: string) => Promise<string | null>
}

export function PaymentForm({ orderId, amount, onCancel, onCreateOrder }: PaymentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "esewa">("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(orderId || null)

  // Function to generate transaction UUID
  const generateTransactionUUID = () => {
    return `order_${currentOrderId}_${Date.now()}`
  }

  const handlePaymentSubmit = async () => {
    setIsProcessing(true)

    try {
      // For cash payments
      if (paymentMethod === "cash") {
        // If we have an order ID already
        if (currentOrderId) {
          // Process cash payment for existing order
          const response = await paymentApi.processCashPayment(currentOrderId)

          if (response.success) {
            toast({
              title: "Cash Payment Recorded",
              description: "Your cash payment has been recorded successfully.",
            })

            // Redirect to order confirmation
            router.push(`/order-confirmation?orderId=${currentOrderId}`)
          } else {
            throw new Error(response.msg || "Failed to process cash payment")
          }
        }
        // If we need to create a new order
        else if (onCreateOrder) {
          const newOrderId = await onCreateOrder("cash")

          if (!newOrderId) {
            throw new Error("Failed to create order")
          }

          // The onCreateOrder function will handle the redirect for cash payments
        }
        return
      }

      // For eSewa payments
      if (paymentMethod === "esewa") {
        let orderIdToUse = currentOrderId

        // If we don't have an order ID yet, create one
        if (!orderIdToUse && onCreateOrder) {
          console.log("Creating new order for eSewa payment")
          const newOrderId = await onCreateOrder("esewa")

          if (!newOrderId) {
            throw new Error("Failed to create order for eSewa payment")
          }

          console.log("New order created with ID:", newOrderId)
          orderIdToUse = newOrderId
          setCurrentOrderId(newOrderId)
        }

        // Double-check we have an order ID before proceeding
        if (!orderIdToUse) {
          throw new Error("Order ID is required for eSewa payment")
        }

        try {
          // First, call the backend to create a payment record
          // This doesn't use the signature from the backend
          await paymentApi.initiatePayment(orderIdToUse, amount)

          // Then generate the eSewa form with client-side signature (the way it worked before)
          const transaction_uuid = `order_${orderIdToUse}_${Date.now()}`

          // Round to 2 decimal places and ensure it's a positive number
          const roundedAmount = Math.max(Math.round(amount * 100) / 100, 0.01)

          console.log("Payment amount:", amount, "Rounded amount:", roundedAmount)
          console.log("Using order ID for payment:", orderIdToUse)

          // Set tax and other charges to 0 for simplicity
          const tax_amount = 0
          const service_charge = 0
          const delivery_charge = 0
          const total_amount = roundedAmount

          // Get merchant code from environment variable or use default test value
          const product_code = process.env.NEXT_PUBLIC_ESEWA_MERCHANT_ID || "EPAYTEST"

          // Set success and failure URLs
          const success_url = `${window.location.origin}/payment/verify`
          const failure_url = `${window.location.origin}/payment/verify`

          // Fields to be signed
          const signed_field_names = "total_amount,transaction_uuid,product_code"

          // Generate signature using crypto-js
          const data = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`
          const secret = process.env.NEXT_PUBLIC_ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q"

          // Import crypto-js modules dynamically
          const HmacSHA256 = (await import("crypto-js/hmac-sha256")).default
          const Base64 = (await import("crypto-js/enc-base64")).default

          // Use the imported crypto-js modules
          const hash = HmacSHA256(data, secret)
          const signature = Base64.stringify(hash)

          // Create a form to submit to eSewa
          const form = document.createElement("form")
          form.method = "POST"
          form.action =
            process.env.NEXT_PUBLIC_ESEWA_PAYMENT_URL || "https://rc-epay.esewa.com.np/api/epay/main/v2/form"

          // Add all required fields
          const params = {
            amount: roundedAmount,
            tax_amount,
            total_amount,
            transaction_uuid,
            product_code,
            product_service_charge: service_charge,
            product_delivery_charge: delivery_charge,
            success_url,
            failure_url,
            signed_field_names,
            signature,
          }

          // Create form inputs for each parameter
          Object.entries(params).forEach(([key, value]) => {
            const input = document.createElement("input")
            input.type = "hidden"
            input.name = key
            input.value = String(value)
            form.appendChild(input)
          })

          // Log the form for debugging
          console.log("Submitting form to eSewa:", form.action, params)

          // Submit the form
          document.body.appendChild(form)
          form.submit()
        } catch (error) {
          console.error("Failed to initiate payment:", error)
          throw error
        }
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  return (
    <div className="w-full">
      <RadioGroup
        value={paymentMethod}
        onValueChange={(value) => setPaymentMethod(value as "cash" | "esewa")}
        className="space-y-4"
      >
        <div className="flex items-center space-x-2 border p-4 rounded-md cursor-pointer hover:bg-muted">
          <RadioGroupItem value="cash" id="cash" />
          <Label htmlFor="cash" className="flex items-center cursor-pointer">
            <CreditCard className="mr-2 h-5 w-5" />
            <div>
              <p className="font-medium">Cash on Delivery</p>
              <p className="text-sm text-muted-foreground">Pay when your order is served</p>
            </div>
          </Label>
        </div>

        <div className="flex items-center space-x-2 border p-4 rounded-md cursor-pointer hover:bg-muted">
          <RadioGroupItem value="esewa" id="esewa" />
          <Label htmlFor="esewa" className="flex items-center cursor-pointer">
            <Wallet className="mr-2 h-5 w-5" />
            <div>
              <p className="font-medium">Pay with eSewa</p>
              <p className="text-sm text-muted-foreground">Pay securely using eSewa digital wallet</p>
            </div>
          </Label>
        </div>
      </RadioGroup>

      <div className="mt-6 p-4 bg-muted rounded-md">
        <div className="flex justify-between">
          <span>Total Amount:</span>
          <span className="font-bold">Rs {amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button onClick={handlePaymentSubmit} disabled={isProcessing}>
          {isProcessing ? "Processing..." : `Pay Rs ${amount.toFixed(2)}`}
        </Button>
      </div>
    </div>
  )
}
