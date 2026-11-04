import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { PaymentMethod } from '../payment.entity';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['CARD', 'BOLETO', 'PIX'], {
    message: 'O método de pagamento deve ser CARD, BOLETO ou PIX',
  })
  method: PaymentMethod;
}