const cache = {};
const TTL = 60 * 1000; // 1 minute in milliseconds

const setCache = (key, data) => {
    cache[key] = {
        data,
        timestamp: Date.now()
    };
};

const getCache = (key) => {
    const cached = cache[key];
    if (!cached) return null;
    const isExpired = (Date.now() - cached.timestamp) > TTL;
    return isExpired ? null : cached.data;
};

// Getter functions for specific CRM data
const getStages = () => getCache('stages');
const getLeads = () => getCache('leads');
const getKPI = () => getCache('kpi');

export { setCache, getStages, getLeads, getKPI };