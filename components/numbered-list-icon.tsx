import { IconButton, type IconButtonProps } from "@radix-ui/themes";

interface NumberedListIconProps extends IconButtonProps {
  width: number;
  height: number;
}
export function NumberedListIcon({ width, height, ...props }: NumberedListIconProps) {
  return (
    <IconButton variant="ghost" asChild {...props}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 5h10" />
        <path d="M11 12h10" />
        <path d="M11 19h10" />
        <path d="M4 4h1v5" />
        <path d="M4 9h2" />
        <path d="M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02" />
      </svg>
    </IconButton>
  );
}
