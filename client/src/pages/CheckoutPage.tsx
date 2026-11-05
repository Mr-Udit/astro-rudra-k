import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function CheckoutPage() {
  useDocumentTitle("Checkout");

  return (
    <div style={{ marginTop: "120px" }}>
      <p className="text-center text-gray-600">
        Please use the booking flow to initiate a payment.
      </p>
    </div>
  );
}
