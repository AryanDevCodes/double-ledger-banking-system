package com.bank.service.webhook;

import com.bank.entity.WebhookSubscription;
import com.bank.repository.WebhookSubscriptionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Listens for {@link PaymentStatusEvent}s and posts them to every active webhook subscription whose
 * {@code eventTypes} includes the event name. Delivery is asynchronous and retries up to {@code
 * app.webhook.max-retries} with exponential backoff.
 *
 * <p>Each request includes:
 *
 * <ul>
 *   <li>{@code Content-Type: application/json}
 *   <li>{@code X-Bank-Event}: the event type
 *   <li>{@code X-Bank-Signature}: hex HMAC-SHA256 of the body using the subscription's secret
 * </ul>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebhookDispatcher {

  private final WebhookSubscriptionRepository subscriptionRepository;
  private final ObjectMapper objectMapper;

  @Value("${app.webhook.connect-timeout-ms:3000}")
  private int connectTimeoutMs;

  @Value("${app.webhook.read-timeout-ms:5000}")
  private int readTimeoutMs;

  @Value("${app.webhook.max-retries:3}")
  private int maxRetries;

  @Async
  @EventListener
  public void onPaymentStatus(PaymentStatusEvent event) {
    List<WebhookSubscription> subs = subscriptionRepository.findByActiveTrue();
    if (subs.isEmpty()) return;

    String body;
    try {
      body = objectMapper.writeValueAsString(event);
    } catch (Exception ex) {
      log.error("Failed to serialise webhook payload for {}", event.getEventType(), ex);
      return;
    }

    HttpClient client =
        HttpClient.newBuilder().connectTimeout(Duration.ofMillis(connectTimeoutMs)).build();

    for (WebhookSubscription sub : subs) {
      if (!matchesEventType(sub, event.getEventType())) continue;
      deliverWithRetry(client, sub, event.getEventType(), body);
    }
  }

  private boolean matchesEventType(WebhookSubscription sub, String eventType) {
    if (sub.getEventTypes() == null || sub.getEventTypes().isBlank()) return false;
    String[] types = sub.getEventTypes().split(",");
    for (String t : types) {
      if (t.trim().equalsIgnoreCase(eventType) || "*".equals(t.trim())) return true;
    }
    return false;
  }

  private void deliverWithRetry(
      HttpClient client, WebhookSubscription sub, String eventType, String body) {
    String signature = hmacSha256Hex(sub.getSecret(), body);
    HttpRequest request =
        HttpRequest.newBuilder()
            .uri(URI.create(sub.getTargetUrl()))
            .timeout(Duration.ofMillis(readTimeoutMs))
            .header("Content-Type", "application/json")
            .header("X-Bank-Event", eventType)
            .header("X-Bank-Signature", signature)
            .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
            .build();

    int attempts = Math.max(1, maxRetries);
    long backoffMs = 500L;
    for (int i = 1; i <= attempts; i++) {
      try {
        HttpResponse<String> resp = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
          log.info(
              "Webhook delivered to {} (event={}, status={}, attempt={})",
              sub.getTargetUrl(),
              eventType,
              resp.statusCode(),
              i);
          return;
        }
        log.warn(
            "Webhook delivery non-2xx: url={} event={} status={} attempt={}",
            sub.getTargetUrl(),
            eventType,
            resp.statusCode(),
            i);
      } catch (Exception ex) {
        log.warn(
            "Webhook delivery failed: url={} event={} attempt={} err={}",
            sub.getTargetUrl(),
            eventType,
            i,
            ex.getMessage());
      }

      if (i < attempts) {
        try {
          Thread.sleep(backoffMs);
        } catch (InterruptedException ie) {
          Thread.currentThread().interrupt();
          return;
        }
        backoffMs *= 2;
      }
    }
    log.error(
        "Webhook delivery permanently failed for url={} event={}", sub.getTargetUrl(), eventType);
  }

  private String hmacSha256Hex(String secret, String body) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      byte[] digest = mac.doFinal(body.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (Exception ex) {
      throw new IllegalStateException("HMAC computation failed", ex);
    }
  }
}
