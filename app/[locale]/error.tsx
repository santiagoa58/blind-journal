"use client";

import { UnexpectedErrorPage } from "@/components/unexpected-error-page";

type ErrorPageProps = {
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return <UnexpectedErrorPage onRetry={reset} />;
}
