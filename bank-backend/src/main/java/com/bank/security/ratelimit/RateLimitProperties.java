package com.bank.security.ratelimit;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bound from {@code app.rate-limit.*} in application.yml. Each rule is a token-bucket
 * specification: {@code capacity} tokens are available, refilling fully every {@code
 * refillSeconds}.
 */
@Data
@ConfigurationProperties(prefix = "app.rate-limit")
public class RateLimitProperties {

  /** Master toggle. Set false to disable all limits. */
  private boolean enabled = true;

  private Rule login = new Rule(10, 60);
  private Rule forgot = new Rule(5, 60);
  private Rule upiPay = new Rule(20, 60);

  @Data
  public static class Rule {
    private int capacity;
    private int refillSeconds;

    public Rule() {}

    public Rule(int capacity, int refillSeconds) {
      this.capacity = capacity;
      this.refillSeconds = refillSeconds;
    }
  }
}
