package com.bank.service.auth;

import com.bank.entity.Role;
import com.bank.entity.User;
import com.bank.repository.RoleRepository;
import com.bank.repository.UserRepository;
import com.bank.security.JwtUtil;
import com.bank.service.dto.auth.ChangePasswordRequestDTO;
import com.bank.service.dto.auth.AuthResponseDTO;
import com.bank.service.dto.auth.LoginRequestDTO;
import com.bank.service.dto.auth.RegisterRequestDTO;
import com.bank.service.dto.auth.UserResponseDTO;
import com.bank.exception.InvalidDataException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponseDTO register(RegisterRequestDTO request) {
        // Check if username or email already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setActive(true);
        user.setLocked(false);

        // Assign roles
        Set<Role> roles = new HashSet<>();
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            for (String roleName : request.getRoles()) {
                Role role = roleRepository.findByName(Role.RoleName.valueOf(roleName))
                        .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
                roles.add(role);
            }
        } else {
            // Default role: USER
            Role userRole = roleRepository.findByName(Role.RoleName.ROLE_USER)
                    .orElseThrow(() -> new RuntimeException("Default role not found"));
            roles.add(userRole);
        }
        user.setRoles(roles);

        user = userRepository.save(user);

        // Generate tokens
        String accessToken = jwtUtil.generateToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

        return buildAuthResponse(user, accessToken, refreshToken, false);
    }

    @Transactional
    public AuthResponseDTO login(LoginRequestDTO request) {
        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        boolean firstLogin = user.getLastLogin() == null;
        boolean hasPassword = StringUtils.hasText(user.getPassword());
        boolean passwordProvided = StringUtils.hasText(request.getPassword());

        // Allow passwordless first login; otherwise authenticate with password
        if (!(firstLogin && !passwordProvided)) {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        }

        boolean passwordChangeRequired = firstLogin;

        // Only stamp lastLogin once a password has been set (avoid clearing first-login requirement)
        if (!firstLogin && hasPassword) {
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
        }

        // Generate tokens
        String accessToken = jwtUtil.generateToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

        return buildAuthResponse(user, accessToken, refreshToken, passwordChangeRequired);
    }

    @Transactional(readOnly = true)
    public UserResponseDTO getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return buildUserResponse(user);
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequestDTO request) {
        if (request == null || !StringUtils.hasText(request.getNewPassword())) {
            throw new InvalidDataException("New password is required", "newPassword", null);
        }
        if (request.getNewPassword().length() < 8) {
            throw new InvalidDataException("New password must be at least 8 characters", "newPassword",
                    null);
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        boolean hasExistingPassword = StringUtils.hasText(user.getPassword());
        boolean firstLogin = user.getLastLogin() == null || !hasExistingPassword;

        if (hasExistingPassword && !firstLogin && !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidDataException("Current password is incorrect", "currentPassword", null);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
    }

        private AuthResponseDTO buildAuthResponse(User user, String accessToken, String refreshToken,
            boolean passwordChangeRequired) {
        return AuthResponseDTO.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toSet()))
                .expiresAt(LocalDateTime.now().plusHours(24))
            .passwordChangeRequired(passwordChangeRequired)
                .build();
    }

    private UserResponseDTO buildUserResponse(User user) {
        return UserResponseDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .isActive(user.isActive())
                .isLocked(user.isLocked())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toSet()))
                .createdAt(user.getCreatedAt())
                .lastLogin(user.getLastLogin())
                .build();
    }
}
