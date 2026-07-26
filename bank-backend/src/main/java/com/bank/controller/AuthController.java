package com.bank.controller;

import com.bank.service.audit.AuditService;
import com.bank.service.auth.AuthService;
import com.bank.service.security.SecurityService;
import com.bank.dto.auth.AuthResponseDTO;
import com.bank.dto.auth.ChangePasswordRequestDTO;
import com.bank.dto.auth.ForgotPasswordRequestDTO;
import com.bank.dto.auth.ForgotPasswordResponseDTO;
import com.bank.dto.auth.LoginRequestDTO;
import com.bank.dto.auth.RefreshTokenRequestDTO;
import com.bank.dto.auth.ResetPasswordRequestDTO;
import com.bank.dto.auth.UserResponseDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

  private final AuthService authService;
  private final AuditService auditService;
  private final SecurityService securityService;

  @PostMapping("/login")
  public ResponseEntity<AuthResponseDTO> login(
      @RequestBody LoginRequestDTO request, HttpServletRequest httpRequest) {
    try {
      AuthResponseDTO response = authService.login(request);
      try {
        securityService.recordSuccessfulLogin(
            response.getUserId(), response.getUsername(), response.getAccessToken(), httpRequest);
      } catch (Exception telemetryEx) {
        log.warn("Unable to record successful login telemetry", telemetryEx);
      }

      try {
        auditService.logEvent(
            response.getUserId(),
            response.getUsername(),
            "LOGIN",
            "AUTH",
            response.getUsername(),
            "User login successful",
            "SUCCESS",
            httpRequest);
      } catch (Exception telemetryEx) {
        log.warn("Unable to record successful login audit event", telemetryEx);
      }

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      try {
        securityService.recordFailedLogin(
            request != null ? request.getUsername() : null, httpRequest);
      } catch (Exception telemetryEx) {
        log.warn("Unable to record failed login telemetry", telemetryEx);
      }

      try {
        auditService.logEvent(
            null,
            request != null ? request.getUsername() : "unknown",
            "LOGIN",
            "AUTH",
            request != null ? request.getUsername() : "unknown",
            "Login failed",
            "FAILED",
            httpRequest);
      } catch (Exception telemetryEx) {
        log.warn("Unable to record failed login audit event", telemetryEx);
      }

      return ResponseEntity.status(401).build();
    }
  }

  @PostMapping("/forgot-password")
  public ResponseEntity<ForgotPasswordResponseDTO> forgotPassword(
      @RequestBody ForgotPasswordRequestDTO request, HttpServletRequest httpRequest) {
    ForgotPasswordResponseDTO response = authService.requestPasswordReset(request);

    try {
      String identifier = request != null ? request.getIdentifier() : null;
      auditService.logEvent(
          null,
          identifier,
          "PASSWORD_RESET_REQUEST",
          "AUTH",
          identifier,
          "Password reset token requested",
          "SUCCESS",
          httpRequest);
    } catch (Exception telemetryEx) {
      log.warn("Unable to record password-reset-request audit event", telemetryEx);
    }

    return ResponseEntity.ok(response);
  }

  @PostMapping("/reset-password")
  public ResponseEntity<Void> resetPassword(
      @RequestBody ResetPasswordRequestDTO request, HttpServletRequest httpRequest) {
    String username = authService.resetPassword(request);

    try {
      securityService.recordPasswordChange(username, httpRequest);
    } catch (Exception telemetryEx) {
      log.warn("Unable to record password-reset telemetry", telemetryEx);
    }

    try {
      auditService.logEvent(
          null,
          username,
          "PASSWORD_RESET",
          "AUTH",
          username,
          "Password reset completed",
          "SUCCESS",
          httpRequest);
    } catch (Exception telemetryEx) {
      log.warn("Unable to record password-reset audit event", telemetryEx);
    }

    return ResponseEntity.noContent().build();
  }

  @GetMapping("/me")
  public ResponseEntity<UserResponseDTO> getCurrentUser(Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()) {
      return ResponseEntity.status(401).build();
    }

    String username = authentication.getName();
    UserResponseDTO user = authService.getCurrentUser(username);
    return ResponseEntity.ok(user);
  }

  @PreAuthorize("isAuthenticated()")
  @PostMapping("/change-password")
  public ResponseEntity<Void> changePassword(
      Authentication authentication,
      HttpServletRequest httpRequest,
      @RequestBody ChangePasswordRequestDTO request) {
    if (authentication == null || !authentication.isAuthenticated()) {
      return ResponseEntity.status(401).build();
    }

    authService.changePassword(authentication.getName(), request);
    try {
      securityService.recordPasswordChange(authentication.getName(), httpRequest);
    } catch (Exception telemetryEx) {
      log.warn("Unable to record password-change telemetry", telemetryEx);
    }

    try {
      auditService.logEvent(
          null,
          authentication.getName(),
          "UPDATE",
          "AUTH",
          authentication.getName(),
          "Password changed",
          "SUCCESS",
          httpRequest);
    } catch (Exception telemetryEx) {
      log.warn("Unable to record password-change audit event", telemetryEx);
    }

    return ResponseEntity.noContent().build();
  }

  @PostMapping("/refresh")
  public ResponseEntity<AuthResponseDTO> refresh(@RequestBody RefreshTokenRequestDTO request) {
    AuthResponseDTO response = authService.refresh(request != null ? request.getRefreshToken() : null);
    return ResponseEntity.ok(response);
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(
      Authentication authentication,
      @RequestHeader(value = "Authorization", required = false) String authHeader,
      @RequestBody(required = false) RefreshTokenRequestDTO body,
      HttpServletRequest httpRequest) {
    String username = authentication != null && authentication.isAuthenticated()
        ? authentication.getName()
        : null;

    // Revoke the presented refresh token (if any) so it cannot be rotated again.
    try {
      if (body != null) {
        authService.revokeRefreshToken(body.getRefreshToken());
      }
    } catch (Exception ex) {
      log.warn("Unable to revoke refresh token on logout", ex);
    }

    try {
      securityService.recordLogout(username, extractBearerToken(authHeader), httpRequest);
    } catch (Exception telemetryEx) {
      log.warn("Unable to record logout telemetry", telemetryEx);
    }

    try {
      auditService.logEvent(
          null, username, "LOGOUT", "AUTH", username, "User logout", "SUCCESS", httpRequest);
    } catch (Exception telemetryEx) {
      log.warn("Unable to record logout audit event", telemetryEx);
    }

    return ResponseEntity.noContent().build();
  }

  private String extractBearerToken(String authHeader) {
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7);
  }
}
