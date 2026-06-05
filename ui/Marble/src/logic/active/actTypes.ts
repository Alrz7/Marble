export type Request = {
  status: MessageStatus;
  channel: string;
  token?: string;
  headers?: Record<string, string>;
  message?: string;
  body?: any;
};

export type Handler = (request: Request) => void;

export type Handelers = Record<string, Handler>;

export enum MessageStatus {
  Pending = 0,
  Request = 1,
  Success = 2,
  Error = 3,
  Warning = 4,
  Canceled = 5,
  Timeout = 6,
  Rejected = 7,
  Approved = 8,
  Retry = 9,
}
