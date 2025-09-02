const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-otp -otpExpires -otpRequestTimestamps');
            if (!req.user || !req.user.isActive) {
                return res.status(401).json({ message: 'دسترسی مجاز نیست، کاربر غیرفعال است.' });
            }
            next();
        } catch (error) {
            return res.status(401).json({ message: 'توکن نامعتبر است، دسترسی مجاز نیست.' });
        }
    }
    if (!token) {
        return res.status(401).json({ message: 'توکنی یافت نشد، دسترسی مجاز نیست.' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `نقش '${req.user.role}' مجاز به دسترسی به این مسیر نیست.` });
        }
        next();
    };
};