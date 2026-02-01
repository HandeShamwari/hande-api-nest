import { IsNotEmpty, IsUUID } from 'class-validator';

export class AcceptBidDto {
  @IsNotEmpty()
  @IsUUID()
  bidId: string;
}
