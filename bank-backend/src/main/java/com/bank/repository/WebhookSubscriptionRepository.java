package com.bank.repository;

import com.bank.entity.WebhookSubscription;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WebhookSubscriptionRepository extends JpaRepository<WebhookSubscription, Long> {
  List<WebhookSubscription> findByActiveTrue();
}
