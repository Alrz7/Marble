// ---** token Configuration **---

export let GlobalAuthToken: string | null = null;

export function setAuthToken(newToken: string) {
  if (newToken != "") {
    /// other cons
    GlobalAuthToken = newToken;
  }
}
export function GetAuthToken(): string | null {
  return GlobalAuthToken;
}
