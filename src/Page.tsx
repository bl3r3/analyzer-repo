import { Button, Stack, Alert, Polymorphic } from "@vetsource/kibble";
import { styled, ThemeOptions } from "@mui/material";

// Prueba de uso de función (será ignorado, lo cual es correcto)
const MyDiv = styled("div")({ color: "red" });

// Prueba de uso de componente (será contado)
const MyComponent = () => {
  return (
    <Stack>
      <Button>Click Me</Button>
      <Alert severity="info">This is an alert</Alert>
      <Polymorphic>asdasd</Polymorphic>
    </Stack>
  );
};

// Prueba de importación de tipo (ThemeOptions) (será ignorado, lo cual es correcto)
const myOptions: ThemeOptions = {};
