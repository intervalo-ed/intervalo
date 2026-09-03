"""Verifica cuándo el resumen de sesión pide un cafecito o que recluta.

Es una función pura de cinco números, así que no hace falta base ni servidor —y
justamente por eso hay que probarla: equivocarse en la cadencia o en la
separación no se ve usando la app (hay que terminar seis sesiones para
enterarse) sino semanas después, en el embudo, cuando ya no se sabe si el pedido
convierte mal o directamente no salió.

Lo que se prueba es lo que no se ve mirando la pantalla:

· Que los dos pedidos se ALTERNEN y nunca salgan pegados, ni siquiera cuando un
  hito de racha aterriza al lado de una sesión de reclutas. La cadencia sola no
  lo garantiza: los hitos caen en cualquier número de sesión.
· Que gane el café cuando los dos caerían en la misma sesión, y que el WhatsApp
  se saltee esa vuelta en vez de apilarse detrás.
· Que un refetch del MISMO resumen devuelva lo mismo: el pedido no puede
  apagarse con la persona mirándolo.
· Que reabrir el resumen de una sesión VIEJA no vuelva a pedir nada.
· Que sin la PWA el café no salga —pero reclutar sí, que no cuesta plata—.

Uso:
    python backend/scripts/check_pedidos_del_resumen.py

Sale con código 1 si algo falla.
"""
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

import summary_asks  # noqa: E402
from summary_asks import (  # noqa: E402
    CAFECITO,
    DIAS_MINIMOS,
    PEDIDO_CADA,
    RECLUTAS,
    RECLUTAS_RESTO,
    SEPARACION,
    pedido_del_resumen,
)

fallos: list[str] = []


def check(desc: str, ok: bool, extra: str = "") -> None:
    print(f"  {'OK ' if ok else 'MAL'} {desc} {extra}".rstrip())
    if not ok:
        fallos.append(desc)


def pide(
    n: int,
    *,
    hito: bool = False,
    dias: int = 10,
    pwa: bool = True,
    handle: bool = True,
    ultimo: int | None = None,
) -> str | None:
    return pedido_del_resumen(
        session_number=n,
        tier_reached=hito,
        streak_days=dias,
        tiene_pwa=pwa,
        tiene_handle=handle,
        ultimo_pedido=ultimo,
    )


print("1. la cadencia: café en los múltiplos, WhatsApp en el medio")
check("la sesión 6 pide café", pide(6) == CAFECITO)
check("la sesión 12 también", pide(12) == CAFECITO)
check("la 3 pide reclutar", pide(3) == RECLUTAS)
check("la 9 también", pide(9) == RECLUTAS)
check("y en el resto de las sesiones no se pide nada",
      [n for n in range(1, 25) if pide(n) is not None] == [3, 6, 9, 12, 15, 18, 21, 24])

print()
print("2. el piso: quien todavía está probando la app no recibe pedidos")
check("con menos días que el mínimo, nada",
      pide(6, dias=DIAS_MINIMOS - 1) is None)
check("justo en el mínimo, sí", pide(6, dias=DIAS_MINIMOS) == CAFECITO)
# El mínimo de SESIONES se sacó a propósito: era lo que hacía que el primer
# hito (día 3) casi nunca llegara a pedir nada.
check("y no hay mínimo de sesiones: el hito del día 3 pide aunque lleve dos",
      pide(2, hito=True, dias=3) == CAFECITO)

print()
print("3. el hito de racha: el café aprovecha el festejo además de su cadencia")
check("una sesión cualquiera con hito pide café", pide(7, hito=True) == CAFECITO)
check("sin hito y fuera de la cadencia, no", pide(7) is None)

print()
print("4. la prioridad: cuando los dos caerían juntos, gana el café")
# La 9 es de reclutas por cadencia; si además cae un hito de racha, el café se
# la queda. Que el WhatsApp se saltee la vuelta (en vez de apilarse detrás) es
# lo que evita dos pantallas de pedido seguidas.
check("la 9 con hito pide café y no reclutar", pide(9, hito=True) == CAFECITO)
check("la 9 sin hito sigue siendo de reclutas", pide(9) == RECLUTAS)

print()
print("5. la separación: nunca dos pedidos en sesiones consecutivas")
# El caso que la cadencia sola NO cubre: reclutas en la 9 y, al día siguiente,
# un hito de racha en la 10.
check("un hito pegado a un pedido de reclutas se calla",
      pide(10, hito=True, ultimo=9) is None)
check("y una sesión después ya corresponde",
      pide(11, hito=True, ultimo=9) == CAFECITO)
check(f"la separación mínima es de {SEPARACION} sesiones",
      all(pide(9 + d, hito=True, ultimo=9) is None for d in range(1, SEPARACION))
      and pide(9 + SEPARACION, hito=True, ultimo=9) == CAFECITO)
# La cadencia natural ya deja tres de distancia, así que el caso normal ni toca
# la guarda.
check("la cadencia normal no necesita la guarda", pide(6, ultimo=3) == CAFECITO)

print()
print("6. el refetch: el pedido no se apaga con la persona mirándolo")
check("el mismo nº de sesión devuelve lo mismo", pide(6, ultimo=6) == CAFECITO)
check("y el de reclutas también", pide(9, ultimo=9) == RECLUTAS)
# Reabrir un resumen viejo cae en la misma guarda por la resta negativa, que es
# lo correcto: ese pedido ya se hizo (o ya se dejó pasar) hace rato.
check("reabrir una sesión vieja no vuelve a pedir", pide(4, ultimo=9) is None)

print()
print("7. la PWA solo condiciona la plata")
check("sin PWA no se pide café", pide(6, pwa=False) is None)
check("ni siquiera en un hito", pide(7, hito=True, pwa=False) is None)
# Reclutar no le cuesta nada a nadie y es lo que hace crecer la app, así que no
# espera a que la persona instale.
check("pero reclutar sale igual", pide(9, pwa=False) == RECLUTAS)

print()
print("8. las constantes siguen siendo coherentes entre sí")
check("el resto de reclutas cae adentro de la vuelta",
      0 < RECLUTAS_RESTO < PEDIDO_CADA)
check("y deja al menos la separación mínima contra los dos bordes",
      RECLUTAS_RESTO >= SEPARACION and PEDIDO_CADA - RECLUTAS_RESTO >= SEPARACION)
check("los dos pedidos son los que el contrato declara",
      {CAFECITO, RECLUTAS} == {"cafecito", "reclutas"})
check("y el módulo no expone un tercero por accidente",
      {v for k, v in vars(summary_asks).items()
       if k.isupper() and isinstance(v, str)} == {CAFECITO, RECLUTAS})

print("9. sin @ no se pide reclutar, y el turno no se gasta")
# El link de reclutas lleva `?r=<@>`. Sin @ el botón sale apagado sin
# explicación y el link que se muestra abajo no atribuye a nadie: la pantalla no
# es un pedido, es un callejón. Y encima gastaba el turno, así que el pedido
# siguiente esperaba otra vuelta entera por una pantalla que no ofrecía nada.
check("la sesión de reclutas se saltea sin @", pide(3, handle=False) is None)
check("y el café en la misma situación sí sale",
      pide(6, handle=False) == CAFECITO)
check("con @ vuelve a corresponder", pide(3, handle=True) == RECLUTAS)
# Lo que hace que el turno no se gaste: `session_store` solo anota cuando el
# pedido no es None, así que devolver None es exactamente no consumirlo. Se
# afirma acá porque es lo que sostiene la separación de la vuelta siguiente.
check("y no habiendo pedido, la vuelta siguiente arranca limpia",
      pide(6, handle=False, ultimo=None) == CAFECITO)

print()
if fallos:
    print(f"{len(fallos)} chequeos fallaron:")
    for f in fallos:
        print(f"  - {f}")
    raise SystemExit(1)
print("todo ok")
