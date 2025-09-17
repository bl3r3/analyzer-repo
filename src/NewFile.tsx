import type { InputFieldProps } from "@vetsource/kibble/typings/components";
import { TextField } from "@vetsource/kibble";
import { useIMask } from "react-imask";

import type { InputMaskProps } from "typings/components";

/**
 * @description `InputMask` component exists because it masks the input
 */
const InputMask = (props: InputMaskProps) => {
  const { value, onAccept, inputProps, maskOptions, ...rest } = props;

  const imask = useIMask(
    {
      overwrite: true,
      ...maskOptions,
    },
    {
      onAccept,
      defaultUnmaskedValue: (value ?? undefined) as string,
    }
  );

  return (
    <TextField
      required={false}
      inputProps={{
        ...inputProps,
        value: imask.value,
        ref: imask.ref as InputFieldProps["ref"],
      }}
      {...rest}
    />
  );
};

export default InputMask;
