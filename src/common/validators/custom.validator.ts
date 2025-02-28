import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsValidPrice(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidPrice',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'number' && value >= 0 && value <= 999999999;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid price between 0 and 999,999,999`;
        },
      },
    });
  };
} 