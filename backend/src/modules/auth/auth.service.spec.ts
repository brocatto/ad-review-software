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
        passwordHash: await bcrypt.hash('senha-atual', 4),
      }),
      setPassword: jest.fn(),
    };
    service = new AuthService(usersService, { sign: jest.fn().mockReturnValue('jwt') } as any);
  });

  it('rejects login with a wrong password', async () => {
    usersService.findByEmail.mockResolvedValue(await usersService.findById());

    await expect(service.login({ email: 'a@b.com', password: 'errada' })).rejects.toThrow(
      UnauthorizedException,
    );
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
});
