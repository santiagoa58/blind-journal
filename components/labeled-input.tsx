import { Text, TextField } from "@radix-ui/themes";

interface LabeledInputProps extends TextField.RootProps {
  label: string;
  name: string;
  children?: React.ReactNode;
}
export function LabeledInput({ name, label, children, ...inputProps }: LabeledInputProps) {
  return (
    <>
      <label htmlFor={name}>
        <Text>{label}</Text>
      </label>
      <TextField.Root {...inputProps} id={name} name={name}>
        {children && <TextField.Slot>{children}</TextField.Slot>}
      </TextField.Root>
    </>
  );
}
