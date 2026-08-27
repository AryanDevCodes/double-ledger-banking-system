package  com.bank.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/heath")
    public ResponseEntity<String> health(){
        return ResponseEntity.ok(
                "Running: " + "OK"
        );
    }
}