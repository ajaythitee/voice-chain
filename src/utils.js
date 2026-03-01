export const CATEGORIES = [
    'Infrastructure',
    'Healthcare',
    'Education',
    'Technology',
    'Environment',
    'Social Welfare',
    'Transportation',
    'Energy',
    'Agriculture',
    'Other'
];

export const POLYGON_AMOY_CHAIN_ID = 80002;

export const POLYGON_AMOY_RPC = 'https://rpc-amoy.polygon.technology/';

export const BLOCK_EXPLORER = 'https://amoy.etherscan.io';

export const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatEther = (value) => {
    if (!value) return '0';
    return parseFloat(value).toFixed(4);
};

export const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const getTimeRemaining = (deadline) => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = Number(deadline) - now;

    if (timeLeft <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    return { days, hours, minutes, seconds, expired: false };
};

export const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    const addresses = [];

    for (const line of lines) {
        const address = line.trim();
        if (address && address.startsWith('0x') && address.length === 42) {
            addresses.push(address);
        }
    }

    return addresses;
};

export const isValidAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
};
