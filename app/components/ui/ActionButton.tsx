import React from "react";
import { Button, ButtonProps, CircularProgress } from "@mui/material";

type ActionVariant = "primary" | "outline" | "text" | "danger";

export type ActionButtonProps = Omit<ButtonProps, "variant" | "color"> & {
  loading?: boolean;
  variant?: ActionVariant;
  fullWidth?: boolean;
};

/** Maps our semantic variants to valid MUI Button variant + color pairs. */
const VARIANT_MAP: Record<
  ActionVariant,
  { variant: ButtonProps["variant"]; color: ButtonProps["color"] }
> = {
  primary: { variant: "contained", color: "primary" },
  outline: { variant: "outlined", color: "primary" },
  text: { variant: "text", color: "primary" },
  danger: { variant: "contained", color: "error" },
};

export function ActionButton({
  loading,
  variant = "primary",
  fullWidth = false,
  children,
  ...props
}: ActionButtonProps) {
  const { variant: muiVariant, color } = VARIANT_MAP[variant];

  return (
    <Button
      variant={muiVariant}
      color={color}
      fullWidth={fullWidth}
      disabled={loading}
      data-testid="action-button"
      {...props}
    >
      {loading && (
        <CircularProgress
          size={18}
          data-testid="action-button-spinner"
          style={{ marginRight: 8 }}
        />
      )}
      {!loading && children}
    </Button>
  );
}