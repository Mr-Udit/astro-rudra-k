import crypto from "crypto"

function verifyWebhook(req) {

  const signature = req.headers["x-razorpay-signature"]

  const expected = crypto
    .createHmac(
      "sha256",
      process.env.RAZORPAY_WEBHOOK_SECRET
    )
    .update(JSON.stringify(req.body))
    .digest("hex")

  return signature === expected
}

export default verifyWebhook