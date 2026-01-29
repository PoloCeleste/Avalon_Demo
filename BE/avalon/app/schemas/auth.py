from pydantic import BaseModel, Field
from typing import Optional

class TokenResponse(BaseModel):
    # access_token: str # Removed
    # refresh_token: str # Removed
    token_type: str = "bearer"
    expires_in: int

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    role: str
    status: str

class PasswordReset(BaseModel):
    username: str = Field(..., description="Your username")
    old_password: str = Field(..., description="Your current (temporary) password")
    new_password: str = Field(..., min_length=8, description="Your new password, minimum 8 characters")

class ForgotPasswordRequest(BaseModel):
    email: str
    username: str

class ConfirmPasswordReset(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)