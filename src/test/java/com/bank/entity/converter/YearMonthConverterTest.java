package com.bank.entity.converter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.YearMonth;
import org.junit.jupiter.api.Test;

class YearMonthConverterTest {

    private final YearMonthConverter converter = new YearMonthConverter();

    @Test
    void convertsYearMonthToDatabaseColumn() {
        assertEquals("2026-05", converter.convertToDatabaseColumn(YearMonth.of(2026, 5)));
    }

    @Test
    void convertsBlankValuesToNull() {
        assertNull(converter.convertToEntityAttribute(null));
        assertNull(converter.convertToEntityAttribute("   "));
    }

    @Test
    void convertsYearMonthString() {
        assertEquals(YearMonth.of(2026, 5), converter.convertToEntityAttribute("2026-05"));
    }

    @Test
    void convertsIsoDateString() {
        assertEquals(YearMonth.of(2026, 5), converter.convertToEntityAttribute("2026-05-21"));
    }

    @Test
    void rejectsUnsupportedShortValues() {
        assertThrows(RuntimeException.class, () -> converter.convertToEntityAttribute("2026"));
    }
}
