package com.bank.exception;

import com.bank.dto.ApiResponse;
import com.bank.dto.ApiResponse.ErrorDetails;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler that catches all exceptions thrown by the application
 * and returns standardized ApiResponse objects
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle ResourceNotFoundException
     * Returns 404 NOT FOUND
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        log.error("Resource not found: {}", ex.getMessage());

        ErrorDetails errorDetails = ErrorDetails.builder()
                .errorCode("RESOURCE_NOT_FOUND")
                .errorMessage(ex.getMessage())
                .field(ex.getFieldName())
                .rejectedValue(ex.getFieldValue())
                .build();

        ApiResponse<Void> response = ApiResponse.error(
                HttpStatus.NOT_FOUND.value(),
                ex.getMessage(),
                errorDetails
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    /**
     * Handle InvalidDataException
     * Returns 400 BAD REQUEST
     */
    @ExceptionHandler(InvalidDataException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidDataException(InvalidDataException ex) {
        log.error("Invalid data: {}", ex.getMessage());

        ErrorDetails errorDetails = ErrorDetails.builder()
                .errorCode("INVALID_DATA")
                .errorMessage(ex.getMessage())
                .field(ex.getField())
                .rejectedValue(ex.getRejectedValue())
                .build();

        ApiResponse<Void> response = ApiResponse.error(
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage(),
                errorDetails
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handle BusinessRuleException
     * Returns 422 UNPROCESSABLE ENTITY
     */
    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessRuleException(BusinessRuleException ex) {
        log.error("Business rule violation: {}", ex.getMessage());

        ErrorDetails errorDetails = ErrorDetails.builder()
                .errorCode(ex.getErrorCode())
                .errorMessage(ex.getMessage())
                .build();

        ApiResponse<Void> response = ApiResponse.error(
                HttpStatus.UNPROCESSABLE_ENTITY.value(),
                ex.getMessage(),
                errorDetails
        );

        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(response);
    }

    /**
     * Handle GlobalServiceException (legacy exception)
     * Returns 500 INTERNAL SERVER ERROR
     */
    @ExceptionHandler(GlobalServiceException.class)
    public ResponseEntity<ApiResponse<Void>> handleGlobalServiceException(GlobalServiceException ex) {
        log.error("Service exception: {}", ex.getMessage(), ex);

        ErrorDetails errorDetails = ErrorDetails.builder()
                .errorCode("SERVICE_ERROR")
                .errorMessage(ex.getMessage())
                .build();

        ApiResponse<Void> response = ApiResponse.error(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                ex.getMessage(),
                errorDetails
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    /**
     * Handle validation errors from @Valid annotation
     * Returns 400 BAD REQUEST
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(MethodArgumentNotValidException ex) {
        log.error("Validation error: {}", ex.getMessage());

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ErrorDetails errorDetails = ErrorDetails.builder()
                .errorCode("VALIDATION_ERROR")
                .errorMessage("Validation failed for one or more fields")
                .build();

        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .success(false)
                .statusCode(HttpStatus.BAD_REQUEST.value())
                .message("Validation failed")
                .data(errors)
                .error(errorDetails)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handle data integrity violations (e.g., unique constraint violations)
     * Returns 409 CONFLICT
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.error("Data integrity violation: {}", ex.getMessage());

        String message = "Data integrity violation. This might be due to duplicate entries or constraint violations.";

        ErrorDetails errorDetails = ErrorDetails.builder()
                .errorCode("DATA_INTEGRITY_VIOLATION")
                .errorMessage(message)
                .build();

        ApiResponse<Void> response = ApiResponse.error(
                HttpStatus.CONFLICT.value(),
                message,
                errorDetails
        );

        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    /**
     * Handle method argument type mismatch
     * Returns 400 BAD REQUEST
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        log.error("Type mismatch: {}", ex.getMessage());

        String message = String.format("Invalid value '%s' for parameter '%s'. Expected type: %s",
                ex.getValue(),
                ex.getName(),
                ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown");

        ErrorDetails errorDetails = ErrorDetails.builder()
                .errorCode("TYPE_MISMATCH")
                .errorMessage(message)
                .field(ex.getName())
                .rejectedValue(ex.getValue())
                .build();

        ApiResponse<Void> response = ApiResponse.error(
                HttpStatus.BAD_REQUEST.value(),
                message,
                errorDetails
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handle malformed JSON requests
     * Returns 400 BAD REQUEST
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        log.error("Malformed JSON request: {}", ex.getMessage());

        ErrorDetails errorDetails = ErrorDetails.builder()
                .errorCode("MALFORMED_JSON")
                .errorMessage("Malformed JSON request. Please check your request body.")
                .build();

        ApiResponse<Void> response = ApiResponse.error(
                HttpStatus.BAD_REQUEST.value(),
                "Malformed JSON request",
                errorDetails
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handle NoResourceFoundException (404 for static resources or invalid paths)
     * Returns 404 NOT FOUND
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResourceFound(NoResourceFoundException ex) {
        log.error("Resource not found: {}", ex.getMessage());

        ErrorDetails errorDetails = ErrorDetails.builder()
                .errorCode("RESOURCE_NOT_FOUND")
                .errorMessage("The requested resource was not found")
                .build();

        ApiResponse<Void> response = ApiResponse.error(
                HttpStatus.NOT_FOUND.value(),
                "Resource not found",
                errorDetails
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    /**
     * Handle IllegalArgumentException
     * Returns 400 BAD REQUEST
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        log.error("Illegal argument: {}", ex.getMessage());

        ErrorDetails errorDetails = ErrorDetails.builder()
                .errorCode("ILLEGAL_ARGUMENT")
                .errorMessage(ex.getMessage())
                .build();

        ApiResponse<Void> response = ApiResponse.error(
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage(),
                errorDetails
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handle all other exceptions
     * Returns 500 INTERNAL SERVER ERROR
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGlobalException(Exception ex) {
        log.error("Unexpected error occurred: {}", ex.getMessage(), ex);

        ErrorDetails errorDetails = ErrorDetails.builder()
                .errorCode("INTERNAL_SERVER_ERROR")
                .errorMessage("An unexpected error occurred. Please try again later.")
                .build();

        ApiResponse<Void> response = ApiResponse.error(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal server error",
                errorDetails
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}

