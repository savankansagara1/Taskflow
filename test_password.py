from app.core.password import (
    hash_password,
    verify_password,
)


password = "MySecret123"

hashed_password = hash_password(password)

print("Original:", password)
print("Hash:", hashed_password)

print(
    "Correct password:",
    verify_password(
        "MySecret123",
        hashed_password,
    ),
)

print(
    "Wrong password:",
    verify_password(
        "WrongPassword",
        hashed_password,
    ),
)