export type Request = {
  status: number;
  channel: string;
  token?: string;
  headers?: Record<string, string>;
  message?: string;
  body?: any;
};

export type Handler = (request: any) => void;

export type Handelers = Record<string, Handler>;
