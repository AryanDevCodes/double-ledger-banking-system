package com.bank.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.bank.dto.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;

class GlobalExceptionHandlerTest {

  private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

  @Test
  void accessDeniedReturnsForbiddenApiResponse() {
    ApiResponse<Void> response =
        handler.handleAccessDenied(new AccessDeniedException("insufficient role")).getBody();

    assertThat(response).isNotNull();
    assertThat(response.isSuccess()).isFalse();
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN.value());
    assertThat(response.getMessage()).isEqualTo("Access denied");
    assertThat(response.getError().getErrorCode()).isEqualTo("ACCESS_DENIED");
    assertThat(response.getError().getErrorMessage()).isEqualTo("Access denied");
  }
}
