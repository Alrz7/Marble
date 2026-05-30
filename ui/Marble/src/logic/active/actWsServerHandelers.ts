import { MessageStatus, Request } from "./actTypes";

// ----- auth -----
export let isAuthorized = false;
export async function defAuthStatus(request: any) {
  if (request.status == MessageStatus.Approved) {
    isAuthorized = true;
    console.log(request.message);
  } else {
    console.log(request.message);
  }
}

// ----- Session -----
export function HndlSessions(req: Request) {
  if (!req.headers) {
    console.error("request has no methods");
    return;
  }
  switch (req.headers.method) {
    case "create":
      HndlCreateSession(req);
  }
}

export function HndlCreateSession(req: Request) {
  
}
