export interface APIResponse {

    Status: number;
    Error: boolean;

    Message: string;

    Data: any //eslint-disable-line @typescript-eslint/no-explicit-any

}
