import { Injectable, Logger } from '@nestjs/common';

export interface SendMessageDto {
  telegramUserId: string;
  message: string;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  async sendMessage(dto: SendMessageDto): Promise<boolean> {
    try {
      this.logger.log(
        `Sending message to Telegram user ${dto.telegramUserId}: ${dto.message.substring(0, 50)}...`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send message to ${dto.telegramUserId}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
}
