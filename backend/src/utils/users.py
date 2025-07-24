import secrets
import string


def generate_password(length=8):
    # Define character sets
    letters = string.ascii_letters  # a-z and A-Z
    digits = string.digits  # 0-9
    special_chars = string.punctuation  # !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~

    # Combine all characters
    all_chars = letters + digits + special_chars

    # Generate password with at least one of each type
    password = [
        secrets.choice(letters),  # At least one letter
        secrets.choice(digits),  # At least one digit
        secrets.choice(special_chars),  # At least one special character
    ]

    # Fill the rest of the password
    for i in range(length - 3):
        password.append(secrets.choice(all_chars))

    # Shuffle the password characters
    secrets.SystemRandom().shuffle(password)

    # Convert list to string
    return "".join(password)
