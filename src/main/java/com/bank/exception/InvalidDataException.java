package com.bank.exception;

import lombok.Getter;

/** * Exception thrown when invalid data is provided */
@Getter
public class InvalidDataException extends RuntimeException {
  private final String field;
  private final Object rejectedValue;

  public InvalidDataException(String message) {
    super(message);
    this.field = null;
    this.rejectedValue = null;
  }

  public InvalidDataException(String message, String field, Object rejectedValue) {
    super(message);
    this.field = field;
    this.rejectedValue = rejectedValue;
  }
}
