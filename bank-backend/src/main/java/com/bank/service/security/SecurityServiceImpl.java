package com.bank.service.security;

import com.bank.entity.AccessEventType;
import com.bank.entity.AccessLog;
import com.bank.entity.User;
import com.bank.entity.UserSession;
import com.bank.exception.InvalidDataException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.AccessLogRepository;
import com.bank.repository.UserRepository;
import com.bank.repository.UserSessionRepository;
import com.bank.security.JwtUtil;
import com.bank.dto.security.AccessLogEntryDTO;
import com.bank.dto.security.SessionInfoDTO;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class SecurityServiceImpl implements SecurityService {

  private final UserSessionRepository userSessionRepository;
  private final AccessLogRepository accessLogRepository;
  private final UserRepository userRepository;
  private final JwtUtil jwtUtil;

  @Override
  @Transactional
  public void recordSuccessfulLogin(
      Long userId, String username, String accessToken, HttpServletRequest request) {
    if (!StringUtils.hasText(accessToken)) {
      return;
    }

    String tokenId = safeExtractTokenId(accessToken);
    if (!StringUtils.hasText(tokenId)) {
      return;
    }

    Long resolvedUserId = userId != null ? userId : resolveUserId(username);
    String resolvedUsername = StringUtils.hasText(username) ? username : "unknown";
    LocalDateTime now = LocalDateTime.now();
    LocalDateTime expiresAt = LocalDateTime.ofInstant(
        jwtUtil.extractExpiration(accessToken).toInstant(), ZoneId.systemDefault());

    UserSession session = userSessionRepository.findByTokenId(tokenId).orElseGet(UserSession::new);

    session.setTokenId(tokenId);
    session.setUserId(resolvedUserId != null ? resolvedUserId : -1L);
    session.setUserName(resolvedUsername);
    session.setIpAddress(resolveIpAddress(request));
    session.setUserAgent(resolveUserAgent(request));
    session.setExpiresAt(expiresAt);
    session.setLastActivity(now);
    session.setActive(true);

    if (session.getCreatedAt() == null) {
      session.setCreatedAt(now);
    }

    userSessionRepository.save(session);
    recordAccessLog(resolvedUserId, resolvedUsername, AccessEventType.LOGIN, true, request);
  }

  @Override
  @Transactional
  public void recordFailedLogin(String username, HttpServletRequest request) {
    String resolvedUsername = StringUtils.hasText(username) ? username : "unknown";
    Long resolvedUserId = resolveUserId(resolvedUsername);
    recordAccessLog(resolvedUserId, resolvedUsername, AccessEventType.FAILED_LOGIN, false, request);
  }

  @Override
  @Transactional
  public void recordPasswordChange(String username, HttpServletRequest request) {
    String resolvedUsername = StringUtils.hasText(username) ? username : "unknown";
    Long resolvedUserId = resolveUserId(resolvedUsername);
    recordAccessLog(
        resolvedUserId, resolvedUsername, AccessEventType.PASSWORD_CHANGE, true, request);
  }

  @Override
  @Transactional
  public void recordLogout(String username, String accessToken, HttpServletRequest request) {
    deactivateSessionForToken(accessToken);

    String resolvedUsername = StringUtils.hasText(username) ? username : "unknown";
    Long resolvedUserId = resolveUserId(resolvedUsername);
    recordAccessLog(resolvedUserId, resolvedUsername, AccessEventType.LOGOUT, true, request);
  }

  @Override
  @Transactional(readOnly = true)
  public List<SessionInfoDTO> getSessions() {
    return userSessionRepository.findAllByOrderByLastActivityDesc().stream()
        .map(this::toSessionInfo)
        .toList();
  }

  @Override
  @Transactional
  public void terminateSession(String sessionId) {
    UserSession session = userSessionRepository
        .findById(sessionId)
        .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

    session.setActive(false);
    session.setLastActivity(LocalDateTime.now());
    userSessionRepository.save(session);
  }

  @Override
  @Transactional
  public void terminateAllSessions(boolean excludeCurrent, String currentAccessToken) {
    String currentTokenId = excludeCurrent ? safeExtractTokenId(currentAccessToken) : null;
    LocalDateTime now = LocalDateTime.now();

    List<UserSession> activeSessions = userSessionRepository.findByActiveTrue();
    for (UserSession session : activeSessions) {
      if (excludeCurrent
          && StringUtils.hasText(currentTokenId)
          && currentTokenId.equals(session.getTokenId())) {
        continue;
      }
      session.setActive(false);
      session.setLastActivity(now);
    }

    userSessionRepository.saveAll(activeSessions);
  }

  @Override
  @Transactional(readOnly = true)
  public List<AccessLogEntryDTO> getAccessLogs(
      LocalDateTime startDate, LocalDateTime endDate, String eventType) {
    Specification<AccessLog> spec = (root, query, cb) -> cb.conjunction();

    if (startDate != null) {
      spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("timestamp"), startDate));
    }

    if (endDate != null) {
      spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("timestamp"), endDate));
    }

    if (StringUtils.hasText(eventType)) {
      AccessEventType parsedEventType;
      try {
        parsedEventType = AccessEventType.valueOf(eventType.trim().toUpperCase());
      } catch (IllegalArgumentException ex) {
        throw new InvalidDataException("Invalid eventType: " + eventType);
      }

      spec = spec.and((root, query, cb) -> cb.equal(root.get("eventType"), parsedEventType));
    }

    return accessLogRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "timestamp")).stream()
        .map(this::toAccessLogEntry)
        .toList();
  }

  @Override
  @Transactional(readOnly = true)
  public boolean isAccessTokenSessionActive(String accessToken) {
    String tokenId = safeExtractTokenId(accessToken);

    // Backward compatibility for tokens without jti claim.
    if (!StringUtils.hasText(tokenId)) {
      return true;
    }

    return userSessionRepository
        .findByTokenId(tokenId)
        .filter(UserSession::isActive)
        .filter(
            session -> session.getExpiresAt() == null
                || session.getExpiresAt().isAfter(LocalDateTime.now()))
        .isPresent();
  }

  @Override
  @Transactional
  public void touchSessionActivity(String accessToken) {
    String tokenId = safeExtractTokenId(accessToken);
    if (!StringUtils.hasText(tokenId)) {
      return;
    }

    userSessionRepository
        .findByTokenId(tokenId)
        .ifPresent(
            session -> {
              LocalDateTime now = LocalDateTime.now();
              if (session.getExpiresAt() != null && session.getExpiresAt().isBefore(now)) {
                session.setActive(false);
              }
              session.setLastActivity(now);
              userSessionRepository.save(session);
            });
  }

  private void deactivateSessionForToken(String accessToken) {
    String tokenId = safeExtractTokenId(accessToken);
    if (!StringUtils.hasText(tokenId)) {
      return;
    }

    userSessionRepository
        .findByTokenId(tokenId)
        .ifPresent(
            session -> {
              session.setActive(false);
              session.setLastActivity(LocalDateTime.now());
              userSessionRepository.save(session);
            });
  }

  private String safeExtractTokenId(String accessToken) {
    if (!StringUtils.hasText(accessToken)) {
      return null;
    }
    try {
      return jwtUtil.extractTokenId(accessToken);
    } catch (Exception ex) {
      return null;
    }
  }

  private void recordAccessLog(
      Long userId,
      String userName,
      AccessEventType eventType,
      boolean success,
      HttpServletRequest request) {
    AccessLog log = AccessLog.builder()
        .userId(userId)
        .userName(StringUtils.hasText(userName) ? userName : "unknown")
        .eventType(eventType)
        .ipAddress(resolveIpAddress(request))
        .userAgent(resolveUserAgent(request))
        .location(resolveLocation(request))
        .success(success)
        .build();

    accessLogRepository.save(log);
  }

  private Long resolveUserId(String username) {
    if (!StringUtils.hasText(username)) {
      return null;
    }

    return userRepository
        .findByUsername(username)
        .map(User::getId)
        .or(() -> userRepository.findByEmail(username).map(User::getId))
        .orElse(null);
  }

  private String resolveIpAddress(HttpServletRequest request) {
    if (request == null) {
      return "unknown";
    }

    String forwardedFor = request.getHeader("X-Forwarded-For");
    if (StringUtils.hasText(forwardedFor)) {
      return forwardedFor.split(",")[0].trim();
    }

    String realIp = request.getHeader("X-Real-IP");
    if (StringUtils.hasText(realIp)) {
      return realIp;
    }

    String remoteAddr = request.getRemoteAddr();
    return StringUtils.hasText(remoteAddr) ? remoteAddr : "unknown";
  }

  private String resolveUserAgent(HttpServletRequest request) {
    if (request == null) {
      return "unknown";
    }

    String userAgent = request.getHeader("User-Agent");
    return StringUtils.hasText(userAgent) ? userAgent : "unknown";
  }

  private String resolveLocation(HttpServletRequest request) {
    if (request == null) {
      return null;
    }

    String country = request.getHeader("CF-IPCountry");
    if (StringUtils.hasText(country)) {
      return country;
    }

    String city = request.getHeader("X-AppEngine-City");
    if (StringUtils.hasText(city)) {
      return city;
    }

    return null;
  }

  private SessionInfoDTO toSessionInfo(UserSession session) {
    return SessionInfoDTO.builder()
        .id(session.getId())
        .userId(String.valueOf(session.getUserId()))
        .userName(session.getUserName())
        .ipAddress(session.getIpAddress())
        .userAgent(session.getUserAgent())
        .createdAt(session.getCreatedAt())
        .lastActivity(session.getLastActivity())
        .expiresAt(session.getExpiresAt())
        .active(session.isActive())
        .build();
  }

  private AccessLogEntryDTO toAccessLogEntry(AccessLog log) {
    return AccessLogEntryDTO.builder()
        .id(log.getId())
        .timestamp(log.getTimestamp())
        .userId(log.getUserId() != null ? String.valueOf(log.getUserId()) : "unknown")
        .userName(StringUtils.hasText(log.getUserName()) ? log.getUserName() : "unknown")
        .eventType(log.getEventType().name())
        .ipAddress(log.getIpAddress())
        .userAgent(log.getUserAgent())
        .location(log.getLocation())
        .success(log.isSuccess())
        .build();
  }
}
