export class LogoutDto {
  // Empty body - uses JWT from bearer token
}

export class LogoutResponseDto {
  success: boolean;
  message: string;
}
