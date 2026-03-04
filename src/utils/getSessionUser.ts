import axios from 'axios';
import { AuthUser } from './link';

export default async function getSessionUser({ onSuccess, onFailed }: { onSuccess: (user: any) => void, onFailed: (data: any) => void }) {
    try {
        const res = await axios.get(AuthUser(), {
            withCredentials: true,
        });

        const data = res.data;
        if (!data?.user) {
            onFailed({ message: "No Active User Session Found!"});
        } else {
            onSuccess(data.user);
        }
    } catch (err: any) {
        const data = err?.response?.data;
        if (data?.user) {
            onSuccess(data.user);
            return;
        }
        onFailed(err);
    }
}
