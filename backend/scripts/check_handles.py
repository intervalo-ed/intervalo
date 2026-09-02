"""Verifica el registro de nombres (`backend/handles.py`).

Lo que se prueba es lo que NO se ve usando la app:

· Que soltar un @ NO lo libere. Es la regla que `game_alias_history` existía
  para sostener: un @ soltado sigue resolviendo los links `?r=` repartidos, así
  que dárselo a otro sería darle también la gente que trajo el primero.
· Que volver a un @ propio ya soltado se pueda, y que no lo pueda nadie más.
· Que un dueño nunca termine con dos @ activos, que es lo que hace de esto un
  registro y no una lista.
· Que al vincular las dos caras de una persona gane el @ del JUEGO, que es el
  que vio en pantalla y compartió.
· Que las dos columnas caché (`users.username`, `game_players.alias`) sigan
  siempre al handle activo.

Uso:
    python backend/scripts/check_handles.py

Sale con código 1 si algo falla.
"""
import os
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "handles.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import Base, GamePlayer, Handle, User  # noqa: E402

Base.metadata.create_all(database.engine)

import handles  # noqa: E402

fallos: list[str] = []


def check(nombre: str, cond: bool, detalle: str = "") -> None:
    print(f"{'ok   ' if cond else 'FALLA'}  {nombre} {detalle}".rstrip())
    if not cond:
        fallos.append(nombre)


db = database.SessionLocal()
db.add(User(id=1, clerk_user_id="c1", email="a@a.com", name="A"))
db.add(User(id=2, clerk_user_id="c2", email="b@b.com", name="B"))
db.commit()
db.add(GamePlayer(id=10, alias="tmp10"))
db.add(GamePlayer(id=11, alias="tmp11"))
db.commit()
# Los alias de arranque son andamiaje: el registro se estrena abajo.
db.query(Handle).delete()
db.commit()

print("1. reclamar y liberar")
handles.reclamar(db, "nico", user_id=1)
db.commit()
check("un @ nuevo queda activo y con dueño",
      handles.duenio(db, "nico").status == "active"
      and handles.duenio(db, "nico").user_id == 1)
check("y baja al caché de users.username", db.get(User, 1).username == "nico")

handles.reclamar(db, "nicolas", user_id=1)
db.commit()
check("cambiar de @ deja el nuevo activo", handles.activo_de_usuario(db, 1).handle == "nicolas")
check("y el caché lo sigue", db.get(User, 1).username == "nicolas")
check("el viejo NO se borra: queda retirado",
      handles.duenio(db, "nico") is not None
      and handles.duenio(db, "nico").status == "retired")
check("y sigue apuntando a su dueño (por eso el link `?r=nico` no muere)",
      handles.duenio(db, "nico").user_id == 1)
check("nadie queda con dos @ activos",
      db.query(Handle).filter(Handle.user_id == 1, Handle.status == "active").count() == 1)

print("2. un @ soltado no se lo lleva otro")
try:
    handles.reclamar(db, "nico", user_id=2)
    check("reclamar el @ soltado de otro tiene que fallar", False)
except handles.HandleTomado:
    check("reclamar el @ soltado de otro tiene que fallar", True)
db.rollback()
check("y sigue siendo del primero", handles.duenio(db, "nico").user_id == 1)
check("tomado() dice que sí aunque esté retirado", handles.tomado(db, "nico"))

print("3. volver a un @ propio")
handles.reclamar(db, "nico", user_id=1)
db.commit()
check("el dueño sí puede recuperarlo", handles.activo_de_usuario(db, 1).handle == "nico")
check("y el que dejó queda retirado",
      handles.duenio(db, "nicolas").status == "retired")
check("sigue habiendo uno solo activo",
      db.query(Handle).filter(Handle.user_id == 1, Handle.status == "active").count() == 1)

print("4. invitados: el @ vive en el registro sin fila en users")
handles.reclamar(db, "derivador7431", player_id=10)
db.commit()
fila = handles.duenio(db, "derivador7431")
check("un invitado puede tener @ sin user_id", fila.user_id is None and fila.player_id == 10)
check("y baja al caché de game_players.alias", db.get(GamePlayer, 10).alias == "derivador7431")
try:
    handles.reclamar(db, "derivador7431", player_id=11)
    check("otro invitado no se lo puede llevar", False)
except handles.HandleTomado:
    check("otro invitado no se lo puede llevar", True)
db.rollback()

print("5. al registrarse gana el @ del JUEGO")
# La persona jugó de invitada como `fenolftaleina` y su cuenta de Intervalo se
# dio de alta como `mchd`. Al vincularse tiene que quedar `fenolftaleina`: es el
# que eligió, el que vio en pantalla y el que compartió.
handles.reclamar(db, "fenolftaleina", player_id=11)
handles.reclamar(db, "mchd", user_id=2)
db.commit()
handles.vincular(db, user_id=2, player_id=11)
db.commit()
activo = handles.activo_de_usuario(db, 2)
check("gana el @ del juego", activo.handle == "fenolftaleina", f"(dio {activo.handle})")
check("y la fila es UNA sola, con las dos caras",
      activo.user_id == 2 and activo.player_id == 11)
check("el username de clásico se retira pero sigue siendo suyo",
      handles.duenio(db, "mchd").status == "retired"
      and handles.duenio(db, "mchd").user_id == 2)
check("los dos cachés quedan sincronizados",
      db.get(User, 2).username == "fenolftaleina"
      and db.get(GamePlayer, 11).alias == "fenolftaleina")
check("y el usuario no tiene dos activos",
      db.query(Handle).filter(Handle.user_id == 2, Handle.status == "active").count() == 1)

print("6. el índice de base respalda la unicidad, no solo el chequeo")
# El chequeo de `reclamar` tiene una ventana entre el SELECT y el INSERT. Que la
# unicidad esté ADEMÁS en la base es lo que hace que dos altas simultáneas no
# puedan quedarse las dos con el mismo @.
from sqlalchemy.exc import IntegrityError  # noqa: E402

try:
    db.add(Handle(handle="colado", user_id=1, status="active"))
    db.commit()
    check("dos handles activos para el mismo dueño los rebota la base", False)
except IntegrityError:
    db.rollback()
    check("dos handles activos para el mismo dueño los rebota la base", True)

try:
    db.add(Handle(handle="sindueno", status="active"))
    db.commit()
    check("un handle sin dueño lo rebota la base", False)
except IntegrityError:
    db.rollback()
    check("un handle sin dueño lo rebota la base", True)

print("7. el cruce entre los dos productos, que es el punto de todo esto")
# Antes `usernames.py` validaba contra `users` y `game/aliases.py` contra el
# namespace del juego, sin mirarse. El mismo string podía terminar siendo de dos
# personas, una en cada producto — y con `?r=<@>` cruzando, eso es pagarle los
# reclutas al que no fue.
import game.aliases as aliases  # noqa: E402
import usernames  # noqa: E402

db.add(GamePlayer(id=12, alias="tmp12"))
db.commit()
handles.reclamar(db, "solojuego", player_id=12)
db.commit()
check("un @ de invitado figura tomado para el generador de usernames de clásico",
      usernames.assign_unique_username(db, "Solo Juego") != "solojuego")
check("y alias_taken del juego ve el username de clásico",
      aliases.alias_taken(db, "nico"))
check("aunque ese username esté RETIRADO", aliases.alias_taken(db, "nicolas"))
check("y un nombre que no tuvo nadie sigue libre", not aliases.alias_taken(db, "nadielotuvo"))

print("8. unificar un @ no puede LIBERAR el username viejo")
# El caso salió verificando producción, no razonando: el backfill de la migración
# saltea el username de quien ya tiene fila activa por su alias del juego, así
# que esos usernames NUNCA entran al registro. Y `reclamar` solo puede retirar lo
# que existe, de modo que al unificar el @ el username viejo quedaba libre para
# cualquiera — justo la regla que este registro existe para sostener.
db.add(User(id=3, clerk_user_id="c3", email="c@c.com", name="C", username="tlopreite"))
db.commit()
db.add(GamePlayer(id=18, alias="tmp18", user_id=3))
db.commit()
# El estado que deja el backfill: el ALIAS tiene fila activa con las dos caras, y
# el username no tiene ninguna.
db.query(Handle).filter(Handle.player_id == 18).delete()
db.commit()
handles.reclamar(db, "goldenmedialuna", user_id=3, player_id=18)
db.commit()
check("el username viejo efectivamente NO está en el registro",
      handles.duenio(db, "tlopreite") is None)

handles.reservar_retirado(db, "tlopreite", user_id=3)
db.commit()
reservado = handles.duenio(db, "tlopreite")
check("después de reservarlo, existe", reservado is not None)
check("queda RETIRADO, no activo", reservado and reservado.status == "retired")
check("y sigue siendo de esa persona", reservado and reservado.user_id == 3)
check("el @ que usa sigue siendo el del juego",
      handles.activo_de_usuario(db, 3).handle == "goldenmedialuna")
check("nadie más se lo puede llevar", handles.tomado(db, "tlopreite"))
try:
    handles.reclamar(db, "tlopreite", user_id=1)
    check("y reclamarlo desde otra cuenta falla", False)
except handles.HandleTomado:
    check("y reclamarlo desde otra cuenta falla", True)
db.rollback()
check("reservar dos veces no duplica ni pisa",
      handles.reservar_retirado(db, "tlopreite", user_id=1) is None)

db.close()

print()
if fallos:
    print(f"{len(fallos)} chequeos fallaron:")
    for f in fallos:
        print(f"  - {f}")
    raise SystemExit(1)
print("todo ok")
