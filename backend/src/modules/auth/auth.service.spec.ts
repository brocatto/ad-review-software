import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let usersService: any;
  let service: AuthService;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn().mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        fullName: 'Ana',
        role: 'MANAGER',
        passwordHash: await bcrypt.hash('senha-atual', 4),
      }),
      setPassword: jest.fn(),
    };
    service = new AuthService(usersService, { sign: jest.fn().mockReturnValue('jwt') } as any);
  });

  it('rejects login for an unknown e-mail', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(service.login({ email: 'x@b.com', password: 'qualquer' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects login with a wrong password', async () => {
    usersService.findByEmail.mockResolvedValue(await usersService.findById());

    await expect(service.login({ email: 'a@b.com', password: 'errada' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('returns a token and the public user on valid credentials', async () => {
    usersService.findByEmail.mockResolvedValue(await usersService.findById());

    const result = await service.login({ email: 'a@b.com', password: 'senha-atual' });

    expect(result.access_token).toBe('jwt');
    expect(result.user).toEqual({ id: 'u1', email: 'a@b.com', fullName: 'Ana', role: 'MANAGER' });
    expect((result.user as any).passwordHash).toBeUndefined();
  });

  it('changes the password when the current one matches', async () => {
    await service.changePassword('u1', { currentPassword: 'senha-atual', newPassword: 'nova-senha-123' });

    expect(usersService.setPassword).toHaveBeenCalledWith('u1', 'nova-senha-123');
  });

  it('refuses to change the password when the current one is wrong', async () => {
    await expect(
      service.changePassword('u1', { currentPassword: 'errada', newPassword: 'nova-senha-123' }),
    ).rejects.toThrow(BadRequestException);
    expect(usersService.setPassword).not.toHaveBeenCalled();
  });

  it('refuses to reuse the current password', async () => {
    await expect(
      service.changePassword('u1', { currentPassword: 'senha-atual', newPassword: 'senha-atual' }),
    ).rejects.toThrow(BadRequestException);
    expect(usersService.setPassword).not.toHaveBeenCalled();
  });
});
