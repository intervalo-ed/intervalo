# Scripts que miran (o tocan) la base REAL

Todo lo que está acá se conecta a la `DATABASE_URL` del entorno. **Ninguno se
corre en CI ni forma parte de la suite** (`backend/scripts/run_checks.py`).

Están separados porque antes vivían al lado de los checks y con el mismo prefijo:
`check_handle_collisions.py` se llamaba igual que treinta y dos scripts que armaban
un SQLite temporal, y su propio docstring dice que hay que correrlo contra
producción. Un runner que hiciera `for f in check_*.py` lo metía en la misma
bolsa — o sea un script de diagnóstico corriendo contra la base de verdad, con la
`DATABASE_URL` que tuviera el entorno.

| Script | Qué hace | Escribe |
|---|---|---|
| `handle_collisions.py` | Cuenta las colisiones y divergencias entre los dos namespaces de @ | No |
| `reconcile_handles.py` | Unifica los @ divergentes. **Renombra personas** | Sí |

Los dos se corren a mano, y `reconcile_handles.py` primero con `--dry-run`:

```bash
railway ssh --service backend
python backend/scripts/diag/handle_collisions.py
python backend/scripts/diag/reconcile_handles.py --dry-run
```

Un renombrado que te sorprende a las 3 de la mañana no es algo para automatizar:
por eso la reconciliación no es una migración de Alembic, que corre sola en cada
deploy.
