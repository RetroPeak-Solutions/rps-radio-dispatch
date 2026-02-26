import { useEffect, useMemo, useState } from "react";
import { useLoading } from "../context/Loading";
import { useNavigate } from "react-router";
import getSessionUser from "../utils/getSessionUser";
import { WelcomeMessage } from "../components/UI/WelcomeMessage";
import type { User } from "../lib/types";
import axios from "axios";
import link from "../utils/link";
import { Button } from "../components/UI/Button";
import { ChevronRight, Plus, Search, Users } from "lucide-react";
import AuthStyledInput from "../components/UI/AuthStyledInput";
import ModernCard from "../components/UI/ModernCard";
import { AnimatedDropdownWithIcon } from "../components/UI/IconDropdown";
import { Dialog } from "../components/UI/Dialog";

export default function DashboardPage() {
    const { setLoading } = useLoading();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | undefined>();
    const [memberships, setMemberships] = useState<any[]>([]);

    const [menu, setMenu] = useState<{
        x: number;
        y: number;
        communityId: string;
        communityOwner: boolean;
    } | null>(null);

    const [query, setQuery] = useState("");
    const [joinDialogOpen, setJoinDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [inviteCode, setInviteCode] = useState("");
    const [discoverQuery, setDiscoverQuery] = useState("");
    const [communityName, setCommunityName] = useState("");
    const [communityDescription, setCommunityDescription] = useState("");

    useEffect(() => {
        let mounted = true;
        const loadSession = async () => {
            setLoading(true);
            await getSessionUser({
                onSuccess(User: any) {
                    setUser(User);
                },
                onFailed(data: any) {
                    console.log("failed to get Session User:", data?.message);
                    navigate('/auth/login');
                }
            });
            setLoading(false);
        };
        void loadSession();
        void getMemberships();
        return () => {
            mounted = false;
        };
    }, []);

    // const res = await axios.get(`${link('dev')}/api/communities/${id}`, {
    //             withCredentials: true,
    //         });

    async function getMemberships() {
        try {
            setLoading(true)
            const res = await axios.get(`${link('dev')}/api/auth/communities`, {
                withCredentials: true,
            });

            const data = res.data;

            console.log("Request Data:", data);

            if (!data.memberships) {
                setMemberships([]);
            } else {
                setMemberships(data.memberships);
            }
        } finally {
            setLoading(false);
        }
    }

    const filteredMemberships = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return memberships;
        return memberships.filter((membership) => {
            return (
                membership.community.name.toLowerCase().includes(normalized) ||
                membership.role.toLowerCase().includes(normalized) ||
                (membership.radioId || "").toLowerCase().includes(normalized)
            );
        });
    }, [memberships, query]);

    const handleLeaveCommunity = async (communityId: string) => {
        const formData = new FormData();
        formData.set("intent", "leaveCommunity");
        formData.set("communityId", communityId);
        await axios.post(`${link('dev')}/dashboard`, formData);
        setMenu(null);
    };

    return (
        <div>
            {/* <WelcomeMessage user={{ firstName: user?.firstName!, lastName: user?.lastName! }} /> */}
            <ModernCard hoverScale={1}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Welcome back, {user?.firstName}</h1>
                        <p className="text-sm text-gray-400">Select a Community to Connect to its Dispatch Console.</p>
                    </div>

                    <div className="relative min-w-[260px]">
                        <AuthStyledInput
                            id="community-search"
                            icon={Search}
                            label="Search communities"
                            value={query}
                            onChange={setQuery}
                            type="search"
                        />
                    </div>
                </div>
                {/* <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                        <Button className="cursor-pointer bg-[#3C83F61A] border border-[#3C83F61A] text-[#3C83F6]" onClick={() => setJoinDialogOpen(true)}>
                            <Plus className="h-4 w-4" /> Find / Join Community
                        </Button>
                        <Button className="cursor-pointer bg-[#3C83F61A] border border-[#3C83F61A] text-[#3C83F6]" onClick={() => setCreateDialogOpen(true)}>Create Community</Button>
                    </div>
                </div> */}
            </ModernCard>

            {filteredMemberships.length === 0 ? (
                <ModernCard className="mt-4">
                    <p className="text-gray-400">No communities matched your search.</p>
                </ModernCard>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 mt-4">
                    {filteredMemberships.map((membership) => (
                        <div
                            key={membership.id}
                            onClick={() => navigate(`/${membership.communityId}/console`)}
                            onContextMenu={(event) => {
                                event.preventDefault();
                                setMenu({
                                    x: event.clientX,
                                    y: event.clientY,
                                    communityId: membership.communityId,
                                    communityOwner: membership.role === "OWNER",
                                });
                            }}
                            className="cursor-pointer"
                        >
                            <ModernCard hoverScale={1.02} contentClassName="space-y-3">
                                <div className="flex items-start justify-between">
                                    <h2 className="text-lg font-semibold text-white">{membership.community.name}</h2>
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="space-y-1 text-sm text-gray-300">
                                    <p>
                                        <span className="text-gray-400">Role:</span> {membership.role}
                                    </p>
                                    <p>
                                        <span className="text-gray-400">Joined:</span> {new Date(membership.joinedAt).toLocaleDateString()}
                                    </p>
                                    <p>
                                        <span className="text-gray-400">Radio ID:</span> {membership.radioId || "N/A"}
                                    </p>
                                </div>
                            </ModernCard>
                        </div>
                    ))}
                </div>
            )}

            {menu && (
                <div
                    className="fixed z-50 min-w-[190px] rounded-xl border border-white/20 bg-[#0B1220]/95 p-2 shadow-2xl backdrop-blur-xl gap-2 flex flex-col"
                    style={{ left: menu.x, top: menu.y }}
                    onClick={(event) => event.stopPropagation()}
                >
                    <Button
                        className="w-full cursor-pointer bg-[#3C83F61A] border border-[#3C83F61A] text-[#3C83F6] active:scale-[1.02]"
                        onClick={() => {
                            setMenu(null);
                            navigate(`/${menu.communityId}/console`);
                        }}
                    >
                        View Community
                    </Button>
                    {/* {!menu.communityOwner && (
                        <Button className="w-full cursor-pointer bg-[#f63c3c1a] border border-[#f63c3c1a] text-[#f63c3c] active:scale-[1.02]" onClick={() => handleLeaveCommunity(menu.communityId)}>
                            Leave Community
                        </Button>
                    )} */}
                </div>
            )}
        </div>
    );
}