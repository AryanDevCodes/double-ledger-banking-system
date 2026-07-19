package com.bank.entity.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;

@Converter(autoApply = true)
public class YearMonthConverter implements AttributeConverter<YearMonth, String> {

    @Override
    public String convertToDatabaseColumn(YearMonth attribute) {
        return attribute == null ? null : attribute.toString(); // "YYYY-MM"
    }

    @Override
    public YearMonth convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }

        String normalized = dbData.trim();

        try {
            return YearMonth.parse(normalized);
        } catch (DateTimeParseException ex) {
            if (normalized.length() >= 10) {
                try {
                    return YearMonth.from(LocalDate.parse(normalized.substring(0, 10)));
                } catch (DateTimeParseException ignored) {
                    // Fall through to the final parse attempt below.
                }
            }

            if (normalized.length() >= 7) {
                return YearMonth.parse(normalized.substring(0, 7));
            }

            throw ex;
        }
    }
}
