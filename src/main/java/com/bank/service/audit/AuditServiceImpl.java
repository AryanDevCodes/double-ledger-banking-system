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

import java.time.LocalDateTime;
import java.util.List;
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
public
class AuditServiceImpl implements AuditService {
  private final AuditLogRepository auditLogRepository;
  private static final int DEFAULT_PAGE_SIZE = 25;
  private static final int MAX_PAGE_SIZE = 200;

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
    Specification<AuditLog> spec = Specification.where(null);
    if (startDate != null) {
      spec =
          spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("timestamp"), startDate));
    }
    if (endDate != null) {
      spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("timestamp"), endDate));
    }
    if (StringUtils.hasText(action)) {
      AuditAction parsedAction = parseAction(action);
      spec = spec.and((root, query, cb) -> cb.equal(root.get("action"), parsedAction));
    }
    if (StringUtils.hasText(userId)) {
      Long parsedUserId;
      try {
        parsedUserId = Long.parseLong(userId.trim());
      } catch (NumberFormatException ex) {
        throw new InvalidDataException("userId must be numeric", "userId", userId);
      }
      spec = spec.and((root, query, cb) -> cb.equal(root.get("userId"), parsedUserId));
    }
    if (StringUtils.hasText(resource)) {
      String normalized = resource.trim().toLowerCase();
      spec = spec.and((root, query, cb) -> cb.equal(cb.lower(root.get("resource")), normalized));
    }
    Pageable pageable =
        PageRequest.of(resolvedPage - 1, resolvedSize, Sort.by(Sort.Direction.DESC, "timestamp"));
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
    AuditLog log =
        auditLogRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("AuditLog", "id", id));
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
    AuditLog log =
        AuditLog.builder()
            .userId(userId)
            .userName(StringUtils.hasText(userName) ? userName : "unknown")
            .action(parseAction(action))
            .resource(StringUtils.hasText(resource) ? resource.trim() : "GENERAL")
            .resourceId(StringUtils.hasText(resourceId) ? resourceId.trim() : "-")
            .details(StringUtils.hasText(details) ? details.trim() : "-")
            .ipAddress(resolveIpAddress(request))
            .userAgent(resolveUserAgent(request))
            .status(parseStatus(status))
            .build();
    auditLogRepository.save(log);
  }

  private AuditAction parseAction(String action) {
    if (!StringUtils.hasText(action)) {
      throw new InvalidDataException("action is required", "action", action);
    }
    try {
      return AuditAction.valueOf(action.trim().toUpperCase());
    } catch (IllegalArgumentException ex) {
      throw new InvalidDataException("Invalid action: " + action, "action", action);
    }
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
