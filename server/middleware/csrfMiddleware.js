import { logger } from "../utils/logger.js";

/*
  CSRF PROTECTION MIDDLEWARE
  
  Purpose: Prevent Cross-Site Request Forgery attacks
  
  How it works:
  - Requires custom header "X-Requested-With: XMLHttpRequest"
  - This header cannot be set by cross-origin forms
  - Simple but effective CSRF protection for cookie-based auth
  
  Why needed:
  - JWT in cookies = CSRF vulnerability
  - JWT in headers = no CSRF risk
  - Since we moved to cookies, we need CSRF protection
*/

export function csrfProtection(req, res, next) {
    // Skip CSRF check for safe methods (GET, HEAD, OPTIONS)
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

    // Allow third-party webhooks and health checks without CSRF header
    if (
        req.path.startsWith('/payment/webhook') ||
        req.path.startsWith('/api/health')
    ) {
        return next();
    }

    if (safeMethods.includes(req.method)) {
        return next();
    }

    // Require custom header for state-changing requests
    const customHeader = req.headers['x-requested-with'];

    if (customHeader !== 'XMLHttpRequest') {
        logger.warn('CSRF protection blocked request', {
            method: req.method,
            path: req.path,
            origin: req.headers.origin,
            hasHeader: !!customHeader,
        });

        return res.status(403).json({
            ok: false,
            message: 'CSRF validation failed',
        });
    }

    next();
}
