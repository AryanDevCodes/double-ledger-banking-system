package com.bank.security;

import com.bank.service.security.SecurityService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
  private final JwtUtil jwtUtil;
  private final UserDetailsService userDetailsService;
  private final SecurityService securityService;

  public JwtAuthenticationFilter(
      JwtUtil jwtUtil,
      UserDetailsService userDetailsService,
      SecurityService securityService) {
    this.jwtUtil = jwtUtil;
    this.userDetailsService = userDetailsService;
    this.securityService = securityService;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    final String authHeader = request.getHeader("Authorization");
    final String jwt;
    final String username;
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      filterChain.doFilter(request, response);
      return;
    }
    jwt = authHeader.substring(7);
    try {
      username = jwtUtil.extractUsername(jwt);
    } catch (Exception ex) {
      filterChain.doFilter(request, response);
      return;
    }
    if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
      UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
      boolean tokenValid;
      try {
        tokenValid = jwtUtil.validateToken(jwt, userDetails);
      } catch (Exception ex) {
        tokenValid = false;
      }
      if (tokenValid && securityService.isAccessTokenSessionActive(jwt)) {
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
            userDetails, null, userDetails.getAuthorities());
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authToken);
        securityService.touchSessionActivity(jwt);
        filterChain.doFilter(request, response);
        return;
      }
    }
    filterChain.doFilter(request, response);
  }

}
