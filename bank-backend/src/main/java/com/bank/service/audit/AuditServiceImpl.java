package com.bank.service.audit;

import com.bank.dto.audit.AuditLogEntryDTO;
import com.bank.dto.audit.AuditLogPageResponseDTO;
import com.bank.entity.AuditAction;
import com.bank.entity.AuditLog;
import com.bank.entity.AuditStatus;
import com.bank.exception.InvalidDataException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditServiceImpl implements AuditService {
  private final AuditLogRepository auditLogRepository;
  private static final int DEFAULT_PAGE_SIZE = 25;
  private static final int MAX_PAGE_SIZE = 200;
  private static final int MAX_DETAILS_LENGTH = 2000;
  private static final int MAX_RESOURCE_LENGTH = 128;
  private static final int MAX_RESOURCE_ID_LENGTH = 128;
  private static final int MAX_IP_LENGTH = 64;
  private static final int MAX_USER_AGENT_LENGTH = 1024;
  private static final int MAX_USER_NAME_LENGTH = 256;
  private static final Pattern UUID_PATTERN = Pattern
      .compile("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");

  @Override
  @Transactional(readOnly = true)
  public AuditLogPageResponseDTO getLogs(
      LocalDateTime startDate,
      LocalDateTime endDate,
      String action,
      String userId,
      String resource,
      Integer page,
      Integer size) {
    if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
      throw new InvalidDataException("startDate cannot be after endDate", "startDate", startDate);
    }
    int resolvedPage = page != null ? page : 1;
    int resolvedSize = size != null ? size : DEFAULT_PAGE_SIZE;
    if (resolvedPage < 1) {
      throw new InvalidDataException(
          "page must be greater than or equal to 1", "page", resolvedPage);
    }
    if (resolvedSize < 1 || resolvedSize > MAX_PAGE_SIZE) {
      throw new InvalidDataException(
          "size must be between 1 and " + MAX_PAGE_SIZE, "size", resolvedSize);
    }
    Specification<AuditLog> spec = (root, query, cb) -> cb.conjunction();
    if (startDate != null) {
      spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("timestamp"), startDate));
    }
    if (endDate != null) {
      spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("timestamp"), endDate));
    }
    if (StringUtils.hasText(action)) {
      AuditAction parsedAction = validateAction(action);
      spec = spec.and((root, query, cb) -> cb.equal(root.get("action"), parsedAction));
    }
    if (StringUtils.hasText(userId)) {
      Long parsedUserId = validateAndParseUserId(userId);
      spec = spec.and((root, query, cb) -> cb.equal(root.get("userId"), parsedUserId));
    }
    if (StringUtils.hasText(resource)) {
      String normalized = sanitizeResource(resource).toLowerCase();
      spec = spec.and((root, query, cb) -> cb.equal(cb.lower(root.get("resource")), normalized));
    }
    Pageable pageable = PageRequest.of(resolvedPage - 1, resolvedSize, Sort.by(Sort.Direction.DESC, "timestamp"));
    Page<AuditLog> resultPage = auditLogRepository.findAll(spec, pageable);
    List<AuditLogEntryDTO> items = resultPage.getContent().stream().map(this::toDto).toList();
    return AuditLogPageResponseDTO.builder()
        .items(items)
        .page(resolvedPage)
        .size(resolvedSize)
        .totalElements(resultPage.getTotalElements())
        .totalPages(Math.max(resultPage.getTotalPages(), 1))
        .hasNext(resultPage.hasNext())
        .hasPrevious(resultPage.hasPrevious())
        .build();
  }

  @Override
  @Transactional(readOnly = true)
  public AuditLogEntryDTO getLogById(String id) {
    String sanitizedId = sanitizeAndValidateId(id);
    AuditLog log = auditLogRepository
        .findById(sanitizedId)
        .orElseThrow(() -> new ResourceNotFoundException("AuditLog", "id", sanitizedId));
    return toDto(log);
  }

  @Override
  @Transactional
  public void logEvent(
      Long userId,
      String userName,
      String action,
      String resource,
      String resourceId,
      String details,
      String status,
      HttpServletRequest request) {
    String sanitizedAction = validateAction(action).name();
    String sanitizedUserName = sanitizeUserName(userName);
    String sanitizedResource = sanitizeResource(resource);
    String sanitizedResourceId = sanitizeResourceId(resourceId);
    String sanitizedDetails = sanitizeDetails(details);
    String sanitizedIpAddress = sanitizeIpAddress(resolveIpAddress(request));
    String sanitizedUserAgent = sanitizeUserAgent(resolveUserAgent(request));
    AuditStatus sanitizedStatus = parseStatus(status);

    AuditLog auditLog = AuditLog.builder()
        .userId(userId)
        .userName(sanitizedUserName)
        .action(AuditAction.valueOf(sanitizedAction))
        .resource(sanitizedResource)
        .resourceId(sanitizedResourceId)
        .details(sanitizedDetails)
        .ipAddress(sanitizedIpAddress)
        .userAgent(sanitizedUserAgent)
        .status(sanitizedStatus)
        .build();
    auditLogRepository.save(auditLog);
    log.debug("Audit log created: action={}, resource={}, user={}", sanitizedAction, sanitizedResource,
        sanitizedUserName);
  }

  private AuditAction validateAction(String action) {
    if (!StringUtils.hasText(action)) {
      throw new InvalidDataException("action is required", "action", action);
    }
    try {
      return AuditAction.valueOf(action.trim().toUpperCase());
    } catch (IllegalArgumentException ex) {
      throw new InvalidDataException(
          "Invalid action: " + action + ". Allowed values: CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT, EXPORT",
          "action",
          action);
    }
  }

  private Long validateAndParseUserId(String userId) {
    String trimmed = userId.trim();
    if (trimmed.length() > 20) {
      throw new InvalidDataException("userId too long", "userId", userId);
    }
    try {
      return Long.parseLong(trimmed);
    } catch (NumberFormatException ex) {
      throw new InvalidDataException("userId must be numeric", "userId", userId);
    }
  }

  private String sanitizeResource(String resource) {
    String sanitized = StringUtils.hasText(resource) ? resource.trim() : "GENERAL";
    sanitized = sanitized.replaceAll("[\r\n]+", " ").replaceAll("[;'\"]", "");
    if (sanitized.length() > MAX_RESOURCE_LENGTH) {
      sanitized = sanitized.substring(0, MAX_RESOURCE_LENGTH);
    }
    return StringUtils.hasText(sanitized) ? sanitized : "GENERAL";
  }

  private String sanitizeResourceId(String resourceId) {
    String sanitized = StringUtils.hasText(resourceId) ? resourceId.trim() : "-";
    sanitized = sanitized.replaceAll("[\r\n]+", " ");
    if (sanitized.length() > MAX_RESOURCE_ID_LENGTH) {
      sanitized = sanitized.substring(0, MAX_RESOURCE_ID_LENGTH);
    }
    return StringUtils.hasText(sanitized) ? sanitized : "-";
  }

  private String sanitizeDetails(String details) {
    String sanitized = StringUtils.hasText(details) ? details.trim() : "-";
    sanitized = sanitized.replaceAll("[\r\n]+", " ");
    if (sanitized.length() > MAX_DETAILS_LENGTH) {
      sanitized = sanitized.substring(0, MAX_DETAILS_LENGTH);
    }
    return StringUtils.hasText(sanitized) ? sanitized : "-";
  }

  private String sanitizeUserName(String userName) {
    String sanitized = StringUtils.hasText(userName) ? userName.trim() : "unknown";
    sanitized = sanitized.replaceAll("[\r\n]+", " ");
    if (sanitized.length() > MAX_USER_NAME_LENGTH) {
      sanitized = sanitized.substring(0, MAX_USER_NAME_LENGTH);
    }
    return StringUtils.hasText(sanitized) ? sanitized : "unknown";
  }

  private String sanitizeIpAddress(String ipAddress) {
    String sanitized = StringUtils.hasText(ipAddress) ? ipAddress.trim() : "unknown";
    sanitized = sanitized.replaceAll("[\r\n]+", " ");
    if (sanitized.length() > MAX_IP_LENGTH) {
      sanitized = sanitized.substring(0, MAX_IP_LENGTH);
    }
    return StringUtils.hasText(sanitized) ? sanitized : "unknown";
  }

  private String sanitizeUserAgent(String userAgent) {
    String sanitized = StringUtils.hasText(userAgent) ? userAgent.trim() : "unknown";
    sanitized = sanitized.replaceAll("[\r\n]+", " ");
    if (sanitized.length() > MAX_USER_AGENT_LENGTH) {
      sanitized = sanitized.substring(0, MAX_USER_AGENT_LENGTH);
    }
    return StringUtils.hasText(sanitized) ? sanitized : "unknown";
  }

  private String sanitizeAndValidateId(String id) {
    if (!StringUtils.hasText(id)) {
      throw new InvalidDataException("id is required", "id", id);
    }
    String trimmed = id.trim();
    if (!UUID_PATTERN.matcher(trimmed).matches()) {
      throw new InvalidDataException("Invalid id format. Expected UUID", "id", id);
    }
    return trimmed;
  }

  private AuditStatus parseStatus(String status) {
    if (!StringUtils.hasText(status)) {
      return AuditStatus.SUCCESS;
    }
    try {
      return AuditStatus.valueOf(status.trim().toUpperCase());
    } catch (IllegalArgumentException ex) {
      throw new InvalidDataException("Invalid status: " + status, "status", status);
    }
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

  private AuditLogEntryDTO toDto(AuditLog log) {
    return AuditLogEntryDTO.builder()
        .id(log.getId())
        .timestamp(log.getTimestamp())
        .userId(log.getUserId() != null ? String.valueOf(log.getUserId()) : "unknown")
        .userName(StringUtils.hasText(log.getUserName()) ? log.getUserName() : "unknown")
        .action(log.getAction().name())
        .resource(StringUtils.hasText(log.getResource()) ? log.getResource() : "-")
        .resourceId(StringUtils.hasText(log.getResourceId()) ? log.getResourceId() : "-")
        .details(StringUtils.hasText(log.getDetails()) ? log.getDetails() : "-")
        .ipAddress(StringUtils.hasText(log.getIpAddress()) ? log.getIpAddress() : "unknown")
        .userAgent(StringUtils.hasText(log.getUserAgent()) ? log.getUserAgent() : "unknown")
        .status(log.getStatus().name())
        .build();
  }
}
