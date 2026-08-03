namespace Warehouse.API.Application.DTOs.Auth;

public record UpdateEmployeeRequest(
    string FirstName,
    string LastName,
    string Role
);

public record ResetEmployeePasswordRequest(
    string NewPassword
);