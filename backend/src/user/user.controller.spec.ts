import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/user.dto';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  const mockUser = {
    id: 'test-id',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed_password',
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    verificationTokens: [],
  };

  const mockUserService = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return a user when user exists', async () => {
      mockUserService.findById.mockResolvedValue(mockUser);

      const result = await controller.findOne(mockUser.id);

      expect(result).toBe(mockUser);
      expect(userService.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserService.findById.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      expect(userService.findById).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };

    it('should update and return the user when user exists', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUserService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(mockUser.id, updateUserDto);

      expect(result).toBe(updatedUser);
      expect(userService.update).toHaveBeenCalledWith(mockUser.id, updateUserDto);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserService.update.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.update('non-existent-id', updateUserDto)).rejects.toThrow(
        NotFoundException
      );
      expect(userService.update).toHaveBeenCalledWith('non-existent-id', updateUserDto);
    });
  });
});