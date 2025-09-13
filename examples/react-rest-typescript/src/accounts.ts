import { AccountsClient } from '@accounts/client';
import { AccountsClientPassword } from '@accounts/client-password';
import { RestClient } from '@accounts/rest-client';

const apiHost = (import.meta as any).env?.VITE_REACT_APP_API_URL || window.location.origin;
const accountsRest = new RestClient({ apiHost, rootPath: '/accounts' });
const accountsClient = new AccountsClient({}, accountsRest);
const accountsPassword = new AccountsClientPassword(accountsClient);

export { accountsClient, accountsRest, accountsPassword };
