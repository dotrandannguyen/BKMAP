import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authRepository } from './auth.repository.js';
import { sendVerificationEmail } from '../../common/utils/email.util.js';
import {
  ClientException,
  UnauthorizedException,
} from '../../common/exceptions/index.js';

const SALT_ROUNDS = 10;

// ENV CONFIG
const ACCESS_JWT_SECRET = process.env.ACCESS_JWT_SECRET;
const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET;

const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || '1d';
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || '7d';

// validate env
if (!ACCESS_JWT_SECRET || !REFRESH_JWT_SECRET) {
  throw new Error('Missing JWT secrets in environment variables');
}

export const authService = {
  // REGISTER
  async register(dto) {
    const existUser = await authRepository.findUserByEmail(dto.email);

    if (existUser) {
      throw new ClientException(409, 'Email đã tồn tại.');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const verifyToken = crypto.randomBytes(32).toString('hex');
    // Set expiration 24 hours from now
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24);

    const newUser = await authRepository.createUser({
      email: dto.email,
      passwordHash,
      userName: dto.userName,
      avatar: null,
      verifyToken,
      tokenExpires,
    });

    // Send verification email in background
    sendVerificationEmail(newUser.email, verifyToken).catch(console.error);

    return {
      id: newUser.id,
      email: newUser.email,
      userName: newUser.userName,
      avatar: newUser.avatar,
      verifyToken: newUser.verifyToken,
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
    };
  },

  // LOGIN
  async login(dto) {
    const user = await authRepository.findUserByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    }

    // NẾU MUỐN CHẶN LOGIN KHI CHƯA XÁC THỰC EMAIL THÌ MỞ ĐOẠN NÀY RA
    // if (!user.isVerified) {
    //   throw new UnauthorizedException('Tài khoản chưa được xác thực. Vui lòng kiểm tra email.');
    // }

    // JWT payload
    const payload = {
      sub: user.id,
    };

    const accessToken = jwt.sign(payload, ACCESS_JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES,
    });

    const refreshToken = jwt.sign(payload, REFRESH_JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES,
    });

    // Hash refreshToken trước khi lưu vào database để tăng bảo mật
    const hashedRefreshToken = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await authRepository.updateRefreshToken(user.id, hashedRefreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
      accessToken,
      refreshToken,
    };
  },

  // VERIFY EMAIL
  async verifyEmail(dto) {
    const user = await authRepository.findUserByVerifyToken(dto.token);

    if (!user) {
      throw new ClientException(400, 'Invalid Token.');
    }

    if (user.tokenExpires && user.tokenExpires < new Date()) {
      throw new ClientException(400, 'Token Expired.');
    }

    await authRepository.verifyUser(user.id);

    return {
      message: 'Email xác thực thành công.',
    };
  },

  // REFRESH TOKEN
  async refreshToken(token) {
    if (!token) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    try {
      // 1. Verify token signature
      const payload = jwt.verify(token, REFRESH_JWT_SECRET);

      // 2. Find user
      const user = await authRepository.findUserById(payload.sub);
      if (!user || !user.hashedRefreshToken) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      // 3. Verify token matches hashed token in DB
      const isMatch = await bcrypt.compare(token, user.hashedRefreshToken);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      // 4. Generate new tokens
      const newPayload = { sub: user.id };
      
      const newAccessToken = jwt.sign(newPayload, ACCESS_JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES,
      });

      const newRefreshToken = jwt.sign(newPayload, REFRESH_JWT_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRES,
      });

      // 5. Hash and save new refresh token (Refresh Token Rotation)
      const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, SALT_ROUNDS);
      await authRepository.updateRefreshToken(user.id, hashedNewRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  },

  // LOGOUT
  async logout(userId) {
    // Xóa refreshToken trong DB
    await authRepository.updateRefreshToken(userId, null);
    return { message: 'Đăng xuất thành công.' };
  },
};
