package com.bank.config;

import com.bank.entity.CreditPlan;
import com.bank.entity.Status;
import com.bank.repository.CreditPlanRepository;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CreditPlanInitializer implements CommandLineRunner {
  private final CreditPlanRepository creditPlanRepository;

  @Override
  public void run(String... args) {
    if (creditPlanRepository.count() > 0) {
      return;
    }

    List<CreditPlan> plans = List.of(
        CreditPlan.builder()
            .name("Silver")
            .description("Entry-tier plan with low fees and steady rewards")
            .apr(new BigDecimal("14.9"))
            .annualFee(new BigDecimal("499"))
            .lateFee(new BigDecimal("500"))
            .gracePeriodDays(25)
            .minLimit(new BigDecimal("25000"))
            .maxLimit(new BigDecimal("100000"))
            .cashbackPercentage(new BigDecimal("0.5"))
            .status(Status.ACTIVE)
            .build(),
        CreditPlan.builder()
            .name("Gold")
            .description("Balanced rewards and higher credit line")
            .apr(new BigDecimal("18.9"))
            .annualFee(new BigDecimal("999"))
            .lateFee(new BigDecimal("750"))
            .gracePeriodDays(30)
            .minLimit(new BigDecimal("100000"))
            .maxLimit(new BigDecimal("300000"))
            .cashbackPercentage(new BigDecimal("1.0"))
            .status(Status.ACTIVE)
            .build(),
        CreditPlan.builder()
            .name("Platinum")
            .description("Premium rewards, concierge, and higher limits")
            .apr(new BigDecimal("21.9"))
            .annualFee(new BigDecimal("2499"))
            .lateFee(new BigDecimal("1000"))
            .gracePeriodDays(35)
            .minLimit(new BigDecimal("300000"))
            .maxLimit(new BigDecimal("750000"))
            .cashbackPercentage(new BigDecimal("1.5"))
            .status(Status.ACTIVE)
            .build());

    creditPlanRepository.saveAll(plans);
  }
}
