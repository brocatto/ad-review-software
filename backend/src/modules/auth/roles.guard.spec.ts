import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const contextFor = (user?: { role: string }) =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as any;

  const guardRequiring = (roles?: string[]) => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(roles) } as unknown as Reflector;
    return new RolesGuard(reflector);
  };

  it('allows any authenticated user when no role is required', () => {
    expect(guardRequiring(undefined).canActivate(contextFor({ role: 'MANAGER' }))).toBe(true);
  });

  it('allows users with the required role', () => {
    expect(guardRequiring(['ADMIN']).canActivate(contextFor({ role: 'ADMIN' }))).toBe(true);
  });

  it('blocks users without the required role', () => {
    expect(guardRequiring(['ADMIN']).canActivate(contextFor({ role: 'MANAGER' }))).toBe(false);
  });
});
