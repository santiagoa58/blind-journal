// @vitest-environment jsdom

import { Theme } from "@radix-ui/themes";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { type ReactNode, useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  GuardedLink,
  NavigationBlockerProvider,
  useNavigationBlocker,
} from "@/components/navigation-blocker";
import { englishMessages } from "@/i18n/messages";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    onNavigate,
    ...props
  }: {
    children: ReactNode;
    href: string;
    onNavigate?: (event: { preventDefault: () => void }) => void;
  }) => (
    <a
      {...props}
      onClick={(event) => {
        onNavigate?.({ preventDefault: () => event.preventDefault() });
      }}
    >
      {children}
    </a>
  ),
  useRouter: () => ({ push: mocks.push }),
}));

function BlockNavigation({ blocked }: { blocked: boolean }) {
  const { setBlocked } = useNavigationBlocker();

  useEffect(() => {
    setBlocked(blocked);
  }, [blocked, setBlocked]);

  return null;
}

function renderBlocker(children: ReactNode, blocked = true) {
  return render(
    <NextIntlClientProvider locale="en" messages={englishMessages} timeZone="UTC">
      <Theme>
        <NavigationBlockerProvider>
          <BlockNavigation blocked={blocked} />
          {children}
        </NavigationBlockerProvider>
      </Theme>
    </NextIntlClientProvider>,
  );
}

describe("NavigationBlockerProvider", () => {
  it("protects hard navigation only while blocked", () => {
    const view = renderBlocker(null, true);
    const blocked = new Event("beforeunload", { cancelable: true });
    expect(window.dispatchEvent(blocked)).toBe(false);

    view.rerender(
      <NextIntlClientProvider locale="en" messages={englishMessages} timeZone="UTC">
        <Theme>
          <NavigationBlockerProvider>
            <BlockNavigation blocked={false} />
          </NavigationBlockerProvider>
        </Theme>
      </NextIntlClientProvider>,
    );

    const allowed = new Event("beforeunload", { cancelable: true });
    expect(window.dispatchEvent(allowed)).toBe(true);
  });

  it("continues guarded navigation only after discard", async () => {
    const user = userEvent.setup();
    renderBlocker(<GuardedLink href="/how-it-works">How it works</GuardedLink>);

    await user.click(screen.getByRole("link", { name: "How it works" }));

    expect(
      screen.getByRole("alertdialog", { name: "Discard unsaved changes?" }),
    ).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/how-it-works");
  });
});
