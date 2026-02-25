export default function link(mode: 'dev' | 'prod') {
    if (mode === 'dev') {
        return 'http://localhost:5173';
    }

    return "https://rto.retropeak.solutions";
}

export function SocketLink(mode: 'dev' | 'prod') {
    if (mode === 'dev') {
        return 'http://localhost:3000';
    }

    return "https://ws.rto.retropeak.solutions";
}

export function AuthUser() {
    return `${link("dev")}/api/auth/me`;
}

export function AuthLogout() {
    return `${link("dev")}/api/auth/logout`
}

export function AuthLogin() {
    return `${link("dev")}/api/auth/login`
}