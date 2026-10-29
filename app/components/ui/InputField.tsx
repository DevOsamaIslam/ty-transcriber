import React from "react";
import { TextField, TextFieldProps } from "@mui/material";

export type InputFieldProps = TextFieldProps;

/**
 * MUI TextField with `margin="normal"` and `fullWidth` defaults; both can be
 * overridden by the caller (e.g. `margin="none"` inside dense layouts).
 */
export function InputField({
  margin = "normal",
  fullWidth = true,
  ...props
}: InputFieldProps) {
  return <TextField margin={margin} fullWidth={fullWidth} {...props} />;
}
