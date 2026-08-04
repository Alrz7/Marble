import { AppUser } from "@states/stateUser";
import { MessageStatus, Request } from "./actTypes";
import { sendRequest } from "./actWsCore";
import { searchResult } from "@states/stateCommon";
import { savedMessagesAudience } from "@internal/intrCmnVars";
import { setAuthToken } from "@internal/intrAuthHelpers";
import { UserConfig } from "@internal/intrCmnTypes";
import { fetch } from "@tauri-apps/plugin-http";
import { openConnection } from "./actWsRouter";

export async function signIn(
  DisplayId: string,
  password: string,
): Promise<UserConfig | null> {
  const response = await fetch("http://localhost:6280/account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      task: "signin",
    },
    body: JSON.stringify({
      display_id: DisplayId,
      password: password,
    }),
  });
  if (response.ok) {
    try {
      const result = await response.json();
      if (!result.error) {
        setAuthToken(result.token);
        openConnection();
        return result;
      } else
        console.error(
          "there was an error while trying to connect to the server",
        );
      return null;
    } catch (err) {
      // adding to the notif system...( will be added a little bit later!)
      console.error(`there was an error while trying to connect to the server`);
      return null;
    }
  } else {
    console.error("Failed to decode the http result");
    throw new Error("Failed to decode the http result");
  }
}

// --- Users ---
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
