import { useMemo, useRef, useState } from "react";
import { createOrder, verifyPayment } from "@/api/razorpay";
import { loadRazorpay } from "@/utils/loadRazorpay";
import { toast } from "sonner";

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type PaymentButtonProps = {
  bookingId?: string;
  amount: number;
  customer: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onPaymentVerified: (payment: RazorpayResponse) => Promise<void> | void;
  disabled?: boolean;
  label?: string;
  getBookingId?: () => Promise<string>;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentButton({
  bookingId,
  amount,
  customer,
  onPaymentVerified,
  disabled = false,
  label = "Pay Now",
  getBookingId,
}: PaymentButtonProps) {
  const [isPaying, setIsPaying] = useState(false);
  const idemKeyRef = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${bookingId}-${Date.now()}`,
  );

  const buttonLabel = useMemo(
    () => (isPaying ? "Processing..." : `${label} ₹${amount}`),
    [isPaying, label, amount],
  );

  const startPayment = async () => {
    if (isPaying) return;
    setIsPaying(true);
    try {
      const resolvedBookingId =
        bookingId || (getBookingId ? await getBookingId() : null);

      if (!resolvedBookingId) {
        toast.error("Unable to create booking for payment");
        setIsPaying(false);
        return;
      }

      const sdkLoaded = await loadRazorpay(
        import.meta.env.VITE_RAZORPAY_CHECKOUT_URL,
      );

      if (!sdkLoaded) {
        toast.error("Razorpay SDK failed to load. Please retry.");
        setIsPaying(false);
        return;
      }

      const order = await createOrder({
        bookingId: resolvedBookingId,
        idempotencyKey: idemKeyRef.current,
      });

      const rzp = new window.Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Astro Rudra",
        description: `Booking ${order.bookingId}`,
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.contact,
        },
        modal: {
          ondismiss: () => setIsPaying(false),
        },
        handler: async function (response: RazorpayResponse) {
          try {
            const verify = await verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            if (verify.success) {
              await onPaymentVerified(response);
              toast.success("Payment successful");
            } else {
              toast.error("Payment verification failed");
            }
          } catch (err: any) {
            toast.error(
              err?.response?.data?.message || "Payment verification failed",
            );
          } finally {
            setIsPaying(false);
          }
        },
      });

      rzp.on("payment.failed", (failure: any) => {
        toast.error(
          failure?.error?.description || "Payment failed. Please try again.",
        );
        setIsPaying(false);
      });

      rzp.open();
    } catch (err: any) {
      toast.error(err?.message || "Unable to start payment");
      setIsPaying(false);
    }
  };

  return (
    <button
      onClick={startPayment}
      disabled={disabled || isPaying}
      className="w-full btn-primary py-3 rounded-md"
    >
      {buttonLabel}
    </button>
  );
}
