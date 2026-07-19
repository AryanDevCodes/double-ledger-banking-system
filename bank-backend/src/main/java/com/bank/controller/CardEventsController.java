package com.bank.controller;

import com.bank.repository.UserRepository;
import com.bank.security.JwtUtil;
import com.bank.service.event.CardEventService;
import com.bank.service.security.SecurityService;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/stream")
@RequiredArgsConstructor
public class CardEventsController {
  private final CardEventService cardEventService;
  private final JwtUtil jwtUtil;
  private final SecurityService securityService;
  private final UserRepository userRepository;

  @GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter stream(@RequestParam("token") String token) {
    if (token == null || token.isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing token");
    }

    if (!securityService.isAccessTokenSessionActive(token)) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token");
    }

    String username = jwtUtil.extractUsername(token);
    Optional<Long> userId = userRepository.findByUsernameOrEmailIgnoreCase(username)
        .map(user -> user.getId());

    if (userId.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid user");
    }

    return cardEventService.register(userId.get());
  }
}
