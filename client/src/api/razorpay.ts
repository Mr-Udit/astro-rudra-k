import api from "@/lib/api";

export type CreateOrderPayload = {
  bookingId: string;
  idempotencyKey: string;
};

export const createOrder = async (payload: CreateOrderPayload) => {
  const { data } = await api.post("/payment/create-order", payload);

  if (!data.ok) {
    throw new Error(data.message || "Unable to create payment order");
  }

  return data as {
    ok: true;
    orderId: string;
    amount: number;
    currency: string;
    key: string;
    bookingId: string;
    status: string;
    idempotencyKey: string;
  };
};

export type VerifyPayload = {
  orderId: string;
  paymentId: string;
  signature: string;
};

export const verifyPayment = async (payload: VerifyPayload) => {
  const { data } = await api.post("/payment/verify", payload);
  return data as {
    success: boolean;
    orderId: string;
    paymentId: string;
    status?: string;
  };
};
