"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  USERNAME_MAX,
  normalizeUsername,
  validateUsername,
} from "@/lib/username"
import { useUpdateProfile } from "./UseUpdateProfile"

export function EditUsernameDialog({
  open,
  onOpenChange,
  current,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  current: string
}) {
  const [value, setValue] = useState(current)
  const [serverError, setServerError] = useState<string | null>(null)
  const update = useUpdateProfile()

  const clientError = value.length > 0 ? validateUsername(value) : null
  const unchanged = value === current
  const canSave = !clientError && !unchanged && !update.isPending

  function reset(next: boolean) {
    if (next) {
      setValue(current)
      setServerError(null)
    }
    onOpenChange(next)
  }

  async function save() {
    setServerError(null)
    try {
      await update.mutateAsync({ username: value })
      onOpenChange(false)
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "No se pudo guardar.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-sans">Cambiar usuario</DialogTitle>
          <DialogDescription>
            Tu nombre de usuario aparece en el ranking. Minúsculas, números, punto
            y guion bajo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">@</span>
            <Input
              value={value}
              autoFocus
              maxLength={USERNAME_MAX}
              aria-invalid={!!(clientError || serverError)}
              onChange={(e) => {
                setValue(normalizeUsername(e.target.value))
                setServerError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSave) save()
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-destructive">
              {serverError ?? clientError ?? ""}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {value.length}/{USERNAME_MAX}
            </span>
          </div>
        </div>

        <DialogFooter className="flex-row justify-end gap-2 sm:justify-end">
          <Button
            size="sm"
            variant="outline"
            className="rounded-md"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
            onClick={save}
            disabled={!canSave}
          >
            {update.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
