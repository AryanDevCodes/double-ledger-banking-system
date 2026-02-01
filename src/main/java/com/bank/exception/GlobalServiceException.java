package com.bank.exception;

public class GlobalServiceException extends RuntimeException {
    public GlobalServiceException(String message) {
        super(message);
    }

    public GlobalServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
