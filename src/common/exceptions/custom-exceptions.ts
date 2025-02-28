export class ValidationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationException';
  }
}

export class ResourceNotFoundException extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'ResourceNotFoundException';
  }
} 