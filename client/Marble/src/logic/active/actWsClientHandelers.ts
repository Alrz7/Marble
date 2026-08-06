import { AppUser } from "@user/stateUser";
import { MessageStatus, Request } from "./actTypes";
import { sendRequest } from "./actWsCore";
import { searchResult } from "@states/stateCommon";
import { savedMessagesAudience } from "@internal/intrCmnVars";

// --- Search ---
export function onSearchUser(param: string) {
  const { currentUser } = AppUser.getState();
  if (
    currentUser &&
    [
      currentUser.config.name,
      String(currentUser.config.userId),
      currentUser.config.displayId,
    ].includes(param)
  ) {
    const { addtoUsers } = searchResult.getState();
    addtoUsers([{ ...savedMessagesAudience, ownerId: currentUser.config.id }]);
  }

  const struct: {
    param: string;
  } = {
    param: param,
  };
  const req: Request = {
    status: MessageStatus.Pending,
    channel: "searchUser",
    headers: {},
    body: JSON.stringify(struct),
  };
  sendRequest(req);
}
