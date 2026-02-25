import { useEffect, useState } from "react";
import { useLoading } from "../context/Loading";
import { useNavigate } from "react-router";
import getSessionUser from "../utils/getSessionUser";
import { WelcomeMessage } from "../components/UI/WelcomeMessage";
import type { User } from "../lib/types";

export default function DashboardPage() {
    const { setLoading } = useLoading();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | undefined>();
    const [lastName, setLastName] = useState("");

    useEffect(() => {
        let mounted = true;
        const loadSession = async () => {
            setLoading(true);
            await getSessionUser({
                onSuccess(User: any) {
                    setUser(User);
                    setLastName(User?.lastName);
                },
                onFailed(data: any) {
                    console.log("failed to get Session User:", data?.message);
                    navigate('/auth/login');
                }
            });
            setLoading(false);
        };
        void loadSession();
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div>
           <WelcomeMessage user={{ firstName: user?.firstName!, lastName: user?.lastName! }} />
            <p className="text-center">
                Dashboard | W.I.P
            </p>
        </div>
    );
}