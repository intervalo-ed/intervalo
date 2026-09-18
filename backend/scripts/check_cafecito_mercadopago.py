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
    == "Intervalo · 1 cafecito",
    "uno solo se dice en singular y sin universidad",
)
# El checkout dibuja arriba el nombre del titular de la cuenta —«Nicolás
# Vrancovich»— y eso no se puede cambiar sin convertirla en empresa. La marca en
# el título es la única forma de que quien paga vea, en esa misma pantalla, el
# nombre que sí reconoce.
ok(item["title"].startswith(mp.MARCA), "la marca va primero, antes de todo lo demas")
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
ok("notification_url" not in cuerpo, "el webhook se configura en un solo lugar")
# Las dos que NO van, y el check existe porque ya rompieron una vez: el botón
# abre Mercado Pago en otra pestaña, así que una URL de retorno redirige esa y
# no la del juego — la persona terminaba con una partida nueva mientras la
# original la esperaba con la diapo abierta.
ok("back_urls" not in cuerpo, "sin URL de retorno: vuelve a la pestaña que ya estaba")
ok("auto_return" not in cuerpo, "y sin auto_return, que la necesita")
ok(cuerpo["expires"] is True, "la preferencia vence")
vence = datetime.fromisoformat(cuerpo["expiration_date_to"].replace("Z", "+00:00"))
ok(vence > datetime.now(timezone.utc), "y vence en el futuro, no en el pasado")


print("— el precio segun de donde mire la persona —")

# Cien pesos argentinos son siete centavos de dólar. El precio por país es lo que
# hace que el cartel signifique algo para alguien de afuera, y estos chequeos son
# los que evitan que esa misma flexibilidad acredite de más.

ok(game_boosts.pais_de("America/Montevideo") == "UY", "Montevideo es Uruguay")
ok(game_boosts.pais_de("America/Argentina/Cordoba") is None, "Cordoba paga el precio de casa")
ok(game_boosts.pais_de("Europe/Madrid") is None, "un pais sin copy propio paga el de casa")
ok(game_boosts.pais_de(None) is None, "sin huso no explota")
ok(game_boosts.pais_de("") is None, "con huso vacio tampoco")
ok(game_boosts.precio_de("UY") == 150, "en Uruguay un cafecito sale 150")
ok(game_boosts.precio_de(None) == game_boosts.PRECIO_CAFECITO, "sin pais, el precio argentino")
ok(game_boosts.precio_de("XX") == game_boosts.PRECIO_CAFECITO, "un pais desconocido, idem")

uy = mp.cuerpo_de_preferencia(player_id=1, cafecitos=10, university="UdelaR", pais="UY")
ok(uy["items"][0]["unit_price"] == 1500, "diez cafecitos uruguayos son $1.500")
ok(uy["metadata"]["precio_unitario"] == 150, "y el pago dice a que precio se cobraron")
ok(uy["metadata"]["cafecitos"] == 10, "y cuantos son, que es lo que se acredita")
ok(uy["metadata"]["pais"] == "UY", "y desde donde miraba quien pago")
ok(uy["items"][0]["currency_id"] == mp.MONEDA == "ARS", "la moneda sigue siendo la unica que la cuenta cobra")

# El título es lo ÚNICO que controlamos de la pantalla de Mercado Pago, que
# dibuja `$ 1.500` sin decir nunca la palabra ARS. El signo `$` también es el
# peso uruguayo: sin esta aclaración, un uruguayo lee treinta y siete dólares.
ok("ARS" in uy["items"][0]["title"], "el titulo aclara la moneda a quien mira de afuera")
ok("1.500" in uy["items"][0]["title"], "y dice el monto, que es lo que se lee mal")
ar = mp.cuerpo_de_preferencia(player_id=1, cafecitos=10, university="UBA", pais=None)
ok("ARS" not in ar["items"][0]["title"], "y no se la mete al que ya sabe en que moneda vive")
ok(ar["items"][0]["title"] == "Intervalo · 10 cafecitos para la UBA", "el titulo argentino no lleva moneda")


print("— cuantos cafecitos se acreditan —")

# El bug que este bloque previene: hasta hoy la cantidad se deducia dividiendo el
# monto por cien. Con un precio por país, los diez cafecitos de un uruguayo
# ($1.500) se habrían acreditado como quince, sin error y sin que nadie se entere.


def pago(monto, meta=None):
    p = {"transaction_amount": monto}
    if meta is not None:
        p["metadata"] = meta
    return p


ok(mp._cuantos_cafecitos(pago(1500, {"cafecitos": 10, "precio_unitario": 150})) == 10,
   "los diez de un uruguayo son diez y no quince")
ok(mp._cuantos_cafecitos(pago(1000, {"cafecitos": 10, "precio_unitario": 100})) == 10,
   "los diez de un argentino siguen siendo diez")
ok(mp._cuantos_cafecitos(pago(500, {"cafecitos": 5, "precio_unitario": 100})) == 5,
   "y cinco son cinco")
ok(mp._cuantos_cafecitos(pago(1500, {"cafecitos": 10, "precio_unitario": 100})) is None,
   "metadata que no cierra con el monto no se acredita")
ok(mp._cuantos_cafecitos(pago(1500, {"cafecitos": 99, "precio_unitario": 150})) is None,
   "ni una cantidad arriba del tope por donacion")
ok(mp._cuantos_cafecitos(pago(1500, {"cafecitos": 0, "precio_unitario": 150})) is None,
   "ni cero")
ok(mp._cuantos_cafecitos(pago(1500, {"cafecitos": "10", "precio_unitario": 150})) is None,
   "ni un texto donde va un numero")
ok(mp._cuantos_cafecitos(pago(1500, {"cafecitos": True, "precio_unitario": 1500})) is None,
   "ni un booleano, que en Python pasa por int")
# La trampa que casi se cuela: con metadata rota, caer a dividir por cien
# acreditaria quince donde hay diez. Un pago nuestro que no se entiende no se
# adivina.
ok(mp._cuantos_cafecitos(pago(1500, {"cafecitos": None, "precio_unitario": 150})) is None,
   "metadata rota NO cae al camino viejo")
# Los pagos que entraron ANTES de este cambio no tienen `precio_unitario`, y la
# reconciliación mira un día para atrás: el camino viejo tiene que seguir vivo.
ok(mp._cuantos_cafecitos(pago(1000, {"cafecitos": 10})) == 10,
   "un pago viejo, sin precio en la metadata, se sigue acreditando por el monto")
ok(mp._cuantos_cafecitos(pago(1000)) == 10, "y uno sin metadata ninguna, tambien")
ok(mp._cuantos_cafecitos(pago(350)) is None, "un monto que no es multiplo no se acredita")
ok(mp._cuantos_cafecitos(pago(0)) is None, "ni cero pesos")
ok(mp._cuantos_cafecitos(pago(-100)) is None, "ni un monto negativo")


print("— el canal del mail no adivina montos ambiguos —")

# $1.500 son diez cafecitos uruguayos o quince argentinos, y el aviso de pago por
# mail no trae con qué distinguirlos: solo el total. El pago en la API sí (lleva
# la metadata), así que el mail se corre y lo acredita el webhook.
from game import cafecito_email  # noqa: E402

def mail(total):
    # `_plano` aplasta los espacios, así que el aviso entra en una línea.
    return {"text": f"Operación: 179711509890 Total de la operación $ {total}"}

leido = cafecito_email.leer(mail("1.500,00"))
ok(leido is None, "el mail no acredita un monto que dos precios explican")
leido = cafecito_email.leer(mail("1.000,00"))
ok(leido is not None and leido["cafecitos"] == 10,
   "pero un monto que solo el precio argentino explica sigue entrando")


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
# El mail del pagador, que es lo único que permite agradecerle a quien donó sin
# cuenta —la mitad de los donantes—. Se guarda aparte de `users.email` a
# propósito: ese mail nos lo dieron para escribirnos, éste se lo dieron a
# Mercado Pago para pagar.
con_mail = game_boosts.acreditar_pago(
    db, otro, 3, "178598424646", donor_email="quien.pago@example.com")
db.commit()
ok(con_mail is not None and con_mail.donor_email == "quien.pago@example.com",
   "se guarda el mail con el que pagó")
ok(boost.donor_email is None, "y queda vacío cuando el pago no lo trajo")


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
    "payer": {"email": "  donante@example.com  "},
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
    ok(nuevo is not None and nuevo.donor_email == "donante@example.com",
       "y con el mail del pagador, sin los espacios que manda Mercado Pago")

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
