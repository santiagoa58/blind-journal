import { Grid, Text, TextField } from "@radix-ui/themes";

export interface LabeledInputProps extends TextField.RootProps {
  description?: string;
  label: string;
  name: string;
  children?: React.ReactNode;
  endAdornment?: React.ReactNode;
}
export function LabeledInput({
  name,
  label,
  description,
  children,
  endAdornment,
  ...inputProps
}: LabeledInputProps) {
  const descriptionId = description ? `${name}-description` : undefined;

  return (
    <Grid gap="1">
      <Text as="label" htmlFor={name} size="2" weight="medium">
        {label}
      </Text>
      <TextField.Root
        {...inputProps}
        id={name}
        name={name}
        size="3"
        aria-describedby={descriptionId}
      >
        {children ? <TextField.Slot side="left">{children}</TextField.Slot> : null}
        {endAdornment ? <TextField.Slot side="right">{endAdornment}</TextField.Slot> : null}
      </TextField.Root>
      {description ? (
        <Text id={descriptionId} as="p" size="1" color="gray">
          {description}
        </Text>
      ) : null}
    </Grid>
  );
}
