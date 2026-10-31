import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsEmail,
  IsHexColor,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

export class LoginDto {
  @Trim() @IsEmail() @MaxLength(254) email: string;
  @IsString() @MinLength(8) @MaxLength(72) password: string;
}
export class RegisterDto extends LoginDto {
  @Trim() @IsString() @MinLength(2) @MaxLength(80) name: string;
}
export class EmailDto {
  @Trim() @IsEmail() @MaxLength(254) email: string;
}
export class OrderLineDto {
  @IsString() @MaxLength(100) variantId: string;
  @IsInt() @Min(1) @Max(10) quantity: number;
}
export class ShippingDto {
  @Trim() @IsString() @MinLength(2) @MaxLength(100) name: string;
  @Trim() @IsString() @MinLength(5) @MaxLength(200) address: string;
  @Trim() @IsString() @MinLength(2) @MaxLength(100) city: string;
  @Trim() @IsString() @MinLength(2) @MaxLength(20) postalCode: string;
  @Trim() @IsString() @MinLength(2) @MaxLength(80) country: string;
}
export class OrderDto extends EmailDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items: OrderLineDto[];
  @IsDefined() @ValidateNested() @Type(() => ShippingDto) shipping: ShippingDto;
  @IsString() @Matches(/^[a-zA-Z0-9-]{16,100}$/) idempotencyKey: string;
}
export class VariantDto {
  @IsString() @MinLength(1) @MaxLength(40) colorName: string;
  @IsHexColor() colorHex: string;
  @IsString() @MinLength(1) @MaxLength(20) size: string;
  @IsInt() @Min(0) @Max(100000) stock: number;
}
export class MediaDto {
  @IsString()
  @Matches(/^(\/images\/[a-zA-Z0-9._-]+|https:\/\/[^\s]+)$/)
  url: string;
  @IsString() @MinLength(3) @MaxLength(200) alt: string;
}
export class ProductDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(100)
  slug: string;
  @IsString() @MinLength(3) @MaxLength(100) name: string;
  @IsString() @MinLength(10) @MaxLength(3000) description: string;
  @IsIn([
    'Outerwear',
    'Knitwear',
    'Dresses',
    'Tailoring',
    'Accessories',
    'Essentials',
  ])
  category: string;
  @IsString() @MinLength(3) @MaxLength(500) fabric: string;
  @IsString() @MinLength(3) @MaxLength(1000) care: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(1) @Max(100000) price: number;
  @IsOptional() @IsString() collectionId?: string;
  @IsBoolean() published: boolean;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => MediaDto)
  media: MediaDto[];
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants: VariantDto[];
}
export class CollectionDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(100)
  slug: string;
  @IsString() @MinLength(3) @MaxLength(100) title: string;
  @IsString() @MinLength(10) @MaxLength(1000) description: string;
  @IsString()
  @Matches(/^(\/images\/[a-zA-Z0-9._-]+|https:\/\/[^\s]+)$/)
  heroImage: string;
  @IsString() @MinLength(2) @MaxLength(40) season: string;
}
export class CampaignDto {
  @IsString() @MinLength(3) @MaxLength(100) title: string;
  @IsString() @MinLength(3) @MaxLength(100) subtitle: string;
  @IsString()
  @Matches(/^(\/images\/[a-zA-Z0-9._-]+|https:\/\/[^\s]+)$/)
  image: string;
  @IsString()
  @Matches(/^\/(collections|lookbook|journal|about)(\/[a-z0-9-]+)?$/)
  link: string;
  @IsHexColor() accent: string;
  @IsBoolean() active: boolean;
}
