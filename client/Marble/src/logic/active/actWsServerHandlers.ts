import { Audience } from "../internal/commonTypes";
import { notifState, searchResult } from "../states/appCommonStates";
import { AppUser } from "../states/userMainStates";
import { hndlAddSession } from "./actSessionHandlers";
import { Request } from "./actTypes";

export function HndlSessions(req: Request) {
  const { currentUser } = AppUser.getState();
  if (!req.headers) {
    console.error("request has no methods");
    return;
  }
  switch (req.headers.task) {
    case "add":
      if (!currentUser?.config) {
        console.error("user is not define!");
        return;
      }
      hndlAddSession(req);
      break;
  }
}

export function HndlSearchResult(req: Request) {
  const { setUsers } = searchResult.getState();

  if (!req.body) return;
  const data: { results: Audience[] } = JSON.parse(req.body);
  if (data.results) {
    setUsers(data.results);
  }
}

export function HndlNotifs(req: Request) {
  const { addNotification } = notifState.getState();
  if (!req.notif) return;
  addNotification(req.notif);
}
