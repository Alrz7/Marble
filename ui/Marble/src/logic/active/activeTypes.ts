export type Request = {
    channel: string
    body: string
}

export type Handler = (requestBody: any) => void

export type Handelers = Record<string, Handler>