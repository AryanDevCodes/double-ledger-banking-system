package com.bank.controller;

import com.bank.service.auth.AuthService;
import com.bank.service.dto.auth.AuthResponseDTO;
import com.bank.service.dto.auth.ChangePasswordRequestDTO;
import com.bank.service.dto.auth.LoginRequestDTO;
import com.bank.service.dto.auth.UserResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody LoginRequestDTO request) {
        try {
            AuthResponseDTO response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }
    
    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        
        String username = authentication.getName();
        UserResponseDTO user = authService.getCurrentUser(username);
        return ResponseEntity.ok(user);
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(Authentication authentication,
            @RequestBody ChangePasswordRequestDTO request) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        authService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // In stateless JWT, logout is handled client-side by removing the token
        return ResponseEntity.ok().build();
    }
}
