import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  street: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  number: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  state: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  zipCode: string;
}