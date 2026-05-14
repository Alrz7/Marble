export type Request = {
    status: number
    channel: string
    headers: Record<string, string>
    body: any
}

export type Handler = (requestBody: any) => void

export type Handelers = Record<string, Handler>