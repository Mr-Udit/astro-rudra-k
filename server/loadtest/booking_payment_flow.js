import autocannon from 'autocannon';

function runAutocannon(opts) {
  return new Promise((resolve, reject) => {
    const instance = autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });

    // Pretty CLI progress output
    autocannon.track(instance, { renderProgressBar: true });
  });
}

async function main() {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
  const authCookie = process.env.AUTH_COOKIE || '';
  const astrologerProfileId = process.env.ASTROLOGER_PROFILE_ID || '';
  const bookingId = process.env.BOOKING_ID || '';

  if (!authCookie) {
    console.warn('[WARN] AUTH_COOKIE env var is not set. Authenticated endpoints will fail with 401.');
  }

  console.log('Base URL:', baseUrl);

  // ---------------------------------------------------------------------------
  // 1) High-read test: /astrologers/list
  // ---------------------------------------------------------------------------
  console.log('\n[1/3] Stress testing GET /astrologers/list ...');
  await runAutocannon({
    url: `${baseUrl}/astrologers/list`,
    connections: Number(process.env.LIST_CONN || 1000),
    duration: Number(process.env.LIST_DURATION || 120),
    pipelining: Number(process.env.LIST_PIPELINE || 10),
  });

  // ---------------------------------------------------------------------------
  // 2) Booking creation test: POST /bookings/create
  //    NOTE: requires a valid astrologerProfileId and auth cookie.
  // ---------------------------------------------------------------------------
  if (!astrologerProfileId) {
    console.warn('\n[SKIP] /bookings/create — ASTROLOGER_PROFILE_ID not set');
  } else {
    console.log('\n[2/3] Stress testing POST /bookings/create ...');

    const bookingPayload = JSON.stringify({
      astrologerProfileId,
      bookingDate: process.env.BOOKING_DATE || '2026-03-21',
      bookingTime: process.env.BOOKING_TIME || '10:00',
      consultationType: process.env.CONSULTATION_TYPE || 'voice_call',
    });

    await runAutocannon({
      url: `${baseUrl}/bookings/create`,
      method: 'POST',
      connections: Number(process.env.BOOKINGS_CONN || 1000),
      duration: Number(process.env.BOOKINGS_DURATION || 120),
      pipelining: Number(process.env.BOOKINGS_PIPELINE || 1),
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(authCookie ? { Cookie: authCookie } : {}),
      },
      body: bookingPayload,
    });
  }

  // ---------------------------------------------------------------------------
  // 3) Payment order creation test: POST /payment/create-order
  //    NOTE: requires an existing bookingId and auth cookie.
  // ---------------------------------------------------------------------------
  if (!bookingId) {
    console.warn('\n[SKIP] /payment/create-order — BOOKING_ID not set');
  } else {
    console.log('\n[3/3] Stress testing POST /payment/create-order ...');

    const orderPayload = JSON.stringify({
      bookingId,
      idempotencyKey: `loadtest-${Date.now()}`,
    });

    await runAutocannon({
      url: `${baseUrl}/payment/create-order`,
      method: 'POST',
      connections: Number(process.env.PAY_CONN || 1000),
      duration: Number(process.env.PAY_DURATION || 120),
      pipelining: Number(process.env.PAY_PIPELINE || 1),
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(authCookie ? { Cookie: authCookie } : {}),
      },
      body: orderPayload,
    });
  }

  console.log('\nLoad test sequence completed. Check your /metrics endpoint and server logs for errors, saturation, and high latencies.');
}

main().catch((err) => {
  console.error('Load test failed:', err);
  process.exit(1);
});
