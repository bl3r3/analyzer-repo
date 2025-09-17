import { Button, Stack } from "@vetsource/kibble";
import { styled, ThemeOptions } from "@mui/material";

// Prueba de uso de función (será ignorado, lo cual es correcto)
const MyDiv = styled("div")({ color: "red" });

// Prueba de uso de componente (será contado)
const MyComponent = () => {
  return (
    <Stack>
      <Button>Click Me</Button>
    </Stack>
  );
};

// Prueba de importación de tipo (ThemeOptions) (será ignorado, lo cual es correcto)
const myOptions: ThemeOptions = {};
