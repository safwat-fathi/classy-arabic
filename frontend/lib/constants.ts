export const COOKIES = {
  TOKEN: "tijaratk_token",
  MERCHANT_ID: "tijaratk_merchant_id",
  MERCHANT_NAME: "tijaratk_merchant_name",
} as const;

export const SESSION_COOKIES = [COOKIES.TOKEN, COOKIES.MERCHANT_ID, COOKIES.MERCHANT_NAME] as const;

// Query flag marking an invalid/expired session redirect; proxy.ts clears session cookies when it sees this.
export const LOGIN_MARKER = "expired";

// Facebook OAuth scopes required by the application
export const FACEBOOK_SCOPES = "email,public_profile,pages_manage_metadata,pages_messaging,pages_show_list,business_management";
