package com.bank.config;

import com.bank.entity.User;
import com.bank.repository.UserRepository;
import com.bank.service.audit.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLoggingInterceptor implements HandlerInterceptor {
  private static final Set<String> EXCLUDED_PREFIXES =
      Set.of(
          "/audit", "/security", "/api/auth", "/swagger-ui", "/v3/api-docs", "/actuator", "/error");
  private final AuditService auditService;
  private final UserRepository userRepository;

  @Override
  public void afterCompletion(
      HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
    String method = request.getMethod();
    String uri = request.getRequestURI();
    if (shouldSkip(method, uri)) {
      return;
    }
    String action = resolveAction(method);
    if (!StringUtils.hasText(action)) {
      return;
    }
    String resource = resolveResource(uri);
    String resourceId = resolveResourceId(uri);
    String details = method + " " + uri + " -> HTTP " + response.getStatus();
    String status = ex == null && response.getStatus() < 400 ? "SUCCESS" : "FAILED";
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String username = extractUsername(authentication);
    Long userId = resolveUserId(username);
    try {
      auditService.logEvent(
          userId, username, action, resource, resourceId, details, status, request);
    } catch (Exception logEx) {
      log.debug("Skipping automatic audit log due to logging error", logEx);
    }
  }

  private boolean shouldSkip(String method, String uri) {
    if (!StringUtils.hasText(uri) || !StringUtils.hasText(method)) {
      return true;
    }
    if ("OPTIONS".equalsIgnoreCase(method)) {
      return true;
    }
    for (String excludedPrefix : EXCLUDED_PREFIXES) {
      if (uri.startsWith(excludedPrefix)) {
        return true;
      }
    }
    return uri.startsWith("/favicon") || uri.contains(".");
  }

  private String resolveAction(String method) {
    return switch (method.toUpperCase()) {
      case "GET" -> "VIEW";
      case "POST" -> "CREATE";
      case "PUT", "PATCH" -> "UPDATE";
      case "DELETE" -> "DELETE";
      default -> null;
    };
  }

  private String resolveResource(String uri) {
    List<String> segments = splitSegments(uri);
    if (segments.isEmpty()) {
      return "GENERAL";
    }
    return segments.getFirst().toUpperCase();
  }

  private String resolveResourceId(String uri) {
    List<String> segments = splitSegments(uri);
    if (segments.size() < 2) {
      return "-";
    }
    return segments.getLast();
  }

  private List<String> splitSegments(String uri) {
    List<String> segments = new ArrayList<>();
    for (String segment : uri.split("/")) {
      if (StringUtils.hasText(segment)) {
        segments.add(segment);
      }
    }
    return segments;
  }

  private String extractUsername(Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()) {
      return "system";
    }
    String principal = authentication.getName();
    return StringUtils.hasText(principal) ? principal : "system";
  }

  private Long resolveUserId(String username) {
    if (!StringUtils.hasText(username) || "system".equalsIgnoreCase(username)) {
      return null;
    }
    return userRepository
        .findByUsername(username)
        .map(User::getId)
        .or(() -> userRepository.findByEmail(username).map(User::getId))
        .orElse(null);
  }
}
