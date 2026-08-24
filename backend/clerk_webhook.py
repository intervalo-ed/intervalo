"""
clerk_webhook.py — Verificación de los webhooks de Clerk (formato Svix).

Existe para que la fila de `users` no dependa de que el navegador llegue a
hacer su primera request autenticada. Ese camino perdía el 15% de las altas:
si el celular se colgaba volviendo del login de Google, la persona quedaba
creada en Clerk y sin existir para nosotros — invisible incluso para los
emails de ciclo de vida, que parten de la tabla `users`.

Firma verificada con la stdlib en vez de traer `svix`: el algoritmo son veinte
líneas y `requirements.txt` está duplicado (raíz y backend/) y sin pinear, así
que una dependencia más es una cadena transitiva que puede romper un deploy
sin lockfile que la contenga.

Formato de Svix:
  - `svix-id`, `svix-timestamp`, `svix-signature` en los headers
  - firma = HMAC-SHA256 de "{id}.{timestamp}.{body}" con el secreto en base64
  - `svix-signature` trae una o varias firmas separadas por espacio, cada una
    con prefijo de versión: "v1,<b64> v1,<b64>". Vienen varias durante una
    rotación de secreto, así que alcanza con que una valide.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import os
import time

# Ventana de tolerancia del timestamp. Sin esto, quien capture un POST válido
# puede repetirlo para siempre.
TOLERANCE_SECONDS = 300


class WebhookVerificationError(Exception):
    """La firma, el timestamp o los headers no validan."""


def _secret_bytes(secret: str) -> bytes:
    """El secreto viene como `whsec_<base64>`; la clave es lo que sigue al guion bajo."""
    raw = secret.split("_", 1)[1] if secret.startswith("whsec_") else secret
    return base64.b64decode(raw)


def verify_svix_signature(
    *,
    body: bytes,
    svix_id: str,
    svix_timestamp: str,
    svix_signature: str,
    secret: str | None = None,
) -> None:
    """Valida la firma o levanta `WebhookVerificationError`.

    `body` tiene que ser el cuerpo crudo tal cual llegó: cualquier
    re-serialización del JSON cambia los bytes y rompe el HMAC.
    """
    secret = secret if secret is not None else os.environ.get("CLERK_WEBHOOK_SECRET", "")
    if not secret:
        raise WebhookVerificationError("CLERK_WEBHOOK_SECRET no configurado")

    if not (svix_id and svix_timestamp and svix_signature):
        raise WebhookVerificationError("faltan headers de Svix")

    try:
        sent_at = int(svix_timestamp)
    except ValueError:
        raise WebhookVerificationError("svix-timestamp no es un entero")

    if abs(time.time() - sent_at) > TOLERANCE_SECONDS:
        raise WebhookVerificationError("svix-timestamp fuera de la ventana de tolerancia")

    signed = f"{svix_id}.{svix_timestamp}.".encode() + body
    expected = base64.b64encode(
        hmac.new(_secret_bytes(secret), signed, hashlib.sha256).digest()
    ).decode()

    for part in svix_signature.split():
        version, _, value = part.partition(",")
        # Versiones desconocidas se ignoran en vez de asumirse compatibles: si
        # Svix saca un v2, esto falla cerrado y no abierto.
        if version != "v1":
            continue
        if hmac.compare_digest(value, expected):
            return

    raise WebhookVerificationError("ninguna firma coincide")
