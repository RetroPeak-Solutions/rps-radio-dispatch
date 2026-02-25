import axios from 'axios';
import { AuthUser } from './link';

export default async function getSessionUser({ onSuccess, onFailed }: { onSuccess: (user: any) => void, onFailed: (data: any) => void }) {
    try {
        const res = await axios.get(AuthUser(), {
            withCredentials: true,
        });

        if (res.data.ok) return;
        const data = await res.data;
        if (!data.user) {
            onFailed({ message: "No Active User Session Found!"});
        } else {
            onSuccess(data.user);
        }
    } catch (err: any) {
        onFailed(err);
        // noop
    }
}