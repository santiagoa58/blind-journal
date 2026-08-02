import { API_ERROR_CODES } from "@/api/error-code";
import { en, type MessageCatalog } from "@/messages/en";
import { es } from "@/messages/es";

export const messageCatalogs = { en, es } satisfies Record<
  string,
  MessageCatalog
>;

export type Locale = keyof typeof messageCatalogs;

export const defaultLocale: Locale = "en";
export const messages: MessageCatalog = messageCatalogs[defaultLocale];

export function getAuthErrorMessage(
  code: string,
  catalog: MessageCatalog = messages,
): string {
  switch (code) {
    case API_ERROR_CODES.authUsernameRequired:
      return catalog.auth.errors.usernameRequired;
    case API_ERROR_CODES.authUserNotFound:
      return catalog.auth.errors.userNotFound;
    default:
      return catalog.common.errors.unexpected;
  }
}

export function formatMessage(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, key: string) => {
    const value = values[key];
    return value === undefined ? placeholder : String(value);
  });
}
