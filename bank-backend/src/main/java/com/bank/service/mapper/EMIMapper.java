package com.bank.service.mapper;

import com.bank.dto.loan.EMIDTO;
import com.bank.entity.EMI;
import com.bank.entity.Status;
import java.time.LocalDateTime;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface EMIMapper {

    @Mapping(target = "loanId", source = "loan.id")
    @Mapping(target = "status", source = "status", qualifiedByName = "statusToString")
    @Mapping(target = "createdAt", source = "createdAt", qualifiedByName = "localDateTimeToString")
    @Mapping(target = "updatedAt", source = "updatedAt", qualifiedByName = "localDateTimeToString")
    EMIDTO toDTO(EMI emi);

    @Mapping(target = "loan", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    EMI toEntity(EMIDTO dto);

    @Named("statusToString")
    default String statusToString(Status status) {
        return status == null ? null : status.name();
    }

    @Named("localDateTimeToString")
    default String localDateTimeToString(LocalDateTime value) {
        return value == null ? null : value.toString();
    }
}
