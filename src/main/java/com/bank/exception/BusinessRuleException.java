package com.bank.exception;

import lombok.Getter;

/** * Exception thrown when a business rule violation occurs */
@Getter
public class BusinessRuleException extends RuntimeException {
  private final String errorCode;

  public BusinessRuleException(String message) {
    super(message);
    this.errorCode = "BUSINESS_RULE_VIOLATION";
  }

  public BusinessRuleException(String message, String errorCode) {
    super(message);
    this.errorCode = errorCode;
  }
}
