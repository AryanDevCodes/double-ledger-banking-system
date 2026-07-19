package com.bank.service.mapper;

import com.bank.dto.card.CreditCardDTO;
import com.bank.entity.CreditCard;
import com.bank.entity.Status;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface CreditCardMapper {

    @Mapping(target = "accountId", source = "account.id")
    @Mapping(target = "status", source = "status", qualifiedByName = "statusToString")
    @Mapping(target = "createdAt", source = "createdAt", qualifiedByName = "localDateTimeToString")
    @Mapping(target = "issueDate", source = "issueDate", qualifiedByName = "localDateTimeToString")
    @Mapping(target = "blockedDate", source = "blockedDate", qualifiedByName = "localDateTimeToString")
    @Mapping(target = "merchantCategoryBlocks", source = "merchantCategoryBlocks", qualifiedByName = "splitCategories")
    @Mapping(target = "planId", expression = "java(card.getCreditPlan() != null ? card.getCreditPlan().getId() : null)")
    @Mapping(target = "planName", expression = "java(card.getCreditPlan() != null ? card.getCreditPlan().getName() : null)")
    @Mapping(target = "planApr", expression = "java(card.getCreditPlan() != null ? card.getCreditPlan().getApr() : null)")
    @Mapping(target = "planAnnualFee", expression = "java(card.getCreditPlan() != null ? card.getCreditPlan().getAnnualFee() : null)")
    @Mapping(target = "planGracePeriodDays", expression = "java(card.getCreditPlan() != null ? card.getCreditPlan().getGracePeriodDays() : null)")
    @Mapping(target = "planLateFee", expression = "java(card.getCreditPlan() != null ? card.getCreditPlan().getLateFee() : null)")
    CreditCardDTO toDTO(CreditCard card);

    @Mapping(target = "account", ignore = true)
    @Mapping(target = "cvv", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "issueDate", ignore = true)
    @Mapping(target = "blockedDate", ignore = true)
    @Mapping(target = "merchantCategoryBlocks", source = "merchantCategoryBlocks", qualifiedByName = "joinCategories")
    @Mapping(target = "creditPlan", ignore = true)
    CreditCard toEntity(CreditCardDTO dto);

    @Named("statusToString")
    default String statusToString(Status status) {
        return status == null ? null : status.name();
    }

    @Named("localDateTimeToString")
    default String localDateTimeToString(LocalDateTime value) {
        return value == null ? null : value.toString();
    }

    @Named("splitCategories")
    default List<String> splitCategories(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split(","))
            .map(String::trim)
            .filter(v -> !v.isBlank())
            .collect(Collectors.toList());
    }

    @Named("joinCategories")
    default String joinCategories(List<String> value) {
        if (value == null || value.isEmpty()) {
            return null;
        }
        return value.stream()
            .map(String::trim)
            .filter(v -> !v.isBlank())
            .collect(Collectors.joining(","));
    }
}
