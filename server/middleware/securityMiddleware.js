import helmet from "helmet";

/*
  High-performance security middleware
  Hardened for large-scale Express deployments

  Goals:
  - Zero dynamic allocations per request
  - No deep recursion
  - No expensive runtime header logic
  - Predictable execution cost
*/

/* ------------------------------------------------------------------
   STATIC SECURITY HEADERS
   ------------------------------------------------------------------ */

const STATIC_HEADERS = Object.freeze({
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
});

/* ------------------------------------------------------------------
   SECURITY HEADERS (O(1))
   ------------------------------------------------------------------ */

export const securityHeaders = (req, res, next) => {
  res.removeHeader("X-Powered-By");

  // ultra-fast static header assignment
  for (const key in STATIC_HEADERS) {
    res.setHeader(key, STATIC_HEADERS[key]);
  }

  // disable caching only for sensitive routes
  if (
    req.path.startsWith("/admin") ||
    req.path.startsWith("/auth")
  ) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  next();
};

/* ------------------------------------------------------------------
   REQUEST STRUCTURE VALIDATION
   ------------------------------------------------------------------
   Optimized:
   - Iterative stack (no recursion → no stack overflow)
   - Depth hard-limit
   - Early bailout
*/

const MAX_DEPTH = 10;

export const validateRequestStructure = (req, res, next) => {
  const body = req.body;

  // Skip validation for raw webhook buffers to avoid breaking signature validation
  if (!body || typeof body !== "object" || Buffer.isBuffer(body)) return next();

  const stack = [{ value: body, depth: 0 }];

  while (stack.length) {
    const { value, depth } = stack.pop();

    if (depth > MAX_DEPTH) {
      return res.status(400).json({
        ok: false,
        message: "Request body structure too deeply nested",
      });
    }

    if (typeof value !== "object" || value === null) continue;

    for (const key in value) {
      stack.push({
        value: value[key],
        depth: depth + 1,
      });
    }
  }

  next();
};

/* ------------------------------------------------------------------
   TRUSTED PROXY CONFIGURATION
   ------------------------------------------------------------------ */

export const configureTrustedProxy = (app) => {
  if (process.env.NODE_ENV === "production") {
    app.set(
      "trust proxy",
      Number(process.env.TRUST_PROXY_HOPS) || 1
    );
  }
};
