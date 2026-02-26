export default function link(mode: 'dev' | 'prod') {
    if (mode === 'dev') {
        return 'http://localhost:5173';
    }

    return "https://rto.retropeak.solutions";
}

export function ApiBaseLink() {
    return `${link('prod')}/api`;
}

export function ApiBaseAuthLink() {
    return `${ApiBaseLink()}/auth`;
}

export function SocketLink(mode: 'dev' | 'prod') {
    if (mode === 'dev') {
        return 'http://localhost:3000';
    }

    return "https://rto-ws.retropeak.solutions";
}

export function AuthUser() {
    return `${ApiBaseAuthLink()}/me`;
}

export function AuthLogout() {
    return `${ApiBaseAuthLink()}/logout`;
}

export function AuthLogin() {
    return `${ApiBaseAuthLink()}/login`;
}

export function AuthForgotPassword() {
    return `${ApiBaseAuthLink()}/forgot-password`;
}