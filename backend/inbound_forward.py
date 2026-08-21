"""Reenvío del correo que llega a hola@intervalo.xyz.

El dominio no tiene casilla propia: Resend recibe el mail (registro MX en la
raíz de intervalo.xyz) y avisa por webhook con el evento email.received. Acá
se verifica la firma de ese webhook y se re-envía el contenido al buzón real,
con reply-to al remitente original para que responder desde ahí le conteste
directo a quien escribió.

El SDK de Python no trae el forward() del SDK de Node, así que se compone a
mano igual que hace aquel por dentro: GET del email recibido + send normal.
Los adjuntos no se re-adjuntan (quedan descargables en Resend); el cuerpo
reenviado lo avisa para que no se pierdan en silencio.
"""

import logging
import os

logger = logging.getLogger(__name__)


def verify_inbound_signature(payload: str, headers: dict[str, str | None]) -> bool:
    """True si la firma Svix del webhook es válida.

    Sin RESEND_INBOUND_SECRET configurado devuelve False siempre: un endpoint
    de webhook sin secreto es un endpoint público que manda emails.
    """
    secret = os.environ.get("RESEND_INBOUND_SECRET")
    if not secret:
        logger.warning("RESEND_INBOUND_SECRET not set — rejecting inbound webhook")
        return False

    import resend

    try:
        resend.Webhooks.verify({
            "payload": payload,
            # El SDK espera las claves peladas, no los nombres de los headers.
            "headers": {
                "id": headers.get("svix-id"),
                "timestamp": headers.get("svix-timestamp"),
                "signature": headers.get("svix-signature"),
            },
            "webhook_secret": secret,
        })
        return True
    except Exception:
        return False


def forward_received_email(email_id: str) -> None:
    """Reenvía un email recibido en Resend al buzón real.

    Cualquier excepción sube al endpoint, que responde 500: Resend reintenta
    el webhook con backoff, así que un fallo transitorio no pierde el mail
    (que además queda guardado en Resend).
    """
    api_key = os.environ.get("RESEND_API_KEY")
    if not api_key:
        raise RuntimeError("RESEND_API_KEY not set")

    to_email = os.environ.get("INBOUND_FORWARD_TO", "nvrancovich@gmail.com")
    # Tiene que ser un dominio verificado para envío; el raíz solo recibe.
    from_email = os.environ.get(
        "INBOUND_FORWARD_FROM", "Intervalo <hola@comms.intervalo.xyz>"
    )

    import resend

    resend.api_key = api_key
    email = resend.EmailsReceiving.get(email_id)

    sender = email.get("from") or "(remitente desconocido)"
    subject = email.get("subject") or "(sin asunto)"
    text = email.get("text")
    html = email.get("html")
    attachments = email.get("attachments") or []

    # Encabezado con el remitente real: el "from" del reenvío es nuestro, así
    # que sin esto no se sabría quién escribió. Solo va en la versión texto;
    # en la HTML el layout es del remitente y no conviene inyectarle nada.
    header = f"De: {sender}\nPara: {', '.join(email.get('to') or [])}\n"
    if attachments:
        names = ", ".join(a.get("filename") or a.get("id") for a in attachments)
        header += (
            f"Adjuntos ({len(attachments)}): {names} — no se reenvían, "
            "quedan descargables en Resend.\n"
        )

    params: dict = {
        "from": from_email,
        "to": [to_email],
        "subject": subject,
        "reply_to": [sender],
    }
    if html:
        params["html"] = html
    params["text"] = f"{header}\n{text or '(sin contenido de texto)'}"

    resend.Emails.send(params)
    logger.info("Forwarded inbound email %s to %s", email_id, to_email)
