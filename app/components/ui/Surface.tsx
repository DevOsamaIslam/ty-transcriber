import React from "react";
import { Card, CardProps } from "@mui/material";

export type SurfaceProps = CardProps;

export function Surface({ children, ...props }: SurfaceProps) {
  return <Card {...props}>{children}</Card>;
}