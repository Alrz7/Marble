import { AppUser } from "../user/stateUser";
import { MessageStatus, Request } from "./actTypes";
import { sendRequest } from "./actWsCore";
import { searchResult } from "@states/stateCommon";
import { savedMessagesAudience } from "@internal/intrCmnVars";
import { addAppErrNotif, commonErrors } from "@internal/golog";

// --- Search ---
export function onSearchUser(param: string) {
  const { currentUser } = AppUser.getState();
  const { addtoUsers, setUsers } = searchResult.getState();
  setUsers([]);
  if (!currentUser?.config) {
    addAppErrNotif(commonErrors.userNotValid);
    return;
  }
  if (
    true
    // currentUser &&
    // [
    //   currentUser.config.name,
    //   String(currentUser.config.userId),
    //   currentUser.config.displayId,
    //   "savedMessage"
    // ].includes(param)
  ) {
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
