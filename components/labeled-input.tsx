import { Grid, Text, TextField } from "@radix-ui/themes";

interface LabeledInputProps extends TextField.RootProps {
  description?: string;
  label: string;
  name: string;
  children?: React.ReactNode;
}
export function LabeledInput({
  name,
  label,
  description,
  children,
  ...inputProps
}: LabeledInputProps) {
  return (
    <Grid gap="1">
      <Text as="label" htmlFor={name} size="2" weight="medium">
        {label}
      </Text>
      <TextField.Root {...inputProps} id={name} name={name} size="3">
        {children && <TextField.Slot>{children}</TextField.Slot>}
      </TextField.Root>
      {description ? (
        <Text as="p" size="1" color="gray">
          {description}
        </Text>
      ) : null}
    </Grid>
  );
}
