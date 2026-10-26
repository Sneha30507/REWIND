from datetime import timedelta

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)

SECRET = "unit-test-secret-key-0123456789abcdef-xyz"


def test_hash_is_not_plain_text_and_is_salted():
    first = hash_password("my-password-1")
    second = hash_password("my-password-1")
    assert "my-password-1" not in first
    assert first != second  # random salt


def test_verify_password():
    stored = hash_password("my-password-1")
    assert verify_password("my-password-1", stored) is True
    assert verify_password("wrong-password", stored) is False


def test_verify_password_rejects_garbage_hash():
    assert verify_password("anything", "not-a-valid-hash") is False
    assert verify_password("anything", "") is False


def test_token_round_trip():
    token = create_access_token(
        "42", secret_key=SECRET, algorithm="HS256", expires_delta=timedelta(minutes=5)
    )
    assert decode_access_token(token, secret_key=SECRET, algorithm="HS256") == "42"


def test_expired_token_rejected():
    token = create_access_token(
        "42", secret_key=SECRET, algorithm="HS256", expires_delta=timedelta(seconds=-10)
    )
    assert decode_access_token(token, secret_key=SECRET, algorithm="HS256") is None


def test_token_with_wrong_secret_rejected():
    token = create_access_token(
        "42", secret_key="another-secret-key-0123456789abcdef-xyz",
        algorithm="HS256", expires_delta=timedelta(minutes=5),
    )
    assert decode_access_token(token, secret_key=SECRET, algorithm="HS256") is None


def test_garbage_token_rejected():
    assert decode_access_token("abc.def.ghi", secret_key=SECRET, algorithm="HS256") is None
