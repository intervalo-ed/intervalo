"""Verifica el cobro directo por Mercado Pago (Checkout Pro).

Cubre las tres cosas de game/mercadopago.py que deciden plata y no se pueden
probar contra la red:

1. **El cuerpo de la preferencia** — que el monto sea el que la persona eligió,
   que no se cuele el efectivo, que no aparezcan cuotas y que la referencia
   lleve al jugador. Un error acá no rompe nada: cobra mal, que es peor.
2. **La firma del webhook** — que acepte la buena y rechace todo lo demás. Si
   esto se relaja, el endpoint pasa a ser un botón público para fabricarse
   empujes; si se rompe al revés, cada donación real entra como inválida y la
   gente paga y no recibe nada.
3. **La acreditación exacta** — que el empuje quede con dueño, que el mismo pago
   no entre dos veces, y que se marque la intención de quien pagó y no la del
   que estaba al lado. Esos tres eran exactamente los agujeros de la vía vieja
   (docs/reports/2026-09-17-cafecito-embudo.md).

Uso:
    python backend/scripts/check_cafecito_mercadopago.py

Sale con código 1 si algo falla.
"""

import hashlib
import hmac
import os
import sys
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "cafecito_mp.db"
).replace("\\", "/")
os.environ["APP_BASE_URL"] = "https://www.intervalo.xyz"
os.environ["MP_ACCESS_TOKEN"] = "TEST-token-de-mentira"
os.environ["MP_WEBHOOK_SECRET"] = "secreto-del-check"
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from fastapi.testclient import TestClient  # noqa: E402

import database  # noqa: E402
from game import boosts as game_boosts  # noqa: E402
from game import mercadopago as mp  # noqa: E402
from models import Base, GameBoost, GameBoostIntent, GamePlayer  # noqa: E402

Base.metadata.create_all(bind=database.engine)

import main  # noqa: E402

fallos: list[str] = []


def ok(cond: bool, etiqueta: str) -> None:
    print(("  ok   " if cond else "  FALLA ") + etiqueta)
    if not cond:
        fallos.append(etiqueta)


print("— el cuerpo de la preferencia —")

cuerpo = mp.cuerpo_de_preferencia(player_id=329, cafecitos=10, university="UBA")
item = cuerpo["items"][0]
ok(item["unit_price"] == 10 * game_boosts.PRECIO_CAFECITO, "diez cafecitos son $1.000")
ok(item["quantity"] == 1, "va un solo ítem, no diez de a uno")
ok(item["currency_id"] == "ARS", "la moneda es pesos")
ok("UBA" in item["title"], "el título nombra la universidad")
ok(
    mp.cuerpo_de_preferencia(player_id=1, cafecitos=1, university=None)["items"][0][
        "title"
    ]
    == "1 cafecito",
    "uno solo se dice en singular y sin universidad",
)
for n in (1, 3, 5, 10):
    c = mp.cuerpo_de_preferencia(player_id=1, cafecitos=n, university=None)
    ok(
        c["items"][0]["unit_price"] == n * game_boosts.PRECIO_CAFECITO,
        f"{n} cafecitos cuestan {n * game_boosts.PRECIO_CAFECITO}",
    )

ok(cuerpo["external_reference"] == "dx:329", "la referencia lleva al jugador")
ok(mp.leer_referencia(cuerpo["external_reference"]) == 329, "y se puede volver a leer")
ok(mp.leer_referencia("C_6aac_U_6a6a") is None, "una referencia ajena no se confunde")
ok(mp.leer_referencia(None) is None, "sin referencia no explota")
ok(mp.leer_referencia("dx:no-es-un-numero") is None, "una referencia rota no explota")
ok(cuerpo["metadata"]["player_id"] == 329, "la metadata repite el jugador")

tipos = {t["id"] for t in cuerpo["payment_methods"]["excluded_payment_types"]}
ok("ticket" in tipos, "el efectivo está excluido")
ok(cuerpo["payment_methods"]["installments"] == 1, "no se ofrecen cuotas")
ok(len(cuerpo["statement_descriptor"]) <= 13, "el descriptor entra en el resumen")
ok(
    all(u.startswith("https://") for u in cuerpo["back_urls"].values()),
    "las tres URLs de vuelta son https",
)
ok("notification_url" not in cuerpo, "el webhook se configura en un solo lugar")
ok(cuerpo["expires"] is True, "la preferencia vence")
vence = datetime.fromisoformat(cuerpo["expiration_date_to"].replace("Z", "+00:00"))
ok(vence > datetime.now(timezone.utc), "y vence en el futuro, no en el pasado")


print("— la firma del webhook —")


def firma(data_id: str, request_id: str, ts: str = "1700000000", secreto: str | None = None) -> str:
    molde = f"id:{data_id};request-id:{request_id};ts:{ts};"
    clave = (secreto or os.environ["MP_WEBHOOK_SECRET"]).encode()
    return "ts=%s,v1=%s" % (
        ts,
        hmac.new(clave, molde.encode(), hashlib.sha256).hexdigest(),
    )


ok(mp.firma_valida(firma("123", "req-1"), "req-1", "123"), "la firma buena pasa")
ok(
    not mp.firma_valida(firma("123", "req-1"), "req-1", "124"),
    "cambiarle el id al pago la invalida",
)
ok(
    not mp.firma_valida(firma("123", "req-1"), "req-2", "123"),
    "cambiarle el request-id la invalida",
)
ok(
    not mp.firma_valida(firma("123", "req-1", secreto="otro"), "req-1", "123"),
    "firmada con otro secreto no pasa",
)
ok(not mp.firma_valida(None, "req-1", "123"), "sin header no pasa")
ok(not mp.firma_valida("cualquier-cosa", "req-1", "123"), "un header roto no pasa")
ok(not mp.firma_valida(firma("123", "req-1"), "req-1", None), "sin data.id no pasa")
_guardado = os.environ.pop("MP_WEBHOOK_SECRET")
ok(
    not mp.firma_valida(firma("123", "req-1", secreto=_guardado), "req-1", "123"),
    "sin secreto configurado NO se acredita nada",
)
os.environ["MP_WEBHOOK_SECRET"] = _guardado


print("— la acreditación exacta —")

db = database.SessionLocal()
paga = GamePlayer(guest_token="t-paga", alias="paga", university="UBA")
otro = GamePlayer(guest_token="t-otro", alias="otro", university="UNC")
db.add_all([paga, otro])
db.commit()

ahora = datetime.utcnow()
i_paga = GameBoostIntent(player_id=paga.id, university="UBA", created_at=ahora)
i_otro = GameBoostIntent(player_id=otro.id, university="UNC", created_at=ahora)
db.add_all([i_paga, i_otro])
db.commit()

boost = game_boosts.acreditar_pago(db, paga, 10, "178598424645")
db.commit()
ok(boost is not None, "el pago se convierte en empuje")
ok(boost.player_id == paga.id, "y el empuje queda con dueño")
ok(boost.university == "UBA", "cobra la universidad de quien pagó")
ok(boost.cafecitos == 10, "por la cantidad que pagó")
ok(boost.source == "cafecito", "cuenta como plata que entró")
ok(
    boost.external_ref == f"{game_boosts.FUENTE_MAIL}178598424645",
    "la referencia es el id del pago, con el prefijo del mail",
)
ok(boost.donor_name is None, "no se publica el nombre legal de quien pagó")

db.refresh(i_paga)
db.refresh(i_otro)
ok(i_paga.consumed_at is not None, "se marca la intención de quien pagó")
ok(i_otro.consumed_at is None, "y NO la del que estaba al lado")

repetido = game_boosts.acreditar_pago(db, paga, 10, "178598424645")
ok(repetido is None, "el mismo pago no entra dos veces")

# La otra mitad de la deduplicación: el mail del mismo pago, que llega con el
# número de operación, arma la misma referencia y rebota contra el UNIQUE.
por_mail = game_boosts.grant(
    db,
    university="UBA",
    cafecitos=10,
    source="cafecito",
    external_ref=f"{game_boosts.FUENTE_MAIL}178598424645",
)
ok(por_mail is None, "el aviso por mail del mismo pago tampoco entra dos veces")

estado = game_boosts.estado_de_donacion(db, paga)
ok(estado.state == "credited", "a quien pagó se le dice que llegó")
ok(
    game_boosts.estado_de_donacion(db, otro).state == "pending",
    "y al que no, se le sigue diciendo que espera",
)


print("— la reconciliación, que es la red de abajo —")

# `aplicar` es el camino compartido: lo usan el webhook y la reconciliación, y
# lo que se prueba acá es que la segunda pasada no vuelva a acreditar. Es el
# escenario real: Mercado Pago reintenta cada 15 minutos, así que el mismo pago
# llega dos veces por definición.
pago_falso = {
    "id": "178777000999",
    "status": "approved",
    "transaction_amount": 300,
    "external_reference": mp.referencia(paga.id),
}
primera = mp.aplicar(db, pago_falso)
db.commit()
ok("3 cafecitos" in primera, "la reconciliación acredita lo que faltaba")
segunda = mp.aplicar(db, pago_falso)
db.commit()
ok("ya estaba aplicado" in segunda, "y en la segunda vuelta no hace nada")

ok(
    "ajeno al juego" in mp.aplicar(db, {**pago_falso, "external_reference": "INSTORE-x"}),
    "un cobro de la cuenta sin referencia nuestra se descarta",
)
ok(
    "no existe" in mp.aplicar(db, {**pago_falso, "id": "1", "external_reference": "dx:999999"}),
    "un jugador que no existe no rompe la vuelta",
)

os.environ["MP_ACCESS_TOKEN"] = ""
ok(mp.pagos_del_juego() == [], "sin token la reconciliación no consulta nada")
os.environ["MP_ACCESS_TOKEN"] = "TEST-token-de-mentira"


print("— el webhook de punta a punta —")

cliente = TestClient(main.app)

r = cliente.post(
    "/webhooks/mercadopago?data.id=999&type=payment",
    json={"type": "payment", "data": {"id": "999"}},
    headers={"x-signature": "ts=1,v1=" + "0" * 64, "x-request-id": "req-x"},
)
ok(r.status_code == 401, "una notificación sin firma válida se rechaza")

antes = db.query(GameBoost).count()
r = cliente.post(
    "/webhooks/mercadopago?data.id=555&type=payment",
    json={"type": "payment", "live_mode": False, "data": {"id": "555"}},
    headers={"x-signature": firma("555", "req-y"), "x-request-id": "req-y"},
)
ok(r.status_code == 200, "una de prueba se acusa recibo")
ok(db.query(GameBoost).count() == antes, "pero no fabrica ningún empuje")

# El camino feliz, con la API de Mercado Pago simulada: lo que se prueba acá es
# el pegamento —firma, referencia, monto, acreditación— y no el cliente HTTP.
_real = mp.leer_pago
mp.leer_pago = lambda pid: {  # type: ignore[assignment]
    "id": pid,
    "status": "approved",
    "transaction_amount": 500,
    "external_reference": mp.referencia(paga.id),
}
try:
    r = cliente.post(
        "/webhooks/mercadopago?data.id=178999000111&type=payment",
        json={"type": "payment", "live_mode": True, "data": {"id": "178999000111"}},
        headers={"x-signature": firma("178999000111", "req-z"), "x-request-id": "req-z"},
    )
    ok(r.status_code == 200, "el pago aprobado se acepta")
    nuevo = (
        db.query(GameBoost)
        .filter(GameBoost.external_ref == f"{game_boosts.FUENTE_MAIL}178999000111")
        .first()
    )
    ok(nuevo is not None, "y queda su empuje")
    ok(nuevo is not None and nuevo.cafecitos == 5, "$500 son cinco cafecitos")
    ok(nuevo is not None and nuevo.player_id == paga.id, "con el dueño que dice la referencia")

    # Un monto que no es múltiplo del precio no es una compra de cafecitos.
    mp.leer_pago = lambda pid: {  # type: ignore[assignment]
        "id": pid,
        "status": "approved",
        "transaction_amount": 237,
        "external_reference": mp.referencia(paga.id),
    }
    antes = db.query(GameBoost).count()
    r = cliente.post(
        "/webhooks/mercadopago?data.id=178999000222&type=payment",
        json={"type": "payment", "live_mode": True, "data": {"id": "178999000222"}},
        headers={"x-signature": firma("178999000222", "req-w"), "x-request-id": "req-w"},
    )
    ok(r.status_code == 200 and db.query(GameBoost).count() == antes,
       "un monto que no es múltiplo del precio se ignora")

    # Un cobro de la misma cuenta que no salió del juego.
    mp.leer_pago = lambda pid: {  # type: ignore[assignment]
        "id": pid,
        "status": "approved",
        "transaction_amount": 6000,
        "external_reference": "C_6aac762d_U_6a6a141f",
    }
    antes = db.query(GameBoost).count()
    r = cliente.post(
        "/webhooks/mercadopago?data.id=178999000333&type=payment",
        json={"type": "payment", "live_mode": True, "data": {"id": "178999000333"}},
        headers={"x-signature": firma("178999000333", "req-v"), "x-request-id": "req-v"},
    )
    ok(r.status_code == 200 and db.query(GameBoost).count() == antes,
       "un cobro ajeno al juego en la misma cuenta no fabrica empujes")

    # Un pago rechazado.
    mp.leer_pago = lambda pid: {  # type: ignore[assignment]
        "id": pid,
        "status": "rejected",
        "transaction_amount": 1000,
        "external_reference": mp.referencia(paga.id),
    }
    antes = db.query(GameBoost).count()
    r = cliente.post(
        "/webhooks/mercadopago?data.id=178999000444&type=payment",
        json={"type": "payment", "live_mode": True, "data": {"id": "178999000444"}},
        headers={"x-signature": firma("178999000444", "req-u"), "x-request-id": "req-u"},
    )
    ok(r.status_code == 200 and db.query(GameBoost).count() == antes,
       "un pago rechazado no acredita nada")
finally:
    mp.leer_pago = _real  # type: ignore[assignment]

db.close()

print()
if fallos:
    print(f"{len(fallos)} fallas:")
    for f in fallos:
        print(f"  - {f}")
    sys.exit(1)
print("todo ok")
