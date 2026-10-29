import React from "react";
import { Card, CardProps } from "@mui/material";

export type SurfaceProps = CardProps;

/**
 * Paper-like container used for cards and panels.
 *
 * Flat (no elevation) with a hairline border and a fixed 12px radius so
 * surfaces read as modern "sheets"; every prop — including `elevation` and
 * `sx` — can still be overridden by the caller.
 */
export function Surface({ elevation = 0, sx, children, ...rest }: SurfaceProps) {
  return (
    <Card
      elevation={elevation}
      sx={{ border: 1, borderColor: "divider", borderRadius: "12px", ...sx }}
      {...rest}
    >
      {children}
    </Card>
  );
}
