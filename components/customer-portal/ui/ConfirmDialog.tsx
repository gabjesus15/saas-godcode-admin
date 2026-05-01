"use client";

import { useCallback, useState } from "react";
import { Button } from "./Button";
import { Dialog, DialogFooter } from "./Dialog";
import type { ColorVariant } from "./tokens";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Tono del botón de confirmación. Por defecto "danger". */
  tone?: Extract<ColorVariant, "danger" | "warning" | "accent">;
};

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

export type UseConfirmDialogReturn = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  ConfirmDialogNode: React.ReactNode;
};

/**
 * Hook que devuelve una función `confirm()` asíncrona y el nodo del diálogo.
 * Uso:
 *   const { confirm, ConfirmDialogNode } = useConfirmDialog();
 *   // En JSX: {ConfirmDialogNode}
 *   // Al acción: const ok = await confirm({ title: "¿Estás seguro?" });
 */
export function useConfirmDialog(): UseConfirmDialogReturn {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  const handleResponse = useCallback((value: boolean) => {
    state?.resolve(value);
    setState(null);
  }, [state]);

  const toneMap: Record<NonNullable<ConfirmOptions["tone"]>, "primary" | "danger" | "secondary"> = {
    danger:  "danger",
    warning: "primary",
    accent:  "primary",
  };
  const btnVariant = toneMap[state?.tone ?? "danger"];

  const ConfirmDialogNode = state ? (
    <Dialog
      open
      onOpenChange={(open) => { if (!open) handleResponse(false); }}
      title={state.title}
      description={state.description}
      size="sm"
      showClose={false}
    >
      <DialogFooter>
        <Button variant="secondary" onClick={() => handleResponse(false)}>
          {state.cancelLabel ?? "Cancelar"}
        </Button>
        <Button variant={btnVariant} onClick={() => handleResponse(true)}>
          {state.confirmLabel ?? "Confirmar"}
        </Button>
      </DialogFooter>
    </Dialog>
  ) : null;

  return { confirm, ConfirmDialogNode };
}
