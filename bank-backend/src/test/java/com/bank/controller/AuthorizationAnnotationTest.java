package com.bank.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

class AuthorizationAnnotationTest {

  @Test
  void cardMutationEndpointsAllowManagers() throws Exception {
    assertThat(preAuthorizeValue(DebitCardController.class.getMethod("freezeCard", Long.class, String.class)))
        .contains("ROLE_MANAGER");
    assertThat(preAuthorizeValue(CreditCardController.class.getMethod("freezeCard", Long.class, String.class)))
        .contains("ROLE_MANAGER");
    assertThat(preAuthorizeValue(DebitCardController.class.getMethod("replaceCard", Long.class)))
        .contains("ROLE_MANAGER");
    assertThat(preAuthorizeValue(CreditCardController.class.getMethod("replaceCard", Long.class)))
        .contains("ROLE_MANAGER");
  }

  @Test
  void creditPlanAssignmentIsRestrictedToPrivilegedRoles() throws Exception {
    String value = preAuthorizeValue(CreditPlanController.class.getMethod("assignPlan", Long.class, Long.class));

    assertThat(value).contains("ROLE_ADMIN");
    assertThat(value).contains("ROLE_MANAGER");
    assertThat(value).doesNotContain("ROLE_USER");
  }

  private static String preAuthorizeValue(Method method) {
    PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);
    assertThat(annotation).isNotNull();
    return annotation.value();
  }
}