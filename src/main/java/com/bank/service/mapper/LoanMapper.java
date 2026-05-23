package com.bank.service.mapper;

import com.bank.dto.loan.LoanDTO;
import com.bank.entity.Loan;
import com.bank.entity.Status;
import java.time.LocalDateTime;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface LoanMapper {

    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "accountId", source = "account.id")
    @Mapping(target = "status", source = "status", qualifiedByName = "statusToString")
    @Mapping(target = "createdAt", source = "createdAt", qualifiedByName = "localDateTimeToString")
    @Mapping(target = "updatedAt", source = "updatedAt", qualifiedByName = "localDateTimeToString")
    LoanDTO toDTO(Loan loan);

    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "account", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Loan toEntity(LoanDTO dto);

    @Named("statusToString")
    default String statusToString(Status status) {
        return status == null ? null : status.name();
    }

    @Named("localDateTimeToString")
    default String localDateTimeToString(LocalDateTime value) {
        return value == null ? null : value.toString();
    }
}
