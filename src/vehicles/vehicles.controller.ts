import {
    ValidationPipe,
  } from '@nestjs/common';

  
  const requestValidationPipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  
  
  
  