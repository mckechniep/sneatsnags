import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  refreshTokenSchema,
} from "../utils/validations";
import { logger } from "../utils/logger";
import { ZodError } from "zod";

const authService = new AuthService();

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await authService.register(validatedData);
    
    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: result
    });
  } catch (error: any) {
    // Let the error handler middleware handle all errors
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.login(validatedData);
    res.json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error: any) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = verifyEmailSchema.parse(req.query);
    const result = await authService.verifyEmail(validatedData.token);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error: any) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(validatedData.email);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error: any) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(
      validatedData.token,
      validatedData.password
    );
    res.json({
      success: true,
      message: result.message
    });
  } catch (error: any) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response) => {
  // In a stateless JWT system, logout is handled client-side
  // But we can log the event for analytics
  logger.info("User logged out");
  res.json({ 
    success: true, 
    message: "Logged out successfully" 
  });
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = refreshTokenSchema.parse(req.body);
    const result = await authService.refreshToken(validatedData.refreshToken);
    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: result
    });
  } catch (error: any) {
    next(error);
  }
};
