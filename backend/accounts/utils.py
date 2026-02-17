import secrets
import hashlib
import qrcode
import base64
from io import BytesIO
import pyotp

def gen_backup_codes(n=10):
    # return list of plaintext codes
    codes = [secrets.token_hex(6) for _ in range(n)]
    return codes

def hash_code(code: str):
    return hashlib.sha256(code.encode()).hexdigest()

def generate_qr_image_base64(otpauth_url: str):
    qr = qrcode.QRCode(border=1)
    qr.add_data(otpauth_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode()