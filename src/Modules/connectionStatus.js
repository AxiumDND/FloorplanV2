export function describeConnectionStatus(status) {
    const type = status.type === 'tcp' ? 'TCP' : 'HTTP';
    const target = status.host ? ` ${status.host}` : '';
    switch (status.state) {
        case 'connected':
            return `Connected (${type}${target}) as ${status.user || 'Public'}`;
        case 'connecting':
            return `Connecting (${type}${target})...`;
        case 'login-failed':
            return status.message || 'Login failed.';
        case 'error':
            return `Connection problem: ${status.message || 'unknown error'}`;
        default:
            return status.message || 'Not connected';
    }
}

export function showConnectionStatus(status) {
    const text = describeConnectionStatus(status);
    const state = ['connected', 'connecting', 'login-failed', 'error'].includes(status.state)
        ? status.state
        : 'disconnected';

    const label = document.getElementById('connection-status-text');
    if (label) {
        label.textContent = text;
        label.dataset.state = state;
    }

    const indicator = document.getElementById('connection-indicator');
    if (indicator) {
        indicator.className = `connection-indicator state-${state}`;
        indicator.title = text;
    }
}
