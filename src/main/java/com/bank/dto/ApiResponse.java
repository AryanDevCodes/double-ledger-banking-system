package com.bank.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic API response wrapper for consistent response structure across all endpoints
 *
 * @param <T> The type of data being returned
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
  /** Indicates whether the request was successful */
  private boolean success;

  /** HTTP status code */
  private int statusCode;

  /** Human-readable message about the response */
  private String message;

  /** The actual data payload (null in case of errors) */
  private T data;

  /** Error details (only present when success = false) */
  private ErrorDetails error;

  /** Timestamp of the response */
  @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();

  /** Nested class for error details */
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class ErrorDetails {
    private String errorCode;
    private String errorMessage;
    private String field;
    private Object rejectedValue;
  }

  // Convenience factory methods for success responses
  public static <T> ApiResponse<T> success(T data, String message) {
    return ApiResponse.<T>builder()
        .success(true)
        .statusCode(200)
        .message(message)
        .data(data)
        .timestamp(LocalDateTime.now())
        .build();
  }

  public static <T> ApiResponse<T> success(T data) {
    return success(data, "Request processed successfully");
  }

  public static <T> ApiResponse<T> created(T data, String message) {
    return ApiResponse.<T>builder()
        .success(true)
        .statusCode(201)
        .message(message)
        .data(data)
        .timestamp(LocalDateTime.now())
        .build();
  }

  // Convenience factory methods for error responses
  public static <T> ApiResponse<T> error(
      int statusCode, String message, ErrorDetails errorDetails) {
    return ApiResponse.<T>builder()
        .success(false)
        .statusCode(statusCode)
        .message(message)
        .error(errorDetails)
        .timestamp(LocalDateTime.now())
        .build();
  }

  public static <T> ApiResponse<T> error(int statusCode, String message) {
    return error(statusCode, message, null);
  }
}
