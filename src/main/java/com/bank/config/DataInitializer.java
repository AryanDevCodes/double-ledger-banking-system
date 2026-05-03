package com.bank.config;

import com.bank.entity.Role;
import com.bank.entity.User;
import com.bank.repository.CustomerRepository;
import com.bank.repository.RoleRepository;
import com.bank.repository.UserRepository;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

// @Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

  private final RoleRepository roleRepository;
  private final UserRepository userRepository;
  private final CustomerRepository customerRepository;
  private final PasswordEncoder passwordEncoder;

  @Override
  public void run(String... args) {
    initializeRoles();
    initializeUsers();
    linkCustomersToUsers();
  }

  private void initializeRoles() {
    Arrays.stream(Role.RoleName.values())
        .forEach(
            roleName -> {
              if (roleRepository.findByName(roleName).isEmpty()) {
                Role role = new Role();
                role.setName(roleName);
                roleRepository.save(role);
                log.info("Created role: {}", roleName);
              }
            });
  }

  private void initializeUsers() {
    Role userRole =
        roleRepository
            .findByName(Role.RoleName.ROLE_USER)
            .orElseThrow(() -> new RuntimeException("USER role not found"));

    if (userRepository.findByUsername("admin").isEmpty()) {
      User admin = new User();
      admin.setUsername("admin");
      admin.setEmail("admin@bank.com");
      admin.setPassword(passwordEncoder.encode("admin123"));
      admin.setFullName("System Administrator");
      admin.setPhoneNumber("+1234567890");
      admin.setActive(true);
      admin.setLocked(false);

      Set<Role> roles = new HashSet<>();
      roleRepository.findByName(Role.RoleName.ROLE_ADMIN).ifPresent(roles::add);
      admin.setRoles(roles);

      userRepository.save(admin);
      log.info("Created admin user - username: admin, password: admin123");
    }

    if (userRepository.findByUsername("manager").isEmpty()) {
      User manager = new User();
      manager.setUsername("manager");
      manager.setEmail("manager@bank.com");
      manager.setPassword(passwordEncoder.encode("manager123"));
      manager.setFullName("Bank Manager");
      manager.setPhoneNumber("+1234567891");
      manager.setActive(true);
      manager.setLocked(false);

      Set<Role> roles = new HashSet<>();
      roleRepository.findByName(Role.RoleName.ROLE_MANAGER).ifPresent(roles::add);
      manager.setRoles(roles);

      userRepository.save(manager);
      log.info("Created manager user - username: manager, password: manager123");
    }

    if (userRepository.findByUsername("user").isEmpty()) {
      User user = new User();
      user.setUsername("user");
      user.setEmail("user@bank.com");
      user.setPassword(passwordEncoder.encode("user123"));
      user.setFullName("Regular User");
      user.setPhoneNumber("+1234567892");
      user.setActive(true);
      user.setLocked(false);

      Set<Role> roles = new HashSet<>();
      roles.add(userRole);
      user.setRoles(roles);

      userRepository.save(user);
      log.info("Created user - username: user, password: user123");
    }

    createUserIfNotExists("aryan", "aryan.gmail.com", "ARYAN", "247081471", userRole);
    createUserIfNotExists("aryan1", "aryan1.gmail.com", "ARYAN", "2147081471", userRole);
    createUserIfNotExists("aryan2", "aryan2.gmail.com", "ARYAN", "12147081471", userRole);
    createUserIfNotExists("aryan3", "aryan3.gmail.com", "ARYAN", "121147081471", userRole);
    createUserIfNotExists("aryan4", "aryan4.gmail.com", "ARYAN", "1147081471", userRole);
    createUserIfNotExists("aryan5", "aryan5.gmail.com", "ARYAN", "11470811471", userRole);
    createUserIfNotExists("aryan6", "aryan6.gmail.com", "ARYAN", "101470811471", userRole);

    log.info("User initialization completed");
  }

  private void createUserIfNotExists(
      String username, String email, String fullName, String phone, Role userRole) {
    if (userRepository.findByEmail(email).isEmpty()) {
      User user = new User();
      user.setUsername(username);
      user.setEmail(email);
      user.setPassword(passwordEncoder.encode("password123"));
      user.setFullName(fullName);
      user.setPhoneNumber(phone);
      user.setActive(true);
      user.setLocked(false);

      Set<Role> roles = new HashSet<>();
      roles.add(userRole);
      user.setRoles(roles);

      userRepository.save(user);
      log.info("Created user - username: {}, email: {}, password: password123", username, email);
    }
  }

  private void linkCustomersToUsers() {
    log.info("Linking customers to users by phone number...");

    customerRepository.findAll().stream()
        .filter(customer -> customer.getUser() == null)
        .forEach(
            customer ->
                userRepository.findAll().stream()
                    .filter(user -> user.getPhoneNumber().equals(customer.getPhoneNumber()))
                    .findFirst()
                    .ifPresent(
                        user -> {
                          customer.setUser(user);
                          customerRepository.save(customer);
                          log.info(
                              "Linked customer {} to user {}",
                              customer.getId(),
                              user.getUsername());
                        }));

    log.info("Customer-User linking completed");
  }
}
