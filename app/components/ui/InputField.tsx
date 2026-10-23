import React from "react";
import { TextField, TextFieldProps } from "@mui/material";

export type InputFieldProps = TextFieldProps;

export function InputField({ ...props }: InputFieldProps) {
  return <TextField {...props} margin="normal" fullWidth />;
}