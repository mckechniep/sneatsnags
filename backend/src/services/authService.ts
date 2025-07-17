import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../utils/prisma";
import { generateToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/email";
import { RegisterRequest, LoginRequest, AuthResponse } from "../types/auth";
import { logger } from "../utils/logger";
import { loginSchema } from "../utils/validations";
import {
  DuplicateEmailError,
  InvalidCredentialsError,
  AccountInactiveError,
  InvalidTokenError,
  UserNotFoundError,
  DatabaseError
} from "../utils/errors";

export class AuthService {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role = "BUYER",
    } = data;

    //Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new DuplicateEmailError(email);
    }

    //Hash Password
    const hashedPassword = await bcrypt.hash(password, 12);

    //Generate email verification token
    const emailVerifyToken = crypto.randomBytes(32).toString("hex");

    //Create user
    try {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone: phone || null,
          role,
          emailVerifyToken,
        },
      });

      //Send verification email
      //await sendVerificationEmail(email, emailVerifyToken);

      //Generate tokens for immediate login after registration
      const token = generateToken({ userId: user.id });
      const refreshToken = generateRefreshToken({ userId: user.id });

      logger.info(`User registered: ${email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
        tokens: {
          accessToken: token,
          refreshToken: refreshToken,
        },
      };
    } catch (error: any) {
      logger.error("Database error during user registration:", error);
      throw new DatabaseError("Failed to create user account");
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const { email, password } = data;

    //Find user
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!user.isActive) {
      throw new AccountInactiveError();
    }

    //Check Password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    //Update last login
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });

    //Generate token
    const token = generateToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });

    logger.info(`User logged in: ${email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      tokens: {
        accessToken: token,
        refreshToken: refreshToken,
      },
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw new InvalidTokenError("Invalid or expired verification token");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
      },
    });

    logger.info(`Email verified for user: ${user.email}`);

    return { message: "Email verified successfully" };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists for security
      return {
        message:
          "If an account with that email exists, we sent a password reset link.",
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    await sendPasswordResetEmail(email, resetToken);

    logger.info(`Password reset requested for: ${email}`);

    return {
      message:
        "If an account with that email exists, we sent a password reset link.",
    };
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new InvalidTokenError("Invalid or expired reset token");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    logger.info(`Password reset for user: ${user.email}`);

    return { message: "Password reset successfully" };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      
      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw new InvalidTokenError("User not found or inactive");
      }

      // Generate new access token
      const accessToken = generateToken({ userId: user.id });

      logger.info(`Token refreshed for user: ${user.email}`);

      return { accessToken };
    } catch (error) {
      logger.error("Token refresh error:", error);
      throw new InvalidTokenError("Invalid refresh token");
    }
  }
}
