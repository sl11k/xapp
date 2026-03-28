export { getAuthToken, setAuthToken } from "./authToken";
import { localApi } from "./localApi";

export const trpcClient = localApi as any;
