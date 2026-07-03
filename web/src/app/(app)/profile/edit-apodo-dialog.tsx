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
import { useUpdateProfile } from "./UseUpdateProfile"

const APODO_MAX = 40

export function EditApodoDialog({
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

  const unchanged = value.trim() === current
  const canSave = !unchanged && !update.isPending

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
      await update.mutateAsync({ display_name: value.trim() })
      onOpenChange(false)
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "No se pudo guardar.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-sans">Apodo</DialogTitle>
          <DialogDescription>
            Cómo te llamamos en notificaciones y mensajes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Input
            value={value}
            autoFocus
            maxLength={APODO_MAX}
            onChange={(e) => {
              setValue(e.target.value)
              setServerError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSave) save()
            }}
          />
          {serverError && (
            <span className="text-xs text-destructive">{serverError}</span>
          )}
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
