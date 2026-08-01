import { Theme } from "@radix-ui/themes";
import { ThemeProvider } from "next-themes";
import { PropsWithChildren } from "react";

export function Providers(props: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class">
      <Theme accentColor="iris" radius="full">
        {props.children}
      </Theme>
    </ThemeProvider>
  );
}
