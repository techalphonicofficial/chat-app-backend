const DEFAULT_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
const DEFAULT_ALLOWED_HEADERS = ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'];

const getAllowedOrigins = () => {
    return (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
};

const isOriginAllowed = (origin, allowedOrigins) => {
    return !origin || allowedOrigins.length === 0 || allowedOrigins.includes('*') || allowedOrigins.includes(origin);
};

const createCorsOptions = (overrides = {}) => {
    const allowedOrigins = getAllowedOrigins();

    return {
        origin: (origin, callback) => {
            if (isOriginAllowed(origin, allowedOrigins)) {
                return callback(null, true);
            }

            return callback(new Error(`Origin ${origin} is not allowed by CORS`));
        },
        methods: overrides.methods || DEFAULT_METHODS,
        allowedHeaders: overrides.allowedHeaders || DEFAULT_ALLOWED_HEADERS,
        credentials: overrides.credentials ?? true
    };
};

module.exports = {
    createCorsOptions,
    getAllowedOrigins
};
