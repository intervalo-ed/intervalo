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
· Que quien ya practicaba en clásico conserve su @ si el del juego es el sorteado.
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

print("el camino de runtime, no la función suelta")
# Lo de arriba prueba que `reservar_retirado` haga lo suyo. Esto prueba que
# ALGUIEN la llame: el bug no era que la función estuviera mal, era que el
# único que la usaba fuera un script manual, así que en la app el username
# viejo se liberaba igual.
import auth  # noqa: E402

# Un alta como la hace Clerk hoy: la fila se crea sin username y el registro se
# lo pone. Antes se escribía `users.username` derecho y el @ quedaba invisible
# para el minijuego, que le pregunta al registro y no a `users`.
nueva = User(id=4, clerk_user_id="c4", email="d@d.com", name="Martina Paz")
db.add(nueva)
db.flush()
auth._registrar_handle(db, nueva)
db.commit()
del_alta = handles.activo_de_usuario(db, 4)
check("el alta deja el @ anotado en el registro", del_alta is not None)
check("y la caché quedó igual que el registro",
      del_alta and db.get(User, 4).username == del_alta.handle,
      f"(registro {del_alta and del_alta.handle!r}, caché {db.get(User, 4).username!r})")
check("y el minijuego lo ve tomado",
      del_alta and handles.tomado(db, del_alta.handle))
username_del_alta = del_alta.handle

# Ahora se registra habiendo jugado antes de invitada: gana el @ del juego.
db.add(GamePlayer(id=24, alias="derivadora77", user_id=4))
db.commit()
handles.reclamar(db, "derivadora77", player_id=24)
db.commit()
handles.vincular(db, user_id=4, player_id=24)
db.commit()

check("al unificar gana el @ del juego",
      handles.activo_de_usuario(db, 4).handle == "derivadora77",
      f"(dio {handles.activo_de_usuario(db, 4).handle!r})")
viejo = handles.duenio(db, username_del_alta)
check("y el username viejo NO quedó libre", viejo is not None)
check("quedó retirado", viejo and viejo.status == "retired")
check("y sigue siendo de la misma persona", viejo and viejo.user_id == 4)
try:
    handles.reclamar(db, username_del_alta, user_id=1)
    check("nadie más se lo puede llevar", False)
except handles.HandleTomado:
    check("nadie más se lo puede llevar", True)
db.rollback()

print("8. quien ya practicaba en clásico conserva su @ al entrar al juego sin sesión")
# `fhorl` (clásico, con XP) abre el juego de invitado y recibe un @ sorteado. Al
# iniciar sesión tiene que seguir siendo `fhorl`, y el sorteado se retira.
db.add(User(id=5, clerk_user_id="c5", email="e@e.com", name="E", total_xp=316))
db.add(User(id=6, clerk_user_id="c6", email="f@f.com", name="F", total_xp=0))
db.add(GamePlayer(id=30, alias="tmp30", alias_is_generated=True))
db.add(GamePlayer(id=31, alias="tmp31", alias_is_generated=False))
db.add(GamePlayer(id=32, alias="tmp32", alias_is_generated=True))
db.commit()
handles.reclamar(db, "fhorl", user_id=5)
handles.reclamar(db, "tripleapunte44", player_id=30)
handles.reclamar(db, "elegido31", player_id=31)
handles.reclamar(db, "nuevo6", user_id=6)
handles.reclamar(db, "sorteado32", player_id=32)
db.commit()
handles.vincular(db, user_id=5, player_id=30)
db.commit()
check("con XP de clásico y @ sorteado: gana el de clásico",
      handles.activo_de_usuario(db, 5).handle == "fhorl")
check("el jugador toma ese @ y deja de ser «sorteado»",
      db.get(GamePlayer, 30).alias == "fhorl" and not db.get(GamePlayer, 30).alias_is_generated
      and db.get(User, 5).username == "fhorl")
sorteado = handles.duenio(db, "tripleapunte44")
check("el sorteado queda retirado y sigue resolviendo",
      sorteado.status == "retired" and sorteado.player_id == 30)
# Si el @ del juego lo eligió ella, manda el del juego como siempre.
db.add(User(id=7, clerk_user_id="c7", email="g@g.com", name="G", total_xp=50))
db.commit()
handles.reclamar(db, "viejo7", user_id=7)
db.commit()
handles.vincular(db, user_id=7, player_id=31)
db.commit()
check("con @ del juego elegido: gana el del juego",
      handles.activo_de_usuario(db, 7).handle == "elegido31")
# Sin XP de clásico no hay nada que conservar: gana el del juego.
handles.vincular(db, user_id=6, player_id=32)
db.commit()
check("sin XP de clásico: gana el del juego",
      handles.activo_de_usuario(db, 6).handle == "sorteado32")
# El XP que vino solo por reclutas no cuenta como haber practicado.
db.add(User(id=8, clerk_user_id="c8", email="h@h.com", name="H", total_xp=40, referral_xp_earned=40))
db.add(GamePlayer(id=33, alias="tmp33", alias_is_generated=True))
db.commit()
handles.reclamar(db, "reclutador8", user_id=8)
handles.reclamar(db, "sorteado33", player_id=33)
db.commit()
handles.vincular(db, user_id=8, player_id=33)
db.commit()
check("XP solo de reclutas: gana el del juego",
      handles.activo_de_usuario(db, 8).handle == "sorteado33")

# La universidad y la carrera de clásico pasan al jugador nuevo.
from models import Course, Enrollment  # noqa: E402
from game import deps as game_deps  # noqa: E402

db.add(Course(id=1, name="Cálculo", slug="calculo")) if db.get(Course, 1) is None else None
db.add(User(id=9, clerk_user_id="c9", email="i@i.com", name="I", total_xp=10))
db.add(GamePlayer(id=34, alias="tmp34", alias_is_generated=True, guest_token="tok34"))
db.commit()
db.add(Enrollment(user_id=9, course_id=1, university="UNSAM", career="S"))
db.commit()
handles.reclamar(db, "clasico9", user_id=9)
handles.reclamar(db, "sorteado34", player_id=34)
db.commit()
game_deps.link_guest_to_user(db, db.get(GamePlayer, 34), db.get(User, 9))
p34 = db.get(GamePlayer, 34)
check("al registrarse hereda universidad y carrera de clásico",
      p34.university == "UNSAM" and p34.career == "S")
check("y conserva el @ de clásico", p34.alias == "clasico9")

db.close()

print()
if fallos:
    print(f"{len(fallos)} chequeos fallaron:")
    for f in fallos:
        print(f"  - {f}")
    raise SystemExit(1)
print("todo ok")
