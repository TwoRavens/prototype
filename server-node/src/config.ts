export const config = {
    passport: {
        secret: process.env.JWT_PASSPORT_SECRET,
        expiresIn: 10000,
    }
};
