"""Verifica la vía de respaldo: la donación que entra por el mail de Mercado Pago.

Cubre las tres cosas que pueden salir mal y que no se ven hasta que alguien pagó:
que el monto se lea del renglón correcto (el aviso trae tres montos y solo uno es
lo que donaron), que un mail cualquiera en el buzón no reparta premios, y que una
donación anunciada por los DOS canales no valga el doble.

Los cuerpos de acá abajo son copias de avisos reales con los datos de la persona
cambiados. El repositorio es público: nunca entra el nombre ni el mail de alguien
que donó.

Uso:
    python backend/scripts/check_cafecito_email.py

Sale con código 1 si algo falla.
"""

import os
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "cafecito_mail.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import Base, GameBoost, GameBoostIntent, GamePlayer  # noqa: E402
from game import boosts  # noqa: E402
from game import cafecito_email as ce  # noqa: E402
from game import cafecito_stream as cs  # noqa: E402

Base.metadata.create_all(bind=database.engine)

BUZON = "mp-9f3a1c7b@intervalo.xyz"
os.environ["CAFECITO_MAIL_BUZON"] = BUZON

FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


def limpiar() -> None:
    db = database.SessionLocal()
    db.query(GameBoost).delete()
    db.query(GameBoostIntent).delete()
    db.query(GamePlayer).delete()
    db.commit()
    db.close()


def empujes() -> list[GameBoost]:
    db = database.SessionLocal()
    filas = db.query(GameBoost).order_by(GameBoost.id).all()
    db.close()
    return filas


def intencion(university: str | None, hace_minutos: int = 0) -> None:
    """Alguien tocó el botón de donar hace un rato."""
    db = database.SessionLocal()
    jugador = GamePlayer(alias=f"j{hace_minutos}{university}", university=university)
    db.add(jugador)
    db.flush()
    db.add(
        GameBoostIntent(
            player_id=jugador.id,
            university=university,
            created_at=datetime.utcnow() - timedelta(minutes=hace_minutos),
        )
    )
    db.commit()
    db.close()


# El aviso de Mercado Pago tal como llega: una tabla aplanada, con el número de
# operación dos veces (la primera deletreado para el lector de pantalla) y TRES
# montos, de los cuales solo el primero es lo que pagaron.
def aviso(total: str = "500", operacion: str = "176089085046") -> dict:
    return {
        "from": "Mercado Pago <info@mercadopago.com>",
        "to": [BUZON],
        "subject": "Pago aprobado en Nicolás Vrancovich",
        "text": (
            "| |\n| Hola, Nicolás Vrancovich |\n"
            "| Recibiste un pago en Nicolás Vrancovich |\n"
            f"Número de operación , 1 7 6 0 8 9N.° de operación: {operacion}\n"
            "| # Detalle del pago |\n"
            f"| Total de la operación |\n\n| |\n| $ {total} |\n"
            "| Costos de Mercado Pago |\n\n| - $ 21,51 |\n"
            "| El 15/sep recibirás |\n\n| $ 453,49 |\n"
            "| Medio de pago |\n| Dinero disponible |\n"
            "| Datos del cliente |\n| Juan Carlos Cafecito |\n"
            "| juancarlos@example.com |\n"
        ),
        "html": None,
    }


print("1. un aviso de $500 son cinco cafecitos")
limpiar()
intencion("UBA", hace_minutos=2)
destinos = ce.aplicar(aviso())
filas = empujes()
check(destinos == ["UBA"], f"va a la universidad de quien tocó el botón (fue a {destinos})")
check(len(filas) == 1, f"una sola fila ({len(filas)})")
check(filas[0].cafecitos == 5, f"cinco cafecitos ({filas[0].cafecitos})")
check(
    filas[0].external_ref == "mp:176089085046",
    f"la referencia es el número de operación ({filas[0].external_ref})",
)
check(filas[0].donor_name is None, "no publica el nombre legal de quien pagó")

print("2. el total no se confunde con los costos ni con el neto")
limpiar()
ce.aplicar(aviso(total="1.500"))
filas = empujes()
check(len(filas) == 1 and filas[0].cafecitos == 15, f"$1.500 son quince cafecitos ({filas and filas[0].cafecitos})")

print("3. el mismo aviso dos veces no aplica dos veces")
limpiar()
ce.aplicar(aviso())
segunda = ce.aplicar(aviso())
check(segunda == [], f"la segunda no otorga nada ({segunda})")
check(len(empujes()) == 1, f"sigue habiendo una sola fila ({len(empujes())})")

print("4. un cobro que no es múltiplo del precio del cafecito se ignora")
limpiar()
check(ce.leer(aviso(total="450")) is None, "$450 no es una compra de cafecitos")
check(ce.aplicar(aviso(total="450")) == [], "y no otorga nada")
check(len(empujes()) == 0, "no deja ninguna fila")

print("5. un correo cualquiera en el buzón no reparte premios")
limpiar()
otro = {
    "from": "alguien@example.com",
    "to": [BUZON],
    "subject": "hola",
    "text": "quería consultar algo sobre la app",
    "html": None,
}
check(ce.leer(otro) is None, "no se lo confunde con un aviso de pago")
check(ce.procesar(otro) is True, "igual se lo reconoce como propio del buzón")
check(len(empujes()) == 0, "y no deja ninguna fila")

print("6. sin CAFECITO_MAIL_BUZON el camino está apagado")
limpiar()
del os.environ["CAFECITO_MAIL_BUZON"]
check(ce.procesar(aviso()) is False, "no procesa nada")
check(len(empujes()) == 0, "ni siquiera un aviso de pago legítimo")
os.environ["CAFECITO_MAIL_BUZON"] = BUZON

print("7. un aviso dirigido a otra dirección no es nuestro")
limpiar()
ajeno = aviso()
ajeno["to"] = ["hola@intervalo.xyz"]
check(ce.procesar(ajeno) is False, "se deja pasar para que lo reenvíe el forward")
check(len(empujes()) == 0, "sin tocar el juego")

print("8. un aviso que llega solo en HTML se lee igual")
limpiar()
solo_html = aviso()
solo_html["text"] = ""
solo_html["html"] = (
    "<table><tr><td>N.&deg; de operaci&oacute;n: 176089085046</td></tr>"
    "<tr><td>Total de la operaci&oacute;n</td></tr>"
    "<tr><td><b>$&nbsp;300</b></td></tr>"
    "<tr><td>Costos de Mercado Pago</td></tr><tr><td>- $ 12,90</td></tr></table>"
)
datos = ce.leer(solo_html)
check(datos is not None and datos["cafecitos"] == 3, f"tres cafecitos desde el HTML ({datos})")

print("9. lo que ya entró por el socket no se cobra de nuevo por mail")
limpiar()
intencion("UTN", hace_minutos=1)
cs.aplicar({"name": "Nico", "count": 5, "message": "vamos"})
antes = len(empujes())
destinos = ce.aplicar(aviso())
check(destinos == [], f"el mail no otorga nada ({destinos})")
check(len(empujes()) == antes, f"la cantidad de empujes no cambia ({len(empujes())})")

print("10. y al revés: lo que entró por mail no se cobra de nuevo por el socket")
limpiar()
intencion("UTN", hace_minutos=1)
ce.aplicar(aviso())
antes = len(empujes())
destinos = cs.aplicar({"name": "Nico", "count": 5, "message": "vamos"})
check(destinos == [], f"el socket no otorga nada ({destinos})")
check(len(empujes()) == antes, f"la cantidad de empujes no cambia ({len(empujes())})")

print("11. dos donaciones iguales separadas en el tiempo cuentan las dos")
limpiar()
ahora = datetime.utcnow()
ce.aplicar(aviso(operacion="176089085047"), ahora=ahora - timedelta(seconds=boosts.VENTANA_MISMO_PAGO_S + 60))
cs.aplicar({"name": "Otro", "count": 5, "message": "aguante la UBA"}, ahora=ahora)
filas = empujes()
check(len(filas) == 2, f"las dos quedan registradas ({len(filas)})")

print("12. una donación sin intenciones abiertas es un empuje global")
limpiar()
destinos = ce.aplicar(aviso())
check(destinos == ["TODOS"], f"le llega a todo el mundo ({destinos})")
check(empujes()[0].university is None, "la fila queda sin universidad")

print("13. un aviso maquetado de verdad, con CSS entre el rotulo y el monto")
limpiar()
maquetado = aviso()
maquetado["text"] = ""
maquetado["html"] = (
    "<html><head><style type=3D'text/css'>"
    ".col-600{width:600px;padding:0 24px 0 24px;font-size:14px;line-height:20px}"
    "@media only screen and (max-width:640px){.col-600{width:320px}}"
    "</style></head><body>"
    "<p>N.&deg; de operaci&oacute;n: 176089085046</p>"
    "<table><tr><td class=3D'col-600'>Total de la operaci&oacute;n</td></tr>"
    "<style>.monto{font-size:28px;margin:0 0 8px 0}</style>"
    "<tr><td class=3D'monto'>$&nbsp;200</td></tr>"
    "<tr><td>Costos de Mercado Pago</td></tr><tr><td>- $ 8,60</td></tr></table>"
    "</body></html>"
)
datos = ce.leer(maquetado)
check(datos is not None and datos["cafecitos"] == 2, f"dos cafecitos, sin comerse el CSS ({datos})")

print()
if FAILURES:
    print(f"{len(FAILURES)} fallo(s):")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todo ok")
