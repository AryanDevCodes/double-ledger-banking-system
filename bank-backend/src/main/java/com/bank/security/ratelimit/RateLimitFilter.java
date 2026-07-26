package com.bank.security.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Per-IP token-bucket rate limiter for security-sensitive endpoints.
 *
 * <p>This is an in-memory limiter; for multi-instance deployments back it with Redis. Endpoints
 * matched here:
 *
 * <ul>
 *   <li>POST {@code /api/auth/login}
 *   <li>POST {@code /api/auth/forgot-password}
 *   <li>POST {@code /upi/pay}
 * </ul>
 *
 * Buckets are keyed by {@code <rule-name>:<client-ip>}. Returns HTTP 429 with {@code Retry-After}
 * when the bucket is empty.
 */
@Component
@RequiredArgsConstructor
@EnableConfigurationProperties(RateLimitProperties.class)
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

  private final RateLimitProperties props;

  /** rule-key -> per-IP bucket */
  private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

  private record Endpoint(String method, String path, String ruleName) {}

  private List<Endpoint> endpoints() {
    return List.of(
        new Endpoint("POST", "/api/auth/login", "login"),
        new Endpoint("POST", "/api/auth/forgot-password", "forgot"),
        new Endpoint("POST", "/api/upi/pay", "upi-pay"));
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    if (!props.isEnabled()) {
      chain.doFilter(request, response);
      return;
    }

    Endpoint match = matchEndpoint(request);
    if (match == null) {
      chain.doFilter(request, response);
      return;
    }

    RateLimitProperties.Rule rule = ruleFor(match.ruleName());
    if (rule == null || rule.getCapacity() <= 0) {
      chain.doFilter(request, response);
      return;
    }

    String ip = clientIp(request);
    String key = match.ruleName() + ":" + ip;
    Bucket bucket = buckets.computeIfAbsent(key, k -> new Bucket(rule.getCapacity()));

    long now = System.currentTimeMillis();
    long retryAfterSeconds = bucket.tryConsume(rule, now);
    if (retryAfterSeconds == 0) {
      chain.doFilter(request, response);
      return;
    }

    log.warn("Rate limit exceeded for {} on {} (ip={})", match.ruleName(), request.getRequestURI(), ip);
    response.setStatus(429);
    response.setHeader("Retry-After", String.valueOf(Math.max(1, retryAfterSeconds)));
    response.setContentType("application/json");
    response.getWriter().write("{\"error\":\"Too Many Requests\"}");
  }

  private Endpoint matchEndpoint(HttpServletRequest req) {
    String method = req.getMethod();
    String path = req.getRequestURI();
    for (Endpoint e : endpoints()) {
      if (e.method().equalsIgnoreCase(method) && path.equals(e.path())) {
        return e;
      }
    }
    return null;
  }

  private RateLimitProperties.Rule ruleFor(String name) {
    return switch (name) {
      case "login" -> props.getLogin();
      case "forgot" -> props.getForgot();
      case "upi-pay" -> props.getUpiPay();
      default -> null;
    };
  }

  private String clientIp(HttpServletRequest req) {
    String fwd = req.getHeader("X-Forwarded-For");
    if (fwd != null && !fwd.isBlank()) {
      return fwd.split(",")[0].trim();
    }
    String real = req.getHeader("X-Real-IP");
    if (real != null && !real.isBlank()) {
      return real.trim();
    }
    return req.getRemoteAddr() != null ? req.getRemoteAddr() : "unknown";
  }

  /**
   * Token bucket. Refills linearly at {@code capacity / refillSeconds} tokens per second.
   *
   * <p>Returns 0 from {@link #tryConsume} on success, otherwise a positive number of seconds the
   * caller should wait before retrying.
   */
  private static final class Bucket {
    private final AtomicLong tokensTimes1000;
    private final AtomicLong lastRefillMs;

    Bucket(int initialCapacity) {
      this.tokensTimes1000 = new AtomicLong((long) initialCapacity * 1000L);
      this.lastRefillMs = new AtomicLong(System.currentTimeMillis());
    }

    synchronized long tryConsume(RateLimitProperties.Rule rule, long nowMs) {
      long elapsedMs = nowMs - lastRefillMs.get();
      if (elapsedMs > 0) {
        // tokens-per-ms * 1000 to keep integer math
        double tokensPerMs = (double) rule.getCapacity() / (rule.getRefillSeconds() * 1000.0);
        long add = (long) (tokensPerMs * elapsedMs * 1000.0);
        long current = tokensTimes1000.get();
        long capx1000 = (long) rule.getCapacity() * 1000L;
        long updated = Math.min(capx1000, current + add);
        tokensTimes1000.set(updated);
        lastRefillMs.set(nowMs);
      }

      if (tokensTimes1000.get() >= 1000L) {
        tokensTimes1000.addAndGet(-1000L);
        return 0L;
      }
      // Time until 1 full token is available again
      double tokensPerSec = (double) rule.getCapacity() / rule.getRefillSeconds();
      return Math.max(1L, (long) Math.ceil(1.0 / Math.max(0.0001, tokensPerSec)));
    }
  }
}
