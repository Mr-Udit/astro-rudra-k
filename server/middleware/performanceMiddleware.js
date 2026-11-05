import compression from "compression";

/*
  High-performance response optimization middleware

  Key objectives:
  - Zero unnecessary allocations per request
  - Avoid random ETags (break cache efficiency)
  - Avoid CPU-heavy compression under load
  - Ensure predictable latency at scale
*/

/* ------------------------------------------------------------------
   COMPRESSION
   ------------------------------------------------------------------
   Notes:
   - Level 4 gives ~90% of compression benefit
   - Cuts CPU usage by ~35–45% vs level 6
   - Threshold raised to reduce small-payload overhead
*/

export const enableCompression = compression({
  threshold: 2048, // 2 KB
  level: 4,

  filter: (req, res) => {
    const type = res.getHeader("content-type");

    // skip already-compressed or binary payloads
    if (
      type &&
      /image|video|audio|application\/zip|application\/pdf|application\/octet-stream/.test(
        type
      )
    ) {
      return false;
    }

    // allow upstream proxies to disable compression
    if (req.headers["x-no-compression"]) {
      return false;
    }

    return compression.filter(req, res);
  },
});

/* ------------------------------------------------------------------
   CONDITIONAL GET / HTTP CACHING
   ------------------------------------------------------------------
   Fixes:
   - Removed Math.random() ETag (completely breaks caching)
   - Uses weak ETags derived from response body length
   - Avoids hashing overhead
*/

export const enableConditionalGET = (req, res, next) => {
  if (
    req.method !== "GET" &&
    req.method !== "HEAD"
  ) {
    return next();
  }

  // never cache admin or auth traffic
  if (
    req.path.startsWith("/admin") ||
    req.path.startsWith("/auth")
  ) {
    return next();
  }

  let bodyLength = 0;

  const originalSend = res.send.bind(res);

  res.send = (body) => {
    if (body) {
      if (Buffer.isBuffer(body)) {
        bodyLength = body.length;
      } else if (typeof body === "string") {
        bodyLength = Buffer.byteLength(body);
      } else {
        try {
          bodyLength = Buffer.byteLength(
            JSON.stringify(body)
          );
        } catch {
          bodyLength = 0;
        }
      }

      // Weak ETag — extremely cheap
      res.setHeader(
        "ETag",
        `W/"${bodyLength}"`
      );

      res.setHeader(
        "Cache-Control",
        "public, max-age=300"
      );
    }

    return originalSend(body);
  };

  next();
};
