import { Session } from "../internal/commonTypes";
import { Request } from "./actTypes";

export function hndlAddSession(
  req: Request,
  sessionList: Session[],
  addSession: (origin: Session[], sessions: Session[]) => void,
) {
  try {
    const data: { sessions: Session[] } = JSON.parse(req.body);
    addSession(sessionList, data.sessions);
  } catch (err) {
    console.error(err);
  }
}
