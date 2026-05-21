import { Request } from "./actTypes";
import { sendRequest } from "./actWebsocket";

export function onSearchUser(param: string) {
    console.log(param)
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
