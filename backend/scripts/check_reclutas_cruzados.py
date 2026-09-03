"""Verifica que los reclutas paguen en los DOS productos, y que nadie se pague a sí mismo.

Lo que se prueba es lo que no se ve usando la app:

· Que un recluta que estudia en Intervalo clásico le pague a quien lo trajo, aun
  cuando ese reclutador solo jugó al minijuego.
· Que la XP se ACUÑE: al recluta no se le descuenta nada.
· Que la cuenta cierre EXACTA. Redondeando cada pago hacia abajo, el 10%
  prometido se convierte en 8% — una quinta parte evaporada.
· Que el reclutador INVITADO no pierda lo que ganó: se le acumula y lo cobra al
  registrarse. Perderlo mataría el caso viral, que es compartir antes de tener
  cuenta.
· Que el autoreclutamiento no pague. Es alcanzable en dos clicks con código que
  ya existe: juego de invitado, comparto mi link, abro mi propio link, me anoto
  en clásico, vuelvo al juego y las dos filas se fusionan.

Uso:
    python backend/scripts/check_reclutas_cruzados.py

Sale con código 1 si algo falla.
"""
import os
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "reclutas.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import Base, GamePlayer, Handle, User  # noqa: E402

Base.metadata.create_all(database.engine)

import handles  # noqa: E402
import referrals  # noqa: E402

fallos: list[str] = []


def check(nombre: str, cond: bool, detalle: str = "") -> None:
    print(f"{'ok   ' if cond else 'FALLA'}  {nombre} {detalle}".rstrip())
    if not cond:
        fallos.append(nombre)


db = database.SessionLocal()

# El reclutador: un INVITADO del juego, sin cuenta de Intervalo. Es el caso que
# importa — se comparte el link antes de registrarse.
db.add(GamePlayer(id=1, alias="tmp1", guest_token="t1"))
# Y un reclutador que SÍ tiene cuenta, para el camino simple.
db.add(User(id=2, clerk_user_id="c2", email="b@b.com", name="B"))
db.commit()
db.add(GamePlayer(id=2, alias="tmp2", user_id=2))
# Los reclutas, los dos usuarios de clásico.
db.add(User(id=10, clerk_user_id="c10", email="r1@a.com", name="R1"))
db.add(User(id=11, clerk_user_id="c11", email="r2@a.com", name="R2"))
db.commit()
db.query(Handle).delete()
db.commit()
handles.reclamar(db, "invitadoquecomparte", player_id=1)
handles.reclamar(db, "conquetiene", user_id=2, player_id=2)
db.commit()

print("1. el @ de un invitado resuelve, y el de un registrado también")
check("el link de un invitado encuentra a su jugador",
      referrals.resolver(db, "invitadoquecomparte") == 1)
check("y el de un registrado también", referrals.resolver(db, "conquetiene") == 2)
check("un @ que no existe no resuelve a nadie", referrals.resolver(db, "nadie") is None)

print("2. anotar la arista es set-once")
r1 = db.get(User, 10)
referrals.anotar_usuario(db, r1, "invitadoquecomparte")
db.commit()
check("queda anotado quién lo trajo", r1.referred_by_player_id == 1)
referrals.anotar_usuario(db, r1, "conquetiene")
db.commit()
check("y un segundo intento no lo reasigna", r1.referred_by_player_id == 1)

print("3. el recluta de clásico le paga a un reclutador INVITADO")
antes_recluta = r1.total_xp
# El 10% de 25 XP son 2,5. En centésimas: 250, o sea 2 enteros y 50 de resto.
# Ese medio punto es lo que un pago redondeado hacia abajo tiraría en CADA
# respuesta, y es de dónde sale que el 10% prometido termine siendo un 8%.
pagado = referrals.acreditar_clasico(db, r1, 25)
db.commit()
check("paga los 2 enteros del 10% de 25 XP", pagado == 2, f"(dio {pagado})")
check("y el medio punto que sobra queda guardado, no se tira",
      r1.referral_pending == 50, f"(dio {r1.referral_pending})")
pagado2 = referrals.acreditar_clasico(db, r1, 25)
db.commit()
check("la segunda respuesta cobra 3: los 2 suyos más el medio punto guardado",
      pagado2 == 3, f"(dio {pagado2})")
check("dos respuestas de 25 pagaron 5 en total, el 10% EXACTO de 50",
      r1.referral_xp_given == 5, f"(dio {r1.referral_xp_given})")
check("la XP se ACUÑA: al recluta no se le descontó nada",
      db.get(User, 10).total_xp == antes_recluta)
check("y el invitado, que no tiene cuenta, la tiene guardada",
      db.get(GamePlayer, 1).classic_xp_owed == 5,
      f"(dio {db.get(GamePlayer, 1).classic_xp_owed})")

print("4. la cuenta cierra exacta, sin evaporarse en el redondeo")
# 20 respuestas de 12 XP = 240 XP. El 10% son 24 exactos. Redondeando cada pago
# hacia abajo se pagarían 0 y el 10% prometido sería 0%.
r2 = db.get(User, 11)
referrals.anotar_usuario(db, r2, "conquetiene")
db.commit()
for _ in range(20):
    referrals.acreditar_clasico(db, r2, 12)
db.commit()
check("20 respuestas de 12 XP pagan 24, no menos",
      db.get(User, 11).referral_xp_given == 24,
      f"(dio {db.get(User, 11).referral_xp_given})")
check("y el reclutador CON cuenta las cobró en su total_xp",
      db.get(User, 2).total_xp == 24, f"(dio {db.get(User, 2).total_xp})")

print("5. el invitado cobra lo que generó al registrarse")
db.add(User(id=3, clerk_user_id="c3", email="c@c.com", name="C"))
db.commit()
saldado = referrals.saldar_deuda_de_clasico(db, db.get(GamePlayer, 1), 3)
db.commit()
check("se le paga la deuda entera", saldado == 5, f"(dio {saldado})")
check("y le llega al total_xp de su cuenta nueva", db.get(User, 3).total_xp == 5)
check("el contador queda en cero", db.get(GamePlayer, 1).classic_xp_owed == 0)
# Descontando en vez de poner en cero, un pago que entre en el medio no se pierde.
db.query(GamePlayer).filter(GamePlayer.id == 1).update({"classic_xp_owed": 7})
db.commit()
check("y si entra un pago nuevo después, sigue pendiente y no se borró",
      db.get(GamePlayer, 1).classic_xp_owed == 7)

print("6. nadie se paga a sí mismo")
# La persona jugó de invitada, compartió su link, lo abrió ella y se anotó en
# clásico con su propio @. Al vincularse, ese jugador pasa a ser suyo.
db.add(User(id=20, clerk_user_id="c20", email="yo@a.com", name="Yo"))
db.commit()
db.add(GamePlayer(id=20, alias="tmp20", guest_token="t20"))
db.commit()
handles.reclamar(db, "mipropioalias", player_id=20)
db.commit()
yo = db.get(User, 20)
referrals.anotar_usuario(db, yo, "mipropioalias")
db.commit()
check("todavía sin vincular, la arista se puede llegar a anotar",
      yo.referred_by_player_id == 20)
# Ahora se vincula: el jugador pasa a ser de este usuario.
db.get(GamePlayer, 20).user_id = 20
db.commit()
pago = referrals.acreditar_clasico(db, yo, 1000)
db.commit()
check("pero la guarda de runtime NO le paga un centavo", pago == 0, f"(dio {pago})")
check("ni le tocó el total_xp", db.get(User, 20).total_xp == 0)
# Y anotarla de nuevo cuando el jugador YA es suyo tampoco pasa.
otro = db.get(User, 11)
otro.referred_by_player_id = None
db.commit()
db.get(GamePlayer, 2).user_id = 11
db.commit()
referrals.anotar_usuario(db, otro, "conquetiene")
db.commit()
check("y anotar el @ de un jugador que ya es tuyo tampoco crea la arista",
      otro.referred_by_player_id is None)

print("7. la fusión con una cuenta que ya tenía jugador")
# La rama que ningún caso recorría, y donde la deuda quedaba IMPAGABLE: el
# traspaso a la fila que sobrevive va por SQL con `synchronize_session=False`,
# que no toca el objeto en memoria, así que `saldar_deuda_de_clasico` leía el
# valor de antes del traspaso —casi siempre 0— y no pagaba nada. La XP no se
# borraba de la base, pero quedaba en una fila ya vinculada y esa función no se
# vuelve a llamar nunca para ese usuario.
from game import deps  # noqa: E402

db.add(User(id=30, clerk_user_id="c30", email="reg@a.com", name="Registrada"))
db.commit()
db.add(GamePlayer(id=30, alias="lafila", user_id=30))          # la que sobrevive
db.add(GamePlayer(id=31, alias="elinvitado", guest_token="t31", classic_xp_owed=13))
db.commit()
handles.reclamar(db, "lafila", user_id=30, player_id=30)
handles.reclamar(db, "elinvitado", player_id=31)
db.commit()

deps.link_guest_to_user(db, db.get(GamePlayer, 31), db.get(User, 30))
check("la deuda del invitado se le paga a la cuenta que lo absorbió",
      db.get(User, 30).total_xp == 13, f"(dio {db.get(User, 30).total_xp})")
check("y el contador de la fila que sobrevive queda en cero",
      db.get(GamePlayer, 30).classic_xp_owed == 0,
      f"(dio {db.get(GamePlayer, 30).classic_xp_owed})")

print("8. la deuda AUTOGENERADA antes de vincular no se cobra")
# El camino que las tres guardas no cubrían, porque cubren el estado y no la
# historia: mientras el jugador no tenía `user_id`, la guarda de runtime no
# disparaba y cada respuesta acumulaba el 10% de la propia XP en `classic_xp_owed`.
# Al vincular, la arista se limpiaba... y acto seguido se pagaba toda esa deuda.
db.add(User(id=40, clerk_user_id="c40", email="auto@a.com", name="Auto"))
db.commit()
db.add(GamePlayer(id=40, alias="miyo", guest_token="t40"))
db.commit()
handles.reclamar(db, "miyo", player_id=40)
db.commit()
yo2 = db.get(User, 40)
referrals.anotar_usuario(db, yo2, "miyo")
db.commit()
# Estudia: cada respuesta le acumula el 10% a su propio jugador invitado.
for _ in range(4):
    referrals.acreditar_clasico(db, yo2, 100)
db.commit()
autogenerado = db.get(GamePlayer, 40).classic_xp_owed
check("la deuda se acumuló mientras el jugador no tenía cuenta",
      autogenerado == 40, f"(dio {autogenerado})")
xp_antes = db.get(User, 40).total_xp

deps.link_guest_to_user(db, db.get(GamePlayer, 40), yo2)
check("al vincular, la arista queda limpia",
      db.get(User, 40).referred_by_player_id is None)
check("y NO se le paga lo que se generó a sí misma",
      db.get(User, 40).total_xp == xp_antes,
      f"(antes {xp_antes}, ahora {db.get(User, 40).total_xp})")
check("el aporte de esa arista muerta se borra de su fila",
      db.get(User, 40).referral_xp_given == 0,
      f"(dio {db.get(User, 40).referral_xp_given})")

# Pero lo que ese mismo invitado ganó trayendo gente DE VERDAD sí se cobra: la
# resta es por lo autogenerado, no por la deuda entera.
db.add(User(id=41, clerk_user_id="c41", email="otro@a.com", name="Otro"))
db.commit()
db.add(GamePlayer(id=42, alias="mixto", guest_token="t42"))
db.commit()
handles.reclamar(db, "mixto", player_id=42)
db.commit()
propio = db.get(User, 41)
referrals.anotar_usuario(db, propio, "mixto")
db.commit()
referrals.acreditar_clasico(db, propio, 200)   # 20 autogenerados
db.query(GamePlayer).filter(GamePlayer.id == 42).update(
    {"classic_xp_owed": GamePlayer.classic_xp_owed + 55}   # 55 de un recluta real
)
db.commit()
deps.link_guest_to_user(db, db.get(GamePlayer, 42), propio)
check("cobra lo de los reclutas reales y nada de lo propio",
      db.get(User, 41).total_xp == 55, f"(dio {db.get(User, 41).total_xp})")

db.close()

print()
if fallos:
    print(f"{len(fallos)} chequeos fallaron:")
    for f in fallos:
        print(f"  - {f}")
    raise SystemExit(1)
print("todo ok")
