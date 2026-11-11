package com.bank.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bank.security.JwtUtil;
import com.bank.service.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class NotificationControllerTest {

  private final NotificationService notificationService = mock(NotificationService.class);
  private final JwtUtil jwtUtil = mock(JwtUtil.class);
  private final NotificationController controller =
      new NotificationController(notificationService, jwtUtil);
  private final MockHttpServletRequest request = new MockHttpServletRequest();

  @BeforeEach
  void authenticateRequest() {
    request.addHeader("Authorization", "Bearer test-token");
    when(jwtUtil.extractUserId("test-token")).thenReturn(7L);
  }

  @Test
  void markingNotificationAsReadReturnsNoContent() {
    ResponseEntity<Void> response = controller.markAsRead(15L, request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    verify(notificationService).markAsRead(15L, 7L);
  }

  @Test
  void markingAllNotificationsAsReadReturnsNoContent() {
    ResponseEntity<Void> response = controller.markAllAsRead(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    verify(notificationService).markAllAsRead(7L);
  }
}
