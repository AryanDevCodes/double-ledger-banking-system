package com.bank.service.security;

import com.bank.dto.security.AccessLogEntryDTO;
import com.bank.dto.security.SessionInfoDTO;

import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDateTime;
import java.util.List;

public interface SecurityService {
  void recordSuccessfulLogin(
      Long userId, String username, String accessToken, HttpServletRequest request);

  void recordFailedLogin(String username, HttpServletRequest request);

  void recordPasswordChange(String username, HttpServletRequest request);

  void recordLogout(String username, String accessToken, HttpServletRequest request);

  List<SessionInfoDTO> getSessions();

  void terminateSession(String sessionId);

  void terminateAllSessions(boolean excludeCurrent, String currentAccessToken);

  List<AccessLogEntryDTO> getAccessLogs(
      LocalDateTime startDate, LocalDateTime endDate, String eventType);

  boolean isAccessTokenSessionActive(String accessToken);

  void touchSessionActivity(String accessToken);
}
