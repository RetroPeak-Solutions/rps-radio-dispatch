import { useEffect, useMemo, useState } from "react";
import { useLoading } from "@context/Loading";
import { useNavigate } from "react-router";
import getSessionUser from "@utils/getSessionUser";
import type { User } from "@lib/types";
import axios from "axios";
import link from "@utils/link";
import { Button } from "@components/UI/Button";
import { ChevronRight, Search } from "lucide-react";
import AuthStyledInput from "@components/UI/AuthStyledInput";
import ModernCard from "@components/UI/ModernCard";
import { useToast } from "@context/ToastProvider";

export default function DashboardPage() {
    const { setLoading } = useLoading();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | undefined>();
    const [memberships, setMemberships] = useState<any[]>([]);
    const [bansByCommunityId, setBansByCommunityId] = useState<Record<string, any>>({});

    const [menu, setMenu] = useState<{
        x: number;
        y: number;
        communityId: string;
        communityOwner: boolean;
    } | null>(null);

    const [query, setQuery] = useState("");
    const [serverPicker, setServerPicker] = useState<{
        communityId: string;
        communityName: string;
        servers: Array<{ id: string; label: string; ip: string; port: string }>;
    } | null>(null);
    // const [joinDialogOpen, setJoinDialogOpen] = useState(false);
    // const [createDialogOpen, setCreateDialogOpen] = useState(false);
    // const [inviteCode, setInviteCode] = useState("");
    // const [discoverQuery, setDiscoverQuery] = useState("");
    // const [communityName, setCommunityName] = useState("");
    // const [communityDescription, setCommunityDescription] = useState("");

    useEffect(() => {
        const loadSession = async () => {
            setLoading(true);
            await getSessionUser({
                onSuccess(User: any) {
                    setUser(User);
                    void getMemberships();
                },
                onFailed(data: any) {
                    console.log("failed to get Session User:", data?.message);
                    navigate('/auth/login');
                }
            });
            setLoading(false);
        };
        void loadSession();
    }, []);

    async function getMemberships() {
        try {
            setLoading(true)
            const res = await axios.get(`${link('prod')}/api/auth/communities`, {
                withCredentials: true,
            });

            const data = res.data;

            console.log("Request Data:", data);

            if (!data.memberships) {
                setMemberships([]);
            } else {
                setMemberships(data.memberships);
            }
            setBansByCommunityId(data?.bansByCommunityId ?? {});
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

    // const handleLeaveCommunity = async (communityId: string) => {
    //     const formData = new FormData();
    //     formData.set("intent", "leaveCommunity");
    //     formData.set("communityId", communityId);
    //     await axios.post(`${link('prod')}/dashboard`, formData);
    //     setMenu(null);
    // };

    const openCommunityConsole = (membership: any) => {
        const servers = Array.isArray(membership?.community?.servers)
            ? membership.community.servers
            : [];

        if (servers.length === 0) {
            toast("No FiveM servers are configured for this community yet.", { type: "warning" });
            return;
        }

        setServerPicker({
            communityId: membership.communityId,
            communityName: membership.community.name,
            servers: servers.map((s: any) => ({
                id: String(s.id),
                label: String(s.label || "Unnamed Server"),
                ip: String(s.ip || ""),
                port: String(s.port || ""),
            })),
        });
    };

    return (
        <div>
            <ModernCard hoverScale={1}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Welcome back, {user?.firstName}</h1>
                        <p className="text-sm text-gray-400">Select a Community to Connect to its Dispatch Console.</p>
                    </div>

                    <div className="relative min-w-65">
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
            </ModernCard>

            {filteredMemberships.length === 0 ? (
                <ModernCard className="mt-4" hoverScale={1}>
                    <p className="text-gray-400">No communities matched your search.</p>
                </ModernCard>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 mt-4">
                    {filteredMemberships.map((membership) => {
                        const communityBan = bansByCommunityId?.[membership.communityId] ?? null;
                        const isBanned = Boolean(communityBan);
                        const hasDispatchAccess = Boolean(membership?.canDispatchAccess);
                        return (
                        <div
                            key={membership.id}
                            onClick={() => {
                                if (isBanned || !hasDispatchAccess) return;
                                openCommunityConsole(membership);
                            }}
                            onContextMenu={(event) => {
                                event.preventDefault();
                                if (isBanned || !hasDispatchAccess) return;
                                setMenu({
                                    x: event.clientX,
                                    y: event.clientY,
                                    communityId: membership.communityId,
                                    communityOwner: membership.role === "OWNER",
                                });
                            }}
                            className={isBanned || !hasDispatchAccess ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
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
                                    {isBanned ? (
                                        <p className="text-red-300">
                                            <span className="text-red-400">Access:</span> Banned
                                            {communityBan?.reason ? ` • ${communityBan.reason}` : ""}
                                        </p>
                                    ) : !hasDispatchAccess ? (
                                        <p className="text-amber-300">
                                            <span className="text-amber-400">Access:</span> No dispatch console permission
                                        </p>
                                    ) : null}
                                </div>
                            </ModernCard>
                        </div>
                        );
                    })}
                </div>
            )}

            {menu && (
                <div
                    className="fixed z-50 min-w-47.5 rounded-xl border border-white/20 bg-[#0B1220]/95 p-2 shadow-2xl backdrop-blur-xl gap-2 flex flex-col"
                    style={{ left: menu.x, top: menu.y }}
                    onClick={(event) => event.stopPropagation()}
                >
                    <Button
                        className="w-full cursor-pointer bg-[#3C83F61A] border border-[#3C83F61A] text-[#3C83F6] active:scale-[1.02]"
                        onClick={() => {
                            const membership = memberships.find((m) => m.communityId === menu.communityId);
                            setMenu(null);
                            if (!membership) {
                                navigate(`/${menu.communityId}/console`);
                                return;
                            }
                            openCommunityConsole(membership);
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

            {serverPicker && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    onClick={() => setServerPicker(null)}
                >
                    <div
                        className="w-full max-w-xl rounded-2xl border border-white/20 bg-[#0B1220] p-5"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h3 className="text-xl font-semibold text-white">Select FiveM Server</h3>
                        <p className="mt-1 text-sm text-gray-400">
                            Choose a server for {serverPicker.communityName} before entering console.
                        </p>
                        <div className="mt-4 space-y-2">
                            {serverPicker.servers.map((server) => (
                                <button
                                    key={server.id}
                                    className="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-left transition hover:bg-white/10"
                                    onClick={() => {
                                        navigate(
                                            `/${serverPicker.communityId}/console?serverId=${encodeURIComponent(server.id)}`,
                                        );
                                        setServerPicker(null);
                                    }}
                                >
                                    <div className="text-white font-medium">{server.label}</div>
                                    <div className="text-xs text-gray-300">
                                        {server.ip}:{server.port}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button
                                className="cursor-pointer border border-white/20 bg-white/5 text-white"
                                onClick={() => setServerPicker(null)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
