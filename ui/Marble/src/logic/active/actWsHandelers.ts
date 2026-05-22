import { Request } from "./actTypes";
import { sendRequest } from "./actWebsocket";

export function onSearchUser(param: string) {
  const struct: {
    param: string;
  } = {
    param: param,
  };
  const req: Request = {
    status: 0,
    channel: "searchUser",
    headers: {},
    body: JSON.stringify(struct),
  };
  sendRequest(req);
}
// ----- auth -----
export let isAuthorized = false;
export async function defAuthStatus(request: any) {
  if (request.status == 2) {
    isAuthorized = true;
    console.log(request.message);
  } else {
    console.log(request.message);
  }
}
