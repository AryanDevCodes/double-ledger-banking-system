package com.bank.repository;

import com.bank.entity.AccessEventType;
import com.bank.entity.AccessLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface AccessLogRepository
    extends JpaRepository<AccessLog, String>, JpaSpecificationExecutor<AccessLog> {
  long countByEventType(AccessEventType eventType);
}
